import { calcularReembolso } from '../calcular-reembolso';
import type { ProveedorPoliticaCancelacion, UnidadDeTrabajo } from '../puertos';
import type { Actor, ResultadoReembolso } from '../tipos';
import { asegurarCancelable, obtenerReservaAutorizada } from './comun';

export interface ComandoConsultarReembolso {
  reservaId: string;
  actor: Actor;
  ahora: Date;
}

/**
 * Vista previa del reembolso sin modificar la reserva, los cupos ni el historial (R6.7).
 * Reutiliza las validaciones de CancelarReserva: autorización, estado y tiempo.
 */
export class ConsultarReembolso {
  constructor(
    private readonly unidadDeTrabajo: UnidadDeTrabajo,
    private readonly proveedorPolitica: ProveedorPoliticaCancelacion,
  ) {}

  async ejecutar(comando: ComandoConsultarReembolso): Promise<ResultadoReembolso> {
    const politica = await this.proveedorPolitica.obtener();

    return this.unidadDeTrabajo.ejecutar(async (repos) => {
      // Reutiliza las validaciones de CancelarReserva (DRY)
      const reserva = await obtenerReservaAutorizada(repos.reservas, comando.reservaId, comando.actor);
      const disponibilidad = await asegurarCancelable(repos.disponibilidad, reserva, comando.ahora);

      // Calcula el reembolso sin modificar nada (R6.7)
      return calcularReembolso({
        montoPagadoCentimos: reserva.montoCentimos,
        inicio: disponibilidad.inicio,
        canceladoEn: comando.ahora,
        politica,
      });
    });
  }
}
