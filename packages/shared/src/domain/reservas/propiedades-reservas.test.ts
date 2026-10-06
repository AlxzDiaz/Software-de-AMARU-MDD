import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { ESTADOS_RESERVA } from '../../constants/estados-reserva';
import {
  AHORA,
  COMPRADOR,
  crearDisponibilidad,
  masHoras,
  masMinutos,
  politicaDePrueba,
  prepararEscenario,
} from '../../../test/dobles/fabricas';
import type { UnidadDeTrabajoEnMemoria } from '../../../test/dobles/unidad-de-trabajo-en-memoria';
import { ErrorDominio } from '../errores/error-dominio';
import { calcularReembolso } from './calcular-reembolso';
import { CancelarReserva } from './casos-de-uso/cancelar-reserva';
import { ConfirmarAsistencia } from './casos-de-uso/confirmar-asistencia';
import { ConfirmarReserva } from './casos-de-uso/confirmar-reserva';
import { ConsultarReembolso } from './casos-de-uso/consultar-reembolso';
import { CrearReserva } from './casos-de-uso/crear-reserva';
import { CancelarPorPagoRechazado, LiberarBloqueosVencidos } from './casos-de-uso/liberar-bloqueos';
import { calcularCuposRestantes } from './cupos';
import { puedeCambiarEstadoReserva } from './transiciones-reserva';

const CORRIDAS = { numRuns: 200 };
const INICIO = masHoras(AHORA, 400);

// ── Generadores ──────────────────────────────────────────────────────────────
const montoArb = fc.integer({ min: 0, max: 1_000_000_000 });
const porcentajeArb = fc.double({ min: 0, max: 100, noNaN: true });
const horasArb = fc.double({ min: -1_000, max: 2_000, noNaN: true });

type Operacion =
  | { tipo: 'crear'; participantes: number }
  | { tipo: 'confirmar'; indice: number }
  | { tipo: 'rechazar'; indice: number }
  | { tipo: 'cancelar'; indice: number }
  | { tipo: 'liberar' }
  | { tipo: 'avanzar'; minutos: number };

const operacionArb: fc.Arbitrary<Operacion> = fc.oneof(
  fc.record({ tipo: fc.constant('crear' as const), participantes: fc.integer({ min: 0, max: 5 }) }),
  fc.record({ tipo: fc.constant('confirmar' as const), indice: fc.nat(20) }),
  fc.record({ tipo: fc.constant('rechazar' as const), indice: fc.nat(20) }),
  fc.record({ tipo: fc.constant('cancelar' as const), indice: fc.nat(20) }),
  fc.constant({ tipo: 'liberar' as const }),
  fc.record({ tipo: fc.constant('avanzar' as const), minutos: fc.integer({ min: 0, max: 3_000 }) }),
);

// ── Modelo: ejecuta una secuencia de operaciones sobre una fecha de 8 cupos ─────
function verificarInvariantes(unidad: UnidadDeTrabajoEnMemoria): void {
  const disponibilidad = unidad.almacen.disponibilidades.get('disp-1');
  if (!disponibilidad) throw new Error('falta la disponibilidad');
  const { capacidadReservada, capacidadBloqueada, capacidadTotal } = disponibilidad;
  const reservas = [...unidad.almacen.reservas.values()];
  const suma = (estado: string) =>
    reservas.filter((r) => r.estado === estado).reduce((total, r) => total + r.participantes, 0);

  // Property 1 — invariante de cupos
  expect(capacidadReservada).toBeGreaterThanOrEqual(0);
  expect(capacidadBloqueada).toBeGreaterThanOrEqual(0);
  expect(capacidadReservada + capacidadBloqueada).toBeLessThanOrEqual(capacidadTotal);
  // Property 2 — conservación de cupos
  expect(capacidadBloqueada).toBe(suma('PENDING_PAYMENT'));
  expect(capacidadReservada).toBe(suma('CONFIRMED'));
  // Property 3 — estado coherente con los cupos
  expect(disponibilidad.estado === 'FULL').toBe(calcularCuposRestantes(disponibilidad) === 0);
}

