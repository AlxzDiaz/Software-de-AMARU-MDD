# Requirements Document

**Gestión de cupos y cancelación de reservas de experiencias**

> **Funcionalidad:** `reservas-cupos-cancelacion`
> **Estado:** APROBADO (2026-10-06). Ampliación del 2026-10-06: R6.7 y Requirement 9, **pendientes de implementación** (tareas 9–11 de tasks.md)
> **Trazabilidad:** RN-06, RN-07, RN-08, RF-09, RF-16 · Regla arquitectónica 6 (transiciones) · Sprint 1 (S1-02, S1-03)

## Introduction

Esta funcionalidad construye el **núcleo de dominio de las reservas** de experiencias vivenciales en `packages/shared`:

- consulta de fechas y cupos;
- validación de la reserva;
- bloqueo temporal de cupos mientras se paga;
- confirmación tras el pago;
- liberación de bloqueos vencidos;
- cálculo del reembolso;
- cancelación con liberación de cupos.

Todo se implementa como reglas puras y casos de uso que trabajan contra **puertos** (interfaces de repositorio). En las pruebas, esos puertos tienen implementaciones en memoria. Así, la lógica queda verificable sin base de datos ni servidor, y el backend NestJS la reutilizará después como fuente de verdad.

## Glossary

| Término | Definición |
|---|---|
| **Sistema de reservas** | Conjunto de reglas y casos de uso de esta funcionalidad |
| **Disponibilidad** | Fecha y hora de inicio declaradas por el coordinador para una experiencia, con `capacidadTotal`, `capacidadReservada` y `capacidadBloqueada` |
| **Cupos restantes** | `capacidadTotal − capacidadReservada − capacidadBloqueada` |
| **Bloqueo temporal** | Cupos apartados para una reserva `PENDING_PAYMENT` hasta `bloqueoExpiraEn` |
| **Horas de anticipación** | Horas entre el momento de la cancelación y el inicio de la experiencia |
| **Porcentaje de reembolso parcial** | Parámetro configurable del sistema (0–100). No se escribe en el código |
| **Montos** | Enteros en céntimos de sol (S/ 150.00 = `15000`) |

## Convención de redacción

Los criterios de aceptación usan **EARS** (Easy Approach to Requirements Syntax):

| Patrón | Plantilla |
|---|---|
| Ubicuo | EL SISTEMA DE RESERVAS DEBERÁ … |
| Por evento | CUANDO \<evento\>, EL SISTEMA DE RESERVAS DEBERÁ … |
| Por estado | MIENTRAS \<estado\>, EL SISTEMA DE RESERVAS DEBERÁ … |
| No deseado | SI \<condición\>, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ … |

Cada requisito incluye además un **escenario Dado–Cuando–Entonces**, que se convierte directamente en una prueba automatizada con el mismo ID.

---

## Requirements

### Requirement 1: Consultar fechas y cupos disponibles

**User Story:** Como **turista**, quiero ver las fechas disponibles de una experiencia y los cupos que quedan, para elegir una fecha en la que realmente pueda participar.

#### Acceptance Criteria

1. **R1.1** CUANDO el turista consulte las fechas de una experiencia, EL SISTEMA DE RESERVAS DEBERÁ devolver solo las disponibilidades con estado `AVAILABLE` o `FULL` cuyo inicio sea posterior al momento de la consulta, ordenadas por fecha ascendente.
2. **R1.2** EL SISTEMA DE RESERVAS DEBERÁ informar, para cada fecha devuelta, los cupos restantes calculados como `capacidadTotal − capacidadReservada − capacidadBloqueada`.
3. **R1.3** SI los cupos restantes de una fecha son 0, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ marcarla como agotada (`seleccionable = false`).
4. **R1.4** SI la experiencia no está en estado `PUBLISHED`, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ devolver una lista vacía.
5. **R1.5** EL SISTEMA DE RESERVAS NO DEBERÁ devolver disponibilidades en estado `BLOCKED` o `CLOSED`.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una experiencia PUBLISHED con dos fechas futuras AVAILABLE de capacidad 10
  Y la primera tiene 6 cupos reservados y 4 bloqueados
Cuando el turista consulta las fechas
Entonces la primera fecha aparece con 0 cupos restantes y no seleccionable
  Y la segunda aparece con 10 cupos restantes y seleccionable
