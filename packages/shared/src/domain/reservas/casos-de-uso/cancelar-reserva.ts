import { MIN_CARACTERES_MOTIVO_CANCELACION } from '../../../constants/politica-cancelacion';
import { ErrorDominio } from '../../errores/error-dominio';
import { calcularReembolso, estadoTrasCancelacion } from '../calcular-reembolso';
import type { ProveedorPoliticaCancelacion, UnidadDeTrabajo } from '../puertos';
import type { Actor, Reserva, ResultadoReembolso } from '../tipos';
import { aplicarTransicion, asegurarCancelable, obtenerReservaAutorizada } from './comun';

export interface ComandoCancelarReserva {
  reservaId: string;
  actor: Actor;
  motivo: string;
  ahora: Date;
}

export interface ResultadoCancelacion {
  reserva: Reserva;
  reembolso: ResultadoReembolso;
}

/** Cancela una reserva confirmada aplicando la política RN-07 y libera sus cupos (R6, R7). */
export class CancelarReserva {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly proveedorPolitica: ProveedorPoliticaCancelacion,
  ) {}

  async ejecutar(comando: ComandoCancelarReserva): Promise<ResultadoCancelacion> {
    const politica = await this.proveedorPolitica.obtener();

    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      // La autorización va antes que cualquier dato de la reserva, para no revelarlo a terceros.
      const reserva = await obtenerReservaAutorizada(repos.reservas, comando.reservaId, comando.actor);

      const motivo = comando.motivo.trim();
      if (motivo.length < MIN_CARACTERES_MOTIVO_CANCELACION) {
        throw new ErrorDominio('MOTIVO_REQUERIDO', { minimo: MIN_CARACTERES_MOTIVO_CANCELACION });
      }

      const disponibilidad = await asegurarCancelable(repos.disponibilidad, reserva, comando.ahora);

      const reembolso = calcularReembolso({
        montoPagadoCentimos: reserva.montoCentimos,
        inicio: disponibilidad.inicio,
        canceladoEn: comando.ahora,
        politica,
      });

      const cancelada = await aplicarTransicion(
        repos.reservas,
        reserva,
        {
          estado: estadoTrasCancelacion(reembolso.tipo),
          motivoCancelacion: motivo,
          reembolsoCentimos: reembolso.montoCentimos,
          canceladaEn: comando.ahora,
        },
        comando.actor.id,
        motivo,
        comando.ahora,
      );
      await repos.disponibilidad.liberarReservados(disponibilidad.id, reserva.participantes);

      return { reserva: cancelada, reembolso };
    });
  }
}
