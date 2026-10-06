import { ErrorDominio } from '../errores/error-dominio';

const PUNTOS_BASICOS_POR_PORCENTAJE = 100;
const PUNTOS_BASICOS_TOTALES = 10_000;

/** Exige un entero seguro, no negativo, en céntimos (RNF-R3). */
export function asegurarCentimos(valor: number, campo: string): void {
  if (!Number.isSafeInteger(valor) || valor < 0) {
    throw new ErrorDominio('MONTO_INVALIDO', { campo, valor });
  }
}

/** Exige un porcentaje finito en el rango [0, 100] (R6.5). */
export function asegurarPorcentaje(porcentaje: number): void {
  if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    throw new ErrorDominio('POLITICA_INVALIDA', { porcentaje });
  }
}

/**
 * Aplica un porcentaje a un monto en céntimos y redondea al céntimo más cercano
 * (los medios céntimos hacia arriba) usando solo aritmética entera (R6.4).
 * El porcentaje se considera con hasta dos decimales (puntos básicos).
 */
export function aplicarPorcentaje(centimos: number, porcentaje: number): number {
  asegurarCentimos(centimos, 'centimos');
  asegurarPorcentaje(porcentaje);
  const puntosBasicos = Math.round(porcentaje * PUNTOS_BASICOS_POR_PORCENTAJE);
  return Math.floor((centimos * puntosBasicos + PUNTOS_BASICOS_TOTALES / 2) / PUNTOS_BASICOS_TOTALES);
}
