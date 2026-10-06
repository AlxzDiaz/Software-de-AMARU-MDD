import { describe, expect, it, vi } from 'vitest';
import {
  AHORA,
  crearDisponibilidad,
  crearReservaDePrueba,
  disponibilidadDe,
  errorDeAsync,
  masMinutos,
  prepararEscenario,
  reservaDe,
} from '../../../../test/dobles/fabricas';
import { CancelarPorPagoRechazado, LiberarBloqueosVencidos } from './liberar-bloqueos';

/** Fecha FULL: 7 reservados + 3 bloqueados por una reserva pendiente vencida hace 1 minuto. */
const escenarioVencido = () =>
  prepararEscenario({
    disponibilidades: [crearDisponibilidad({ capacidadReservada: 7, capacidadBloqueada: 3, estado: 'FULL' })],
    reservas: [crearReservaDePrueba({ id: 'res-1', participantes: 3, bloqueoExpiraEn: masMinutos(AHORA, -1) })],
  });

describe('LiberarBloqueosVencidos (Requirement 5)', () => {
  it('R5.1/R5.3/R5.4 escenario — cancela la vencida, la fecha vuelve a AVAILABLE y repetir no libera dos veces', async () => {
    const unidad = escenarioVencido();
    const liberar = new LiberarBloqueosVencidos(unidad);

    expect(await liberar.ejecutar({ ahora: AHORA })).toEqual({ liberadas: 1 });
    expect(reservaDe(unidad, 'res-1')).toMatchObject({
      estado: 'CANCELLED',
      motivoCancelacion: 'EXPIRED',
      canceladaEn: AHORA,
      bloqueoExpiraEn: null,
    });
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadBloqueada: 0, estado: 'AVAILABLE' });

    expect(await liberar.ejecutar({ ahora: AHORA })).toEqual({ liberadas: 0 });
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadBloqueada: 0, capacidadReservada: 7 });
  });

  it('R5.1 — registra la cancelación en el historial con el sistema como actor', async () => {
    const unidad = escenarioVencido();
    await new LiberarBloqueosVencidos(unidad).ejecutar({ ahora: AHORA });
    expect(unidad.almacen.historial).toEqual([
      { reservaId: 'res-1', desde: 'PENDING_PAYMENT', hacia: 'CANCELLED', actorId: null, motivo: 'EXPIRED', ocurridoEn: AHORA },
    ]);
  });

  it('R5.1 — no toca reservas pendientes cuyo bloqueo sigue vigente', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadBloqueada: 2 })],
      reservas: [crearReservaDePrueba({ id: 'res-1', bloqueoExpiraEn: masMinutos(AHORA, 5) })],
    });
    expect(await new LiberarBloqueosVencidos(unidad).ejecutar({ ahora: AHORA })).toEqual({ liberadas: 0 });
    expect(reservaDe(unidad, 'res-1').estado).toBe('PENDING_PAYMENT');
  });

  describe('R5.4 — vuelve a leer cada reserva antes de cambiarla (ejecuciones solapadas)', () => {
    const conListadoDesactualizado = (reservaListada: ReturnType<typeof crearReservaDePrueba>) => {
      const unidad = prepararEscenario({
        disponibilidades: [crearDisponibilidad({ capacidadReservada: 2 })],
        reservas: [crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED', bloqueoExpiraEn: null })],
      });
      vi.spyOn(unidad.repos.reservas, 'listarPendientesVencidas').mockResolvedValueOnce([reservaListada]);
      return unidad;
    };

    it('ignora una reserva que otra ejecución ya confirmó', async () => {
      const unidad = conListadoDesactualizado(crearReservaDePrueba({ id: 'res-1', bloqueoExpiraEn: masMinutos(AHORA, -1) }));
      const antes = unidad.almacen.instantanea();
      expect(await new LiberarBloqueosVencidos(unidad).ejecutar({ ahora: AHORA })).toEqual({ liberadas: 0 });
      expect(unidad.almacen.instantanea()).toEqual(antes);
    });

    it('ignora una reserva que ya no existe', async () => {
      const unidad = conListadoDesactualizado(crearReservaDePrueba({ id: 'res-borrada' }));
      expect(await new LiberarBloqueosVencidos(unidad).ejecutar({ ahora: AHORA })).toEqual({ liberadas: 0 });
    });

    it('ignora una reserva pendiente cuyo bloqueo ya no está vencido', async () => {
      const unidad = prepararEscenario({
        disponibilidades: [crearDisponibilidad({ capacidadBloqueada: 2 })],
        reservas: [crearReservaDePrueba({ id: 'res-1', bloqueoExpiraEn: masMinutos(AHORA, 30) })],
      });
      vi.spyOn(unidad.repos.reservas, 'listarPendientesVencidas').mockResolvedValueOnce([
        crearReservaDePrueba({ id: 'res-1', bloqueoExpiraEn: masMinutos(AHORA, -1) }),
      ]);
      expect(await new LiberarBloqueosVencidos(unidad).ejecutar({ ahora: AHORA })).toEqual({ liberadas: 0 });
      expect(reservaDe(unidad, 'res-1').estado).toBe('PENDING_PAYMENT');
    });
  });
});

describe('CancelarPorPagoRechazado (R5.2)', () => {
  const escenarioPendiente = () =>
    prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadBloqueada: 10, estado: 'FULL' })],
      reservas: [crearReservaDePrueba({ id: 'res-1', participantes: 10 })],
    });

  it('cancela con motivo PAYMENT_REJECTED, libera los cupos y la fecha vuelve a AVAILABLE (R5.3)', async () => {
    const unidad = escenarioPendiente();
    const reserva = await new CancelarPorPagoRechazado(unidad).ejecutar({ reservaId: 'res-1', ahora: AHORA });

    expect(reserva).toMatchObject({ estado: 'CANCELLED', motivoCancelacion: 'PAYMENT_REJECTED' });
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadBloqueada: 0, estado: 'AVAILABLE' });
  });

  it('es idempotente: un segundo aviso de rechazo no libera cupos otra vez', async () => {
    const unidad = escenarioPendiente();
    const cancelar = new CancelarPorPagoRechazado(unidad);
    await cancelar.ejecutar({ reservaId: 'res-1', ahora: AHORA });
    const despues = unidad.almacen.instantanea();

    const repetida = await cancelar.ejecutar({ reservaId: 'res-1', ahora: AHORA });

    expect(repetida.estado).toBe('CANCELLED');
    expect(unidad.almacen.instantanea()).toEqual(despues);
  });

  it('rechaza con TRANSICION_INVALIDA un aviso de rechazo sobre una reserva ya confirmada', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadReservada: 2 })],
      reservas: [crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED' })],
    });
    const error = await errorDeAsync(() => new CancelarPorPagoRechazado(unidad).ejecutar({ reservaId: 'res-1', ahora: AHORA }));
    expect(error.codigo).toBe('TRANSICION_INVALIDA');
    expect(error.detalles).toMatchObject({ actual: 'CONFIRMED', siguiente: 'CANCELLED' });
  });

  it('responde RESERVA_NO_ENCONTRADA si la reserva no existe', async () => {
    const error = await errorDeAsync(() =>
      new CancelarPorPagoRechazado(prepararEscenario()).ejecutar({ reservaId: 'nada', ahora: AHORA }),
    );
    expect(error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});
