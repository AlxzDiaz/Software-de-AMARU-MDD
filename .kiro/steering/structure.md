---
inclusion: always
---

# Estructura del repositorio — AMARU-MDD

```text
apps/web/                      React + Vite (presentación y aplicación del cliente)
apps/api/                      NestJS (módulos con domain/ application/ infrastructure/ presentation/)
packages/shared/src/
  ├── constants/               estados (tuplas as const) y constantes fijadas por la especificación
  ├── domain/                  reglas de negocio puras, transiciones, servicios de dominio y puertos
  ├── schemas/                 esquemas Zod compartidos
  └── types/                   tipos compartidos
docs/                          requisitos, arquitectura, base de datos, decisiones
steering/                      reglas de desarrollo detalladas (referenciadas desde .kiro/steering)
.kiro/specs/<feature>/         requirements.md → design.md → tasks.md de cada funcionalidad
tests/integration, tests/e2e/  pruebas que cruzan paquetes
```

- Las pruebas unitarias van junto al código (`*.test.ts` en shared y web, `*.spec.ts` en api).
- Cada funcionalidad nueva empieza con su carpeta en `.kiro/specs/` y no se escribe código hasta que `requirements.md` y `design.md` estén aprobados.

Modelo de datos: #[[file:docs/base-de-datos/modelo-inicial.md]]
