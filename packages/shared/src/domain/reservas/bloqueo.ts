import { MS_POR_MINUTO } from '../../constants/politica-cancelacion';
import type { Reserva } from './tipos';

/** Momento en que vence el bloqueo temporal de cupos (R3.2). */
export function calcularExpiracionBloqueo(ahora: Date, minutosBloqueo: number): Date {
  return new Date(ahora.getTime() + minutosBloqueo * MS_POR_MINUTO);
}

/**
 * Indica si el bloqueo de una reserva ya venció (R4.4, R5.1).
 * Una reserva sin fecha de vencimiento se considera vencida, por seguridad.
 */
export function bloqueoVencido(reserva: Pick<Reserva, 'bloqueoExpiraEn'>, ahora: Date): boolean {
  return reserva.bloqueoExpiraEn === null || reserva.bloqueoExpiraEn.getTime() <= ahora.getTime();
}
