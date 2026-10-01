# Propuesta técnica inicial — AMARU-MDD v1.0

> Estado: **PROPUESTA — pendiente de confirmación**.
> Fuente: `AMARU-MDD-Prompt-Maestro.md` (especificación maestra).
> Todo lo marcado como **[DECISIÓN]** es una elección técnica tomada para poder avanzar; todo lo marcado como **[PENDIENTE]** requiere respuesta del equipo antes de implementarse.

---

## 1. Análisis de la especificación

### 1.1 Resumen

Marketplace de dos verticales (artesanías con envío físico + experiencias con calendario y cupos) con cinco roles, pagos por pasarela externa, comisiones, liquidaciones manuales y fuerte componente de **gobernanza cultural** (consentimiento comunitario, verificación de artesanos, moderación previa a la publicación).

### 1.2 Módulos y su complejidad relativa

| Módulo | Complejidad | Motivo |
|---|---|---|
| Autenticación y roles | Media | Refresh tokens, cierre de sesiones, bloqueo, verificación de correo |
| Comunidades y consentimiento | Media | La revocación del consentimiento despublica contenido en cascada (RN-05) |
| Verificación de artesanos | Baja-Media | Flujo de estados con historial y documentos privados |
| Catálogo y búsqueda | Media | Filtros combinados, paginación, rendimiento en conexión limitada |
| Publicación (productos / experiencias) | Media | Moderación, validación de fotos, formulario guiado por pasos |
| Carrito y pedidos | **Alta** | Stock concurrente, pedidos con varios artesanos, plazos RN-09 |
| Reservas y disponibilidad | **Alta** | Cupos concurrentes, bloqueo temporal, liberación por expiración |
| Pagos | **Alta** | Webhook firmado, idempotencia, nunca confiar en el retorno del navegador |
| Envíos | Media | Adaptador logístico, cobertura, estados |
| Comisiones y liquidaciones | Media | Historial de tasas, snapshot al confirmar, sin doble cálculo |
| Reseñas | Baja | Elegibilidad verificada, unicidad, ventana de edición |
| Métricas y auditoría | Media | Registro transversal de operaciones sensibles |

### 1.3 Riesgos técnicos detectados en la especificación

1. **SEO y vista previa en redes (RF-19)**: una SPA de Vite no entrega etiquetas Open Graph a los rastreadores de redes sociales, porque no ejecutan JavaScript. Hace falta una solución explícita (ver §2.4).
2. **Stock de piezas únicas**: el flujo de compra (§18, paso 13) descuenta stock *al aprobarse el pago*. Con piezas de stock = 1, dos compradores pueden pagar la misma pieza. Se propone una **reserva temporal de stock** equivalente al bloqueo de cupos de RF-09 (ver §9, ambigüedad A-06).
3. **Transiciones de pedido incompletas**: la tabla de la regla arquitectónica 6 no permite `pagado → retrasado` (necesario para RN-09 si el artesano nunca pasa a `en_preparacion`) ni `retrasado → enviado/entregado` (retraso durante el transporte). Ver A-07.
4. **Docker no está instalado** en el equipo de desarrollo actual y **pnpm tampoco**. La propuesta se adapta a ello (ver §3).
5. **Repositorio Git**: la carpeta del proyecto está dentro de un repositorio Git cuya raíz es `C:\Users\USER` (el directorio personal completo). Se recomienda un repositorio propio para el proyecto (ver A-15).

---

## 2. Arquitectura técnica final

### 2.1 Vista general

```text
┌────────────────────────────┐        HTTPS/JSON         ┌─────────────────────────────────┐
│ apps/web (React + Vite)    │ ────────────────────────▶ │ apps/api (NestJS)               │
│ Presentación → Aplicación  │   Access token (memoria)  │ Presentación (controllers, DTO) │
│ (views, hooks, TanStack Q.)│   Refresh token (cookie)  │ Aplicación (casos de uso)       │
└─────────────┬──────────────┘                           │ Dominio (reglas, puertos)       │
              │ importa                                  │ Infraestructura (Prisma, etc.)  │
              ▼                                          └──────┬──────────┬──────────┬────┘
┌────────────────────────────┐          importa                 │          │          │
│ packages/shared            │ ◀────────────────────────────────┘          │          │
│ constantes, estados,       │                                   PostgreSQL│   Adaptadores:
│ transiciones, reglas puras,│                                             │   pagos (mock),
│ esquemas Zod, tipos        │                                   Almacén   │   correo, logística,
└────────────────────────────┘                                   archivos ─┘   almacenamiento
```

