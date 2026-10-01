# Steering — Convenciones

## Nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `ProductCard.tsx` |
| Hooks | `useEntidadAccion` | `useProductoCrear`, `useCatalogoProductos` |
| Servicios y funciones | camelCase | `productService.ts`, `calcularComision()` |
| Tipos e interfaces | PascalCase | `EstadoPedido`, `ProductoPublico` |
| Constantes | MAYÚSCULAS | `ESTADOS_PEDIDO`, `MIN_FOTOS_ARTESANIA` |
| Casos de uso (API) | Verbo + entidad en PascalCase (inglés, como Nest) | `CreateProduct`, `ConfirmPayment` |
| Tablas y columnas | snake_case plural | `order_items.unit_price_cents` |
| Rutas API | kebab-case, recursos en inglés (§16) | `/api/products/:id/submit-review` |
| Rutas web | español, kebab-case | `/artesanias/:slug`, `/panel/artesano/productos` |
| Archivos de reglas | nombre descriptivo | `calcular-reembolso.ts`, `transiciones-pedido.ts` |
| Montos | sufijo `Cents` | `priceCents`, `totalCents` |

**Idioma:** el dominio y los textos de negocio van en español (`calcularReembolso`, `EstadoPedido`). La infraestructura técnica y los nombres de NestJS o Prisma van en inglés (`ProductsController`, `PrismaService`). Los valores de estado se copian **exactamente** de la especificación (§20).

## Tamaño y responsabilidad

- Un componente, un propósito.
- Un archivo que supere ~250 líneas y mezcle responsabilidades se divide.
- Una función de dominio es pura, sin E/S, y recibe `ahora: Date` como parámetro en lugar de llamar a `new Date()`, para que se pueda probar.

## Git

- Ramas: `main` (estable), `develop` (integración), `feature/<fase>-<descripcion>` (por ejemplo, `feature/f5-checkout`), `fix/<descripcion>`.
- Commits con Conventional Commits en español: `feat(orders): crear pedido pendiente de pago`, `fix(bookings): liberar cupos al expirar`, `test(shared): casos límite de reembolso`.
- Cada PR indica los RF, RNF y RN afectados y la evidencia de pruebas.
- No se sube nunca `.env`, secretos, documentos de verificación ni datos reales de personas.

## Datos de ejemplo

- Solo datos ficticios: `artesano.demo@amaru.local`, teléfonos `900000000`, DNI inventados que no correspondan a personas reales.
- Las historias y los símbolos culturales del seed son **marcadores de posición genéricos**. El contenido cultural real solo lo ingresa la comunidad, con consentimiento (RN-05).

## Definición de terminado (§27)

Una tarea está terminada solo si:

- [ ] Cumple los RF, RNF y RN indicados en el PR.
- [ ] Tiene validación en el frontend (UX) **y** en el backend (seguridad).
- [ ] Maneja los estados de carga, vacío y error.
- [ ] Es accesible (teclado, etiquetas, contraste, alt) y responsive desde 320 px.
- [ ] Tiene pruebas y pasan en CI.
- [ ] Los textos están centralizados y no hay lógica duplicada ni tasas repetidas.
- [ ] No expone datos sensibles ni secretos.
- [ ] La documentación (README, Swagger o `docs/`) está actualizada.
- [ ] Puede ejecutarse siguiendo las instrucciones del README.

## Formato de respuesta en tareas asistidas

Toda tarea sigue la estructura de §23 de la especificación: comprensión → requisitos → archivos → diseño técnico → implementación → configuración → pruebas → verificación → riesgos.
