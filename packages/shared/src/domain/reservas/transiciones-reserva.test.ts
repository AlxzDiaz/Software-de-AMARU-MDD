import { describe, expect, it } from 'vitest';
import { ESTADOS_RESERVA, type EstadoReserva } from '../../constants/estados-reserva';
import { errorDe } from '../../../test/dobles/fabricas';
import { asegurarTransicionReserva, puedeCambiarEstadoReserva } from './transiciones-reserva';

/** Copia independiente de la tabla de R8.1, para que la prueba no reutilice la implementación. */
const PERMITIDAS = new Set([
  'PENDING_PAYMENT→CONFIRMED',
  'PENDING_PAYMENT→CANCELLED',
  'CONFIRMED→COMPLETED',
  'CONFIRMED→CANCELLED',
  'CONFIRMED→REFUNDED',
  'CONFIRMED→PARTIALLY_REFUNDED',
]);

const TODAS: Array<[EstadoReserva, EstadoReserva, boolean]> = ESTADOS_RESERVA.flatMap((actual) =>
  ESTADOS_RESERVA.map(
    (siguiente) => [actual, siguiente, PERMITIDAS.has(`${actual}→${siguiente}`)] as [EstadoReserva, EstadoReserva, boolean],
  ),
);

describe('Transiciones de estado de la reserva (Requirement 8)', () => {
  it('cubre las 36 combinaciones de estados', () => {
    expect(TODAS).toHaveLength(36);
  });

  it.each(TODAS)('R8.1 — %s → %s: permitido = %s', (actual, siguiente, permitido) => {
    expect(puedeCambiarEstadoReserva(actual, siguiente)).toBe(permitido);
  });

  it.each(['COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'] as const)(
    'R8.2 — %s es un estado final sin transiciones de salida',
    (final) => {
      for (const siguiente of ESTADOS_RESERVA) {
        expect(puedeCambiarEstadoReserva(final, siguiente)).toBe(false);
      }
    },
  );

  it('R8.3 — lanza TRANSICION_INVALIDA con los estados actual y solicitado (escenario COMPLETED → CANCELLED)', () => {
    const error = errorDe(() => asegurarTransicionReserva('COMPLETED', 'CANCELLED'));
    expect(error.codigo).toBe('TRANSICION_INVALIDA');
    expect(error.detalles).toEqual({
      actual: 'COMPLETED',
      siguiente: 'CANCELLED',
      transicion: 'COMPLETED → CANCELLED',
    });
  });

  it('R8.3 — la transición a sí mismo también es inválida', () => {
    expect(errorDe(() => asegurarTransicionReserva('CONFIRMED', 'CONFIRMED')).codigo).toBe('TRANSICION_INVALIDA');
  });

  it('R8.4 — una transición permitida no lanza error', () => {
    expect(() => asegurarTransicionReserva('PENDING_PAYMENT', 'CONFIRMED')).not.toThrow();
  });
});
