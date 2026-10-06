import { describe, expect, it } from 'vitest';
import { errorDe } from '../../../test/dobles/fabricas';
import { aplicarPorcentaje, asegurarCentimos, asegurarPorcentaje } from './centimos';

describe('asegurarCentimos (RNF-R3)', () => {
  it.each([0, 1, 15_000, Number.MAX_SAFE_INTEGER])('acepta el entero no negativo %d', (valor) => {
    expect(() => asegurarCentimos(valor, 'monto')).not.toThrow();
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza %d con MONTO_INVALIDO e indica el campo',
    (valor) => {
      const error = errorDe(() => asegurarCentimos(valor, 'precio'));
      expect(error.codigo).toBe('MONTO_INVALIDO');
      expect(error.detalles).toMatchObject({ campo: 'precio' });
      expect(error.message).toBe('El monto debe ser un número entero de céntimos, no negativo.');
    },
  );
});

describe('asegurarPorcentaje (R6.5)', () => {
  it.each([0, 33.33, 50, 100])('acepta %d', (porcentaje) => {
    expect(() => asegurarPorcentaje(porcentaje)).not.toThrow();
  });

  it.each([-1, -0.01, 100.01, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza %d con POLITICA_INVALIDA',
    (porcentaje) => {
      expect(errorDe(() => asegurarPorcentaje(porcentaje)).codigo).toBe('POLITICA_INVALIDA');
    },
  );
});

describe('aplicarPorcentaje (R6.4)', () => {
  it.each([
    { centimos: 45_000, porcentaje: 50, esperado: 22_500 },
    { centimos: 45_000, porcentaje: 0, esperado: 0 },
    { centimos: 45_000, porcentaje: 100, esperado: 45_000 },
    { centimos: 45_000, porcentaje: 33.33, esperado: 14_999 }, // 14 998.5 → 14 999 (medio céntimo hacia arriba)
    { centimos: 1, porcentaje: 50, esperado: 1 }, // 0.5 → 1
    { centimos: 3, porcentaje: 50, esperado: 2 }, // 1.5 → 2
    { centimos: 1, porcentaje: 49, esperado: 0 }, // 0.49 → 0
    { centimos: 0, porcentaje: 75, esperado: 0 },
  ])('$porcentaje % de $centimos = $esperado', ({ centimos, porcentaje, esperado }) => {
    expect(aplicarPorcentaje(centimos, porcentaje)).toBe(esperado);
  });

  it('rechaza un monto inválido con MONTO_INVALIDO', () => {
    expect(errorDe(() => aplicarPorcentaje(-5, 50)).codigo).toBe('MONTO_INVALIDO');
  });

  it('rechaza un porcentaje inválido con POLITICA_INVALIDA', () => {
    expect(errorDe(() => aplicarPorcentaje(1_000, 150)).codigo).toBe('POLITICA_INVALIDA');
  });
});