async function ejecutarSecuencia(operaciones: Operacion[]): Promise<{ unidad: UnidadDeTrabajoEnMemoria; ahora: Date }> {
  const unidad = prepararEscenario({
    disponibilidades: [crearDisponibilidad({ capacidadTotal: 8, inicio: INICIO })],
  });
  const crear = new CrearReserva(unidad, { minutosBloqueo: 20 });
  const confirmar = new ConfirmarReserva(unidad);
  const rechazar = new CancelarPorPagoRechazado(unidad);
  const cancelar = new CancelarReserva(unidad, politicaDePrueba(50));
  const liberar = new LiberarBloqueosVencidos(unidad);
  const ids: string[] = [];
  let ahora = AHORA;

  for (const operacion of operaciones) {
    const elegido = 'indice' in operacion ? ids[operacion.indice % Math.max(ids.length, 1)] : undefined;
    const antes = unidad.almacen.instantanea();
    try {
      switch (operacion.tipo) {
        case 'crear': {
          const reserva = await crear.ejecutar({
            experienciaId: 'exp-1',
            disponibilidadId: 'disp-1',
            compradorId: COMPRADOR.id,
            participantes: operacion.participantes,
            ahora,
          });
          ids.push(reserva.id);
          break;
        }
        case 'confirmar':
          if (elegido) await confirmar.ejecutar({ reservaId: elegido, referenciaPago: `PAY-${elegido}`, ahora });
          break;
        case 'rechazar':
          if (elegido) await rechazar.ejecutar({ reservaId: elegido, ahora });
          break;
        case 'cancelar':
          if (elegido) await cancelar.ejecutar({ reservaId: elegido, actor: COMPRADOR, motivo: 'Motivo de prueba', ahora });
          break;
        case 'liberar':
          await liberar.ejecutar({ ahora });
          break;
        case 'avanzar':
          ahora = masMinutos(ahora, operacion.minutos);
          break;
      }
    } catch (error) {
      // Solo se admiten errores de dominio, y ninguno puede dejar cambios a medias (Property 8).
      if (!(error instanceof ErrorDominio)) throw error;
      expect(unidad.almacen.instantanea()).toEqual(antes);
    }
    verificarInvariantes(unidad);
  }
  return { unidad, ahora };
}

