import { describe, expect, it } from 'vitest';
import { errorDe } from '../../../test/dobles/fabricas';
import { calcularMontoReserva } from './calcular-monto-reserva';

describe('calcularMontoReserva (R3.3)', () => {
  it('multiplica el precio vigente por persona por los participantes: S/ 150.00 × 3 = S/ 450.00', () => {
    expect(calcularMontoReserva(15_000, 3)).toBe(45_000);
  });

  it.each([0, -2, 2.5])('rechaza %d participantes con PARTICIPANTES_INVALIDOS', (participantes) => {
    expect(errorDe(() => calcularMontoReserva(15_000, participantes)).codigo).toBe('PARTICIPANTES_INVALIDOS');
  });

  it.each([-100, 99.9])('RNF-R3 — rechaza el precio %d con MONTO_INVALIDO', (precio) => {
    expect(errorDe(() => calcularMontoReserva(precio, 1)).codigo).toBe('MONTO_INVALIDO');
  });

  it('RNF-R3 — rechaza un total que excede el rango entero seguro', () => {
    const error = errorDe(() => calcularMontoReserva(Number.MAX_SAFE_INTEGER, 2));
    expect(error.codigo).toBe('MONTO_INVALIDO');
    expect(error.detalles).toMatchObject({ campo: 'montoCentimos' });
  });
});
