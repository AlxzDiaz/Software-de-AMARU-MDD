import type { EstadoReserva, TipoReembolso } from '../../constants/estados-reserva';
import {
  HORAS_REEMBOLSO_PARCIAL,
  HORAS_REEMBOLSO_TOTAL,
  MS_POR_HORA,
} from '../../constants/politica-cancelacion';
import { aplicarPorcentaje, asegurarCentimos, asegurarPorcentaje } from '../dinero/centimos';
import type { PoliticaCancelacion, ResultadoReembolso } from './tipos';

export interface DatosReembolso {
  montoPagadoCentimos: number;
  inicio: Date;
  canceladoEn: Date;
  politica: PoliticaCancelacion;
}

const ESTADO_TRAS_CANCELACION: Readonly<Record<TipoReembolso, EstadoReserva>> = {
  TOTAL: 'REFUNDED',
  PARCIAL: 'PARTIALLY_REFUNDED',
  SIN_REEMBOLSO: 'CANCELLED',
};

/** Horas exactas (con decimales) entre la cancelación y el inicio de la experiencia. */
export function calcularHorasAnticipacion(inicio: Date, canceladoEn: Date): number {
  return (inicio.getTime() - canceladoEn.getTime()) / MS_POR_HORA;
}

/**
 * Política de cancelación RN-07, como función pura de dominio (R6.1–R6.6):
 * ≥ 168 h → total · 48 h a < 168 h → parcial · < 48 h → sin reembolso.
 */
export function calcularReembolso(datos: DatosReembolso): ResultadoReembolso {
  const { montoPagadoCentimos, politica } = datos;
  asegurarCentimos(montoPagadoCentimos, 'montoPagadoCentimos');
  asegurarPorcentaje(politica.porcentajeReembolsoParcial);

  const horasAnticipacion = calcularHorasAnticipacion(datos.inicio, datos.canceladoEn);

  if (horasAnticipacion >= HORAS_REEMBOLSO_TOTAL) {
    return { tipo: 'TOTAL', montoCentimos: montoPagadoCentimos, horasAnticipacion };
  }
  if (horasAnticipacion >= HORAS_REEMBOLSO_PARCIAL) {
    return {
      tipo: 'PARCIAL',
      montoCentimos: aplicarPorcentaje(montoPagadoCentimos, politica.porcentajeReembolsoParcial),
      horasAnticipacion,
    };
  }
  return { tipo: 'SIN_REEMBOLSO', montoCentimos: 0, horasAnticipacion };
}

/** Estado final de una reserva cancelada según el tipo de reembolso (R7.1). */
export function estadoTrasCancelacion(tipo: TipoReembolso): EstadoReserva {
  return ESTADO_TRAS_CANCELACION[tipo];
}
