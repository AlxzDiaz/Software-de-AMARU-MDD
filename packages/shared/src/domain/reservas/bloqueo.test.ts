import { describe, expect, it } from 'vitest';
import { AHORA, masMinutos } from '../../../test/dobles/fabricas';
import { bloqueoVencido, calcularExpiracionBloqueo } from './bloqueo';

describe('calcularExpiracionBloqueo (R3.2)', () => {
  it('suma los minutos de bloqueo al momento actual', () => {
    expect(calcularExpiracionBloqueo(AHORA, 20)).toEqual(masMinutos(AHORA, 20));
  });
});

describe('bloqueoVencido (R4.4, R5.1)', () => {
  it('no está vencido antes de la hora de expiración', () => {
    expect(bloqueoVencido({ bloqueoExpiraEn: masMinutos(AHORA, 1) }, AHORA)).toBe(false);
  });

  it('está vencido exactamente a la hora de expiración', () => {
    expect(bloqueoVencido({ bloqueoExpiraEn: AHORA }, AHORA)).toBe(true);
  });

  it('está vencido después de la hora de expiración', () => {
    expect(bloqueoVencido({ bloqueoExpiraEn: masMinutos(AHORA, -1) }, AHORA)).toBe(true);
  });

  it('una reserva sin expiración se considera vencida, por seguridad', () => {
    expect(bloqueoVencido({ bloqueoExpiraEn: null }, AHORA)).toBe(true);
  });
});
