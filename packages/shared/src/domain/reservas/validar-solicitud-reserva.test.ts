import { describe, expect, it } from 'vitest';
import {
  AHORA,
  crearDisponibilidad,
  crearExperiencia,
  errorDe,
  masHoras,
} from '../../../test/dobles/fabricas';
import { type SolicitudReserva, validarSolicitudReserva } from './validar-solicitud-reserva';

const solicitudValida = (cambios: Partial<SolicitudReserva> = {}): SolicitudReserva => ({
  experiencia: crearExperiencia(),
  disponibilidad: crearDisponibilidad(),
  participantes: 2,
  ahora: AHORA,
  ...cambios,
});

const codigoDe = (cambios: Partial<SolicitudReserva>) =>
  errorDe(() => validarSolicitudReserva(solicitudValida(cambios))).codigo;

describe('validarSolicitudReserva (Requirement 2)', () => {
  it('R2.1 — acepta una solicitud que cumple todas las condiciones', () => {
    expect(() => validarSolicitudReserva(solicitudValida())).not.toThrow();
  });

  it('R2.1 — acepta reservar exactamente los cupos restantes', () => {
    const disponibilidad = crearDisponibilidad({ capacidadReservada: 8 });
    expect(() => validarSolicitudReserva(solicitudValida({ disponibilidad, participantes: 2 }))).not.toThrow();
  });

  describe('R2.2 — EXPERIENCIA_NO_PUBLICADA', () => {
    it('si la experiencia no existe', () => {
      expect(codigoDe({ experiencia: null })).toBe('EXPERIENCIA_NO_PUBLICADA');
    });

    it.each(['DRAFT', 'PENDING_REVIEW', 'OBSERVED', 'REJECTED', 'UNPUBLISHED'] as const)(
      'si la experiencia está %s',
      (estado) => {
        expect(codigoDe({ experiencia: crearExperiencia({ estado }) })).toBe('EXPERIENCIA_NO_PUBLICADA');
      },
    );
  });

  describe('R2.3 — FECHA_NO_DISPONIBLE', () => {
    it('si la disponibilidad no existe', () => {
      expect(codigoDe({ disponibilidad: null })).toBe('FECHA_NO_DISPONIBLE');
    });

    it('si pertenece a otra experiencia', () => {
      expect(codigoDe({ disponibilidad: crearDisponibilidad({ experienciaId: 'exp-otra' }) })).toBe(
        'FECHA_NO_DISPONIBLE',
      );
    });

    it('si no fue declarada por un coordinador', () => {
      expect(codigoDe({ disponibilidad: crearDisponibilidad({ declaradaPor: null }) })).toBe('FECHA_NO_DISPONIBLE');
    });

    it.each(['BLOCKED', 'CLOSED'] as const)('si está %s', (estado) => {
      expect(codigoDe({ disponibilidad: crearDisponibilidad({ estado }) })).toBe('FECHA_NO_DISPONIBLE');
    });

    it('si inicia exactamente ahora', () => {
      expect(codigoDe({ disponibilidad: crearDisponibilidad({ inicio: AHORA }) })).toBe('FECHA_NO_DISPONIBLE');
    });

    it('si ya inició', () => {
      expect(codigoDe({ disponibilidad: crearDisponibilidad({ inicio: masHoras(AHORA, -1) }) })).toBe(
        'FECHA_NO_DISPONIBLE',
      );
    });
  });

  it.each([0, -1, 1.5, Number.NaN])('R2.4 — rechaza %d participantes con PARTICIPANTES_INVALIDOS', (participantes) => {
    expect(codigoDe({ participantes })).toBe('PARTICIPANTES_INVALIDOS');
  });

  it('R2.5 — escenario: 3 participantes con 2 cupos restantes → CUPOS_INSUFICIENTES', () => {
    const disponibilidad = crearDisponibilidad({ capacidadReservada: 6, capacidadBloqueada: 2 });
    const error = errorDe(() => validarSolicitudReserva(solicitudValida({ disponibilidad, participantes: 3 })));
    expect(error.codigo).toBe('CUPOS_INSUFICIENTES');
    expect(error.detalles).toEqual({ solicitados: 3, restantes: 2 });
  });

  it('R2.5 — una fecha FULL responde CUPOS_INSUFICIENTES (no FECHA_NO_DISPONIBLE)', () => {
    const disponibilidad = crearDisponibilidad({ estado: 'FULL', capacidadReservada: 10 });
    expect(codigoDe({ disponibilidad, participantes: 1 })).toBe('CUPOS_INSUFICIENTES');
  });
});
