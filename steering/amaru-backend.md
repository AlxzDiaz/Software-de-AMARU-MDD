# Steering — Backend (`apps/api`)

> Obligatorio para todo el código de `apps/api`. Complementa `reglas-negocio.md` y `convenciones.md`.

## Stack

NestJS · TypeScript strict · Prisma · PostgreSQL · Zod (esquemas de `packages/shared`) · Jest + Supertest · Swagger · nestjs-pino · @nestjs/schedule · @nestjs/throttler · helmet · argon2.

## Estructura por módulo

```text
src/modules/<modulo>/
├── domain/          # errores de dominio, interfaces de repositorio (puertos), tipos del módulo
├── application/     # casos de uso: una clase por acción (CreateProduct, SubmitProductForReview…)
├── infrastructure/  # PrismaXRepository, adaptadores externos
├── presentation/    # XController, DTO (createZodDto), mapeadores a respuesta pública
└── <modulo>.module.ts
```

- Dependencias permitidas: `presentation → application → domain ← infrastructure`.
- `domain/` no importa `@nestjs/*`, `@prisma/client` ni nada de HTTP.
- Los controllers **no** contienen lógica: validan la entrada, llaman a un caso de uso y mapean la respuesta.
- Las reglas puras se importan desde `@amaru/shared/domain`. Está prohibido reimplementarlas.

## Reglas obligatorias

1. **Nunca confíes en el cliente.** Totales, subtotales, comisiones, stock, cupos, reembolsos y permisos se recalculan siempre con datos de la BD. Si el cliente envía `price`, `total` o `commission`, se ignoran o se rechazan.
2. **Autorización en dos niveles**: `@Roles()` + `RolesGuard` para el rol, y comprobación de **propiedad** dentro del caso de uso (el `artisanId` del recurso debe coincidir con el del usuario).
3. **Transiciones de estado** solo a través de las funciones de `@amaru/shared/domain/transitions`. Cada cambio se escribe en `*_status_history`.
4. **Transacciones** (`prisma.$transaction`) en pagos, reservas, checkout, cancelaciones, liquidaciones y revocación de consentimiento. Stock y cupos se modifican con `UPDATE` condicional; si afecta 0 filas, se lanza un error de dominio.
5. **Idempotencia**: webhooks deduplicados por `(provider, event_id)`; comisiones y liquidaciones con `UNIQUE` por pedido o reserva.
6. **Auditoría** (`AuditService.record()`) en: login fallido y bloqueo, cambio de rol o estado de usuario, verificación de artesano, moderación, cambio de tasa de comisión, cambio de consentimiento, cambio de estado de pago, reembolsos, liquidaciones y acceso a documentos privados.
7. **Respuestas públicas**: se devuelven siempre mediante un mapeador explícito (`toPublicArtisan()` y similares). Nunca se devuelve la entidad Prisma completa. Nunca se exponen email, teléfono, dirección ni documentos de otro usuario.
8. **Errores**: los errores de dominio (`DomainError` con `code`) se convierten en el filtro global al formato `{ error: { code, message, details? } }` con el HTTP adecuado (400/403/404/409/422). Los mensajes para el usuario van en español y los detalles internos solo a los logs.
9. **Validación** con Zod en toda entrada (body, query, params). Se rechazan los campos desconocidos. La paginación tiene un máximo de 50 elementos por página.
10. **Archivos**: validación de magic bytes, tamaño y dimensiones; nombre UUID; documentos en almacenamiento privado, servidos con URL firmada de corta duración.
11. **Configuración**: todas las variables se leen mediante `ConfigService`, validado con Zod al arrancar. Si falta una variable obligatoria, la app no arranca. Prohibido usar `process.env` fuera de `src/config/`.
12. **Logs**: sin contraseñas, tokens, emails completos ni payloads de pago. Usa `userId`, no datos personales.
13. **Sin SQL crudo inseguro**: prohibido `$queryRawUnsafe` y `$executeRawUnsafe`. `$queryRaw` solo con plantillas etiquetadas.
14. **Pagos reales**: no se implementan hasta que se apruebe explícitamente. En desarrollo se usa `PAYMENT_PROVIDER=mock`.

## Formato de la API

- Prefijo `/api`. Se usan las rutas de la especificación (§16).
- Listas: `{ data: T[], meta: { page, pageSize, total } }`.
- Fechas en ISO 8601 UTC; la zona horaria de negocio es `America/Lima`.
- Montos en céntimos (`priceCents`), nunca decimales.
- Cada endpoint se documenta en Swagger con los roles requeridos y los códigos de error posibles.

## Pruebas

| Tipo | Ubicación | Qué cubre |
|---|---|---|
| Unitarias | `*.spec.ts` junto al caso de uso | Casos de uso con repositorios falsos |
| Integración | `tests/integration/api/` | Endpoints reales + BD de prueba (Supertest), incluidos permisos por rol |
| Contrato del webhook | `tests/integration/api/payments/` | Firma válida o inválida, evento repetido, orden fuera de secuencia |

Una tarea de backend no está terminada sin pruebas de: el caso feliz, el caso sin permiso (403), la entrada inválida (400/422) y el conflicto de estado (409).
