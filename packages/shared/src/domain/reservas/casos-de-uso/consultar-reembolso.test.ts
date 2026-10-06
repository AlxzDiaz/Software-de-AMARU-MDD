import { describe, expect, it } from 'vitest';
import {
  AHORA,
  COMPRADOR,
  crearDisponibilidad,
  crearReservaDePrueba,
  errorDeAsync,
  masHoras,
  OTRO_COMPRADOR,
  politicaDePrueba,
  prepararEscenario,
} from '../../../../test/dobles/fabricas';
import { ConsultarReembolso } from './consultar-reembolso';

/** Reserva CONFIRMED de 2 participantes por S/ 300.00 que inicia en horasHastaInicio. */
const escenarioConsulta = (horasHastaInicio = 100) =>
  prepararEscenario({
    disponibilidades: [
      crearDisponibilidad({ capacidadTotal: 2, capacidadReservada: 2, inicio: masHoras(AHORA, horasHastaInicio) }),
    ],
    reservas: [
      crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED', referenciaPago: 'PAY-001', bloqueoExpiraEn: null }),
    ],
  });

const consultar = (unidad: ReturnType<typeof prepararEscenario>, porcentaje = 50) =>
  new ConsultarReembolso(unidad, politicaDePrueba(porcentaje)).ejecutar({
    reservaId: 'res-1',
    actor: COMPRADOR,
    ahora: AHORA,
  });

describe('ConsultarReembolso (Requirement 6.7)', () => {
  it('R6.7 escenario — 100 h antes con 50 %: devuelve PARCIAL 15000 y el almacén queda sin cambios', async () => {
    const unidad = escenarioConsulta(100);
    const antes = unidad.almacen.instantanea();

    const reembolso = await consultar(unidad);

    expect(reembolso).toMatchObject({
      tipo: 'PARCIAL',
      montoCentimos: 15_000,
      horasAnticipacion: 100,
    });
    // El almacén debe quedar exactamente igual (R6.7)
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R6.7 — ≥ 168 h devuelve TOTAL 30000', async () => {
    const unidad = escenarioConsulta(200);
    const reembolso = await consultar(unidad);
    expect(reembolso).toMatchObject({ tipo: 'TOTAL', montoCentimos: 30_000 });
  });

  it('R6.7 — < 48 h devuelve SIN_REEMBOLSO 0', async () => {
    const unidad = escenarioConsulta(24);
    const reembolso = await consultar(unidad);
    expect(reembolso).toMatchObject({ tipo: 'SIN_REEMBOLSO', montoCentimos: 0 });
  });

  it('R6.7 — la consulta no modifica el historial de estados', async () => {
    const unidad = escenarioConsulta(100);
    expect(unidad.almacen.historial).toHaveLength(0);
    await consultar(unidad);
    expect(unidad.almacen.historial).toHaveLength(0);
  });

  it('R6.7 — la consulta no modifica los cupos de la disponibilidad', async () => {
    const unidad = escenarioConsulta(100);
    const antes = unidad.almacen.disponibilidades.get('disp-1');
    await consultar(unidad);
    const despues = unidad.almacen.disponibilidades.get('disp-1');
    expect(despues).toEqual(antes);
  });

  it('R6.7 — la consulta no modifica el estado de la reserva', async () => {
    const unidad = escenarioConsulta(100);
    const antes = unidad.almacen.reservas.get('res-1');
    await consultar(unidad);
    const despues = unidad.almacen.reservas.get('res-1');
    expect(despues).toEqual(antes);
    expect(despues?.estado).toBe('CONFIRMED');
  });

  it('R6.7 + R7.2 — otro comprador recibe ACCESO_DENEGADO', async () => {
    const unidad = escenarioConsulta(100);
    const error = await errorDeAsync(() =>
      new ConsultarReembolso(unidad, politicaDePrueba(50)).ejecutar({
        reservaId: 'res-1',
        actor: OTRO_COMPRADOR,
        ahora: AHORA,
      }),
    );
    expect(error.codigo).toBe('ACCESO_DENEGADO');
  });

  it.each(['PENDING_PAYMENT', 'COMPLETED', 'CANCELLED', 'REFUNDED'] as const)(
    'R6.7 + R7.4 — una reserva %s responde CANCELACION_NO_PERMITIDA',
    async (estado) => {
      const unidad = prepararEscenario({
        disponibilidades: [crearDisponibilidad({ inicio: masHoras(AHORA, 100) })],
        reservas: [crearReservaDePrueba({ id: 'res-1', estado })],
      });
      const error = await errorDeAsync(() => consultar(unidad));
      expect(error.codigo).toBe('CANCELACION_NO_PERMITIDA');
    },
  );

  it.each([0, -5])(
    'R6.7 + R7.4 — si la experiencia inicia en %d h (ya empezó) responde CANCELACION_NO_PERMITIDA',
    async (horas) => {
      const unidad = escenarioConsulta(horas);
      const error = await errorDeAsync(() => consultar(unidad));
      expect(error.codigo).toBe('CANCELACION_NO_PERMITIDA');
    },
  );

  it('R6.7 — responde RESERVA_NO_ENCONTRADA si la reserva no existe', async () => {
    const error = await errorDeAsync(() => consultar(prepararEscenario()));
    expect(error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });
});