### 2.2 Decisión clave: reglas de dominio compartidas **[DECISIÓN]**

La especificación pide reglas en el backend **y** validación progresiva en el frontend, pero prohíbe la lógica duplicada. Solución:

- Las **reglas puras** (transiciones de estado, cálculo de comisión, cálculo de reembolso, validación de publicación, validación de fotos, elegibilidad de reseña) viven **una sola vez** en `packages/shared/src/domain/`.
- El **backend** las ejecuta como fuente de verdad, con datos leídos de la base de datos (nunca del cliente).
- El **frontend** las importa solo para mostrar al usuario resultados anticipados (por ejemplo, "recibirás S/ 85.00 netos") y para la validación progresiva de formularios.
- Las carpetas `apps/web/src/domain/*` solo contienen modelos de vista y adaptadores; no redefinen reglas.

### 2.3 Capas del backend por módulo **[DECISIÓN]**

Cada módulo de `apps/api/src/modules/<modulo>/` sigue la misma forma:

```text
<modulo>/
├── domain/            # entidades del módulo, interfaces de repositorio (puertos), errores de dominio
├── application/       # casos de uso (una clase por caso de uso), orquestación, transacciones
├── infrastructure/    # repositorios Prisma, adaptadores externos
├── presentation/      # controllers, DTO (esquemas Zod), mapeo a respuestas públicas
└── <modulo>.module.ts
```

Reglas de dependencia: `presentation → application → domain ← infrastructure`. El dominio no importa Prisma, Nest ni HTTP.

### 2.4 SEO y compartir en redes (RF-19) **[DECISIÓN — confirmar]**

- Se mantiene la SPA con Vite (stack de la especificación).
- La API expone `GET /share/:tipo/:slug`, que devuelve un HTML mínimo con `<title>`, `description`, `og:*` y `twitter:*`, y redirige al usuario humano a la ficha de la SPA. Los botones de compartir usan esa URL.
- `react-helmet-async` (o las etiquetas `<title>`/`<meta>` nativas de React 19) para títulos en navegación interna.
- `sitemap.xml` y `robots.txt` generados por la API.
- Alternativa descartada por ahora: React Router en *modo framework* con SSR. Mejora el SEO y el primer render, pero añade un servidor Node para el frontend y complica el despliegue. Se puede migrar más adelante sin reescribir componentes.

### 2.5 Concurrencia en stock y cupos **[DECISIÓN]**

- Restricciones `CHECK` en PostgreSQL: `stock >= 0`, `reserved_capacity >= 0`, `held_capacity >= 0`, `reserved_capacity + held_capacity <= total_capacity`.
- Actualizaciones atómicas condicionales (`UPDATE ... SET held = held + n WHERE id = ? AND total - reserved - held >= n`) dentro de transacciones; si afecta 0 filas → error de dominio `CUPOS_INSUFICIENTES` / `STOCK_INSUFICIENTE`.
- Bloqueo temporal con expiración (`hold_expires_at`); un job programado libera bloqueos vencidos (RF-09).

### 2.6 Pagos (Fase 7, sin pasarela real todavía)

- Puerto `PaymentGateway` con `createCheckout()`, `verifyWebhook()`, `getTransactionStatus()`.
- Adaptador `MockPaymentGateway` para desarrollo: página simulada de pago, webhook firmado con HMAC-SHA256 y clave de `.env`.
- Idempotencia: tabla `payment_webhook_events` con `UNIQUE(provider, event_id)`; `payments.idempotency_key` único.
- El retorno del navegador desde la pasarela **solo** muestra "estamos confirmando tu pago" y consulta el estado; nunca cambia el estado (RN-08).

### 2.7 Tareas programadas

