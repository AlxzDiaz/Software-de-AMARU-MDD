import { MS_POR_HORA, MS_POR_MINUTO } from '../../src/constants/politica-cancelacion';
import { ErrorDominio } from '../../src/domain/errores/error-dominio';
import type { ProveedorPoliticaCancelacion } from '../../src/domain/reservas/puertos';
import type {
  Actor,
  Disponibilidad,
  ExperienciaReservable,
  Reserva,
} from '../../src/domain/reservas/tipos';
import { clonarDisponibilidad, clonarExperiencia, clonarReserva } from './almacen-en-memoria';
import { UnidadDeTrabajoEnMemoria } from './unidad-de-trabajo-en-memoria';

/** Momento fijo de todas las pruebas: 6 de octubre de 2026, 12:00 en Lima. */
export const AHORA = new Date('2026-10-06T12:00:00-05:00');

export const masHoras = (base: Date, horas: number): Date => new Date(base.getTime() + horas * MS_POR_HORA);
export const masMinutos = (base: Date, minutos: number): Date =>
  new Date(base.getTime() + minutos * MS_POR_MINUTO);

export const COMPRADOR: Actor = { id: 'comprador-1', roles: ['BUYER'] };
export const OTRO_COMPRADOR: Actor = { id: 'comprador-2', roles: ['BUYER'] };
export const ADMINISTRADOR: Actor = { id: 'admin-1', roles: ['ADMIN'] };

/** 50 % es un valor de ejemplo para las pruebas; el valor real está pendiente (A-03). */
export const politicaDePrueba = (porcentajeReembolsoParcial = 50): ProveedorPoliticaCancelacion => ({
  obtener: async () => ({ porcentajeReembolsoParcial }),
});

export function crearExperiencia(cambios: Partial<ExperienciaReservable> = {}): ExperienciaReservable {
  return { id: 'exp-1', estado: 'PUBLISHED', precioPorPersonaCentimos: 15_000, ...cambios };
}

export function crearDisponibilidad(cambios: Partial<Disponibilidad> = {}): Disponibilidad {
  return {
    id: 'disp-1',
    experienciaId: 'exp-1',
    inicio: masHoras(AHORA, 240),
    capacidadTotal: 10,
    capacidadReservada: 0,
    capacidadBloqueada: 0,
    estado: 'AVAILABLE',
    declaradaPor: 'coordinador-1',
    ...cambios,
  };
}

export function crearReservaDePrueba(cambios: Partial<Reserva> = {}): Reserva {
  return {
    id: 'res-x',
    experienciaId: 'exp-1',
    disponibilidadId: 'disp-1',
    compradorId: COMPRADOR.id,
    participantes: 2,
    montoCentimos: 30_000,
    estado: 'PENDING_PAYMENT',
    bloqueoExpiraEn: masMinutos(AHORA, 20),
    referenciaPago: null,
    motivoCancelacion: null,
    reembolsoCentimos: null,
    canceladaEn: null,
    ...cambios,
  };
}

export interface DatosEscenario {
  experiencias?: ExperienciaReservable[];
  disponibilidades?: Disponibilidad[];
  reservas?: Reserva[];
}

/** Crea una unidad de trabajo en memoria con los datos indicados ya cargados. */
export function prepararEscenario(datos: DatosEscenario = {}): UnidadDeTrabajoEnMemoria {
  const unidad = new UnidadDeTrabajoEnMemoria();
  const { experiencias = [crearExperiencia()], disponibilidades = [], reservas = [] } = datos;
  for (const e of experiencias) unidad.almacen.experiencias.set(e.id, clonarExperiencia(e));
  for (const d of disponibilidades) unidad.almacen.disponibilidades.set(d.id, clonarDisponibilidad(d));
  for (const r of reservas) unidad.almacen.reservas.set(r.id, clonarReserva(r));
  return unidad;
}

/** Ejecuta `accion` y devuelve el ErrorDominio que lanza; falla si no lanza ninguno. */
export function errorDe(accion: () => unknown): ErrorDominio {
  try {
    accion();
  } catch (error) {
    if (error instanceof ErrorDominio) return error;
    throw error;
  }
  throw new Error('Se esperaba un ErrorDominio y no se lanzó ninguno');
}

/** Versión asíncrona de `errorDe`. */
export async function errorDeAsync(accion: () => Promise<unknown>): Promise<ErrorDominio> {
  try {
    await accion();
  } catch (error) {
    if (error instanceof ErrorDominio) return error;
    throw error;
  }
  throw new Error('Se esperaba un ErrorDominio y no se lanzó ninguno');
}

export function disponibilidadDe(unidad: UnidadDeTrabajoEnMemoria, id = 'disp-1'): Disponibilidad {
  const disponibilidad = unidad.almacen.disponibilidades.get(id);
  if (!disponibilidad) throw new Error(`No existe la disponibilidad ${id}`);
  return disponibilidad;
}

export function reservaDe(unidad: UnidadDeTrabajoEnMemoria, id: string): Reserva {
  const reserva = unidad.almacen.reservas.get(id);
  if (!reserva) throw new Error(`No existe la reserva ${id}`);
  return reserva;
}
