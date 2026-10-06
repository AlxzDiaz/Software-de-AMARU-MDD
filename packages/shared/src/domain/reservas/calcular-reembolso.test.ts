import { afterEach, describe, expect, it, vi } from 'vitest';
import { AHORA, errorDe, masHoras, masMinutos } from '../../../test/dobles/fabricas';
import { calcularReembolso, estadoTrasCancelacion, type DatosReembolso } from './calcular-reembolso';

const INICIO = masHoras(AHORA, 300);
const POLITICA_50 = { porcentajeReembolsoParcial: 50 };

/** Cancelación `horasAntes` horas antes del inicio de la experiencia. */
const cancelarAntes = (horasAntes: number, cambios: Partial<DatosReembolso> = {}) =>
  calcularReembolso({
    montoPagadoCentimos: 45_000,
    inicio: INICIO,
    canceladoEn: masHoras(INICIO, -horasAntes),
    politica: POLITICA_50,
    ...cambios,
  });

describe('calcularReembolso (Requirement 6) — escenario S/ 450.00 con 50 % parcial', () => {
  it('R6.1 — exactamente 168 h antes → TOTAL 45000', () => {
    expect(cancelarAntes(168)).toEqual({ tipo: 'TOTAL', montoCentimos: 45_000, horasAnticipacion: 168 });
  });

  it('R6.2 — exactamente 48 h antes → PARCIAL 22500', () => {
    expect(cancelarAntes(48)).toEqual({ tipo: 'PARCIAL', montoCentimos: 22_500, horasAnticipacion: 48 });
  });

  it('R6.3 — 47 h 59 min antes → SIN_REEMBOLSO 0', () => {
    const resultado = calcularReembolso({
      montoPagadoCentimos: 45_000,
      inicio: INICIO,
      canceladoEn: masMinutos(INICIO, -(47 * 60 + 59)),
      politica: POLITICA_50,
    });
    expect(resultado.tipo).toBe('SIN_REEMBOLSO');
    expect(resultado.montoCentimos).toBe(0);
  });
});

describe('calcularReembolso (Requirement 6) — límites y rangos', () => {
  it.each([
    { horas: 500, tipo: 'TOTAL', monto: 45_000 },
    { horas: 167.99, tipo: 'PARCIAL', monto: 22_500 },
    { horas: 100, tipo: 'PARCIAL', monto: 22_500 },
    { horas: 47.99, tipo: 'SIN_REEMBOLSO', monto: 0 },
    { horas: 1, tipo: 'SIN_REEMBOLSO', monto: 0 },
    { horas: 0, tipo: 'SIN_REEMBOLSO', monto: 0 },
    { horas: -5, tipo: 'SIN_REEMBOLSO', monto: 0 },
  ])('$horas h antes → $tipo $monto', ({ horas, tipo, monto }) => {
    const resultado = cancelarAntes(horas);
    expect(resultado.tipo).toBe(tipo);
    expect(resultado.montoCentimos).toBe(monto);
  });

  it('R6.2 — usa el porcentaje configurado, no un valor fijo en el código', () => {
    expect(cancelarAntes(100, { politica: { porcentajeReembolsoParcial: 30 } }).montoCentimos).toBe(13_500);
    expect(cancelarAntes(100, { politica: { porcentajeReembolsoParcial: 0 } }).montoCentimos).toBe(0);
    expect(cancelarAntes(100, { politica: { porcentajeReembolsoParcial: 100 } }).montoCentimos).toBe(45_000);
  });

  it('R6.4 — redondea al céntimo (medio céntimo hacia arriba)', () => {
    expect(cancelarAntes(100, { montoPagadoCentimos: 30_001 }).montoCentimos).toBe(15_001); // 15 000.5
  });

  it.each([-1, 101, Number.NaN])(
    'R6.5 — rechaza un porcentaje de %d con POLITICA_INVALIDA, aunque el reembolso fuera total',
    (porcentajeReembolsoParcial) => {
      const error = errorDe(() => cancelarAntes(500, { politica: { porcentajeReembolsoParcial } }));
      expect(error.codigo).toBe('POLITICA_INVALIDA');
    },
  );

  it('RNF-R3 — rechaza un monto pagado no entero con MONTO_INVALIDO', () => {
    expect(errorDe(() => cancelarAntes(500, { montoPagadoCentimos: 10.5 })).codigo).toBe('MONTO_INVALIDO');
  });
});

describe('calcularReembolso — R6.6 función pura', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('no lee el reloj del sistema: el resultado solo depende de sus parámetros', () => {
    const antes = cancelarAntes(100);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1999-01-01T00:00:00Z'));
    expect(cancelarAntes(100)).toEqual(antes);
  });
});

describe('estadoTrasCancelacion (R7.1)', () => {
  it.each([
    ['TOTAL', 'REFUNDED'],
    ['PARCIAL', 'PARTIALLY_REFUNDED'],
    ['SIN_REEMBOLSO', 'CANCELLED'],
  ] as const)('%s → %s', (tipo, estado) => {
    expect(estadoTrasCancelacion(tipo)).toBe(estado);
  });
});