`@nestjs/schedule` con tres jobs idempotentes:

| Job | Frecuencia | Regla |
|---|---|---|
| Liberar bloqueos vencidos de stock y cupos | cada minuto | RF-09 |
| Marcar pedidos fuera de plazo como `retrasado` y notificar al administrador | cada hora | RN-09 |
| Expirar pagos pendientes abandonados | cada 5 min | RF-10 |

### 2.8 Seguridad (RNF-05, RN-12)

| Aspecto | Decisión |
|---|---|
| Contraseñas | Argon2id |
| Sesión | Access token JWT de 15 min en memoria del cliente; refresh token opaco, rotativo, en cookie `httpOnly; Secure; SameSite=Strict`, guardado **hasheado** en `sessions` → permite "cerrar sesiones activas" (RF-01) |
| CSRF | Solo aplica a `/auth/refresh` y `/auth/logout` (usan cookie): `SameSite=Strict` + token doble envío |
| Autorización | `RolesGuard` + comprobación de propiedad del recurso en el caso de uso (un artesano solo edita lo suyo) |
| Validación | Zod en todos los DTO; `ValidationPipe` global que rechaza campos desconocidos |
| Cabeceras | `helmet`, CORS con lista blanca |
| Límite de peticiones | `@nestjs/throttler`, más estricto en login, registro y recuperación de contraseña |
| Inyección | Prisma parametrizado; prohibido `$queryRawUnsafe` |
| XSS | React escapa por defecto; prohibido `dangerouslySetInnerHTML`; los textos culturales se guardan como texto plano |
| Archivos | Validación de tipo MIME real (magic bytes), tamaño, dimensiones; renombrado con UUID; documentos de verificación en almacenamiento **privado** con URL firmada temporal |
| Tarjetas | Nunca pasan por nuestros servidores: redirección o widget de la pasarela |
| Datos personales | Respuestas públicas mapeadas explícitamente (nunca se devuelve la entidad Prisma completa); auditoría de accesos a datos sensibles |

---

## 3. Stack definitivo

| Capa | Tecnología | Nota |
|---|---|---|
| Runtime | Node.js 24 LTS | Ya instalado (v24.18.0) |
| Monorepo | **npm workspaces** | **[DECISIÓN]** pnpm no está instalado; npm 11 soporta workspaces sin herramientas extra. Desventaja: instalaciones algo más lentas. Migrable a pnpm después |
| Lenguaje | TypeScript en modo `strict` | En todo el monorepo |
| Frontend | React 19, Vite, React Router, Tailwind CSS v4, TanStack Query v5, React Hook Form, Zod, Lucide React | Según especificación |
| Pruebas frontend y shared | Vitest + Testing Library | Según especificación |
| Backend | **NestJS** | **[DECISIÓN]** La estructura pedida (`guards`, `pipes`, `filters`, `decorators`, módulos) es la de NestJS; con Express habría que construirla a mano |
| ORM y BD | Prisma + PostgreSQL 16 | Según especificación |
| Validación backend | **Zod** (esquemas compartidos) | **[DECISIÓN]** Frente a class-validator: un solo esquema sirve para frontend y backend |
| Documentación API | Swagger / OpenAPI (`@nestjs/swagger`) | Según especificación |
| Pruebas backend | Jest + Supertest | Según especificación |
| Pruebas E2E | Playwright | No estaba especificado; es el estándar actual para E2E en navegador |
| Logs | `nestjs-pino` (JSON estructurado) | Sin datos personales en los logs |
| Contenedores | Docker Compose: PostgreSQL, Mailpit (correo de prueba), MinIO (almacenamiento S3 local) | **Requiere instalar Docker Desktop** (ver A-14) |
| CI | GitHub Actions: lint, typecheck, pruebas, build | |
| Calidad | ESLint (flat config), Prettier, EditorConfig | |

Las versiones exactas se fijan al inicializar el repositorio con la última versión estable de cada paquete.

---

## 4. Estructura inicial del repositorio

Se respeta la estructura de la especificación (§11) con estos ajustes justificados:

