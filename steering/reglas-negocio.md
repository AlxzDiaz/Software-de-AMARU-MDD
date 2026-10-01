# Steering — Reglas de negocio

> Obligatorio. Cada regla se implementa en el **backend** como fuente de verdad y se cubre con **pruebas automatizadas**. Las reglas puras viven **una sola vez** en `packages/shared/src/domain/`, y el frontend las reutiliza solo para mostrar información anticipada al usuario.
> Si una tarea contradice este archivo, detente y pregunta. Nunca cambies una regla en silencio.

## Tabla de reglas

| Regla | Qué exige | Dónde se aplica | Error de dominio |
|---|---|---|---|
| **RN-01** Verificación | Solo un artesano `VERIFIED` puede enviar a revisión o publicar | `validarPuedePublicar()` en shared + caso de uso `SubmitForReview` | `ARTESANO_NO_VERIFICADO` |
| **RN-02** Precio | Solo el artesano o la comunidad fija el precio. La plataforma nunca lo modifica. El pedido congela el precio en `order_items.unit_price_cents` | Casos de uso de producto y experiencia: solo el dueño puede cambiar `price_cents` | `PRECIO_NO_MODIFICABLE` |
| **RN-03** Datos obligatorios | Comunidad, material, técnica, nombre, descripción, precio y fotos; sin ellos no se puede pasar a `PUBLISHED` | `validarPublicacion()` | `PUBLICACION_INCOMPLETA` (con la lista de campos faltantes) |
| **RN-04** Comisión | Se calcula sobre el precio de venta o reserva, se muestra antes de publicar o confirmar, y se registra **solo** al confirmar el pago. La tasa vive en `commission_rates` (una sola fuente) | `calcularComision()`, `calcularMontoNeto()`; `RegisterCommission` en el webhook | `COMISION_DUPLICADA` |
| **RN-05** Consentimiento cultural | El contenido cultural requiere un consentimiento vigente de la comunidad. Si se revoca, se despublica todo lo asociado | `validarConsentimiento()` + caso de uso `RevokeConsent` | `SIN_CONSENTIMIENTO_CULTURAL` |
| **RN-06** Disponibilidad | Se puede reservar solo si la experiencia está publicada, la fecha está declarada por el coordinador, está `AVAILABLE` y hay cupos | `validarReservable()` + `UPDATE` condicional atómico | `CUPOS_INSUFICIENTES`, `FECHA_NO_DISPONIBLE` |
| **RN-07** Cancelación | ≥ 168 h: reembolso total · 48 h a < 168 h: parcial (porcentaje en `system_settings`) · < 48 h: sin reembolso. Siempre libera cupos | `calcularReembolso()` (servicio de dominio) | `CANCELACION_NO_PERMITIDA` |
| **RN-08** Pago | Solo pasa a `pagado`/`CONFIRMED` tras un webhook con firma válida o una consulta segura a la pasarela. El retorno del navegador **nunca** cambia estados | `ConfirmPayment` (solo lo invoca el webhook o la conciliación) | `PAGO_NO_CONFIRMADO` |
| **RN-09** Plazo de preparación | 5 días hábiles (lunes a viernes, sin feriados) desde `paid_at` para registrar el envío. Si vence: `retrasado` + notificación al administrador + visible para el comprador | `calcularFechaLimitePreparacion()` + job horario | — |
| **RN-10** Reseñas | Solo con pedido `entregado` o reserva `COMPLETED`; una por pedido o reserva; editable hasta 30 días después de crearse | `validarElegibilidadResena()`, `puedeEditarResena()` + restricción `UNIQUE` en BD | `RESENA_NO_PERMITIDA`, `RESENA_DUPLICADA`, `RESENA_NO_EDITABLE` |
| **RN-11** Liquidación | Se genera tras `entregado` o `COMPLETED`. `neto = bruto - comisión` | `CreateSettlement` + `CHECK` en BD | `LIQUIDACION_NO_HABILITADA` |
| **RN-12** Datos personales | Ley N.º 29733 y su reglamento. Acceso por rol, auditoría de operaciones sensibles, nunca datos de tarjeta | `RolesGuard`, verificación de propiedad, `AuditService`, mapeadores públicos | `ACCESO_DENEGADO` |

## Máquinas de estado

Una función central por entidad en `packages/shared/src/domain/transitions/`. Ningún código cambia un `status` sin llamarla.

### Pedido (§12, regla arquitectónica 6)

```text
pendiente_pago → pagado, cancelado
pagado         → en_preparacion, cancelado
en_preparacion → enviado, retrasado
enviado        → entregado, retrasado
retrasado      → en_preparacion, cancelado
entregado      → (final)
cancelado      → (final)
```

> Propuesta A-07, **pendiente de confirmación**: añadir `pagado → retrasado`, `retrasado → enviado` y `retrasado → entregado`. No se implementa hasta que se apruebe.

### Reserva

```text
PENDING_PAYMENT    → CONFIRMED, CANCELLED (pago rechazado o expirado)
CONFIRMED          → COMPLETED, CANCELLED (sin reembolso), REFUNDED (total), PARTIALLY_REFUNDED
COMPLETED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED → (final)
```

### Publicación (producto y experiencia)

```text
DRAFT          → PENDING_REVIEW
PENDING_REVIEW → PUBLISHED, OBSERVED, REJECTED   (solo ADMIN; nunca el propio autor)
OBSERVED       → PENDING_REVIEW
PUBLISHED      → UNPUBLISHED, PENDING_REVIEW (edición de contenido cultural o fotos)
UNPUBLISHED    → PENDING_REVIEW
REJECTED       → (final)
```

### Artesano

```text
PENDING   → VERIFIED, OBSERVED, REJECTED   (solo ADMIN)
OBSERVED  → PENDING                        (el artesano vuelve a enviar documentos)
VERIFIED  → SUSPENDED
SUSPENDED → VERIFIED
REJECTED  → (final)
```

### Pago

```text
PENDING    → AUTHORIZED, REJECTED (incluye expiración, con reason = EXPIRED)
AUTHORIZED → REFUNDED, PARTIALLY_REFUNDED
```

### Liquidación

```text
PENDING    → PROCESSING
PROCESSING → PAID, FAILED
FAILED     → PROCESSING
```

## Dinero

- Siempre en **céntimos enteros** (`number` entero en TypeScript, `INTEGER` en la BD). Nunca uses `float` para montos.
- Comisión: `Math.round(base_cents * rate_bps / 10000)` (redondeo al céntimo más cercano; los casos .5 se redondean hacia arriba).
- Neto: `base_cents - commission_cents`. Nunca se calcula por separado.
- El formato para mostrar (`S/ 120.50`) se aplica **solo** en la capa de presentación, mediante `formatearMoneda()`.

## Casos de prueba obligatorios por regla

Cada regla debe tener, como mínimo, un caso válido, un caso inválido y los casos límite: 48 h exactas, 168 h exactas, stock = 0, cupos exactos, rating 0 y 6, día 30 frente a día 31, transición a sí mismo y webhook repetido.
