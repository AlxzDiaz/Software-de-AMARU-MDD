import type { MotivoCancelacionSistema } from '../../../constants/estados-reserva';
import { ErrorDominio } from '../../errores/error-dominio';
import type { Repositorios, RepositorioDisponibilidad, RepositorioReservas } from '../puertos';
import type { Actor, CambiosReserva, Disponibilidad, Reserva } from '../tipos';
import { asegurarTransicionReserva } from '../transiciones-reserva';

export async function obtenerReservaOFallar(
  reservas: RepositorioReservas,
  reservaId: string,
): Promise<Reserva> {
  const reserva = await reservas.obtenerPorId(reservaId);
  if (reserva === null) {
    throw new ErrorDominio('RESERVA_NO_ENCONTRADA', { reservaId });
  }
  return reserva;
}

/**
 * Obtiene la reserva y valida que el actor tiene autorización para cancelarla (R7.2).
 * RESERVA_NO_ENCONTRADA si no existe.
 * ACCESO_DENEGADO si el actor no es el titular ni ADMIN.
 */
export async function obtenerReservaAutorizada(
  reservas: RepositorioReservas,
  reservaId: string,
  actor: Actor,
): Promise<Reserva> {
  const reserva = await obtenerReservaOFallar(reservas, reservaId);
  
  // Solo el comprador titular o un administrador pueden cancelar (R7.2, A-25).
  const puedeCancelar = actor.id === reserva.compradorId || actor.roles.includes('ADMIN');
  if (!puedeCancelar) {
    throw new ErrorDominio('ACCESO_DENEGADO', { reservaId: reserva.id });
  }
  
  return reserva;
}

/**
 * Valida que la reserva se puede cancelar: debe estar CONFIRMED y la experiencia no debe haber iniciado (R7.4).
 * CANCELACION_NO_PERMITIDA si la reserva no está CONFIRMED o la experiencia ya inició.
 * Devuelve la disponibilidad de la reserva.
 */
export async function asegurarCancelable(
  disponibilidades: RepositorioDisponibilidad,
  reserva: Reserva,
  ahora: Date,
): Promise<Disponibilidad> {
  if (reserva.estado !== 'CONFIRMED') {
    throw new ErrorDominio('CANCELACION_NO_PERMITIDA', { estado: reserva.estado });
  }

  const disponibilidad = await disponibilidades.obtenerPorId(reserva.disponibilidadId);
  if (disponibilidad === null || ahora.getTime() >= disponibilidad.inicio.getTime()) {
    throw new ErrorDominio('CANCELACION_NO_PERMITIDA', { motivo: 'EXPERIENCIA_INICIADA' });
  }

  return disponibilidad;
}

/**
 * Valida la transición (R8), guarda la reserva y registra el historial de estados (R7.6).
 * Es el único camino por el que un caso de uso cambia el estado de una reserva.
 */
export async function aplicarTransicion(
  reservas: RepositorioReservas,
  reserva: Reserva,
  cambios: CambiosReserva,
  actorId: string | null,
  motivo: string | null,
  ahora: Date,
): Promise<Reserva> {
  asegurarTransicionReserva(reserva.estado, cambios.estado);
  const actualizada: Reserva = { ...reserva, ...cambios };
  await reservas.actualizar(actualizada);
  await reservas.registrarCambioEstado({
    reservaId: reserva.id,
    desde: reserva.estado,
    hacia: cambios.estado,
    actorId,
    motivo,
    ocurridoEn: ahora,
  });
  return actualizada;
}

/** Cancela una reserva pendiente de pago por decisión del sistema y libera sus cupos (R5). */
export async function cancelarPendientePorSistema(
  repos: Repositorios,
  reserva: Reserva,
  motivo: MotivoCancelacionSistema,
  ahora: Date,
): Promise<Reserva> {
  const cancelada = await aplicarTransicion(
    repos.reservas,
    reserva,
    { estado: 'CANCELLED', motivoCancelacion: motivo, canceladaEn: ahora, bloqueoExpiraEn: null },
    null,
    motivo,
    ahora,
  );
  await repos.disponibilidad.liberarBloqueados(reserva.disponibilidadId, reserva.participantes);
  return cancelada;
}