```

---

### Requirement 2: Validar que una experiencia es reservable

**User Story:** Como **plataforma**, quiero rechazar las reservas que no cumplen las condiciones de RN-06, para no vender cupos inexistentes ni fechas no autorizadas por la comunidad.

#### Acceptance Criteria

1. **R2.1** EL SISTEMA DE RESERVAS DEBERÁ aceptar una solicitud solo si se cumplen todas estas condiciones: la experiencia está `PUBLISHED`, la disponibilidad pertenece a esa experiencia y fue declarada por el coordinador, la disponibilidad está habilitada (`AVAILABLE` o `FULL`), su inicio es futuro, y el número de participantes es un entero mayor o igual que 1 y menor o igual que los cupos restantes.
2. **R2.2** SI la experiencia no existe o no está `PUBLISHED`, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `EXPERIENCIA_NO_PUBLICADA`.
3. **R2.3** SI la disponibilidad no existe, no pertenece a la experiencia, no fue declarada por un coordinador, está `BLOCKED` o `CLOSED`, o ya inició, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `FECHA_NO_DISPONIBLE`.
4. **R2.4** SI el número de participantes no es un entero mayor o igual que 1, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `PARTICIPANTES_INVALIDOS`.
5. **R2.5** SI el número de participantes supera los cupos restantes (incluido el caso de una fecha `FULL`, con 0 cupos), ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `CUPOS_INSUFICIENTES`.

> Aclaración (2026-10-06): `FULL` es una fecha habilitada sin cupos, no una fecha cerrada. Por eso responde `CUPOS_INSUFICIENTES` (R2.5), lo que hace a R2 coherente con R3.4.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una fecha AVAILABLE con 2 cupos restantes
Cuando un turista solicita reservar para 3 participantes
Entonces la solicitud se rechaza con CUPOS_INSUFICIENTES
  Y los cupos de la fecha no cambian
```

---

### Requirement 3: Bloquear cupos temporalmente al iniciar el pago

**User Story:** Como **turista**, quiero que mis cupos queden apartados mientras pago, para no perderlos a manos de otra persona durante el proceso.

#### Acceptance Criteria

1. **R3.1** CUANDO se acepte una solicitud válida, EL SISTEMA DE RESERVAS DEBERÁ crear una reserva en estado `PENDING_PAYMENT` e incrementar `capacidadBloqueada` en el número de participantes, en una sola operación atómica.
2. **R3.2** CUANDO se cree la reserva, EL SISTEMA DE RESERVAS DEBERÁ fijar `bloqueoExpiraEn = ahora + minutosBloqueo`. `minutosBloqueo` es un parámetro de configuración.
3. **R3.3** CUANDO se cree la reserva, EL SISTEMA DE RESERVAS DEBERÁ calcular el monto como `precioPorPersona × participantes`, usando el precio vigente de la experiencia y nunca un valor enviado por el cliente.
4. **R3.4** SI dos solicitudes compiten por los últimos cupos, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ aceptar solo las que quepan y rechazar el resto con `CUPOS_INSUFICIENTES`, sin que `capacidadReservada + capacidadBloqueada` supere nunca `capacidadTotal`.
5. **R3.5** CUANDO los cupos restantes lleguen a 0 tras un bloqueo, EL SISTEMA DE RESERVAS DEBERÁ cambiar la disponibilidad a `FULL`.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una fecha con 1 cupo restante
Cuando dos turistas solicitan 1 participante al mismo tiempo
Entonces exactamente una solicitud crea una reserva PENDING_PAYMENT
  Y la otra se rechaza con CUPOS_INSUFICIENTES
  Y la fecha queda en estado FULL
```

---

### Requirement 4: Confirmar la reserva tras el pago verificado

**User Story:** Como **turista**, quiero que mi reserva quede confirmada cuando la pasarela apruebe el pago, para tener asegurada mi participación.

#### Acceptance Criteria

1. **R4.1** CUANDO se reciba una confirmación de pago verificada para una reserva `PENDING_PAYMENT` con bloqueo vigente, EL SISTEMA DE RESERVAS DEBERÁ pasar la reserva a `CONFIRMED`, restar los participantes de `capacidadBloqueada`, sumarlos a `capacidadReservada` y guardar la referencia de pago.
2. **R4.2** EL SISTEMA DE RESERVAS DEBERÁ exponer la confirmación únicamente como un caso de uso invocado por el módulo de pagos, nunca por una acción directa del comprador (RN-08).
3. **R4.3** SI la reserva ya está `CONFIRMED` con la misma referencia de pago, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ responder con éxito sin modificar cupos (idempotencia).
4. **R4.4** SI el bloqueo expiró o la reserva ya fue cancelada, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la confirmación con el código `RESERVA_EXPIRADA`, para que el módulo de pagos gestione la devolución.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una reserva PENDING_PAYMENT de 2 participantes con bloqueo vigente
Cuando llega la confirmación de pago con referencia "PAY-001"
Entonces la reserva queda CONFIRMED con referencia "PAY-001"
  Y la capacidad bloqueada baja en 2 y la reservada sube en 2
Cuando la misma confirmación llega por segunda vez
Entonces el resultado es exitoso y los cupos no cambian
```

