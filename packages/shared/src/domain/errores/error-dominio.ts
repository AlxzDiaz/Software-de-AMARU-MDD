export const CODIGOS_ERROR = [
  'EXPERIENCIA_NO_PUBLICADA',
  'FECHA_NO_DISPONIBLE',
  'PARTICIPANTES_INVALIDOS',
  'CUPOS_INSUFICIENTES',
  'CUPOS_INCONSISTENTES',
  'RESERVA_NO_ENCONTRADA',
  'RESERVA_EXPIRADA',
  'REFERENCIA_PAGO_REQUERIDA',
  'PAGO_DUPLICADO',
  'POLITICA_INVALIDA',
  'CONFIGURACION_INVALIDA',
  'MONTO_INVALIDO',
  'ACCESO_DENEGADO',
  'MOTIVO_REQUERIDO',
  'CANCELACION_NO_PERMITIDA',
  'ASISTENCIA_NO_PERMITIDA',
  'TRANSICION_INVALIDA',
] as const;
export type CodigoError = (typeof CODIGOS_ERROR)[number];

export const MENSAJES_ERROR: Readonly<Record<CodigoError, string>> = {
  EXPERIENCIA_NO_PUBLICADA: 'La experiencia no está disponible para reservas.',
  FECHA_NO_DISPONIBLE: 'La fecha seleccionada no está disponible.',
  PARTICIPANTES_INVALIDOS: 'Indica un número de participantes válido (1 o más).',
  CUPOS_INSUFICIENTES: 'No quedan cupos suficientes para esa fecha.',
  CUPOS_INCONSISTENTES: 'Error interno de cupos. Inténtalo más tarde.',
  RESERVA_NO_ENCONTRADA: 'La reserva no existe.',
  RESERVA_EXPIRADA: 'El tiempo para pagar esta reserva venció.',
  REFERENCIA_PAGO_REQUERIDA: 'Falta la referencia de pago.',
  PAGO_DUPLICADO: 'La reserva ya fue pagada con otra operación.',
  POLITICA_INVALIDA: 'La política de cancelación está mal configurada.',
  CONFIGURACION_INVALIDA: 'La configuración del sistema de reservas no es válida.',
  MONTO_INVALIDO: 'El monto debe ser un número entero de céntimos, no negativo.',
  ACCESO_DENEGADO: 'No tienes permiso para realizar esta acción.',
  MOTIVO_REQUERIDO: 'Indica el motivo de la cancelación (mínimo 5 caracteres).',
  CANCELACION_NO_PERMITIDA: 'Esta reserva ya no se puede cancelar.',
  ASISTENCIA_NO_PERMITIDA: 'La asistencia solo se puede confirmar cuando la experiencia ya empezó.',
  TRANSICION_INVALIDA: 'Cambio de estado no permitido.',
};

/** Error esperado de una regla de negocio. La API lo traduce a una respuesta HTTP. */
export class ErrorDominio extends Error {
  readonly codigo: CodigoError;
  readonly detalles: Readonly<Record<string, unknown>>;

  constructor(codigo: CodigoError, detalles: Record<string, unknown> = {}) {
    super(MENSAJES_ERROR[codigo]);
    this.name = 'ErrorDominio';
    this.codigo = codigo;
    this.detalles = detalles;
  }
}
