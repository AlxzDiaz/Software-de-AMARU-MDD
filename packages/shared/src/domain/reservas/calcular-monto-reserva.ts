import { asegurarCentimos } from '../dinero/centimos';
import { ErrorDominio } from '../errores/error-dominio';

/** Monto de la reserva = precio vigente por persona × participantes (R3.3). */
export function calcularMontoReserva(precioPorPersonaCentimos: number, participantes: number): number {
  asegurarCentimos(precioPorPersonaCentimos, 'precioPorPersonaCentimos');
  if (!Number.isSafeInteger(participantes) || participantes < 1) {
    throw new ErrorDominio('PARTICIPANTES_INVALIDOS', { participantes });
  }
  const monto = precioPorPersonaCentimos * participantes;
  asegurarCentimos(monto, 'montoCentimos');
  return monto;
}
