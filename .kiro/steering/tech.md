---
inclusion: always
---

# Tech Stack & Steering Guidelines — AMARU-MDD

Reglas tecnológicas y arquitectónicas que todo agente de IA debe respetar al generar código para este proyecto. Si una petición las contradice, el agente se detiene y pregunta.

## Core Tech

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24 LTS · npm 11 (npm workspaces, monorepo) |
| Lenguaje | TypeScript en modo `strict` en todo el repositorio |
| Frontend (`apps/web`) | React 19 · Vite · React Router · Tailwind CSS v4 · TanStack Query v5 · React Hook Form · Zod · Lucide React |
| Backend (`apps/api`) | NestJS · Prisma ORM · PostgreSQL 16 · JWT con refresh tokens · Swagger/OpenAPI |
| Dominio compartido (`packages/shared`) | TypeScript puro: estados, transiciones, reglas de negocio, esquemas Zod. **Sin dependencias de framework** |
| Infraestructura | Docker Compose (PostgreSQL, Mailpit, MinIO) · GitHub Actions |

Está prohibido agregar dependencias nuevas sin justificar ventajas y desventajas en `docs/decisiones/`.

## Architecture: Clean Architecture

Separación estricta entre UI y lógica de negocio (principio de responsabilidad única, SRP):

```text
Presentación  →  Aplicación  →  Dominio  ←  Infraestructura
(componentes,    (casos de uso,  (entidades,    (Prisma, pasarela,
 controllers)     hooks)          reglas puras,  correo, almacenamiento)
                                  puertos)
```

1. **Las reglas de negocio viven una sola vez** en `packages/shared/src/domain/`. El backend las ejecuta como fuente de verdad y el frontend solo las reutiliza para mostrar avances al usuario.
2. **El dominio es puro**: no hace E/S ni importa `@nestjs/*`, `@prisma/client`, React ni HTTP, y recibe la hora actual como parámetro (`ahora: Date`) en vez de llamar a `new Date()`.
3. **Puertos y adaptadores**: el dominio declara interfaces (por ejemplo, `RepositorioDisponibilidad`) y la infraestructura las implementa (Prisma en producción, memoria en pruebas).
4. **Ningún componente visual** contiene reglas de negocio ni hace `fetch`.
5. **El backend recalcula** totales, comisiones, stock, cupos, reembolsos, permisos y el estado del pago. Nunca confía en valores enviados por el cliente.
6. **Los estados son tuplas cerradas** (`as const`) y toda transición pasa por una función central.
7. **El dinero se maneja en céntimos enteros** (`number` entero / `INTEGER`). Nunca se usa coma flotante para montos.
8. **Ningún parámetro de negocio va en código**: la tasa de comisión y el porcentaje de reembolso parcial se configuran desde el sistema (BD) y entran al dominio como parámetros.

## Testing: cobertura obligatoria

| Paquete | Herramienta | Exigencia |
|---|---|---|
| `packages/shared` (dominio) | **Vitest** | 100 % de ramas en reglas de negocio; casos límite obligatorios |
| `apps/api` | **Jest** + Supertest | Caso feliz, 400/422, 403 y 409 por endpoint |
| `apps/web` | Vitest + Testing Library | Consultas por rol o etiqueta accesible |
| E2E | Playwright | Los 10 flujos de §21 de la especificación |

- Cada criterio de aceptación de un `requirements.md` tiene al menos una prueba automatizada que lo referencia por su ID (por ejemplo, `it('R6.2 …')`).
- Una tarea no se marca como completada si alguna prueba falla (semáforo en verde).

## Conventions

- El dominio se nombra en **español** (`calcularReembolso`, `EstadoReserva`). La infraestructura de los frameworks, en inglés (`BookingsController`).
- Componentes en PascalCase, hooks `useEntidadAccion`, constantes en MAYÚSCULAS, tablas en `snake_case`.
- **Funciones atómicas**: una responsabilidad por función. Se divide todo archivo que supere ~250 líneas y mezcle responsabilidades.
- **Manejo de errores**: errores de dominio tipados (`ErrorDominio` con `codigo`), sin `throw new Error('...')` genérico en el dominio. Los mensajes para el usuario van en español.
- Commits con Conventional Commits en español.

## Referencias obligatorias

- Reglas de negocio y máquinas de estado: #[[file:steering/reglas-negocio.md]]
- Backend: #[[file:steering/amaru-backend.md]]
- Frontend: #[[file:steering/amaru-frontend.md]]
- Convenciones y definición de terminado: #[[file:steering/convenciones.md]]