---

### Requirement 5: Liberar bloqueos vencidos o pagos rechazados

**User Story:** Como **coordinador comunal**, quiero que los cupos apartados por pagos abandonados o rechazados vuelvan a estar disponibles, para no perder visitantes.

#### Acceptance Criteria

1. **R5.1** CUANDO se ejecute la liberación de bloqueos, EL SISTEMA DE RESERVAS DEBERÁ cancelar todas las reservas `PENDING_PAYMENT` con `bloqueoExpiraEn ≤ ahora`, con motivo `EXPIRED`, y restar sus participantes de `capacidadBloqueada`.
2. **R5.2** CUANDO el módulo de pagos informe un pago rechazado, EL SISTEMA DE RESERVAS DEBERÁ cancelar la reserva `PENDING_PAYMENT` con motivo `PAYMENT_REJECTED` y liberar sus cupos bloqueados.
3. **R5.3** CUANDO la liberación deje cupos restantes mayores que 0 en una disponibilidad `FULL`, EL SISTEMA DE RESERVAS DEBERÁ devolverla a `AVAILABLE`.
4. **R5.4** EL SISTEMA DE RESERVAS DEBERÁ ser idempotente: ejecutar la liberación dos veces seguidas no libera cupos dos veces.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una fecha FULL con una reserva PENDING_PAYMENT de 3 participantes vencida hace 1 minuto
Cuando se ejecuta la liberación de bloqueos
Entonces la reserva queda CANCELLED con motivo EXPIRED
  Y la fecha vuelve a AVAILABLE con 3 cupos restantes
Cuando la liberación se ejecuta otra vez
Entonces los cupos restantes siguen siendo 3
```

---

### Requirement 6: Calcular el reembolso según la política de cancelación

**User Story:** Como **turista**, quiero saber cuánto se me devolverá antes de cancelar, para decidir con información clara.

#### Acceptance Criteria

1. **R6.1** SI las horas de anticipación son mayores o iguales que 168 (7 días), ENTONCES EL SISTEMA DE RESERVAS DEBERÁ calcular un reembolso del 100 % del monto pagado, con tipo `TOTAL`.
2. **R6.2** SI las horas de anticipación son mayores o iguales que 48 y menores que 168, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ calcular un reembolso igual al monto × porcentaje de reembolso parcial configurado, con tipo `PARCIAL`.
3. **R6.3** SI las horas de anticipación son menores que 48, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ calcular un reembolso de 0, con tipo `SIN_REEMBOLSO`.
4. **R6.4** EL SISTEMA DE RESERVAS DEBERÁ redondear el reembolso al céntimo entero más cercano (los casos de medio céntimo se redondean hacia arriba) y nunca devolver un monto negativo ni mayor que el pagado.
5. **R6.5** SI el porcentaje de reembolso parcial configurado no es un número entre 0 y 100, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar el cálculo con el código `POLITICA_INVALIDA`.
6. **R6.6** EL SISTEMA DE RESERVAS DEBERÁ implementar este cálculo como una función pura de dominio, que recibe el monto, el inicio de la experiencia, el momento de la cancelación y la política, y que no lee el reloj del sistema (RN-07).
7. **R6.7** CUANDO el comprador titular o un administrador consulte la vista previa de cancelación de una reserva `CONFIRMED` antes del inicio de la experiencia, EL SISTEMA DE RESERVAS DEBERÁ devolver el reembolso que recibiría si cancelara en ese momento (tipo, monto y horas de anticipación), con la política vigente, **sin modificar** la reserva, los cupos ni el historial. Se aplican los mismos rechazos que en la cancelación: `RESERVA_NO_ENCONTRADA`, `ACCESO_DENEGADO` (R7.2) y `CANCELACION_NO_PERMITIDA` (R7.4).

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una reserva pagada de S/ 450.00 (45000 céntimos)
  Y una política con reembolso parcial del 50 %
Cuando se cancela exactamente 168 horas antes del inicio
Entonces el reembolso es 45000 de tipo TOTAL
Cuando se cancela exactamente 48 horas antes del inicio
Entonces el reembolso es 22500 de tipo PARCIAL
Cuando se cancela 47 horas y 59 minutos antes del inicio
Entonces el reembolso es 0 de tipo SIN_REEMBOLSO
```

