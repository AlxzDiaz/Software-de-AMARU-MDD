import { describe, expect, it } from 'vitest';
import { crearDisponibilidad } from '../../../test/dobles/fabricas';
import { calcularCuposRestantes, estadoSegunCupos } from './cupos';

describe('calcularCuposRestantes (R1.2)', () => {
  it('resta reservados y bloqueados del total', () => {
    expect(calcularCuposRestantes(crearDisponibilidad({ capacidadReservada: 3, capacidadBloqueada: 2 }))).toBe(5);
  });

  it('devuelve 0 cuando la capacidad está completa (6 reservados + 4 bloqueados de 10)', () => {
    expect(calcularCuposRestantes(crearDisponibilidad({ capacidadReservada: 6, capacidadBloqueada: 4 }))).toBe(0);
  });
});

describe('estadoSegunCupos (R1.3, R3.5, R5.3, R7.5)', () => {
  it('pasa a FULL cuando no quedan cupos', () => {
    expect(estadoSegunCupos(crearDisponibilidad({ capacidadReservada: 10 }))).toBe('FULL');
  });

  it('vuelve a AVAILABLE cuando una fecha FULL recupera cupos', () => {
    expect(estadoSegunCupos(crearDisponibilidad({ estado: 'FULL', capacidadReservada: 7 }))).toBe('AVAILABLE');
  });

  it.each(['BLOCKED', 'CLOSED'] as const)('mantiene %s aunque cambien los cupos', (estado) => {
    expect(estadoSegunCupos(crearDisponibilidad({ estado, capacidadReservada: 10 }))).toBe(estado);
    expect(estadoSegunCupos(crearDisponibilidad({ estado }))).toBe(estado);
  });
});
