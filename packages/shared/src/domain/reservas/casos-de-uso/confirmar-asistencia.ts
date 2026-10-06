import { ErrorDominio } from '../../errores/error-dominio';
import type { UnidadDeTrabajo } from '../puertos';
import type { Actor, Reserva } from '../tipos';
import { aplicarTransicion, obtenerReservaOFallar } from './comun';

export interface ComandoConfirmarAsistencia {
  reservaId: string;
  actor: Actor;
  ahora: Date;
}

/**
 * Confirma la asistencia de los turistas a una experiencia ya realizada (Requirement 9).
 * La reserva CONFIRMED pasa a COMPLETED. Solo lo puede hacer el coordinador que declaró
 * la fecha o un administrador, y únicamente cuando la experiencia ya inició.
 */
export class ConfirmarAsistencia {
  constructor(private readonly unidadDeTrabajo: UnidadDeTrabajo) {}

  async ejecutar(comando: ComandoConfirmarAsistencia): Promise<Reserva> {
    const { reservaId, actor, ahora } = comando;

    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      // 1. Obtener la reserva (RESERVA_NO_ENCONTRADA si no existe)
      const reserva = await obtenerReservaOFallar(repos.reservas, reservaId);

      // 2. Obtener la disponibilidad para validar la autorización y el momento
      const disponibilidad = await repos.disponibilidad.obtenerPorId(reserva.disponibilidadId);
      
      // 3. Validar autorización: ADMIN o COORDINATOR que declaró la fecha (R9.2, R9.3)
      const esAdmin = actor.roles.includes('ADMIN');
      const esCoordinadorDeclarante = 
        actor.roles.includes('COORDINATOR') && 
        disponibilidad !== null && 
        actor.id === disponibilidad.declaradaPor;
      
      if (!esAdmin && !esCoordinadorDeclarante) {
        throw new ErrorDominio('ACCESO_DENEGADO', { reservaId });
      }

      // 4. Validar que la experiencia ya inició (R9.4)
      if (disponibilidad === null || ahora.getTime() < disponibilidad.inicio.getTime()) {
        throw new ErrorDominio('ASISTENCIA_NO_PERMITIDA', { reservaId });
      }

      // 5. Aplicar la transición CONFIRMED → COMPLETED (R9.1)
      // Si la reserva no está CONFIRMED, aplicarTransicion lanza TRANSICION_INVALIDA (R9.5)
      const completada = await aplicarTransicion(
        repos.reservas,
        reserva,
        { estado: 'COMPLETED' },
        actor.id,
        null,
        ahora,
      );

      // 6. No se modifican los cupos (R9.6): los participantes siguen reservados

      return completada;
    });
  }
}