// ── Propiedades ──────────────────────────────────────────────────────────────
describe('Correctness Properties (design.md)', () => {
  it('Property 1, 2, 3 y 8 — invariantes de cupos y rollback para cualquier secuencia de operaciones', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(operacionArb, { maxLength: 40 }), async (operaciones) => {
        await ejecutarSecuencia(operaciones);
      }),
      CORRIDAS,
    );
  });

  it('Property 4 — el reembolso es un entero entre 0 y el monto pagado', () => {
    fc.assert(
      fc.property(montoArb, porcentajeArb, horasArb, (monto, porcentaje, horas) => {
        const { montoCentimos } = calcularReembolso({
          montoPagadoCentimos: monto,
          inicio: INICIO,
          canceladoEn: masHoras(INICIO, -horas),
          politica: { porcentajeReembolsoParcial: porcentaje },
        });
        expect(Number.isSafeInteger(montoCentimos)).toBe(true);
        expect(montoCentimos).toBeGreaterThanOrEqual(0);
        expect(montoCentimos).toBeLessThanOrEqual(monto);
      }),
      CORRIDAS,
    );
  });

  it('Property 5 — cancelar con más anticipación nunca devuelve menos dinero', () => {
    fc.assert(
      fc.property(montoArb, porcentajeArb, horasArb, horasArb, (monto, porcentaje, horasA, horasB) => {
        const reembolso = (horas: number) =>
          calcularReembolso({
            montoPagadoCentimos: monto,
            inicio: INICIO,
            canceladoEn: masHoras(INICIO, -horas),
            politica: { porcentajeReembolsoParcial: porcentaje },
          }).montoCentimos;
        const [menos, mas] = horasA <= horasB ? [horasA, horasB] : [horasB, horasA];
        expect(reembolso(mas)).toBeGreaterThanOrEqual(reembolso(menos));
      }),
      CORRIDAS,
    );
  });

  it('Property 6 — los estados finales no tienen transiciones de salida', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED' as const),
        fc.constantFrom(...ESTADOS_RESERVA),
        (final, destino) => {
          expect(puedeCambiarEstadoReserva(final, destino)).toBe(false);
        },
      ),
      CORRIDAS,
    );
  });

  it('Property 7 — liberar bloqueos n veces con el mismo "ahora" equivale a hacerlo una vez', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(operacionArb, { maxLength: 25 }), fc.integer({ min: 2, max: 4 }), async (operaciones, veces) => {
        const { unidad, ahora } = await ejecutarSecuencia(operaciones);
        const liberar = new LiberarBloqueosVencidos(unidad);
        await liberar.ejecutar({ ahora });
        const trasUnaVez = unidad.almacen.instantanea();
        for (let i = 1; i < veces; i += 1) {
          expect(await liberar.ejecutar({ ahora })).toEqual({ liberadas: 0 });
        }
        expect(unidad.almacen.instantanea()).toEqual(trasUnaVez);
      }),
      CORRIDAS,
    );
  });

  it('Property 10 — confirmar la asistencia conserva los cupos (R9.6)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(operacionArb, { maxLength: 25 }),
        fc.integer({ min: 1, max: 20 }),
        async (operaciones, indice) => {
          const { unidad, ahora } = await ejecutarSecuencia(operaciones);
          const ids = [...unidad.almacen.reservas.values()]
            .filter((r) => r.estado === 'CONFIRMED')
            .map((r) => r.id);
          
          if (ids.length === 0) return; // sin reservas CONFIRMED, nada que confirmar

          const elegida = ids[indice % ids.length];
          if (!elegida) return;

          const reserva = unidad.almacen.reservas.get(elegida);
          if (!reserva) return;

          const disponibilidad = unidad.almacen.disponibilidades.get(reserva.disponibilidadId);
          if (!disponibilidad) return;

          // Solo se puede confirmar si la experiencia ya inició
          if (ahora.getTime() < disponibilidad.inicio.getTime()) return;

          const antesReservada = disponibilidad.capacidadReservada;
          const antesBloqueada = disponibilidad.capacidadBloqueada;

          const coordinador = { id: disponibilidad.declaradaPor ?? 'coordinador-inexistente', roles: ['COORDINATOR'] as const };
          const confirmarAsistencia = new ConfirmarAsistencia(unidad);
          
          try {
            await confirmarAsistencia.ejecutar({ reservaId: elegida, actor: coordinador, ahora });

            const despuesDisponibilidad = unidad.almacen.disponibilidades.get(reserva.disponibilidadId);
            expect(despuesDisponibilidad?.capacidadReservada).toBe(antesReservada);
            expect(despuesDisponibilidad?.capacidadBloqueada).toBe(antesBloqueada);
          } catch (error) {
            // Si falla (por ejemplo, ACCESO_DENEGADO si declaradaPor es null), es válido
            if (!(error instanceof ErrorDominio)) throw error;
          }
        },
      ),
      CORRIDAS,
    );
  });

  it('Property 9 — la vista previa coincide con la cancelación y no modifica nada (R6.7)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(operacionArb, { maxLength: 25 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 400 }),
        async (operaciones, indice, horasConsulta) => {
          const { unidad } = await ejecutarSecuencia(operaciones);
          const ids = [...unidad.almacen.reservas.values()]
            .filter((r) => r.estado === 'CONFIRMED')
            .map((r) => r.id);

          if (ids.length === 0) return; // sin reservas CONFIRMED, nada que consultar

          const elegida = ids[indice % ids.length];
          if (!elegida) return;

          const reserva = unidad.almacen.reservas.get(elegida);
          if (!reserva) return;

          const disponibilidad = unidad.almacen.disponibilidades.get(reserva.disponibilidadId);
          if (!disponibilidad) return;

          // El momento de consulta debe ser anterior al inicio
          const ahora = masHoras(disponibilidad.inicio, -horasConsulta);
          if (ahora.getTime() >= disponibilidad.inicio.getTime()) return;

          const antesConsulta = unidad.almacen.instantanea();
          const consultar = new ConsultarReembolso(unidad, politicaDePrueba(50));
          const cancelar = new CancelarReserva(unidad, politicaDePrueba(50));

          try {
            const reembolsoConsulta = await consultar.ejecutar({
              reservaId: elegida,
              actor: { id: reserva.compradorId, roles: ['BUYER'] },
              ahora,
            });

            // Property 9a: el almacén queda idéntico tras la consulta
            expect(unidad.almacen.instantanea()).toEqual(antesConsulta);

            // Property 9b: la vista previa coincide con el reembolso de CancelarReserva
            const { reembolso: reembolsoCancelacion } = await cancelar.ejecutar({
              reservaId: elegida,
              actor: { id: reserva.compradorId, roles: ['BUYER'] },
              motivo: 'Motivo de prueba para property',
              ahora,
            });

            expect(reembolsoConsulta).toEqual(reembolsoCancelacion);
          } catch (error) {
            // Si falla (por ejemplo, estado ya no es CONFIRMED), es válido
            if (!(error instanceof ErrorDominio)) throw error;
          }
        },
      ),
      CORRIDAS,
    );
  });
});