> El 50 % es un valor de ejemplo para las pruebas. El valor real está pendiente (decisión A-03).

#### Escenario de aceptación — vista previa (R6.7)

```gherkin
Dado una reserva CONFIRMED de S/ 300.00 cuya experiencia inicia en 100 horas
  Y una política con reembolso parcial del 50 %
Cuando el titular consulta la vista previa de cancelación
Entonces recibe un reembolso de 15000 céntimos de tipo PARCIAL
  Y la reserva sigue CONFIRMED, con los mismos cupos y sin nuevas entradas en el historial
```

---

### Requirement 7: Cancelar una reserva confirmada

**User Story:** Como **turista**, quiero cancelar mi reserva indicando el motivo, para liberar mi lugar y recibir el reembolso que me corresponde.

#### Acceptance Criteria

1. **R7.1** CUANDO el comprador titular solicite cancelar una reserva `CONFIRMED` antes del inicio de la experiencia, EL SISTEMA DE RESERVAS DEBERÁ:
   - calcular el reembolso (Requisito 6);
   - restar los participantes de `capacidadReservada`;
   - registrar el motivo, la fecha de cancelación y el monto a reembolsar;
   - cambiar el estado a `REFUNDED` (tipo `TOTAL`), `PARTIALLY_REFUNDED` (tipo `PARCIAL`) o `CANCELLED` (tipo `SIN_REEMBOLSO`).
2. **R7.2** SI quien solicita la cancelación no es el comprador titular ni un administrador, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazarla con el código `ACCESO_DENEGADO`.
3. **R7.3** SI el motivo está vacío o tiene menos de 5 caracteres, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `MOTIVO_REQUERIDO`.
4. **R7.4** SI la reserva no está `CONFIRMED` o la experiencia ya inició, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `CANCELACION_NO_PERMITIDA`, sin modificar cupos.
5. **R7.5** CUANDO la cancelación libere cupos de una disponibilidad `FULL`, EL SISTEMA DE RESERVAS DEBERÁ devolverla a `AVAILABLE`.
6. **R7.6** CUANDO se complete la cancelación, EL SISTEMA DE RESERVAS DEBERÁ registrar la transición en el historial de estados con el actor, el estado anterior, el estado nuevo y el motivo.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una reserva CONFIRMED de 2 participantes por S/ 300.00 que inicia en 10 días
  Y la fecha está FULL
Cuando el titular la cancela con el motivo "Cambio de planes de viaje"
Entonces la reserva queda REFUNDED con reembolso de 30000 céntimos
  Y la fecha vuelve a AVAILABLE con 2 cupos restantes
  Y el historial registra CONFIRMED → REFUNDED con el motivo
```

---

### Requirement 8: Controlar las transiciones de estado de la reserva

**User Story:** Como **administrador**, quiero que una reserva solo pueda cambiar de estado siguiendo las reglas definidas, para que los datos de reservas, cupos y liquidaciones sean confiables.

#### Acceptance Criteria

1. **R8.1** EL SISTEMA DE RESERVAS DEBERÁ permitir únicamente estas transiciones:
   - `PENDING_PAYMENT → CONFIRMED | CANCELLED`
   - `CONFIRMED → COMPLETED | CANCELLED | REFUNDED | PARTIALLY_REFUNDED`
2. **R8.2** EL SISTEMA DE RESERVAS DEBERÁ tratar `COMPLETED`, `CANCELLED`, `REFUNDED` y `PARTIALLY_REFUNDED` como estados finales, sin transiciones de salida.
3. **R8.3** SI un caso de uso intenta una transición no permitida (incluida la transición a sí mismo), ENTONCES EL SISTEMA DE RESERVAS DEBERÁ lanzar el error `TRANSICION_INVALIDA` con los estados actual y solicitado.
4. **R8.4** EL SISTEMA DE RESERVAS DEBERÁ definir los estados como una tupla cerrada (`as const`) y validar todas las transiciones con una única función central (regla arquitectónica 6).

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una reserva en estado COMPLETED
Cuando un caso de uso intenta pasarla a CANCELLED
Entonces se lanza TRANSICION_INVALIDA indicando "COMPLETED → CANCELLED"
```

