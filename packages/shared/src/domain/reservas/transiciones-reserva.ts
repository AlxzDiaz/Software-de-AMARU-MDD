import type { EstadoReserva } from '../../constants/estados-reserva';
import { ErrorDominio } from '../errores/error-dominio';

/** Única fuente de las transiciones permitidas (regla arquitectónica 6, R8.1–R8.2). */
const TRANSICIONES_RESERVA: Readonly<Record<EstadoReserva, readonly EstadoReserva[]>> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
  PARTIALLY_REFUNDED: [],
};

export function puedeCambiarEstadoReserva(actual: EstadoReserva, siguiente: EstadoReserva): boolean {
  return TRANSICIONES_RESERVA[actual].includes(siguiente);
}

/** Lanza `TRANSICION_INVALIDA` si la transición no está permitida (R8.3). */
export function asegurarTransicionReserva(actual: EstadoReserva, siguiente: EstadoReserva): void {
  if (!puedeCambiarEstadoReserva(actual, siguiente)) {
    throw new ErrorDominio('TRANSICION_INVALIDA', {
      actual,
      siguiente,
      transicion: `${actual} → ${siguiente}`,
    });
  }
}
