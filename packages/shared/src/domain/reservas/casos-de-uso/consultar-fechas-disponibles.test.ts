import { describe, expect, it } from 'vitest';
import {
  AHORA,
  crearDisponibilidad,
  crearExperiencia,
  masHoras,
  prepararEscenario,
} from '../../../../test/dobles/fabricas';
import { ConsultarFechasDisponibles } from './consultar-fechas-disponibles';

const consultar = (unidad: ReturnType<typeof prepararEscenario>, experienciaId = 'exp-1') =>
  new ConsultarFechasDisponibles(unidad).ejecutar({ experienciaId, ahora: AHORA });

describe('ConsultarFechasDisponibles (Requirement 1)', () => {
  it('escenario: fecha llena (6 reservados + 4 bloqueados) no seleccionable; fecha libre con 10 cupos', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [
        crearDisponibilidad({
          id: 'disp-llena',
          inicio: masHoras(AHORA, 48),
          capacidadReservada: 6,
          capacidadBloqueada: 4,
          estado: 'FULL',
        }),
        crearDisponibilidad({ id: 'disp-libre', inicio: masHoras(AHORA, 72) }),
      ],
    });

    expect(await consultar(unidad)).toEqual([
      { disponibilidadId: 'disp-llena', inicio: masHoras(AHORA, 48), cuposRestantes: 0, seleccionable: false },
      { disponibilidadId: 'disp-libre', inicio: masHoras(AHORA, 72), cuposRestantes: 10, seleccionable: true },
    ]);
  });

  it('R1.1 — devuelve solo fechas futuras, ordenadas por fecha ascendente', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [
        crearDisponibilidad({ id: 'tarde', inicio: masHoras(AHORA, 300) }),
        crearDisponibilidad({ id: 'pasada', inicio: masHoras(AHORA, -5) }),
        crearDisponibilidad({ id: 'ahora', inicio: AHORA }),
        crearDisponibilidad({ id: 'pronto', inicio: masHoras(AHORA, 30) }),
      ],
    });

    const ids = (await consultar(unidad)).map((f) => f.disponibilidadId);
    expect(ids).toEqual(['pronto', 'tarde']);
  });

  it('R1.2 — informa los cupos restantes descontando reservados y bloqueados', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadReservada: 3, capacidadBloqueada: 2 })],
    });
    const [fecha] = await consultar(unidad);
    expect(fecha).toMatchObject({ cuposRestantes: 5, seleccionable: true });
  });

  it('R1.3 — una fecha sin cupos se marca como no seleccionable', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ capacidadReservada: 10, estado: 'FULL' })],
    });
    const [fecha] = await consultar(unidad);
    expect(fecha).toMatchObject({ cuposRestantes: 0, seleccionable: false });
  });

  it.each(['DRAFT', 'PENDING_REVIEW', 'UNPUBLISHED'] as const)(
    'R1.4 — devuelve una lista vacía si la experiencia está %s',
    async (estado) => {
      const unidad = prepararEscenario({
        experiencias: [crearExperiencia({ estado })],
        disponibilidades: [crearDisponibilidad()],
      });
      expect(await consultar(unidad)).toEqual([]);
    },
  );

  it('R1.4 — devuelve una lista vacía si la experiencia no existe', async () => {
    expect(await consultar(prepararEscenario(), 'exp-inexistente')).toEqual([]);
  });

  it('R1.5 — no devuelve fechas BLOCKED ni CLOSED, ni fechas sin declarar por el coordinador', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [
        crearDisponibilidad({ id: 'bloqueada', estado: 'BLOCKED' }),
        crearDisponibilidad({ id: 'cerrada', estado: 'CLOSED' }),
        crearDisponibilidad({ id: 'sin-declarar', declaradaPor: null }),
        crearDisponibilidad({ id: 'visible' }),
      ],
    });
    expect((await consultar(unidad)).map((f) => f.disponibilidadId)).toEqual(['visible']);
  });

  it('no mezcla fechas de otras experiencias', async () => {
    const unidad = prepararEscenario({
      disponibilidades: [crearDisponibilidad({ id: 'ajena', experienciaId: 'exp-2' }), crearDisponibilidad()],
    });
    expect((await consultar(unidad)).map((f) => f.disponibilidadId)).toEqual(['disp-1']);
  });
});