| Ajuste | Motivo |
|---|---|
| `packages/shared/src/domain/` (nuevo) | Reglas puras en un único lugar (§2.2) |
| `apps/api/src/modules/<m>/{domain,application,infrastructure,presentation}` | Arquitectura limpia por módulo (§2.3) |
| `apps/api/src/modules/share/` (nuevo) | Vista previa para redes sociales (§2.4) |
| `apps/api/src/modules/guides/` (nuevo) | Material educativo RF-20 (no tenía módulo) |
| `apps/api/src/modules/featured/` (nuevo) | Publicaciones destacadas RF-18 (no tenía módulo) |
| `apps/api/src/jobs/` (nuevo) | Tareas programadas (§2.7) |
| Pruebas unitarias junto al código (`*.spec.ts` / `*.test.ts`) | Convención de Nest y Vitest; `tests/` raíz queda para integración y E2E |
| `CLAUDE.md` en la raíz | Hace que las sesiones de desarrollo asistido carguen siempre `steering/` |

```text
amaru-mdd/
├── apps/
│   ├── web/                      # React + Vite (estructura de la especificación §11)
│   └── api/
│       ├── src/
│       │   ├── config/           # validación de variables de entorno con Zod
│       │   ├── modules/          # auth, users, communities, artisans, products, experiences,
│       │   │                     # availability, cart, orders, bookings, payments, shipments,
│       │   │                     # reviews, commissions, settlements, notifications, metrics,
│       │   │                     # audit, featured, guides, share
│       │   ├── jobs/
│       │   ├── common/           # guards, middleware, decorators, filters, pipes, errors
│       │   ├── database/         # PrismaService, helpers de transacción
│       │   └── main.ts
│       └── prisma/               # schema.prisma, migrations/, seed.ts
├── packages/
│   ├── shared/src/{constants,types,schemas,domain}/
│   ├── eslint-config/
│   └── tsconfig/
├── docs/                         # requisitos, arquitectura, casos-de-uso, api, base-de-datos, ui-ux, decisiones
├── steering/                     # reglas obligatorias de desarrollo
├── tests/{integration,e2e}/
├── .github/workflows/ci.yml
├── .env.example
├── docker-compose.yml
├── package.json
├── CLAUDE.md
├── README.md
└── LICENSE
```

---

## 5. Variables de entorno

Definidas en [`.env.example`](../../.env.example). Principio: **en `.env` solo va configuración de infraestructura y secretos**. Las reglas de negocio (tasa de comisión, porcentaje de reembolso parcial, mínimo de fotos, plazo de preparación) viven en la base de datos (configurables por el administrador) o en `packages/shared/src/constants` (valores fijados por la especificación). Así la tasa de comisión nunca se repite en varios archivos (RN-04).

---

## 6–7. Modelo de datos, entidades y relaciones

Ver [`docs/base-de-datos/modelo-inicial.md`](../base-de-datos/modelo-inicial.md).

---

## 8. Primer sprint (Sprint 1 — 2 semanas)

**Objetivo del sprint:** monorepo ejecutable de extremo a extremo, con base de datos migrada y poblada, reglas de dominio núcleo probadas y la base visual de la aplicación.

