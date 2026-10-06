import type {
  CambioEstadoReserva,
  Disponibilidad,
  ExperienciaReservable,
  NuevaReserva,
  PoliticaCancelacion,
  Reserva,
} from './tipos';

export interface RepositorioExperiencias {
  obtenerReservable(id: string): Promise<ExperienciaReservable | null>;
}

/**
 * Contrato de atomicidad: las operaciones de cupos se ejecutan como una única
 * actualización condicional (UPDATE … WHERE en PostgreSQL) y recalculan el estado
 * con `estadoSegunCupos`. Si una liberación dejaría un contador negativo, lanzan
 * `CUPOS_INCONSISTENTES`.
 */
export interface RepositorioDisponibilidad {
  obtenerPorId(id: string): Promise<Disponibilidad | null>;
  listarPorExperienciaDesde(experienciaId: string, desde: Date): Promise<Disponibilidad[]>;
  /** Suma `cantidad` a la capacidad bloqueada solo si caben; devuelve null si no caben. */
  bloquearCupos(id: string, cantidad: number): Promise<Disponibilidad | null>;
  /** Pasa `cantidad` de capacidad bloqueada a capacidad reservada. */
  confirmarCupos(id: string, cantidad: number): Promise<Disponibilidad>;
  liberarBloqueados(id: string, cantidad: number): Promise<Disponibilidad>;
  liberarReservados(id: string, cantidad: number): Promise<Disponibilidad>;
}

export interface RepositorioReservas {
  obtenerPorId(id: string): Promise<Reserva | null>;
  crear(datos: NuevaReserva): Promise<Reserva>;
  actualizar(reserva: Reserva): Promise<void>;
  listarPendientesVencidas(ahora: Date): Promise<Reserva[]>;
  registrarCambioEstado(cambio: CambioEstadoReserva): Promise<void>;
}

export interface Repositorios {
  experiencias: RepositorioExperiencias;
  disponibilidad: RepositorioDisponibilidad;
  reservas: RepositorioReservas;
}

/** Ejecuta un trabajo en una transacción: si lanza un error, no se persiste ningún cambio. */
export interface UnidadDeTrabajo {
  ejecutar<T>(trabajo: (repos: Repositorios) => Promise<T>): Promise<T>;
}

/** Entrega la política de cancelación vigente, configurada desde el sistema. */
export interface ProveedorPoliticaCancelacion {
  obtener(): Promise<PoliticaCancelacion>;
}
