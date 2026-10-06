import { ErrorDominio } from '../../errores/error-dominio';
import { bloqueoVencido } from '../bloqueo';
import type { UnidadDeTrabajo } from '../puertos';
import type { Reserva } from '../tipos';
import { aplicarTransicion, obtenerReservaOFallar } from './comun';

export interface ComandoConfirmarReserva {
  reservaId: string;
  /** Referencia de la operación aprobada por la pasarela. */
  referenciaPago: string;
  ahora: Date;
}

/**
 * Confirma una reserva tras un pago verificado (R4). Solo lo invoca el módulo de pagos,
 * después de validar el webhook o consultar la pasarela (RN-08). No recibe actor:
 * el comprador nunca puede confirmar su propia reserva.
 */
export class ConfirmarReserva {
  constructor(private readonly unidadDeTrabajo: UnidadDeTrabajo) {}

  async ejecutar(comando: ComandoConfirmarReserva): Promise<Reserva> {
    const referenciaPago = comando.referenciaPago.trim();
    if (referenciaPago === '') {
      throw new ErrorDominio('REFERENCIA_PAGO_REQUERIDA', { reservaId: comando.reservaId });
    }

    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      const reserva = await obtenerReservaOFallar(repos.reservas, comando.reservaId);

      if (reserva.estado === 'CONFIRMED') {
        if (reserva.referenciaPago === referenciaPago) {
          return reserva;
        }
        throw new ErrorDominio('PAGO_DUPLICADO', { reservaId: reserva.id });
      }

      if (reserva.estado !== 'PENDING_PAYMENT' || bloqueoVencido(reserva, comando.ahora)) {
        throw new ErrorDominio('RESERVA_EXPIRADA', { reservaId: reserva.id, estado: reserva.estado });
      }

      const confirmada = await aplicarTransicion(
        repos.reservas,
        reserva,
        { estado: 'CONFIRMED', referenciaPago, bloqueoExpiraEn: null },
        null,
        null,
        comando.ahora,
      );
      await repos.disponibilidad.confirmarCupos(reserva.disponibilidadId, reserva.participantes);
      return confirmada;
    });
  }
}
