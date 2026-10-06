# Implementation Plan

> **Funcionalidad:** `reservas-cupos-cancelacion` · **Base:** [requirements.md](requirements.md) y [design.md](design.md) (ambos aprobados)
> **Estado:** tareas 1–8 COMPLETADAS (2026-10-06: 199 pruebas en verde, 100 % de cobertura, `tsc` sin errores). Tareas 9–10 **COMPLETADAS** (2026-10-06: 214 pruebas en verde, 100 % de cobertura). Tarea 11 **PENDIENTE**: actualización de documentación.
> **Verificación:** `npm run typecheck` · `npm run test:coverage` (desde la raíz del repositorio)

Las tareas son secuenciales: cada una se apoya solo en las anteriores. Cada tarea termina con sus pruebas en verde antes de pasar a la siguiente.

- [x] 1. Configurar el monorepo y el paquete de dominio compartido
  - Crear `package.json` raíz con npm workspaces (`packages/*`) y scripts `test`, `test:coverage` y `typecheck`
  - Crear `tsconfig.base.json` en modo `strict` (incluye `noUncheckedIndexedAccess` y `verbatimModuleSyntax`)
  - Crear `packages/shared` (`@amaru/shared`) con `tsconfig.json` y `vitest.config.ts`, con umbral de cobertura del 100 % en `src/`
  - Instalar solo dependencias de desarrollo: `typescript`, `vitest`, `@vitest/coverage-v8` y `fast-check`
  - Agregar `.gitignore` (`node_modules`, `coverage`, `.env`, `*.zip`)
  - _Requirements: RNF-R1, RNF-R4_

- [x] 2. Definir las constantes, los errores y las reglas de dinero
  - [x] 2.1 Crear los estados como tuplas cerradas `as const` en `src/constants/estados-reserva.ts`, junto con los roles, los tipos de reembolso y los motivos de cancelación del sistema
    - _Requirements: 8.4_
  - [x] 2.2 Crear `src/constants/politica-cancelacion.ts`: 168 h, 48 h y el mínimo de 5 caracteres del motivo, fijados por la especificación
    - _Requirements: 6.1, 6.2, 6.3, 7.3_
  - [x] 2.3 Crear `ErrorDominio` con `codigo`, `detalles` y mensajes en español en `src/domain/errores/error-dominio.ts`
    - _Requirements: RNF-R5_
  - [x] 2.4 Implementar `asegurarCentimos`, `asegurarPorcentaje` y `aplicarPorcentaje` (aritmética entera en puntos básicos, medio céntimo hacia arriba), con pruebas en `centimos.test.ts`
    - _Requirements: 6.4, 6.5, RNF-R3_

- [x] 3. Definir el modelo y los puertos del dominio de reservas
  - [x] 3.1 Crear las entidades en `tipos.ts`: `ExperienciaReservable`, `Disponibilidad`, `Reserva`, `CambioEstadoReserva`, `Actor`, `PoliticaCancelacion`, `ResultadoReembolso` y `FechaDisponible`
    - _Requirements: 1.2, 3.1, 7.6_
  - [x] 3.2 Crear en `puertos.ts` las interfaces `RepositorioExperiencias`, `RepositorioDisponibilidad` (con su contrato de atomicidad), `RepositorioReservas`, `UnidadDeTrabajo` y `ProveedorPoliticaCancelacion`
    - _Requirements: 3.4, RNF-R1_

- [x] 4. Implementar las reglas puras con sus pruebas
  - [x] 4.1 Transiciones de estado: `puedeCambiarEstadoReserva` y `asegurarTransicionReserva`, con pruebas de las 36 combinaciones de estados
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [x] 4.2 Cupos: `calcularCuposRestantes` y `estadoSegunCupos` (mantiene `BLOCKED` y `CLOSED`)
    - _Requirements: 1.2, 1.3, 3.5, 5.3, 7.5_
  - [x] 4.3 Bloqueo temporal: `calcularExpiracionBloqueo` y `bloqueoVencido` (una reserva sin expiración se considera vencida)
    - _Requirements: 3.2, 4.4, 5.1_
  - [x] 4.4 `validarSolicitudReserva` como función de aserción de tipos. Una fecha `FULL` responde `CUPOS_INSUFICIENTES` (aclaración de R2)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 4.5 `calcularMontoReserva`: precio vigente × participantes, con control de desbordamiento
    - _Requirements: 3.3, RNF-R3_
  - [x] 4.6 `calcularReembolso` y `estadoTrasCancelacion`: función pura que no lee el reloj, con pruebas en 168 h, 48 h y 47 h 59 min exactas
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, RNF-R2_

- [x] 5. Construir los dobles de prueba en memoria
  - [x] 5.1 `AlmacenEnMemoria`, con instantánea profunda y restauración
  - [x] 5.2 Repositorios en memoria con operaciones de cupos atómicas (sin `await` entre la comprobación y la escritura) y las mismas restricciones que el `CHECK` de la tabla `availability`
  - [x] 5.3 `UnidadDeTrabajoEnMemoria`: transacciones serializadas y rollback automático ante cualquier error
  - [x] 5.4 Fábricas (`AHORA` fijo, `prepararEscenario`, `errorDe`, `errorDeAsync`)
  - _Requirements: 3.4, RNF-R4_

