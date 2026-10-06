import { ErrorDominio } from '../errores/error-dominio';
import { calcularCuposRestantes } from './cupos';
import type { Disponibilidad, ExperienciaReservable } from './tipos';

export interface SolicitudReserva {
  experiencia: ExperienciaReservable | null;
  disponibilidad: Disponibilidad | null;
  participantes: number;
  ahora: Date;
}

export interface SolicitudReservaValida extends SolicitudReserva {
  experiencia: ExperienciaReservable;
  disponibilidad: Disponibilidad;
}

/** Valida las condiciones de RN-06 para reservar (R2.1–R2.5). */
export function validarSolicitudReserva(
  solicitud: SolicitudReserva,
): asserts solicitud is SolicitudReservaValida {
  const { experiencia, disponibilidad, participantes, ahora } = solicitud;

  if (experiencia === null || experiencia.estado !== 'PUBLISHED') {
    throw new ErrorDominio('EXPERIENCIA_NO_PUBLICADA', { experienciaId: experiencia?.id ?? null });
  }

  if (!fechaHabilitada(disponibilidad, experiencia.id, ahora)) {
    throw new ErrorDominio('FECHA_NO_DISPONIBLE', { disponibilidadId: solicitud.disponibilidad?.id ?? null });
  }

  if (!Number.isSafeInteger(participantes) || participantes < 1) {
    throw new ErrorDominio('PARTICIPANTES_INVALIDOS', { participantes });
  }

  const restantes = calcularCuposRestantes(disponibilidad);
  if (participantes > restantes) {
    throw new ErrorDominio('CUPOS_INSUFICIENTES', { solicitados: participantes, restantes });
  }
}

function fechaHabilitada(
  disponibilidad: Disponibilidad | null,
  experienciaId: string,
  ahora: Date,
): disponibilidad is Disponibilidad {
  return (
    disponibilidad !== null &&
    disponibilidad.experienciaId === experienciaId &&
    disponibilidad.declaradaPor !== null &&
    (disponibilidad.estado === 'AVAILABLE' || disponibilidad.estado === 'FULL') &&
    disponibilidad.inicio.getTime() > ahora.getTime()
  );
}