---

### Requirement 9: Confirmar la asistencia a una experiencia realizada

**User Story:** Como **coordinador comunal**, quiero confirmar la asistencia de los turistas cuando la experiencia ya se realizó, para que la reserva quede completada y se habiliten la reseña y la liquidación (flujo de reserva, §19, pasos 12 y 13).

#### Acceptance Criteria

1. **R9.1** CUANDO el coordinador que declaró la fecha confirme la asistencia de una reserva `CONFIRMED` cuya experiencia ya inició, EL SISTEMA DE RESERVAS DEBERÁ cambiar el estado a `COMPLETED` y registrar la transición en el historial con el actor y el momento de la confirmación.
2. **R9.2** DONDE el actor sea un administrador, EL SISTEMA DE RESERVAS DEBERÁ permitirle confirmar la asistencia en nombre del coordinador, con las mismas reglas.
3. **R9.3** SI el actor no es el coordinador que declaró la fecha (con rol `COORDINATOR`) ni un administrador, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `ACCESO_DENEGADO`.
4. **R9.4** SI la experiencia todavía no inició, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `ASISTENCIA_NO_PERMITIDA`.
5. **R9.5** SI la reserva no está `CONFIRMED`, ENTONCES EL SISTEMA DE RESERVAS DEBERÁ rechazar la solicitud con el código `TRANSICION_INVALIDA` (R8.3).
6. **R9.6** EL SISTEMA DE RESERVAS NO DEBERÁ modificar los cupos de la fecha al confirmar la asistencia: los participantes siguen contando como reservados.

#### Escenario de aceptación (Dado–Cuando–Entonces)

```gherkin
Dado una reserva CONFIRMED de 2 participantes en una fecha declarada por "coordinador-1"
  Y la experiencia inició hace 3 horas
Cuando "coordinador-1" confirma la asistencia
Entonces la reserva queda COMPLETED
  Y el historial registra CONFIRMED → COMPLETED con el actor "coordinador-1"
  Y la capacidad reservada de la fecha sigue siendo 2
```

---

## Requisitos no funcionales

| ID | Requisito |
|---|---|
| **RNF-R1** | El código de dominio no importa frameworks ni realiza E/S. Toda dependencia externa entra por puertos (`RepositorioReservas`, `RepositorioDisponibilidad`, `RepositorioExperiencias`) |
| **RNF-R2** | Toda función que dependa del tiempo recibe `ahora: Date` como parámetro |
| **RNF-R3** | Todos los montos son enteros en céntimos. Cualquier monto no entero o negativo se rechaza con `MONTO_INVALIDO` |
| **RNF-R4** | Las pruebas unitarias cubren el 100 % de las ramas de las reglas de reembolso, transiciones y cupos, y cada criterio R*n.m* tiene al menos una prueba que lo referencia |
| **RNF-R5** | Los errores de dominio son tipados (`ErrorDominio` con `codigo` y `detalles`) y sus mensajes están en español |

## Fuera de alcance

- Endpoints HTTP, persistencia en Prisma y job programado real (siguiente funcionalidad del backend).
- Interfaz de calendario en React (funcionalidad de frontend).
- Ejecución del reembolso en la pasarela, envío de correos y notificaciones.
- Notificar al comprador o habilitar automáticamente la reseña y la liquidación tras `COMPLETED` (funcionalidades de reseñas y liquidaciones).

## Supuestos y decisiones pendientes

| ID | Supuesto | Estado |
|---|---|---|
| A-03 | El porcentaje de reembolso parcial es un parámetro; las pruebas usan 50 % como ejemplo | Pendiente del valor real |
| A-04 | Los límites se miden en horas exactas: ≥ 168 h total, de 48 h a < 168 h parcial, < 48 h sin reembolso | Propuesto |
| A-23 | `aforoMinimo` de la experiencia **no** se exige por reserva; es el mínimo para que la salida se realice (su gestión queda fuera de alcance) | **Nuevo — confirmar** |
| A-24 | El inicio de la experiencia llega al dominio ya resuelto como instante absoluto (fecha y hora en `America/Lima` → `Date`) | **Nuevo — confirmar** |
| A-25 | Un administrador puede cancelar en nombre del comprador con la misma política de reembolso | **Nuevo — confirmar** |
