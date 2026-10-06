import { ErrorDominio } from '../../src/domain/errores/error-dominio';
import { calcularCuposRestantes, estadoSegunCupos } from '../../src/domain/reservas/cupos';
import type {
  RepositorioDisponibilidad,
  RepositorioExperiencias,
  RepositorioReservas,
  Repositorios,
} from '../../src/domain/reservas/puertos';
import type {
  CambioEstadoReserva,
  Disponibilidad,
  ExperienciaReservable,
  NuevaReserva,
  Reserva,
} from '../../src/domain/reservas/tipos';
import {
  type AlmacenEnMemoria,
  clonarCambio,
  clonarDisponibilidad,
  clonarExperiencia,
  clonarReserva,
} from './almacen-en-memoria';

class RepositorioExperienciasEnMemoria implements RepositorioExperiencias {
  constructor(private readonly almacen: AlmacenEnMemoria) {}

  async obtenerReservable(id: string): Promise<ExperienciaReservable | null> {
    const experiencia = this.almacen.experiencias.get(id);
    return experiencia ? clonarExperiencia(experiencia) : null;
  }
}

/**
 * Las operaciones de cupos leen, comprueban y escriben sin ningún `await` intermedio,
 * así que son atómicas dentro del bucle de eventos (equivalen al UPDATE condicional).
 */
class RepositorioDisponibilidadEnMemoria implements RepositorioDisponibilidad {
  constructor(private readonly almacen: AlmacenEnMemoria) {}

  async obtenerPorId(id: string): Promise<Disponibilidad | null> {
    const disponibilidad = this.almacen.disponibilidades.get(id);
    return disponibilidad ? clonarDisponibilidad(disponibilidad) : null;
  }

  async listarPorExperienciaDesde(experienciaId: string, desde: Date): Promise<Disponibilidad[]> {
    return [...this.almacen.disponibilidades.values()]
      .filter((d) => d.experienciaId === experienciaId && d.inicio.getTime() >= desde.getTime())
      .map(clonarDisponibilidad);
  }

  async bloquearCupos(id: string, cantidad: number): Promise<Disponibilidad | null> {
    const actual = this.almacen.disponibilidades.get(id);
    if (!actual || calcularCuposRestantes(actual) < cantidad) {
      return null;
    }
    return this.guardar({ ...actual, capacidadBloqueada: actual.capacidadBloqueada + cantidad });
  }

  async confirmarCupos(id: string, cantidad: number): Promise<Disponibilidad> {
    const actual = this.obtenerOFallar(id);
    return this.guardar({
      ...actual,
      capacidadBloqueada: actual.capacidadBloqueada - cantidad,
      capacidadReservada: actual.capacidadReservada + cantidad,
    });
  }

  async liberarBloqueados(id: string, cantidad: number): Promise<Disponibilidad> {
    const actual = this.obtenerOFallar(id);
    return this.guardar({ ...actual, capacidadBloqueada: actual.capacidadBloqueada - cantidad });
  }

  async liberarReservados(id: string, cantidad: number): Promise<Disponibilidad> {
    const actual = this.obtenerOFallar(id);
    return this.guardar({ ...actual, capacidadReservada: actual.capacidadReservada - cantidad });
  }

  private obtenerOFallar(id: string): Disponibilidad {
    const disponibilidad = this.almacen.disponibilidades.get(id);
    if (!disponibilidad) {
      throw new ErrorDominio('CUPOS_INCONSISTENTES', { disponibilidadId: id });
    }
    return disponibilidad;
  }

  /** Equivale a las restricciones CHECK de la tabla `availability`. */
  private guardar(disponibilidad: Disponibilidad): Disponibilidad {
    const { capacidadReservada, capacidadBloqueada, capacidadTotal } = disponibilidad;
    if (capacidadReservada < 0 || capacidadBloqueada < 0 || capacidadReservada + capacidadBloqueada > capacidadTotal) {
      throw new ErrorDominio('CUPOS_INCONSISTENTES', { disponibilidadId: disponibilidad.id });
    }
    const conEstado = { ...disponibilidad, estado: estadoSegunCupos(disponibilidad) };
    this.almacen.disponibilidades.set(conEstado.id, conEstado);
    return clonarDisponibilidad(conEstado);
  }
}

class RepositorioReservasEnMemoria implements RepositorioReservas {
  constructor(private readonly almacen: AlmacenEnMemoria) {}

  async obtenerPorId(id: string): Promise<Reserva | null> {
    const reserva = this.almacen.reservas.get(id);
    return reserva ? clonarReserva(reserva) : null;
  }

  async crear(datos: NuevaReserva): Promise<Reserva> {
    const reserva: Reserva = { ...datos, id: this.almacen.siguienteId('res') };
    this.almacen.reservas.set(reserva.id, clonarReserva(reserva));
    return clonarReserva(reserva);
  }

  async actualizar(reserva: Reserva): Promise<void> {
    if (!this.almacen.reservas.has(reserva.id)) {
      throw new Error(`Reserva inexistente: ${reserva.id}`);
    }
    this.almacen.reservas.set(reserva.id, clonarReserva(reserva));
  }

  async listarPendientesVencidas(ahora: Date): Promise<Reserva[]> {
    return [...this.almacen.reservas.values()]
      .filter(
        (r) =>
          r.estado === 'PENDING_PAYMENT' &&
          r.bloqueoExpiraEn !== null &&
          r.bloqueoExpiraEn.getTime() <= ahora.getTime(),
      )
      .map(clonarReserva);
  }

  async registrarCambioEstado(cambio: CambioEstadoReserva): Promise<void> {
    this.almacen.historial.push(clonarCambio(cambio));
  }
}

export function crearRepositoriosEnMemoria(almacen: AlmacenEnMemoria): Repositorios {
  return {
    experiencias: new RepositorioExperienciasEnMemoria(almacen),
    disponibilidad: new RepositorioDisponibilidadEnMemoria(almacen),
    reservas: new RepositorioReservasEnMemoria(almacen),
  };
}
