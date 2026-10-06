import { describe, expect, it } from 'vitest';
import {
  ADMINISTRADOR,
  AHORA,
  COMPRADOR,
  crearDisponibilidad,
  crearReservaDePrueba,
  disponibilidadDe,
  errorDeAsync,
  masHoras,
  prepararEscenario,
  reservaDe,
} from '../../../../test/dobles/fabricas';
import type { Actor } from '../tipos';
import { ConfirmarAsistencia } from './confirmar-asistencia';

const COORDINADOR: Actor = { id: 'coordinador-1', roles: ['COORDINATOR'] };
const OTRO_COORDINADOR: Actor = { id: 'coordinador-2', roles: ['COORDINATOR'] };

/**
 * Reserva CONFIRMED de 2 participantes en una fecha declarada por "coordinador-1",
 * cuya experiencia inicia en `horasDesdeAhora` horas.
 */
const escenarioConfirmado = (horasDesdeAhora = -3) =>
  prepararEscenario({
    disponibilidades: [
      crearDisponibilidad({
        capacidadTotal: 10,
        capacidadReservada: 2,
        estado: 'AVAILABLE',
        inicio: masHoras(AHORA, horasDesdeAhora),
        declaradaPor: COORDINADOR.id,
      }),
    ],
    reservas: [
      crearReservaDePrueba({
        id: 'res-1',
        estado: 'CONFIRMED',
        referenciaPago: 'PAY-001',
        bloqueoExpiraEn: null,
      }),
    ],
  });

const confirmarAsistencia = (
  unidad: ReturnType<typeof prepararEscenario>,
  actor: Actor = COORDINADOR,
) =>
  new ConfirmarAsistencia(unidad).ejecutar({
    reservaId: 'res-1',
    actor,
    ahora: AHORA,
  });

describe('ConfirmarAsistencia (Requirement 9)', () => {
  it('R9.1 escenario — el coordinador que declaró la fecha confirma la asistencia 3 horas después del inicio', async () => {
    const unidad = escenarioConfirmado(-3); // experiencia inició hace 3 horas
    const antes = disponibilidadDe(unidad);

    const reserva = await confirmarAsistencia(unidad, COORDINADOR);

    expect(reserva.estado).toBe('COMPLETED');
    expect(reservaDe(unidad, 'res-1').estado).toBe('COMPLETED');
    
    // R9.6: los cupos no cambian
    const despues = disponibilidadDe(unidad);
    expect(despues.capacidadReservada).toBe(antes.capacidadReservada);
    expect(despues.capacidadBloqueada).toBe(antes.capacidadBloqueada);
    
    // R9.1: el historial registra la transición con el actor
    expect(unidad.almacen.historial).toEqual([
      {
        reservaId: 'res-1',
        desde: 'CONFIRMED',
        hacia: 'COMPLETED',
        actorId: COORDINADOR.id,
        motivo: null,
        ocurridoEn: AHORA,
      },
    ]);
  });

  it('R9.2 — un administrador puede confirmar la asistencia en nombre del coordinador', async () => {
    const unidad = escenarioConfirmado(-3);

    const reserva = await confirmarAsistencia(unidad, ADMINISTRADOR);

    expect(reserva.estado).toBe('COMPLETED');
    expect(unidad.almacen.historial[0]?.actorId).toBe(ADMINISTRADOR.id);
  });

  it('R9.3 — otro coordinador (que no declaró la fecha) recibe ACCESO_DENEGADO', async () => {
    const unidad = escenarioConfirmado(-3);
    const antes = unidad.almacen.instantanea();

    const error = await errorDeAsync(() => confirmarAsistencia(unidad, OTRO_COORDINADOR));

    expect(error.codigo).toBe('ACCESO_DENEGADO');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R9.3 — el comprador (sin rol COORDINATOR) recibe ACCESO_DENEGADO', async () => {
    const unidad = escenarioConfirmado(-3);

    const error = await errorDeAsync(() => confirmarAsistencia(unidad, COMPRADOR));

    expect(error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('R9.3 — si la disponibilidad no existe, responde ACCESO_DENEGADO', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [], // sin disponibilidad
      reservas: [
        crearReservaDePrueba({
          id: 'res-1',
          estado: 'CONFIRMED',
          referenciaPago: 'PAY-001',
          bloqueoExpiraEn: null,
        }),
      ],
    });

    const error = await errorDeAsync(() => confirmarAsistencia(unidad, COORDINADOR));

    expect(error.codigo).toBe('ACCESO_DENEGADO');
  });

  it('R9.4 — si la experiencia todavía no inició, responde ASISTENCIA_NO_PERMITIDA', async () => {
    const unidad = escenarioConfirmado(48); // inicia en 48 horas
    const antes = unidad.almacen.instantanea();

    const error = await errorDeAsync(() => confirmarAsistencia(unidad, COORDINADOR));

    expect(error.codigo).toBe('ASISTENCIA_NO_PERMITIDA');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R9.4 — 1 ms antes del inicio todavía no se puede confirmar', async () => {
    // La experiencia inicia en AHORA, pero estamos 1 milisegundo antes (con redondeo de minutos)
    const unidad = prepararEscenario({
      disponibilidades: [
        crearDisponibilidad({
          capacidadTotal: 10,
          capacidadReservada: 2,
          estado: 'AVAILABLE',
          inicio: new Date(AHORA.getTime() + 1), // 1 ms después de AHORA
          declaradaPor: COORDINADOR.id,
        }),
      ],
      reservas: [
        crearReservaDePrueba({
          id: 'res-1',
          estado: 'CONFIRMED',
          referenciaPago: 'PAY-001',
          bloqueoExpiraEn: null,
        }),
      ],
    });
    const antes = unidad.almacen.instantanea();

    const error = await errorDeAsync(() => confirmarAsistencia(unidad, COORDINADOR));

    expect(error.codigo).toBe('ASISTENCIA_NO_PERMITIDA');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it.each(['PENDING_PAYMENT', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'COMPLETED'] as const)(
    'R9.5 — una reserva %s responde TRANSICION_INVALIDA',
    async (estado) => {
      const unidad = prepararEscenario({
        disponibilidades: [
          crearDisponibilidad({
            inicio: masHoras(AHORA, -3),
            declaradaPor: COORDINADOR.id,
          }),
        ],
        reservas: [crearReservaDePrueba({ id: 'res-1', estado })],
      });

      const error = await errorDeAsync(() => confirmarAsistencia(unidad, COORDINADOR));

      expect(error.codigo).toBe('TRANSICION_INVALIDA');
      expect(error.detalles).toMatchObject({ actual: estado, siguiente: 'COMPLETED' });
    },
  );

  it('R9.6 — los cupos no cambian al confirmar la asistencia', async () => {
    const unidad = escenarioConfirmado(-5);
    const antes = disponibilidadDe(unidad);

    await confirmarAsistencia(unidad, COORDINADOR);

    const despues = disponibilidadDe(unidad);
    expect(despues).toMatchObject({
      capacidadTotal: antes.capacidadTotal,
      capacidadReservada: antes.capacidadReservada,
      capacidadBloqueada: antes.capacidadBloqueada,
      estado: antes.estado,
    });
  });

  it('si la reserva no existe, responde RESERVA_NO_ENCONTRADA', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ inicio: masHoras(AHORA, -3) })],
      reservas: [], // sin reservas
    });

    const error = await errorDeAsync(() =>
      new ConfirmarAsistencia(unidad).ejecutar({
        reservaId: 'inexistente',
        actor: COORDINADOR,
        ahora: AHORA,
      }),
    );

    expect(error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});
