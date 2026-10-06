import type {
  EstadoDisponibilidad,
  EstadoPublicacion,
  EstadoReserva,
  Rol,
  TipoReembolso,
} from '../../constants/estados-reserva';

/** Datos de una experiencia necesarios para reservarla. */
export interface ExperienciaReservable {
  id: string;
  estado: EstadoPublicacion;
  /** Precio por persona en céntimos, fijado por el artesano o la comunidad (RN-02). */
  precioPorPersonaCentimos: number;
}

/** Fecha declarada por el coordinador para una experiencia, con sus cupos. */
export interface Disponibilidad {
  id: string;
  experienciaId: string;
  /** Instante absoluto de inicio, ya resuelto desde la hora de Lima (A-24). */
  inicio: Date;
  capacidadTotal: number;
  capacidadReservada: number;
  capacidadBloqueada: number;
  estado: EstadoDisponibilidad;
  /** Id del coordinador que declaró la fecha; null si no fue declarada (RN-06). */
  declaradaPor: string | null;
}

export interface Reserva {
  id: string;
  experienciaId: string;
  disponibilidadId: string;
  compradorId: string;
  participantes: number;
  montoCentimos: number;
  estado: EstadoReserva;
  bloqueoExpiraEn: Date | null;
  referenciaPago: string | null;
  motivoCancelacion: string | null;
  reembolsoCentimos: number | null;
  canceladaEn: Date | null;
}

export type NuevaReserva = Omit<Reserva, 'id'>;

/** Cambios aplicables a una reserva en una transición de estado. */
export type CambiosReserva = Partial<Omit<Reserva, 'id' | 'estado'>> & { estado: EstadoReserva };

export interface CambioEstadoReserva {
  reservaId: string;
  /** null indica la creación de la reserva. */
  desde: EstadoReserva | null;
  hacia: EstadoReserva;
  /** null indica que actuó el sistema (job de expiración o confirmación de pago). */
  actorId: string | null;
  motivo: string | null;
  ocurridoEn: Date;
}

export interface Actor {
  id: string;
  roles: readonly Rol[];
}

export interface PoliticaCancelacion {
  /** Porcentaje (0–100) devuelto con 48 h a menos de 168 h de anticipación. Configurable (A-03). */
  porcentajeReembolsoParcial: number;
}

export interface ResultadoReembolso {
  tipo: TipoReembolso;
  montoCentimos: number;
  horasAnticipacion: number;
}

export interface FechaDisponible {
  disponibilidadId: string;
  inicio: Date;
  cuposRestantes: number;
  seleccionable: boolean;
}
