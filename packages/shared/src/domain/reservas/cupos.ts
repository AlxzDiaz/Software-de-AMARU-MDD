import type { EstadoDisponibilidad } from '../../constants/estados-reserva';
import type { Disponibilidad } from './tipos';

type ContadoresCupos = Pick<
  Disponibilidad,
  'capacidadTotal' | 'capacidadReservada' | 'capacidadBloqueada'
>;

/** Cupos restantes = total − reservados − bloqueados (R1.2). */
export function calcularCuposRestantes(disponibilidad: ContadoresCupos): number {
  return (
    disponibilidad.capacidadTotal -
    disponibilidad.capacidadReservada -
    disponibilidad.capacidadBloqueada
  );
}

/**
 * Estado que corresponde a la disponibilidad según sus cupos (R1.3, R3.5, R5.3, R7.5).
 * BLOCKED y CLOSED son decisiones del coordinador y no cambian por los cupos.
 */
export function estadoSegunCupos(
  disponibilidad: ContadoresCupos & Pick<Disponibilidad, 'estado'>,
): EstadoDisponibilidad {
  if (disponibilidad.estado === 'BLOCKED' || disponibilidad.estado === 'CLOSED') {
    return disponibilidad.estado;
  }
  return calcularCuposRestantes(disponibilidad) <= 0 ? 'FULL' : 'AVAILABLE';
}