- [x] 6. Implementar los casos de uso, cada uno con las pruebas de sus criterios y de su escenario Dado–Cuando–Entonces
  - [x] 6.1 Funciones comunes en `comun.ts`: `obtenerReservaOFallar`, `aplicarTransicion` (único camino para cambiar el estado, con historial) y `cancelarPendientePorSistema`
    - _Requirements: 7.6, 8.3_
  - [x] 6.2 `ConsultarFechasDisponibles`: solo fechas futuras, declaradas y habilitadas, ordenadas, con cupos restantes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 6.3 `CrearReserva`: valida, calcula el monto, bloquea cupos de forma atómica, crea la reserva `PENDING_PAYMENT` y registra el historial. Incluye la prueba de dos solicitudes simultáneas por el último cupo
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 6.4 `ConfirmarReserva`: solo la invoca el módulo de pagos, es idempotente con la misma referencia, responde `PAGO_DUPLICADO` con otra referencia y `RESERVA_EXPIRADA` si el bloqueo venció
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 6.5 `LiberarBloqueosVencidos` (una transacción por reserva, volviendo a leerla) y `CancelarPorPagoRechazado` (idempotente)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.6 `CancelarReserva`: valida primero la autorización, luego el motivo y el estado; aplica la política, libera los cupos y registra el historial
    - _Requirements: 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 7. Verificar las propiedades de corrección con fast-check (200 casos generados por propiedad)
  - [x] 7.1 Property 1, 2, 3 y 8: secuencias aleatorias de hasta 40 operaciones, comprobando tras cada una las invariantes de cupos, la conservación, la coherencia del estado y el rollback
    - _Requirements: 1.3, 3.1, 3.4, 3.5, 4.1, 5.1, 5.2, 5.3, 7.1, 7.5_
  - [x] 7.2 Property 4 y 5: reembolso acotado y monótono
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [x] 7.3 Property 6: los estados finales no tienen salida
    - _Requirements: 8.2_
  - [x] 7.4 Property 7: idempotencia de la liberación de bloqueos
    - _Requirements: 5.4_

- [x] 8. Pasar el semáforo de calidad y actualizar la documentación
  - Ejecutar `npm run typecheck`: sin errores
  - Ejecutar `npm run test:coverage`: 199/199 pruebas y 100 % de cobertura
  - Actualizar `design.md` con los detalles de la implementación y aclarar R2 en `requirements.md`
  - _Requirements: RNF-R4_

- [x] 9. Implementar la vista previa del reembolso (ConsultarReembolso)
  - [x] 9.1 Extraer `obtenerReservaAutorizada` y `asegurarCancelable` a `casos-de-uso/comun.ts` y hacer que `CancelarReserva` las use
    - Refactorización sin cambio de comportamiento: todas las pruebas de `cancelar-reserva.test.ts` deben pasar **sin modificarlas**
    - _Requirements: 7.2, 7.4_
  - [x] 9.2 Crear `casos-de-uso/consultar-reembolso.ts` con la clase `ConsultarReembolso` (constructor: `UnidadDeTrabajo`, `ProveedorPoliticaCancelacion`; comando `{ reservaId, actor, ahora }`) y exportarla en `reservas/index.ts`
    - No debe modificar la reserva, los cupos ni el historial
    - _Requirements: 6.7_
  - [x] 9.3 Crear `consultar-reembolso.test.ts` con el escenario de R6.7 (100 h → PARCIAL 15000 y almacén sin cambios), los casos TOTAL y SIN_REEMBOLSO, y los rechazos RESERVA_NO_ENCONTRADA, ACCESO_DENEGADO (otro comprador) y CANCELACION_NO_PERMITIDA (reserva no CONFIRMED y experiencia iniciada)
    - _Requirements: 6.7_
  - [x] 9.4 Agregar la Property 9 en `propiedades-reservas.test.ts`: para reservas y momentos generados con fast-check, la vista previa coincide con el reembolso de `CancelarReserva` y no modifica el almacén
    - _Requirements: 6.7_

- [x] 10. Implementar la confirmación de asistencia (ConfirmarAsistencia)
  - [x] 10.1 Agregar el código `ASISTENCIA_NO_PERMITIDA` a `CODIGOS_ERROR`, con el mensaje "La asistencia solo se puede confirmar cuando la experiencia ya empezó."
    - _Requirements: 9.4, RNF-R5_
  - [x] 10.2 Crear `casos-de-uso/confirmar-asistencia.ts` con la clase `ConfirmarAsistencia` (constructor: `UnidadDeTrabajo`; comando `{ reservaId, actor, ahora }`), siguiendo el algoritmo de design.md, y exportarla en `reservas/index.ts`
    - Debe usar `aplicarTransicion` (no cambiar el estado a mano) y no tocar los cupos
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 10.3 Crear `confirmar-asistencia.test.ts` con el escenario del Requirement 9 y una prueba por criterio:
    - administrador permitido;
    - otro coordinador, comprador y disponibilidad inexistente → ACCESO_DENEGADO;
    - antes del inicio → ASISTENCIA_NO_PERMITIDA;
    - reserva PENDING_PAYMENT o REFUNDED → TRANSICION_INVALIDA;
    - cupos sin cambios.
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  - [x] 10.4 Agregar la Property 10 en `propiedades-reservas.test.ts` (los cupos se conservan)
    - _Requirements: 9.6_

- [x] 11. Volver a pasar el semáforo de calidad
  - Ejecutar `npm run typecheck` sin errores y `npm run test:coverage` con todas las pruebas en verde y la cobertura en 100 %
  - Quitar las marcas _(pendiente)_ de design.md y actualizar el estado de requirements.md y de este archivo
  - _Requirements: RNF-R4_

## Siguientes funcionalidades (fuera de este spec)

- Implementar los puertos con Prisma y PostgreSQL, y agregar pruebas de integración de concurrencia real
- Endpoints NestJS (`/api/experiences/:id/availability`, `/api/bookings`, `/api/bookings/:id/cancel`) y job programado de liberación
- Calendario de reservas en React, consumiendo estos casos de uso a través de la API
