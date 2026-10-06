import { describe, expect, it, vi } from 'vitest';
import {
  AHORA,
  COMPRADOR,
  crearDisponibilidad,
  crearExperiencia,
  disponibilidadDe,
  errorDe,
  errorDeAsync,
  masMinutos,
  OTRO_COMPRADOR,
  prepararEscenario,
} from '../../../../test/dobles/fabricas';
import type { UnidadDeTrabajoEnMemoria } from '../../../../test/dobles/unidad-de-trabajo-en-memoria';
import { type ComandoCrearReserva, CrearReserva } from './crear-reserva';

const comando = (cambios: Partial<ComandoCrearReserva> = {}): ComandoCrearReserva => ({
  experienciaId: 'exp-1',
  disponibilidadId: 'disp-1',
  compradorId: COMPRADOR.id,
  participantes: 3,
  ahora: AHORA,
  ...cambios,
});

const casoDeUso = (unidad: UnidadDeTrabajoEnMemoria) => new CrearReserva(unidad, { minutosBloqueo: 20 });

describe('CrearReserva (Requirements 2 y 3)', () => {
  it('R3.1/R3.2/R3.3 — crea la reserva PENDING_PAYMENT, bloquea cupos, fija la expiración y calcula el monto', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad()] });

    const reserva = await casoDeUso(unidad).ejecutar(comando());

    expect(reserva).toMatchObject({
      estado: 'PENDING_PAYMENT',
      participantes: 3,
      montoCentimos: 45_000,
      compradorId: COMPRADOR.id,
      bloqueoExpiraEn: masMinutos(AHORA, 20),
      referenciaPago: null,
    });
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadBloqueada: 3, capacidadReservada: 0, estado: 'AVAILABLE' });
    expect(unidad.almacen.historial).toEqual([
      {
        reservaId: reserva.id,
        desde: null,
        hacia: 'PENDING_PAYMENT',
        actorId: COMPRADOR.id,
        motivo: null,
        ocurridoEn: AHORA,
      },
    ]);
  });

  it('R3.3 — el monto sale del precio vigente de la experiencia guardada', async () => {
    const unidad = prepararEscenario({
      experiencias: [crearExperiencia({ precioPorPersonaCentimos: 9_990 })],
      disponibilidades: [crearDisponibilidad()],
    });
    const reserva = await casoDeUso(unidad).ejecutar(comando({ participantes: 2 }));
    expect(reserva.montoCentimos).toBe(19_980);
  });

  it('R2 escenario — 3 participantes con 2 cupos restantes: CUPOS_INSUFICIENTES y los cupos no cambian', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad({ capacidadReservada: 8 })] });
    const antes = unidad.almacen.instantanea();

    const error = await errorDeAsync(() => casoDeUso(unidad).ejecutar(comando({ participantes: 3 })));

    expect(error.codigo).toBe('CUPOS_INSUFICIENTES');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R2.2 — rechaza una experiencia no publicada sin crear la reserva', async () => {
    const unidad = prepararEscenario({
      experiencias: [crearExperiencia({ estado: 'UNPUBLISHED' })],
      disponibilidades: [crearDisponibilidad()],
    });
    const error = await errorDeAsync(() => casoDeUso(unidad).ejecutar(comando()));
    expect(error.codigo).toBe('EXPERIENCIA_NO_PUBLICADA');
    expect(unidad.almacen.reservas.size).toBe(0);
  });

  it('R2.3 — rechaza una fecha inexistente', async () => {
    const unidad = prepararEscenario();
    const error = await errorDeAsync(() => casoDeUso(unidad).ejecutar(comando()));
    expect(error.codigo).toBe('FECHA_NO_DISPONIBLE');
  });

  it('R3.4 escenario — dos solicitudes simultáneas por el último cupo: solo una gana y la fecha queda FULL', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad({ capacidadReservada: 9 })] });
    const crear = casoDeUso(unidad);

    const resultados = await Promise.allSettled([
      crear.ejecutar(comando({ participantes: 1 })),
      crear.ejecutar(comando({ participantes: 1, compradorId: OTRO_COMPRADOR.id })),
    ]);

    const exitosas = resultados.filter((r) => r.status === 'fulfilled');
    const rechazadas = resultados.filter((r) => r.status === 'rejected');
    expect(exitosas).toHaveLength(1);
    expect(rechazadas).toHaveLength(1);
    expect(rechazadas[0]).toMatchObject({ reason: { codigo: 'CUPOS_INSUFICIENTES' } });
    expect(unidad.almacen.reservas.size).toBe(1);
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadReservada: 9, capacidadBloqueada: 1, estado: 'FULL' });
  });

  it('R3.5 — la fecha pasa a FULL cuando un bloqueo agota los cupos', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad({ capacidadReservada: 7 })] });
    await casoDeUso(unidad).ejecutar(comando({ participantes: 3 }));
    expect(disponibilidadDe(unidad).estado).toBe('FULL');
  });

  it('R3.4 — si el bloqueo atómico falla (carrera en la BD) responde CUPOS_INSUFICIENTES y no crea nada', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad()] });
    vi.spyOn(unidad.repos.disponibilidad, 'bloquearCupos').mockResolvedValueOnce(null);

    const error = await errorDeAsync(() => casoDeUso(unidad).ejecutar(comando()));

    expect(error.codigo).toBe('CUPOS_INSUFICIENTES');
    expect(unidad.almacen.reservas.size).toBe(0);
  });

  it('Property 8 — si falla la creación de la reserva, se deshace el bloqueo de cupos (rollback)', async () => {
    const unidad = prepararEscenario({ disponibilidades: [crearDisponibilidad()] });
    vi.spyOn(unidad.repos.reservas, 'crear').mockRejectedValueOnce(new Error('fallo de la base de datos'));

    await expect(casoDeUso(unidad).ejecutar(comando())).rejects.toThrow('fallo de la base de datos');

    expect(disponibilidadDe(unidad).capacidadBloqueada).toBe(0);
  });

  it.each([0, -5, 1.5])('rechaza la configuración minutosBloqueo = %d con CONFIGURACION_INVALIDA', (minutosBloqueo) => {
    const error = errorDe(() => new CrearReserva(prepararEscenario(), { minutosBloqueo }));
    expect(error.codigo).toBe('CONFIGURACION_INVALIDA');
  });
});