| # | Historia / tarea | Criterio de aceptación |
|---|---|---|
| S1-01 | Inicializar monorepo (npm workspaces, TS strict, ESLint, Prettier, EditorConfig) | `npm run lint` y `npm run typecheck` pasan en limpio |
| S1-02 | `packages/shared`: estados como tuplas cerradas + funciones de transición para pedido, reserva, publicación, artesano, pago y liquidación | 100 % de transiciones válidas e inválidas cubiertas por pruebas |
| S1-03 | `packages/shared`: `calcularComision`, `calcularMontoNeto`, `calcularReembolso` (RN-04, RN-07), `validarPublicacion` (RN-03, RNF-12) | Pruebas unitarias con casos límite (redondeo, 48 h exactas, 7 días exactos) |
| S1-04 | `apps/api`: esqueleto NestJS, configuración validada con Zod, `helmet`, CORS, throttler, filtro global de errores, logger, Swagger, `GET /api/health` | `GET /api/health` responde 200 con estado de la BD |
| S1-05 | `prisma/schema.prisma` completo v1, primera migración, restricciones `CHECK`, `seed.ts` (roles, 3 comunidades, administrador de desarrollo, tasa de comisión inicial) | `npx prisma migrate dev` y `npm run db:seed` funcionan desde cero |
| S1-06 | `docker-compose.yml` (PostgreSQL, Mailpit, MinIO) | `docker compose up -d` levanta los servicios |
| S1-07 | `apps/web`: Vite + Tailwind con tokens de la paleta, router, `PublicLayout`, Navbar, Footer, textos centralizados en `i18n/es` | Navegación funcional desde 320 px, foco visible, contraste AA |
| S1-08 | Átomos: `Button`, `Input`, `Label`, `Card`, `Badge`; estados `LoadingState`, `EmptyState`, `ErrorState` | Pruebas de Testing Library y accesibilidad (roles, etiquetas) |
| S1-09 | Página de inicio con contenido estático (hero, comunidades, llamados a la acción) | Responsive en 320 / 375 / 768 / 1024 / 1440 px |
| S1-10 | CI en GitHub Actions: lint, typecheck, test, build | Pipeline en verde |

**Fuera del sprint:** autenticación, catálogo con datos reales, pagos.

---

## 9. Orden exacto de implementación

El orden de la especificación (§22) se mantiene con **tres adelantos justificados**:

| Sprint | Contenido | Ajuste respecto a la especificación |
|---|---|---|
| 1 | Fase 0 + Fase 1 + núcleo de dominio en `shared` + esquema de BD | El esquema y las reglas puras se adelantan porque todo lo demás depende de ellos |
| 2 | Fase 2 — Catálogo público (lectura con datos del seed), filtros, búsqueda, paginación, fichas, comunidad, perfil de artesano, endpoint `share` | — |
| 3 | Fase 3 — Autenticación, sesiones, roles, protección de rutas, perfil. **Módulo de auditoría** | La auditoría se adelanta: las operaciones sensibles empiezan aquí (RN-12) |
| 4 | Fase 4 — Artesanos: solicitud de verificación, panel, crear/editar producto, imágenes. **Verificación de artesanos y moderación de publicaciones (admin)** | Se adelanta parte de la Fase 9: sin aprobación del administrador ningún artesano puede publicar (RN-01) |
| 5 | Fase 5 — Carrito, checkout, direcciones, totales, pedido. **Fase 7 — Adaptador de pago simulado, webhook, idempotencia** | Pagos se adelanta: un pedido sin confirmación de pago no puede completarse ni probarse |
| 6 | Fase 6 — Experiencias, disponibilidad, calendario, cupos, reservas, cancelación y reembolsos | — |
| 7 | Fase 8 — Logística: cobertura, envíos, seguimiento, entrega. Job RN-09. Comisiones y liquidaciones | — |
| 8 | Fase 9 — Resto del panel administrativo: usuarios, comunidades, consentimiento, métricas, destacados, reseñas, guías | — |
| 9 | Reseñas (compra y experiencia) + Fase 10 — E2E, accesibilidad, rendimiento, seguridad, SEO, documentación | — |

---

## 10. Ambigüedades y decisiones pendientes

