# Steering — Frontend (`apps/web`)

> Obligatorio para todo el código de `apps/web`. Complementa `reglas-negocio.md` y `convenciones.md`.

## Stack

React 19 · TypeScript strict · Vite · React Router · Tailwind CSS v4 · TanStack Query v5 · React Hook Form · Zod (esquemas de `@amaru/shared`) · Lucide React · Vitest + Testing Library · Playwright (E2E).

## Capas y flujo de datos

```text
views/*            → componen la página; llaman a hooks; no hacen fetch ni cálculos de negocio
hooks/*            → useEntidadAccion(): TanStack Query + casos de uso del cliente
services/*         → funciones que llaman a infrastructure/api (sin React)
infrastructure/api → cliente HTTP único (fetch + refresh automático + mapeo de errores)
components/*       → átomos, moléculas, organismos y templates: solo presentación y props
```

## Reglas obligatorias

1. **Sin lógica de negocio en componentes.** Los totales, el neto y los reembolsos se muestran a partir de la respuesta de la API o de una función de `@amaru/shared/domain` llamada en el hook. Nunca con `reduce` dentro del JSX.
2. **Sin `fetch` en componentes.** Todo acceso a datos pasa por un hook (`useCatalogoProductos`, `useCrearProducto`…).
3. **El frontend nunca decide un estado.** No existe ningún botón que marque un pedido como pagado. La pantalla de retorno de la pasarela solo consulta el estado (polling con TanStack Query) y muestra "Confirmando tu pago…".
4. **Textos centralizados** en `src/i18n/es/*.ts` (`textos.productos.publicar`). Está prohibido escribir texto visible directamente en el JSX.
5. **Tokens de diseño** en `src/styles/tokens.css` (`@theme` de Tailwind v4). Está prohibido usar colores hexadecimales sueltos en componentes.
6. **Todas las vistas con datos** manejan los cuatro estados: `cargando` (esqueleto), `vacío` (`EmptyState` con acción sugerida), `error` (`ErrorState` con reintento) y `éxito`.
7. **Confirmación** (`ConfirmDialog`) antes de toda acción crítica: cancelar, eliminar, enviar a revisión, pagar, aprobar o rechazar.
8. **El access token solo vive en memoria.** Nunca en `localStorage` ni `sessionStorage`. El refresh token es una cookie `httpOnly` que gestiona el navegador.
9. **Formularios** con React Hook Form + `zodResolver(esquemaCompartido)`. Los mensajes de error se asocian al campo mediante `aria-describedby`.
10. **Rutas protegidas** con `<RequireRole roles={[...]}>`. Es solo UX: la seguridad real está en el backend.

## Formularios para artesanos (RNF-02)

Formulario por pasos (`StepperForm`), con:

- Indicador de avance ("Paso 2 de 5 — Fotografías").
- Campos agrupados por tema: datos básicos → historia cultural → materiales y técnica → fotos → precio y envío → revisión.
- Ayuda contextual y un ejemplo real bajo cada campo.
- Validación progresiva por paso, sin bloquear el guardado del borrador.
- Vista previa de la comisión y del neto **antes** de enviar a revisión (RN-04), calculada con la tasa vigente que devuelve la API.
- Lenguaje simple, sin tecnicismos.

## Accesibilidad (RNF-10), obligatoria en cada componente

- HTML semántico: `header`, `nav`, `main`, `footer`, `button` (nunca un `div` con `onClick`).
- Contraste AA verificado para cada combinación de tokens.
- Foco visible (`focus-visible:ring`) y orden de tabulación lógico; los modales atrapan el foco y se cierran con Esc.
- `alt` descriptivo en todas las imágenes (`alt=""` solo si son decorativas). El texto alternativo de las fotos de producto lo escribe el artesano, con una ayuda.
- Anuncios de estado mediante `aria-live` (toasts, carga del carrito).
- Etiquetas `<label>` en todos los campos.

## Responsive y rendimiento (RNF-03, RNF-04)

- Diseño mobile-first. Se verifica en 320, 375, 768, 1024 y 1440 px.
- Carga diferida de rutas (`lazy`) por panel de rol.
- Imágenes con `loading="lazy"`, `srcset`, WebP y dimensiones explícitas (evita saltos de diseño).
- Paginación del lado del servidor. TanStack Query con `staleTime` adecuado para el catálogo.
- Objetivo: primeros resultados del catálogo en menos de 3 s con "Slow 4G" en DevTools.

## Diseño visual (§15)

Paleta en tokens: `selva` (verde selva), `hoja`, `tierra` (marrón), `arena`, `ocre`, `terracota`, `blanco-calido` y `piedra` (gris). Tonos poco saturados. Las fotos de las piezas son protagonistas; la interfaz queda en segundo plano. La información cultural solo se muestra si existe un consentimiento vigente (el backend no la envía en caso contrario).

## Pruebas

- Componentes: Testing Library. Se consulta por rol o etiqueta, nunca por clase CSS.
- Hooks: Vitest + MSW para simular la API.
- E2E: Playwright para los 10 flujos de la especificación (§21).
