import { calcularCuposRestantes } from '../cupos';
import type { UnidadDeTrabajo } from '../puertos';
import type { Disponibilidad, FechaDisponible } from '../tipos';

export interface ComandoConsultarFechas {
  experienciaId: string;
  ahora: Date;
}

/** Lista las fechas futuras de una experiencia publicada con sus cupos restantes (R1). */
export class ConsultarFechasDisponibles {
  constructor(private readonly unidadDeTrabajo: UnidadDeTrabajo) {}

  ejecutar(comando: ComandoConsultarFechas): Promise<FechaDisponible[]> {
    return this.unidadDeTrabajo.ejecutar(async ({ experiencias, disponibilidad }) => {
      const experiencia = await experiencias.obtenerReservable(comando.experienciaId);
      if (experiencia === null || experiencia.estado !== 'PUBLISHED') {
        return [];
      }
      const fechas = await disponibilidad.listarPorExperienciaDesde(experiencia.id, comando.ahora);
      return fechas
        .filter((fecha) => esVisible(fecha, comando.ahora))
        .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
        .map(aFechaDisponible);
    });
  }
}

function esVisible(fecha: Disponibilidad, ahora: Date): boolean {
  return (
    (fecha.estado === 'AVAILABLE' || fecha.estado === 'FULL') &&
    fecha.declaradaPor !== null &&
    fecha.inicio.getTime() > ahora.getTime()
  );
}

function aFechaDisponible(fecha: Disponibilidad): FechaDisponible {
  const cuposRestantes = Math.max(0, calcularCuposRestantes(fecha));
  return {
    disponibilidadId: fecha.id,
    inicio: fecha.inicio,
    cuposRestantes,
    seleccionable: cuposRestantes > 0,
  };
}
