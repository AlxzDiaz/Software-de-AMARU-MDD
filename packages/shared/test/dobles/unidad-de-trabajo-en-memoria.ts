import type { Repositorios, UnidadDeTrabajo } from '../../src/domain/reservas/puertos';
import { AlmacenEnMemoria } from './almacen-en-memoria';
import { crearRepositoriosEnMemoria } from './repositorios-en-memoria';

/**
 * Transacciones en memoria:
 * - se ejecutan de una en una (cola de promesas), como transacciones serializables;
 * - si el trabajo lanza un error, se restaura la instantánea tomada al empezar (rollback).
 */
export class UnidadDeTrabajoEnMemoria implements UnidadDeTrabajo {
  readonly almacen = new AlmacenEnMemoria();
  readonly repos: Repositorios = crearRepositoriosEnMemoria(this.almacen);
  private cola: Promise<unknown> = Promise.resolve();

  ejecutar<T>(trabajo: (repos: Repositorios) => Promise<T>): Promise<T> {
    const resultado = this.cola.then(async () => {
      const instantanea = this.almacen.instantanea();
      try {
        return await trabajo(this.repos);
      } catch (error) {
        this.almacen.restaurar(instantanea);
        throw error;
      }
    });
    this.cola = resultado.catch(() => undefined);
    return resultado;
  }
}