| ID | Tema | Ambigüedad | Propuesta por defecto |
|---|---|---|---|
| A-01 | **Tasa de comisión** | No se indica el valor inicial | **[PENDIENTE]** Tabla `commission_rates` con historial; el administrador la edita |
| A-02 | **Quién paga la comisión** | RN-04/RN-11 indican que se descuenta al artesano, pero RF-08 muestra "comisión" en el carrito y `Order` tiene `commission` y `total` | Se descuenta al artesano. Total del comprador = subtotal + envío. En el carrito no se muestra comisión (RN-02: el precio lo fija el artesano) |
| A-03 | **Reembolso parcial** | RN-07 no dice el porcentaje para 2–6 días | **[PENDIENTE]** Configurable en `system_settings` |
| A-04 | **Límites exactos de RN-07** | "6 y 2 días" vs "menos de 48 h" deja huecos (por ejemplo, 6,5 días) | Por horas hasta la fecha de inicio: ≥ 168 h → total; 48 h a < 168 h → parcial; < 48 h → sin reembolso. Zona horaria `America/Lima` |
| A-05 | **Pedidos con varios artesanos** | Un carrito puede mezclar artesanos, pero RN-09, envíos, reseñas y liquidaciones son por artesano | Un **checkout** genera **un pedido por artesano**, todos pagados con un solo pago. Cada pedido tiene su propio estado, envío y liquidación |
| A-06 | **Reserva temporal de stock** | El flujo descuenta stock solo al aprobar el pago | Reservar stock al crear el pedido (bloqueo de 20 min, igual que los cupos); se descuenta definitivamente al aprobar y se libera si falla o expira |
| A-07 | **Transiciones de pedido** | Faltan `pagado → retrasado` y `retrasado → enviado` / `retrasado → entregado` | Añadir las tres transiciones. **No se aplican hasta que lo confirmes** |
| A-08 | **Costo de envío y cobertura** | No se define cómo se calcula | Tabla `shipping_zones` (departamento/provincia → costo fijo y días estimados) administrada por el admin |
| A-09 | **Cancelación de pedidos de artesanía** | RN-07 solo cubre experiencias | El comprador puede cancelar mientras el pedido esté en `pagado` (reembolso total). Después, solo el administrador |
| A-10 | **Roles múltiples** | Un artesano puede comprar o ser coordinador | Relación `user_roles` de muchos a muchos (la especificación ya lista la tabla `roles`). `VISITOR` no se guarda: es el usuario no autenticado |
| A-11 | **Quién crea experiencias** | RN-01 exige artesano verificado; §4.4 dice que el coordinador gestiona experiencias | El coordinador (asignado por el admin a una comunidad) o un artesano verificado de esa comunidad las crea; el admin las aprueba; el coordinador siempre gestiona la disponibilidad |
| A-12 | **Edición de publicaciones ya publicadas** | ¿Requiere nueva revisión? | Cambios de precio y stock: sin revisión (RN-02). Cambios de texto cultural, fotos, material o técnica: vuelve a `PENDING_REVIEW` |
| A-13 | **Consentimiento cultural** | `Community.culturalConsent` es un booleano, pero existe la tabla `cultural_consents` | `cultural_consents` por comunidad, con documento, vigencia y revocación. Revocar → despublicación automática del contenido asociado + auditoría |
| A-14 | **Docker** | No está instalado | Instalar Docker Desktop (recomendado) **o** PostgreSQL nativo para Windows; el proyecto funcionará con ambos |
| A-15 | **Repositorio Git** | La raíz Git actual es `C:\Users\USER` | `git init` dentro de la carpeta del proyecto, rama `main` + ramas `feature/*` |
| A-16 | **Comprobante (RF-11)** | ¿Es comprobante electrónico SUNAT (boleta/factura)? | v1: constancia de compra propia enviada por correo, **no** es comprobante tributario. La facturación electrónica queda fuera de alcance (junto con la integración contable). Validar con asesoría tributaria |
| A-17 | **Días hábiles (RN-09)** | ¿Se excluyen feriados? | Lunes a viernes, excluyendo los feriados nacionales cargados en la tabla `holidays` |
| A-18 | **Límites de imágenes (RNF-12)** | No se dan valores | JPEG/PNG/WebP, máximo 5 MB, mínimo 800×800 px, de 3 a 10 fotos por artesanía |
| A-19 | **Pasarela real** | No se indica proveedor | **[PENDIENTE]** Opciones habituales en Perú: Culqi, Niubiz, Izipay, Mercado Pago. No bloquea hasta la salida a producción |
| A-20 | **Estados de pedido en español** | Los pedidos usan `pendiente_pago`… y el resto de entidades usa inglés en mayúsculas | Se respetan los valores de la especificación tal cual, para no desviarse |
| A-21 | **Suspensión de artesano** | `SUSPENDED` aparece en §20 pero no en la entidad `Artisan` | Se incluye. Al suspender, sus publicaciones pasan a `UNPUBLISHED` |
| A-22 | **Métricas de visitas** | No se indica herramienta | Tabla propia `metric_events` (sin datos personales ni IP completa) para respetar RN-12 |
