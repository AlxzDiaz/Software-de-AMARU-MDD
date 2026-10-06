/** Estados de una reserva de experiencia (§20 de la especificación). */
export const ESTADOS_RESERVA = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

/** Estados de una fecha declarada de una experiencia (entidad Availability). */
export const ESTADOS_DISPONIBILIDAD = ['AVAILABLE', 'FULL', 'BLOCKED', 'CLOSED'] as const;
export type EstadoDisponibilidad = (typeof ESTADOS_DISPONIBILIDAD)[number];

/** Estados de publicación de productos y experiencias (§20). */
export const ESTADOS_PUBLICACION = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'OBSERVED',
  'REJECTED',
  'UNPUBLISHED',
] as const;
export type EstadoPublicacion = (typeof ESTADOS_PUBLICACION)[number];

/** Motivos con los que el propio sistema cancela una reserva pendiente de pago. */
export const MOTIVOS_CANCELACION_SISTEMA = ['EXPIRED', 'PAYMENT_REJECTED'] as const;
export type MotivoCancelacionSistema = (typeof MOTIVOS_CANCELACION_SISTEMA)[number];

/** Resultado del cálculo de reembolso según RN-07. */
export const TIPOS_REEMBOLSO = ['TOTAL', 'PARCIAL', 'SIN_REEMBOLSO'] as const;
export type TipoReembolso = (typeof TIPOS_REEMBOLSO)[number];

export const ROLES = ['BUYER', 'ARTISAN', 'COORDINATOR', 'ADMIN'] as const;
export type Rol = (typeof ROLES)[number];
