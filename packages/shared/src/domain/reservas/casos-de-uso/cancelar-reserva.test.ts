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
  OTRO_COMPRADOR,
  politicaDePrueba,
  prepararEscenario,
  reservaDe,
} from '../../../../test/dobles/fabricas';
import type { Actor } from '../tipos';
import { CancelarReserva } from './cancelar-reserva';

const MOTIVO = 'Cambio de planes de viaje';

/** Reserva CONFIRMED de 2 participantes por S/ 300.00 sobre una fecha FULL de 2 cupos. */
const escenarioConfirmado = (horasHastaInicio = 240) =>
  prepararEscenario({
    disponibilidades: [
      crearDisponibilidad({ capacidadTotal: 2, capacidadReservada: 2, estado: 'FULL', inicio: masHoras(AHORA, horasHastaInicio) }),
    ],
    reservas: [
      crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED', referenciaPago: 'PAY-001', bloqueoExpiraEn: null }),
    ],
  });

const cancelar = (
  unidad: ReturnType<typeof prepararEscenario>,
  { actor = COMPRADOR, motivo = MOTIVO, porcentaje = 50 }: { actor?: Actor; motivo?: string; porcentaje?: number } = {},
) => new CancelarReserva(unidad, politicaDePrueba(porcentaje)).ejecutar({ reservaId: 'res-1', actor, motivo, ahora: AHORA });

describe('CancelarReserva (Requirement 7)', () => {
  it('R7.1/R7.5/R7.6 escenario — 10 días antes: REFUNDED 30000, la fecha vuelve a AVAILABLE y queda en el historial', async () => {
    const unidad = escenarioConfirmado(240);

    const { reserva, reembolso } = await cancelar(unidad);

    expect(reembolso).toMatchObject({ tipo: 'TOTAL', montoCentimos: 30_000 });
    expect(reserva).toMatchObject({
      estado: 'REFUNDED',
      reembolsoCentimos: 30_000,
      motivoCancelacion: MOTIVO,
      canceladaEn: AHORA,
    });
    expect(reservaDe(unidad, 'res-1').estado).toBe('REFUNDED');
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadReservada: 0, estado: 'AVAILABLE' });
    expect(unidad.almacen.historial).toEqual([
      { reservaId: 'res-1', desde: 'CONFIRMED', hacia: 'REFUNDED', actorId: COMPRADOR.id, motivo: MOTIVO, ocurridoEn: AHORA },
    ]);
  });

  it('R7.1 — entre 48 h y 168 h antes: PARTIALLY_REFUNDED con el porcentaje configurado', async () => {
    const { reserva } = await cancelar(escenarioConfirmado(100));
    expect(reserva).toMatchObject({ estado: 'PARTIALLY_REFUNDED', reembolsoCentimos: 15_000 });
  });

  it('R7.1 — menos de 48 h antes: CANCELLED sin reembolso, pero libera los cupos igual', async () => {
    const unidad = escenarioConfirmado(24);
    const { reserva } = await cancelar(unidad);
    expect(reserva).toMatchObject({ estado: 'CANCELLED', reembolsoCentimos: 0 });
    expect(disponibilidadDe(unidad).capacidadReservada).toBe(0);
  });

  it('R7.1 — guarda el motivo sin espacios sobrantes', async () => {
    const { reserva } = await cancelar(escenarioConfirmado(), { motivo: `   ${MOTIVO}  ` });
    expect(reserva.motivoCancelacion).toBe(MOTIVO);
  });

  it('A-25 — un administrador puede cancelar en nombre del comprador, con la misma política', async () => {
    const unidad = escenarioConfirmado(100);
    const { reserva } = await cancelar(unidad, { actor: ADMINISTRADOR });
    expect(reserva.estado).toBe('PARTIALLY_REFUNDED');
    expect(unidad.almacen.historial[0]?.actorId).toBe(ADMINISTRADOR.id);
  });

  it('R7.2 — otro comprador recibe ACCESO_DENEGADO y nada cambia', async () => {
    const unidad = escenarioConfirmado();
    const antes = unidad.almacen.instantanea();
    const error = await errorDeAsync(() => cancelar(unidad, { actor: OTRO_COMPRADOR }));
    expect(error.codigo).toBe('ACCESO_DENEGADO');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R7.2 — la autorización se valida antes que el motivo y el estado', async () => {
    const error = await errorDeAsync(() => cancelar(escenarioConfirmado(), { actor: OTRO_COMPRADOR, motivo: '' }));
    expect(error.codigo).toBe('ACCESO_DENEGADO');
  });

  it.each(['', '    ', 'abc', '  ab  '])('R7.3 — el motivo "%s" responde MOTIVO_REQUERIDO', async (motivo) => {
    const error = await errorDeAsync(() => cancelar(escenarioConfirmado(), { motivo }));
    expect(error.codigo).toBe('MOTIVO_REQUERIDO');
  });

  it.each(['PENDING_PAYMENT', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const)(
    'R7.4 — una reserva %s responde CANCELACION_NO_PERMITIDA',
    async (estado) => {
      const unidad = prepararEscenario({
        disponibilidades: [crearDisponibilidad()],
        reservas: [crearReservaDePrueba({ id: 'res-1', estado })],
      });
      const error = await errorDeAsync(() => cancelar(unidad));
      expect(error.codigo).toBe('CANCELACION_NO_PERMITIDA');
    },
  );

  it.each([0, -3])('R7.4 — si la experiencia inicia en %d h (ya empezó) responde CANCELACION_NO_PERMITIDA sin tocar cupos', async (horas) => {
    const unidad = escenarioConfirmado(horas);
    const antes = unidad.almacen.instantanea();
    const error = await errorDeAsync(() => cancelar(unidad));
    expect(error.codigo).toBe('CANCELACION_NO_PERMITIDA');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R7.4 — si la fecha de la reserva ya no existe responde CANCELACION_NO_PERMITIDA', async () => {
    const unidad = prepararEscenario({
      reservas: [crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED', bloqueoExpiraEn: null })],
    });
    const error = await errorDeAsync(() => cancelar(unidad));
    expect(error.codigo).toBe('CANCELACION_NO_PERMITIDA');
  });

  it('R6.5 + Property 8 — una política mal configurada responde POLITICA_INVALIDA y no cambia nada', async () => {
    const unidad = escenarioConfirmado(100);
    const antes = unidad.almacen.instantanea();
    const error = await errorDeAsync(() => cancelar(unidad, { porcentaje: 120 }));
    expect(error.codigo).toBe('POLITICA_INVALIDA');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('responde RESERVA_NO_ENCONTRADA si la reserva no existe', async () => {
    const error = await errorDeAsync(() => cancelar(prepararEscenario()));
    expect(error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});
