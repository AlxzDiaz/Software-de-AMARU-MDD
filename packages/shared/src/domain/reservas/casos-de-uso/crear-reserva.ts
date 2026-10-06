import { ErrorDominio } from '../../errores/error-dominio';
import { calcularExpiracionBloqueo } from '../bloqueo';
import { calcularMontoReserva } from '../calcular-monto-reserva';
import type { UnidadDeTrabajo } from '../puertos';
import type { Reserva } from '../tipos';
import { validarSolicitudReserva } from '../validar-solicitud-reserva';

export interface ConfiguracionCrearReserva {
  /** Minutos que se mantienen bloqueados los cupos mientras se paga (en la API: PAYMENT_HOLD_MINUTES). */
  minutosBloqueo: number;
}

export interface ComandoCrearReserva {
  experienciaId: string;
  disponibilidadId: string;
  compradorId: string;
  participantes: number;
  ahora: Date;
}

/** Valida la solicitud, bloquea cupos y crea la reserva pendiente de pago (R2, R3). */
export class CrearReserva {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly configuracion: ConfiguracionCrearReserva,
  ) {
    const { minutosBloqueo } = configuracion;
    if (!Number.isSafeInteger(minutosBloqueo) || minutosBloqueo < 1) {
      throw new ErrorDominio('CONFIGURACION_INVALIDA', { minutosBloqueo });
    }
  }

  ejecutar(comando: ComandoCrearReserva): Promise<Reserva> {
    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      const solicitud = {
        experiencia: await repos.experiencias.obtenerReservable(comando.experienciaId),
        disponibilidad: await repos.disponibilidad.obtenerPorId(comando.disponibilidadId),
        participantes: comando.participantes,
        ahora: comando.ahora,
      };
      validarSolicitudReserva(solicitud);

      const montoCentimos = calcularMontoReserva(
        solicitud.experiencia.precioPorPersonaCentimos,
        comando.participantes,
      );

      const bloqueada = await repos.disponibilidad.bloquearCupos(
        solicitud.disponibilidad.id,
        comando.participantes,
      );
      if (bloqueada === null) {
        throw new ErrorDominio('CUPOS_INSUFICIENTES', { solicitados: comando.participantes });
      }

      const reserva = await repos.reservas.crear({
        experienciaId: solicitud.experiencia.id,
        disponibilidadId: solicitud.disponibilidad.id,
        compradorId: comando.compradorId,
        participantes: comando.participantes,
        montoCentimos,
        estado: 'PENDING_PAYMENT',
        bloqueoExpiraEn: calcularExpiracionBloqueo(comando.ahora, this.configuracion.minutosBloqueo),
        referenciaPago: null,
        motivoCancelacion: null,
        reembolsoCentimos: null,
        canceladaEn: null,
      });
      await repos.reservas.registrarCambioEstado({
        reservaId: reserva.id,
        desde: null,
        hacia: 'PENDING_PAYMENT',
        actorId: comando.compradorId,
        motivo: null,
        ocurridoEn: comando.ahora,
      });
      return reserva;
    });
  }
}
