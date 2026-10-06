import { ErrorDominio } from '../../errores/error-dominio';
import { bloqueoVencido } from '../bloqueo';
import type { UnidadDeTrabajo } from '../puertos';
import type { Reserva } from '../tipos';
import { cancelarPendientePorSistema, obtenerReservaOFallar } from './comun';

export interface ComandoLiberarBloqueos {
  ahora: Date;
}

/**
 * Cancela las reservas pendientes cuyo bloqueo venció y devuelve sus cupos (R5.1, R5.3, R5.4).
 * Cada reserva se procesa en su propia transacción y se vuelve a leer antes de cambiarla,
 * para que dos ejecuciones simultáneas nunca liberen los mismos cupos dos veces.
 */
export class LiberarBloqueosVencidos {
  constructor(private readonly unidadDeTrabajo: UnidadDeTrabajo) {}

  async ejecutar(comando: ComandoLiberarBloqueos): Promise<{ liberadas: number }> {
    const candidatas = await this.unidadDeTrabajo.ejecutar((repos) =>
      repos.reservas.listarPendientesVencidas(comando.ahora),
    );

    let liberadas = 0;
    for (const candidata of candidatas) {
      const liberada = await this.unidadDeTrabajo.ejecutar(async (repos) => {
        const reserva = await repos.reservas.obtenerPorId(candidata.id);
        if (reserva === null || reserva.estado !== 'PENDING_PAYMENT' || !bloqueoVencido(reserva, comando.ahora)) {
          return false;
        }
        await cancelarPendientePorSistema(repos, reserva, 'EXPIRED', comando.ahora);
        return true;
      });
      if (liberada) {
        liberadas += 1;
      }
    }
    return { liberadas };
  }
}

export interface ComandoCancelarPorPagoRechazado {
  reservaId: string;
  ahora: Date;
}

/** Cancela la reserva pendiente cuando la pasarela rechaza el pago y libera sus cupos (R5.2). */
export class CancelarPorPagoRechazado {
  constructor(private readonly unidadDeTrabajo: UnidadDeTrabajo) {}

  ejecutar(comando: ComandoCancelarPorPagoRechazado): Promise<Reserva> {
    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      const reserva = await obtenerReservaOFallar(repos.reservas, comando.reservaId);
      if (reserva.estado === 'CANCELLED') {
        return reserva;
      }
      if (reserva.estado !== 'PENDING_PAYMENT') {
        throw new ErrorDominio('TRANSICION_INVALIDA', {
          actual: reserva.estado,
          siguiente: 'CANCELLED',
          transicion: `${reserva.estado} → CANCELLED (pago rechazado)`,
        });
      }
      return cancelarPendientePorSistema(repos, reserva, 'PAYMENT_REJECTED', comando.ahora);
    });
  }
}
