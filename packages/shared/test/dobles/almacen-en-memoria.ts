import type {
  CambioEstadoReserva,
  Disponibilidad,
  ExperienciaReservable,
  Reserva,
} from '../../src/domain/reservas/tipos';

const copiarFecha = (fecha: Date | null): Date | null => (fecha === null ? null : new Date(fecha));

export const clonarExperiencia = (e: ExperienciaReservable): ExperienciaReservable => ({ ...e });

export const clonarDisponibilidad = (d: Disponibilidad): Disponibilidad => ({
  ...d,
  inicio: new Date(d.inicio),
});

export const clonarReserva = (r: Reserva): Reserva => ({
  ...r,
  bloqueoExpiraEn: copiarFecha(r.bloqueoExpiraEn),
  canceladaEn: copiarFecha(r.canceladaEn),
});

export const clonarCambio = (c: CambioEstadoReserva): CambioEstadoReserva => ({
  ...c,
  ocurridoEn: new Date(c.ocurridoEn),
});

export interface Instantanea {
  experiencias: Map<string, ExperienciaReservable>;
  disponibilidades: Map<string, Disponibilidad>;
  reservas: Map<string, Reserva>;
  historial: CambioEstadoReserva[];
}

/** Estado completo de la "base de datos" en memoria de las pruebas. */
export class AlmacenEnMemoria {
  readonly experiencias = new Map<string, ExperienciaReservable>();
  readonly disponibilidades = new Map<string, Disponibilidad>();
  readonly reservas = new Map<string, Reserva>();
  readonly historial: CambioEstadoReserva[] = [];
  private secuencia = 0;

  siguienteId(prefijo: string): string {
    this.secuencia += 1;
    return `${prefijo}-${this.secuencia}`;
  }

  /** Copia profunda del estado, usada para el rollback y para comparar en las pruebas. */
  instantanea(): Instantanea {
    return {
      experiencias: copiarMapa(this.experiencias, clonarExperiencia),
      disponibilidades: copiarMapa(this.disponibilidades, clonarDisponibilidad),
      reservas: copiarMapa(this.reservas, clonarReserva),
      historial: this.historial.map(clonarCambio),
    };
  }

  restaurar(instantanea: Instantanea): void {
    reemplazarMapa(this.experiencias, instantanea.experiencias);
    reemplazarMapa(this.disponibilidades, instantanea.disponibilidades);
    reemplazarMapa(this.reservas, instantanea.reservas);
    this.historial.splice(0, this.historial.length, ...instantanea.historial);
  }
}

function copiarMapa<T>(origen: Map<string, T>, clonar: (valor: T) => T): Map<string, T> {
  return new Map([...origen].map(([clave, valor]) => [clave, clonar(valor)]));
}

function reemplazarMapa<T>(destino: Map<string, T>, origen: Map<string, T>): void {
  destino.clear();
  for (const [clave, valor] of origen) {
    destino.set(clave, valor);
  }
}
