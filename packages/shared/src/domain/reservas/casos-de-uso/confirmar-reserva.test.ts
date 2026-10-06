import { describe, expect, it } from 'vitest';
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
import { ConfirmarReserva } from './confirmar-reserva';

/** Reserva PENDING_PAYMENT de 2 participantes con bloqueo vigente sobre una fecha de 10 cupos. */
const escenarioPendiente = (cambiosReserva = {}) =>
  prepararEscenario({
    disponibilidades: [crearDisponibilidad({ capacidadBloqueada: 2 })],
    reservas: [crearReservaDePrueba({ id: 'res-1', ...cambiosReserva })],
  });

describe('ConfirmarReserva (Requirement 4)', () => {
  it('R4.1/R4.3 escenario — confirma con "PAY-001" y la segunda confirmación no cambia cupos', async () => {
    const unidad = escenarioPendiente();
    const confirmar = new ConfirmarReserva(unidad);

    const confirmada = await confirmar.ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA });

    expect(confirmada).toMatchObject({ estado: 'CONFIRMED', referenciaPago: 'PAY-001', bloqueoExpiraEn: null });
    expect(disponibilidadDe(unidad)).toMatchObject({ capacidadBloqueada: 0, capacidadReservada: 2 });

    const despues = unidad.almacen.instantanea();
    const repetida = await confirmar.ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA });

    expect(repetida).toEqual(confirmada);
    expect(unidad.almacen.instantanea()).toEqual(despues);
  });

  it('R4.1 — registra en el historial PENDING_PAYMENT → CONFIRMED con el sistema como actor', async () => {
    const unidad = escenarioPendiente();
    await new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA });
    expect(unidad.almacen.historial).toEqual([
      { reservaId: 'res-1', desde: 'PENDING_PAYMENT', hacia: 'CONFIRMED', actorId: null, motivo: null, ocurridoEn: AHORA },
    ]);
  });

  it('R4.1 — guarda la referencia sin espacios sobrantes', async () => {
    const unidad = escenarioPendiente();
    await new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: '  PAY-002 ', ahora: AHORA });
    expect(reservaDe(unidad, 'res-1').referenciaPago).toBe('PAY-002');
  });

  it('R4.2 — el comando no recibe actor: el comprador no puede confirmar su propia reserva', async () => {
    const unidad = escenarioPendiente();
    await new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA });
    expect(unidad.almacen.historial.every((cambio) => cambio.actorId === null)).toBe(true);
  });

  it('R4.3 — una confirmación con otra referencia de pago responde PAGO_DUPLICADO', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadReservada: 2 })],
      reservas: [crearReservaDePrueba({ id: 'res-1', estado: 'CONFIRMED', referenciaPago: 'PAY-001', bloqueoExpiraEn: null })],
    });
    const error = await errorDeAsync(() =>
      new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-999', ahora: AHORA }),
    );
    expect(error.codigo).toBe('PAGO_DUPLICADO');
  });

  it('R4.4 — si el bloqueo venció responde RESERVA_EXPIRADA y no toca los cupos', async () => {
    const unidad = escenarioPendiente({ bloqueoExpiraEn: AHORA });
    const antes = unidad.almacen.instantanea();

    const error = await errorDeAsync(() =>
      new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA }),
    );

    expect(error.codigo).toBe('RESERVA_EXPIRADA');
    expect(unidad.almacen.instantanea()).toEqual(antes);
  });

  it('R4.4 — si la reserva ya fue cancelada responde RESERVA_EXPIRADA', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad()],
      reservas: [crearReservaDePrueba({ id: 'res-1', estado: 'CANCELLED', bloqueoExpiraEn: masMinutos(AHORA, 10) })],
    });
    const error = await errorDeAsync(() =>
      new ConfirmarReserva(unidad).ejecutar({ reservaId: 'res-1', referenciaPago: 'PAY-001', ahora: AHORA }),
    );
    expect(error.codigo).toBe('RESERVA_EXPIRADA');
  });

  it('responde RESERVA_NO_ENCONTRADA si la reserva no existe', async () => {
    const error = await errorDeAsync(() =>
      new ConfirmarReserva(prepararEscenario()).ejecutar({ reservaId: 'nada', referenciaPago: 'PAY-001', ahora: AHORA }),
    );
    expect(error.codigo).toBe('RESERVA_NO_ENCONTRADA');
  });

  it.each(['', '   '])('responde REFERENCIA_PAGO_REQUERIDA si la referencia es "%s"', async (referenciaPago) => {
    const error = await errorDeAsync(() =>
      new ConfirmarReserva(escenarioPendiente()).ejecutar({ reservaId: 'res-1', referenciaPago, ahora: AHORA }),
    );
    expect(error.codigo).toBe('REFERENCIA_PAGO_REQUERIDA');
  });
});
