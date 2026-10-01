# AMARU-MDD v1.0

**Artesanía y Manifestaciones Ancestrales en Red Unificada — Madre de Dios**

Plataforma web para la visibilización y comercialización directa de artesanía y turismo vivencial de las comunidades nativas de Madre de Dios (Ese Eja, Harakbut y Matsigenka). Conecta a artesanos, comunidades, coordinadores y administradores con compradores y turistas, sin intermediarios y respetando el control comunitario sobre precios, contenidos culturales y actividades.

> **Estado del proyecto:** Fase 0 — análisis y propuesta técnica. Todavía no hay código ejecutable.
> Ver [`docs/arquitectura/propuesta-inicial.md`](docs/arquitectura/propuesta-inicial.md).

---

## Funcionalidades de la versión 1.0

- Catálogo público de artesanías y experiencias, con filtros, búsqueda y fichas preparadas para compartir.
- Registro, verificación y panel de artesanos. Moderación de publicaciones por el administrador.
- Carrito, checkout y pago en línea (pasarela adaptable; simulada en desarrollo).
- Reservas de experiencias con calendario, cupos y política de cancelación.
- Envíos con seguimiento.
- Reseñas verificadas.
- Comisiones configurables y liquidaciones a artesanos.
- Panel administrativo con métricas y bitácora de auditoría.

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React · TypeScript · Vite · React Router · Tailwind CSS · TanStack Query · React Hook Form · Zod |
| Backend | Node.js · NestJS · Prisma · PostgreSQL · JWT con refresh tokens · Swagger |
| Compartido | `packages/shared`: estados, reglas de dominio puras y esquemas Zod |
| Pruebas | Vitest · Testing Library · Jest · Supertest · Playwright |
| Infraestructura | Docker Compose (PostgreSQL, Mailpit, MinIO) · GitHub Actions |

## Estructura

```text
apps/web          Aplicación React (presentación y aplicación del cliente)
apps/api          API NestJS (casos de uso, dominio, infraestructura)
packages/shared   Reglas de negocio puras, estados, esquemas y tipos compartidos
docs/             Requisitos, arquitectura, base de datos, API, UI/UX y decisiones
steering/         Reglas obligatorias de desarrollo (leer antes de programar)
tests/            Pruebas de integración y E2E
```

## Requisitos previos

- **Node.js 24 LTS** y npm 11 o superior.
- **Docker Desktop**, recomendado para PostgreSQL, Mailpit y MinIO. Alternativa: PostgreSQL 16 instalado localmente.
- Git.

## Puesta en marcha

> Los comandos estarán disponibles al terminar el Sprint 1.

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
docker compose up -d
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

| Servicio | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| Mailpit (correos de prueba) | http://localhost:8025 |
| Consola de MinIO | http://localhost:9001 |

## Scripts previstos

| Script | Descripción |
|---|---|
| `npm run dev` | Levanta la web y la API en modo desarrollo |
| `npm run build` | Compila todos los paquetes |
| `npm run lint` | ESLint en todo el monorepo |
| `npm run typecheck` | Verificación de tipos de TypeScript |
| `npm test` | Pruebas unitarias |
| `npm run test:integration` | Pruebas de integración de la API |
| `npm run test:e2e` | Pruebas end-to-end con Playwright |
| `npm run db:migrate` | Aplica las migraciones de Prisma |
| `npm run db:seed` | Carga datos de desarrollo ficticios |

## Principios no negociables

1. Toda regla de negocio crítica se valida en el backend. El frontend solo mejora la experiencia.
2. Un pedido **nunca** se marca como pagado desde el frontend ni por el retorno del navegador: solo mediante un webhook verificado.
3. Solo artesanos verificados publican, y solo con consentimiento cultural vigente de su comunidad.
4. El precio lo fija el artesano o la comunidad. La tasa de comisión existe en un único lugar.
5. No se almacenan datos de tarjetas ni se exponen datos personales de compradores o artesanos.

Detalle completo en [`steering/`](steering/).

## Documentación

- [Propuesta técnica inicial](docs/arquitectura/propuesta-inicial.md)
- [Modelo de base de datos](docs/base-de-datos/modelo-inicial.md)
- [Reglas de negocio](steering/reglas-negocio.md)
- [Guía de backend](steering/amaru-backend.md) · [Guía de frontend](steering/amaru-frontend.md) · [Convenciones](steering/convenciones.md)

## Licencia

Pendiente de definir. Ver `LICENSE`.
