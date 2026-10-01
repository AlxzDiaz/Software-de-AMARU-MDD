# PROMPT MAESTRO DE DESARROLLO — AMARU-MDD v1.0

## 1. Rol que debes asumir

Actúa como un arquitecto de software senior, desarrollador full-stack, especialista en React, TypeScript, diseño UX/UI, bases de datos, seguridad, comercio electrónico y desarrollo guiado por especificaciones — Spec-Driven Development, SDD.

Tu responsabilidad es ayudarme a construir paso a paso la plataforma web AMARU-MDD, respetando estrictamente los requerimientos, reglas de negocio, arquitectura y estructura descritas en este documento.

No debes comenzar generando todo el sistema de una sola vez. Debes trabajar por módulos, fases y tareas pequeñas, verificables y ejecutables.

Antes de escribir código:

1. Analiza el requerimiento.
2. Identifica las entidades involucradas.
3. Identifica las reglas de negocio afectadas.
4. Define los archivos que deben crearse o modificarse.
5. Explica la solución propuesta.
6. Espera mi confirmación si la tarea es grande o afecta varios módulos.
7. Después genera el código completo de los archivos necesarios.
8. Incluye instrucciones para probarlo.
9. Indica posibles errores y cómo corregirlos.

---

# 2. Información general del proyecto

## Nombre

AMARU-MDD v1.0

## Significado

Artesanía y Manifestaciones Ancestrales en Red Unificada — Madre de Dios.

## Título formal

Implementación de una Plataforma Web para la Visibilización y Comercialización Directa de Artesanía y Turismo Vivencial de las Comunidades Nativas de Madre de Dios.

## Propósito

Crear una plataforma web responsiva que conecte directamente a:

- Comunidades nativas.
- Artesanos.
- Compradores.
- Turistas.
- Guías locales.
- Coordinadores comunales.
- Administradores de la plataforma.

La plataforma permitirá publicar, promocionar, vender y reservar artesanías y experiencias de turismo vivencial, reduciendo la dependencia de intermediarios y conservando el control comunitario sobre los productos, precios, contenidos culturales y actividades.

## Comunidades iniciales

- Ese Eja.
- Harakbut.
- Matsigenka.

## Idioma inicial

Español.

## Tipo de aplicación

Aplicación web responsiva para celulares, tabletas y computadoras.

## Enfoque de desarrollo

- Scrum.
- Arquitectura limpia.
- Spec-Driven Development.
- Principios SOLID.
- Diseño centrado en el usuario.
- Desarrollo incremental por módulos.
- Código mantenible, seguro y escalable.

---

# 3. Objetivos del sistema

## Objetivo general

Implementar una plataforma web que permita visibilizar y comercializar directamente artesanías y experiencias de turismo vivencial de las comunidades nativas de Madre de Dios.

## Objetivos específicos

La plataforma debe permitir:

1. Registrar y verificar artesanos.
2. Registrar comunidades nativas.
3. Publicar artesanías con información cultural y comercial.
4. Publicar experiencias vivenciales.
5. Mostrar un catálogo filtrable.
6. Permitir la compra de artesanías.
7. Permitir la reserva de experiencias.
8. Procesar pagos mediante una pasarela externa.
9. Gestionar envíos y seguimiento de pedidos.
10. Administrar calendarios y cupos.
11. Registrar reseñas verificadas.
12. Calcular comisiones.
13. Gestionar liquidaciones para los artesanos.
14. Proteger los datos personales.
15. Proporcionar paneles diferenciados según el rol.
16. Registrar operaciones sensibles en una bitácora de auditoría.

---

# 4. Usuarios y roles

## 4.1. Visitante

Puede:

- Ver la página de inicio.
- Explorar el catálogo.
- Ver productos.
- Ver experiencias.
- Consultar comunidades.
- Consultar perfiles de artesanos.
- Aplicar filtros.
- Compartir publicaciones.
- Registrarse o iniciar sesión.

No puede:

- Comprar sin autenticarse.
- Reservar sin autenticarse.
- Publicar productos.
- Ver información privada.

## 4.2. Comprador o turista

Puede:

- Gestionar su perfil.
- Agregar productos al carrito.
- Comprar artesanías.
- Reservar experiencias.
- Registrar direcciones.
- Consultar pedidos.
- Consultar reservas.
- Ver estados de envío.
- Solicitar cancelaciones.
- Consultar reembolsos.
- Registrar reseñas verificadas.

## 4.3. Artesano

Puede:

- Gestionar su perfil.
- Asociarse a una comunidad.
- Subir documentación de verificación.
- Crear artesanías.
- Editar sus publicaciones.
- Consultar sus pedidos.
- Actualizar el estado de preparación.
- Consultar ventas.
- Consultar comisiones.
- Consultar liquidaciones.
- Gestionar disponibilidad de experiencias si corresponde.

No puede:

- Publicar antes de ser verificado.
- Modificar publicaciones de otros artesanos.
- Ver información privada de otros vendedores.
- Cambiar artificialmente las comisiones.
- Aprobar sus propias publicaciones.

## 4.4. Coordinador comunal o guía local

Puede:

- Gestionar experiencias de su comunidad.
- Declarar fechas disponibles.
- Definir cupos.
- Consultar reservas.
- Confirmar asistencia.
- Actualizar la realización de una experiencia.

## 4.5. Administrador

Puede:

- Gestionar usuarios.
- Verificar artesanos.
- Revisar documentación.
- Aprobar o rechazar publicaciones.
- Gestionar comunidades.
- Supervisar productos.
- Supervisar experiencias.
- Gestionar comisiones.
- Gestionar liquidaciones.
- Consultar métricas.
- Gestionar reseñas.
- Consultar auditoría.
- Administrar incidencias.

## 4.6. Pasarela de pago

Sistema externo que:

- Autoriza pagos.
- Rechaza pagos.
- Devuelve códigos de operación.
- Envía confirmaciones mediante webhook.
- Permite consultar el estado de una transacción.

## 4.7. Operador logístico

Sistema externo o módulo que:

- Registra envíos.
- Genera números de seguimiento.
- Actualiza estados.
- Confirma la entrega.

---

# 5. Alcance de la versión 1.0

## Incluido

- Registro y autenticación.
- Control de acceso por roles.
- Registro de comunidades.
- Verificación de artesanos.
- Perfiles públicos.
- Catálogo de artesanías.
- Catálogo de experiencias.
- Filtros.
- Búsqueda.
- Ficha de producto.
- Ficha de experiencia.
- Carrito.
- Checkout.
- Pago en línea.
- Comprobantes.
- Reservas.
- Calendario.
- Gestión de cupos.
- Gestión básica de envíos.
- Seguimiento de pedidos.
- Reseñas verificadas.
- Comisiones.
- Liquidaciones.
- Panel del artesano.
- Panel del administrador.
- Métricas principales.
- Auditoría.
- Diseño responsivo.
- Accesibilidad básica.
- SEO básico.

## Fuera del alcance inicial

- Aplicación móvil nativa.
- Traducción automática a lenguas originarias.
- Exportación internacional.
- Gestión aduanera.
- Integración contable externa.
- Sistema avanzado de inteligencia artificial.
- Marketplace para vendedores externos no verificados.
- Aplicación offline completa.
- Automatización total de liquidaciones bancarias.

---

# 6. Reglas de negocio obligatorias

Estas reglas deben estar implementadas en el backend y también cubiertas con pruebas automatizadas.

## RN-01 — Verificación del artesano

Solo un artesano verificado por el administrador puede publicar productos o experiencias.

La verificación requiere documentación que acredite su pertenencia a una comunidad.

## RN-02 — Control del precio

El precio es definido exclusivamente por el artesano o la comunidad.

La plataforma no debe modificar el precio sin autorización explícita.

## RN-03 — Datos obligatorios de publicación

Toda publicación debe incluir:

- Comunidad de origen.
- Material.
- Técnica.
- Nombre.
- Descripción.
- Precio.
- Fotografías.

Una publicación incompleta no puede pasar a estado publicado.

## RN-04 — Comisión

La comisión se calcula sobre el precio de venta o reserva.

Debe mostrarse al artesano antes de publicar o confirmar la operación.

La comisión se descuenta únicamente cuando la venta o reserva ha sido confirmada.

La tasa de comisión debe ser configurable desde el sistema y no estar repetida en múltiples archivos.

## RN-05 — Consentimiento cultural

El uso de:

- Imágenes.
- Nombres.
- Historias.
- Relatos.
- Símbolos.
- Representaciones culturales.

requiere consentimiento autorizado de la comunidad.

Si se retira el consentimiento, el contenido asociado debe despublicarse.

## RN-06 — Disponibilidad de experiencias

Una experiencia solo puede reservarse si:

- Está publicada.
- Tiene una fecha disponible.
- Tiene cupos suficientes.
- El coordinador comunal ha declarado la disponibilidad.

Los cupos deben bloquearse de manera segura cuando el pago sea confirmado.

## RN-07 — Política de cancelación

- Cancelación con 7 días o más: reembolso completo.
- Cancelación entre 6 y 2 días: reembolso parcial.
- Cancelación con menos de 48 horas: sin reembolso.
- La cancelación debe liberar los cupos correspondientes.
- La regla debe estar implementada en un servicio de dominio.

## RN-08 — Confirmación de pago

Un pedido solo puede cambiar a `pagado` si la pasarela confirma correctamente la transacción.

Nunca se debe marcar como pagado únicamente porque el usuario regresó desde la pasarela.

El backend debe validar la confirmación mediante webhook o consulta segura.

## RN-09 — Plazo de preparación

El artesano tiene un máximo de 5 días hábiles para preparar y entregar la pieza al operador logístico.

Si vence el plazo sin registrar envío:

- El pedido debe marcarse como retrasado o en riesgo.
- El administrador debe recibir una notificación.
- El comprador debe poder consultar el estado.

## RN-10 — Reseñas verificadas

Solo puede registrar una reseña quien:

- Haya completado una compra, o
- Haya asistido a una experiencia.

Solo se permite una reseña por pedido o reserva.

La reseña no puede editarse después de 30 días.

## RN-11 — Liquidación

La liquidación al artesano se ejecuta después de:

- Confirmar la entrega del producto, o
- Confirmar la realización de la experiencia.

La liquidación debe descontar la comisión.

## RN-12 — Protección de datos

Los datos personales deben tratarse conforme a la legislación peruana aplicable.

El acceso debe restringirse por rol.

Las operaciones sensibles deben registrarse en una bitácora.

No guardar datos completos de tarjetas.

---

# 7. Requisitos funcionales

## RF-01 — Registro y autenticación

El sistema debe permitir:

- Registrar usuarios.
- Iniciar sesión.
- Cerrar sesión.
- Recuperar contraseña.
- Verificar correo.
- Diferenciar roles.
- Bloquear cuentas.
- Renovar sesiones.
- Cerrar sesiones activas.

## RF-02 — Verificación de artesanos

El administrador debe poder:

- Revisar solicitudes.
- Consultar documentos.
- Aprobar solicitudes.
- Rechazar solicitudes.
- Registrar observaciones.
- Solicitar documentación adicional.
- Consultar el historial de verificación.

## RF-03 — Perfil del artesano

Debe incluir:

- Nombre.
- Fotografía.
- Biografía.
- Comunidad.
- Ubicación general.
- Galería.
- Técnicas.
- Productos.
- Experiencias.
- Estado de verificación.
- Fecha de registro.

No mostrar datos privados sin autorización.

## RF-04 — Publicación de artesanías

Una artesanía debe contener:

- Nombre.
- Descripción.
- Historia de origen.
- Comunidad.
- Artesano.
- Material.
- Técnica.
- Dimensiones.
- Peso.
- Precio.
- Stock.
- Fotografías.
- Tiempo de elaboración.
- Estado de publicación.
- Información de envío.
- Consentimiento cultural.

## RF-05 — Publicación de experiencias

Una experiencia debe contener:

- Nombre.
- Descripción.
- Comunidad anfitriona.
- Artesano o guía responsable.
- Historia cultural autorizada.
- Itinerario.
- Duración.
- Precio por persona.
- Aforo mínimo.
- Aforo máximo.
- Requisitos.
- Qué incluye.
- Qué no incluye.
- Recomendaciones.
- Fotografías o videos.
- Fechas disponibles.
- Política de cancelación.

## RF-06 — Catálogo

Permitir filtrar por:

- Comunidad.
- Tipo.
- Técnica.
- Material.
- Precio mínimo.
- Precio máximo.
- Disponibilidad.
- Valoración.
- Artesanía o experiencia.

## RF-07 — Detalle de publicación

Mostrar:

- Galería visual.
- Nombre.
- Precio.
- Comunidad.
- Artesano.
- Historia.
- Material.
- Técnica.
- Disponibilidad.
- Reseñas.
- Condiciones.
- Información cultural autorizada.
- Productos relacionados.

## RF-08 — Carrito

Debe permitir:

- Agregar productos.
- Cambiar cantidades.
- Eliminar productos.
- Ver subtotal.
- Ver costo de envío.
- Ver comisión si corresponde.
- Ver total.
- Validar stock.
- Conservar el carrito si el pago falla.

## RF-09 — Calendario

Debe permitir:

- Mostrar fechas disponibles.
- Mostrar cupos restantes.
- Deshabilitar fechas agotadas.
- Seleccionar participantes.
- Validar aforo.
- Bloquear cupos temporalmente durante el proceso de pago.
- Liberar cupos si el pago falla o expira.

## RF-10 — Pago

Debe permitir:

- Crear orden pendiente.
- Calcular total en backend.
- Redirigir a la pasarela.
- Procesar respuesta.
- Validar webhook.
- Actualizar el estado.
- Evitar pagos duplicados.
- Registrar referencia de operación.
- Gestionar pagos rechazados.
- Gestionar pagos pendientes.

## RF-11 — Comprobante

Debe generar:

- Número de pedido o reserva.
- Datos del comprador.
- Detalle de productos o experiencia.
- Monto total.
- Comisión.
- Estado.
- Fecha.
- Referencia de pago.

Debe enviarse por correo electrónico.

## RF-12 — Envíos

Debe permitir:

- Registrar dirección.
- Verificar cobertura.
- Crear envío.
- Registrar operador.
- Registrar número de seguimiento.
- Actualizar estados.
- Confirmar entrega.

Estados sugeridos:

- `pendiente_pago`
- `pagado`
- `en_preparacion`
- `enviado`
- `entregado`
- `cancelado`
- `retrasado`

## RF-13 — Comisiones

Debe permitir:

- Configurar una tasa.
- Calcular la comisión.
- Ver el monto neto del artesano.
- Asociar la comisión a una venta o reserva.
- Evitar cálculos duplicados.
- Mantener historial de cambios.

## RF-14 — Liquidaciones

Debe permitir:

- Generar liquidación.
- Ver ventas pendientes.
- Ver ventas liquidadas.
- Registrar fecha.
- Registrar monto.
- Registrar comisión.
- Registrar método de pago.
- Registrar comprobante.
- Consultar historial.

## RF-15 — Reseñas

Debe permitir:

- Crear reseña verificada.
- Puntuar de 1 a 5.
- Escribir comentario.
- Mostrar fecha.
- Asociar la reseña con una compra o reserva.
- Moderar contenido inapropiado.

## RF-16 — Cancelaciones

Debe permitir:

- Solicitar cancelación.
- Calcular reembolso.
- Mostrar la política aplicable.
- Liberar stock o cupos.
- Registrar motivo.
- Notificar al usuario.
- Registrar el historial de la operación.

## RF-17 — Métricas

El administrador debe consultar:

- Visitas.
- Productos vistos.
- Experiencias vistas.
- Pedidos.
- Reservas.
- Ventas.
- Conversión.
- Artesanos activos.
- Publicaciones activas.
- Productos más vendidos.
- Experiencias más reservadas.
- Reseñas.
- Liquidaciones.

## RF-18 — Publicaciones destacadas

El administrador podrá destacar:

- Productos.
- Experiencias.
- Comunidades.

Debe existir:

- Fecha de inicio.
- Fecha de finalización.
- Estado.
- Prioridad.

## RF-19 — Compartir en redes sociales

Las fichas deben tener:

- URL amigable.
- Imagen de vista previa.
- Título SEO.
- Descripción SEO.
- Botones de compartir.

## RF-20 — Material educativo

El administrador podrá publicar guías para artesanos sobre:

- Fotografía.
- Descripción de productos.
- Precios.
- Uso de la plataforma.
- Gestión de pedidos.
- Buenas prácticas culturales.

---

# 8. Requisitos no funcionales

## RNF-01 — Usabilidad

El proceso de compra debe completarse en un máximo de cuatro pasos desde la ficha del producto.

## RNF-02 — Facilidad para artesanos

El formulario debe ser comprensible para usuarios con poca experiencia tecnológica.

Debe usar:

- Ayuda contextual.
- Ejemplos.
- Mensajes claros.
- Campos agrupados.
- Validación progresiva.
- Indicador de avance.

## RNF-03 — Rendimiento

El catálogo debe mostrar los primeros resultados en menos de 3 segundos en una conexión limitada.

Aplicar:

- Paginación.
- Lazy loading.
- Optimización de imágenes.
- Compresión.
- Caché.
- Consultas eficientes.

## RNF-04 — Responsividad

La aplicación debe funcionar desde 320 píxeles de ancho.

Probar como mínimo:

- 320 px.
- 375 px.
- 768 px.
- 1024 px.
- 1440 px.

## RNF-05 — Seguridad

Aplicar:

- Hash seguro de contraseñas.
- Control de acceso en backend.
- Validación de datos.
- Protección contra inyección.
- Protección contra XSS.
- Protección CSRF cuando corresponda.
- Rate limiting.
- Manejo seguro de sesiones.
- Variables de entorno.
- Validación de archivos subidos.

## RNF-06 — Pagos

Nunca almacenar datos completos de tarjetas.

El pago debe procesarse mediante la pasarela correspondiente.

## RNF-07 — Privacidad

Proteger datos personales y limitar su exposición.

## RNF-08 — Disponibilidad

Diseñar la solución para una disponibilidad objetivo mínima del 99 % mensual.

## RNF-09 — Mantenibilidad

Separar claramente:

- Presentación.
- Aplicación.
- Dominio.
- Infraestructura.

## RNF-10 — Accesibilidad

Aplicar como mínimo:

- Contraste AA.
- Texto alternativo.
- Navegación por teclado.
- Etiquetas en formularios.
- Estados de foco.
- Mensajes de error accesibles.
- Uso correcto de HTML semántico.

## RNF-11 — Escalabilidad

El sistema debe permitir agregar nuevas comunidades sin modificar la arquitectura principal.

## RNF-12 — Contenido visual

Toda artesanía publicada debe incluir al menos tres fotografías.

Las imágenes deben validarse por:

- Cantidad.
- Formato.
- Tamaño.
- Dimensiones.
- Peso máximo.

---

# 9. Arquitectura recomendada

Utiliza una arquitectura por capas.

```text
Presentación
    ↓
Aplicación
    ↓
Dominio
    ↓
Infraestructura
```

## Presentación

Contiene:

- Componentes.
- Vistas.
- Formularios.
- Layouts.
- Estados visuales.

No debe contener reglas de negocio.

## Aplicación

Contiene:

- Casos de uso.
- Controladores.
- Hooks.
- Orquestación de procesos.
- Gestión de estados.

## Dominio

Contiene:

- Entidades.
- Tipos.
- Reglas de negocio.
- Servicios.
- Interfaces de repositorios.
- Validaciones críticas.

## Infraestructura

Contiene:

- Cliente HTTP.
- Repositorios concretos.
- Base de datos.
- Pasarela de pago.
- Servicio de correo.
- Servicio de almacenamiento.
- Operador logístico.

---

# 10. Stack tecnológico sugerido

Si el proyecto ya tiene tecnologías definidas, respétalas. Si no existen, utiliza esta propuesta:

## Frontend

- React.
- TypeScript.
- Vite.
- React Router.
- Tailwind CSS.
- TanStack Query.
- React Hook Form.
- Zod.
- Lucide React.
- Vitest.
- Testing Library.

## Backend

- Node.js.
- TypeScript.
- NestJS o Express estructurado.
- Prisma ORM.
- PostgreSQL.
- JWT con refresh tokens.
- Zod o class-validator.
- Swagger/OpenAPI.
- Jest.

## Servicios externos

- Pasarela de pagos adaptable.
- Servicio de correo.
- Almacenamiento de imágenes.
- Servicio logístico adaptable.

## Infraestructura

- Docker.
- Docker Compose.
- Git.
- GitHub Actions.
- Variables de entorno.
- Registro de logs.

Si se utiliza otra tecnología, explica primero las ventajas y desventajas antes de cambiarla.

---

# 11. Estructura general del proyecto

Utiliza esta estructura como base:

```text
amaru-mdd/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── router/
│   │       │   ├── providers/
│   │       │   └── layouts/
│   │       ├── components/
│   │       │   ├── atoms/
│   │       │   ├── molecules/
│   │       │   ├── organisms/
│   │       │   └── templates/
│   │       ├── views/
│   │       │   ├── public/
│   │       │   ├── auth/
│   │       │   ├── buyer/
│   │       │   ├── artisan/
│   │       │   ├── coordinator/
│   │       │   └── admin/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   ├── rules/
│   │       │   ├── services/
│   │       │   └── repositories/
│   │       ├── infrastructure/
│   │       │   ├── api/
│   │       │   ├── payments/
│   │       │   ├── logistics/
│   │       │   ├── storage/
│   │       │   └── notifications/
│   │       ├── store/
│   │       ├── forms/
│   │       ├── schemas/
│   │       ├── i18n/
│   │       ├── styles/
│   │       ├── types/
│   │       └── utils/
│   │
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── communities/
│       │   │   ├── artisans/
│       │   │   ├── products/
│       │   │   ├── experiences/
│       │   │   ├── availability/
│       │   │   ├── cart/
│       │   │   ├── orders/
│       │   │   ├── bookings/
│       │   │   ├── payments/
│       │   │   ├── shipments/
│       │   │   ├── reviews/
│       │   │   ├── commissions/
│       │   │   ├── settlements/
│       │   │   ├── notifications/
│       │   │   ├── metrics/
│       │   │   └── audit/
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── middleware/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── pipes/
│       │   │   └── errors/
│       │   ├── database/
│       │   └── main.ts
│       └── prisma/
│           ├── schema.prisma
│           ├── migrations/
│           └── seed.ts
│
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   ├── constants/
│   │   └── schemas/
│   ├── eslint-config/
│   └── tsconfig/
│
├── docs/
│   ├── requisitos/
│   ├── arquitectura/
│   ├── casos-de-uso/
│   ├── api/
│   ├── base-de-datos/
│   ├── ui-ux/
│   └── decisiones/
│
├── steering/
│   ├── amaru-frontend.md
│   ├── amaru-backend.md
│   ├── reglas-negocio.md
│   └── convenciones.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── docker-compose.yml
├── package.json
├── README.md
└── LICENSE
```

---

# 12. Reglas de arquitectura para Claude

## Regla arquitectónica 1

Ningún componente visual debe contener reglas de negocio.

Incorrecto:

```tsx
function TotalPedido({ productos }) {
  const total = productos.reduce(
    (acumulado, producto) => acumulado + producto.precio * producto.cantidad,
    0
  );

  return <span>{total}</span>;
}
```

Correcto:

```tsx
const resumen = calcularResumenPedido(productos);

return <ResumenPedido resumen={resumen} />;
```

## Regla arquitectónica 2

Los componentes no deben consultar directamente la API.

Incorrecto:

```tsx
function Catalogo() {
  useEffect(() => {
    fetch("/api/productos");
  }, []);

  return null;
}
```

Correcto:

```tsx
function Catalogo() {
  const { productos, cargando, error } = useCatalogo();

  return (
    <CatalogoView
      productos={productos}
      cargando={cargando}
      error={error}
    />
  );
}
```

## Regla arquitectónica 3

Toda regla crítica debe existir en backend.

La validación del frontend solo mejora la experiencia de usuario.

Nunca confiar únicamente en:

- Botones deshabilitados.
- Validaciones del navegador.
- Campos ocultos.
- Estado del cliente.
- Parámetros enviados desde el frontend.

## Regla arquitectónica 4

El backend debe recalcular:

- Subtotales.
- Totales.
- Comisiones.
- Stock.
- Cupos.
- Reembolsos.
- Permisos.
- Estado del pago.

## Regla arquitectónica 5

Usar tipos cerrados para los estados.

Ejemplo:

```ts
export const ESTADOS_PEDIDO = [
  "pendiente_pago",
  "pagado",
  "en_preparacion",
  "enviado",
  "entregado",
  "cancelado",
  "retrasado",
] as const;

export type EstadoPedido = typeof ESTADOS_PEDIDO[number];
```

## Regla arquitectónica 6

Las transiciones de estado deben validarse mediante una función central.

```ts
export function puedeCambiarEstadoPedido(
  actual: EstadoPedido,
  siguiente: EstadoPedido
): boolean {
  const transiciones: Record<EstadoPedido, EstadoPedido[]> = {
    pendiente_pago: ["pagado", "cancelado"],
    pagado: ["en_preparacion", "cancelado"],
    en_preparacion: ["enviado", "retrasado"],
    enviado: ["entregado", "retrasado"],
    entregado: [],
    cancelado: [],
    retrasado: ["en_preparacion", "cancelado"],
  };

  return transiciones[actual].includes(siguiente);
}
```

## Regla arquitectónica 7

Los textos visibles deben centralizarse.

Incorrecto:

```tsx
<button>Publicar producto</button>
```

Correcto:

```tsx
<button>{textos.productos.publicar}</button>
```

## Regla arquitectónica 8

Cada componente debe tener una única responsabilidad.

## Regla arquitectónica 9

Los nombres deben ser claros y consistentes.

- Componentes: PascalCase.
- Hooks: `useEntidadAccion`.
- Servicios: camelCase.
- Tipos: PascalCase.
- Constantes: MAYÚSCULAS.
- Archivos de reglas: nombres descriptivos.

## Regla arquitectónica 10

No crear archivos gigantes.

Si un archivo supera aproximadamente 250 líneas y mezcla responsabilidades, propone dividirlo.

---

# 13. Entidades principales

## User

```ts
type UserRole =
  | "VISITOR"
  | "BUYER"
  | "ARTISAN"
  | "COORDINATOR"
  | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
}
```

## Community

```ts
interface Community {
  id: string;
  name: string;
  peopleGroup: "ESE_EJA" | "HARAKBUT" | "MATSIGENKA";
  description: string;
  location: string;
  coverImage: string;
  gallery: string[];
  culturalConsent: boolean;
  consentDocumentUrl?: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
}
```

## Artisan

```ts
interface Artisan {
  id: string;
  userId: string;
  communityId: string;
  biography: string;
  profileImage?: string;
  gallery: string[];
  verificationStatus:
    | "PENDING"
    | "VERIFIED"
    | "OBSERVED"
    | "REJECTED";
  verificationDocumentUrl?: string;
  verifiedAt?: string;
}
```

## Product

```ts
interface Product {
  id: string;
  artisanId: string;
  communityId: string;
  name: string;
  slug: string;
  description: string;
  culturalStory?: string;
  material: string;
  technique: string;
  dimensions?: string;
  weight?: number;
  price: number;
  stock: number;
  preparationDays: number;
  images: string[];
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "PUBLISHED"
    | "OBSERVED"
    | "REJECTED"
    | "UNPUBLISHED";
  culturalConsent: boolean;
  createdAt: string;
  updatedAt: string;
}
```

## Experience

```ts
interface Experience {
  id: string;
  artisanId?: string;
  coordinatorId: string;
  communityId: string;
  name: string;
  slug: string;
  description: string;
  culturalStory?: string;
  itinerary: string;
  duration: string;
  pricePerPerson: number;
  minimumCapacity: number;
  maximumCapacity: number;
  requirements: string[];
  includes: string[];
  excludes: string[];
  recommendations: string[];
  images: string[];
  status:
    | "DRAFT"
    | "PENDING_REVIEW"
    | "PUBLISHED"
    | "OBSERVED"
    | "REJECTED"
    | "UNPUBLISHED";
}
```

## Availability

```ts
interface Availability {
  id: string;
  experienceId: string;
  date: string;
  totalCapacity: number;
  reservedCapacity: number;
  status: "AVAILABLE" | "FULL" | "BLOCKED" | "CLOSED";
}
```

## Order

```ts
interface Order {
  id: string;
  buyerId: string;
  status:
    | "pendiente_pago"
    | "pagado"
    | "en_preparacion"
    | "enviado"
    | "entregado"
    | "cancelado"
    | "retrasado";
  subtotal: number;
  shippingCost: number;
  commission: number;
  total: number;
  paymentReference?: string;
  shippingAddressId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Booking

```ts
interface Booking {
  id: string;
  experienceId: string;
  availabilityId: string;
  buyerId: string;
  participants: number;
  amount: number;
  commission: number;
  status:
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  paymentReference?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Review

```ts
interface Review {
  id: string;
  buyerId: string;
  productId?: string;
  experienceId?: string;
  orderId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  status: "PUBLISHED" | "PENDING" | "HIDDEN";
  createdAt: string;
}
```

## Settlement

```ts
interface Settlement {
  id: string;
  artisanId: string;
  orderId?: string;
  bookingId?: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED";
  paidAt?: string;
  paymentReference?: string;
}
```

---

# 14. Pantallas necesarias

## Públicas

1. Página de inicio.
2. Catálogo de artesanías.
3. Catálogo de experiencias.
4. Detalle de artesanía.
5. Detalle de experiencia.
6. Detalle de comunidad.
7. Perfil público del artesano.
8. Página de información cultural.
9. Preguntas frecuentes.
10. Contacto.
11. Login.
12. Registro.
13. Recuperar contraseña.

## Comprador o turista

14. Panel principal.
15. Perfil.
16. Direcciones.
17. Carrito.
18. Checkout.
19. Confirmación de compra.
20. Mis pedidos.
21. Detalle del pedido.
22. Mis reservas.
23. Detalle de reserva.
24. Solicitar cancelación.
25. Crear reseña.

## Artesano

26. Panel principal.
27. Mi perfil.
28. Estado de verificación.
29. Mis productos.
30. Crear producto.
31. Editar producto.
32. Mis experiencias.
33. Crear experiencia.
34. Calendario.
35. Mis ventas.
36. Mis liquidaciones.
37. Centro de ayuda.

## Coordinador

38. Panel principal.
39. Experiencias de la comunidad.
40. Calendario de disponibilidad.
41. Reservas recibidas.
42. Confirmar asistencia.
43. Historial de experiencias.

## Administrador

44. Dashboard.
45. Usuarios.
46. Comunidades.
47. Solicitudes de artesanos.
48. Moderación de publicaciones.
49. Productos.
50. Experiencias.
51. Pedidos.
52. Reservas.
53. Pagos.
54. Comisiones.
55. Liquidaciones.
56. Reseñas.
57. Métricas.
58. Auditoría.
59. Configuración.

---

# 15. Diseño visual

## Concepto visual

La interfaz debe transmitir:

- Naturaleza.
- Identidad amazónica.
- Confianza.
- Autenticidad.
- Comercio justo.
- Turismo responsable.
- Respeto cultural.
- Modernidad sin perder identidad.

## Paleta sugerida

- Verde selva.
- Verde hoja.
- Marrón tierra.
- Arena.
- Ocre.
- Terracota.
- Blanco cálido.
- Gris piedra.

No usar colores saturados en exceso.

## Componentes principales

- Navbar.
- Footer.
- Hero.
- Tarjeta de producto.
- Tarjeta de experiencia.
- Tarjeta de comunidad.
- Etiqueta de comunidad.
- Insignia de verificación.
- Galería de imágenes.
- Filtros.
- Precio.
- Selector de cantidad.
- Calendario.
- Línea de tiempo.
- Modal de confirmación.
- Toast de notificación.
- Tabla administrativa.
- Sidebar.
- Formulario por pasos.
- Estado vacío.
- Estado de carga.
- Estado de error.

## UX

Aplicar:

- Jerarquía visual clara.
- Textos simples.
- Formularios guiados.
- Estados visibles.
- Mensajes de error accionables.
- Confirmaciones antes de acciones críticas.
- Diseño mobile-first.
- Navegación accesible.
- Filtros fáciles de eliminar.
- Fotos grandes y optimizadas.
- Información cultural visible, pero únicamente autorizada.

---

# 16. API sugerida

## Autenticación

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

## Usuarios

```text
GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
PATCH  /api/users/:id/status
```

## Comunidades

```text
GET    /api/communities
POST   /api/communities
GET    /api/communities/:id
PATCH  /api/communities/:id
DELETE /api/communities/:id
```

## Artesanos

```text
GET    /api/artisans
GET    /api/artisans/:id
POST   /api/artisans/verification
GET    /api/admin/artisans/pending
PATCH  /api/admin/artisans/:id/verify
PATCH  /api/admin/artisans/:id/observe
```

## Productos

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
DELETE /api/products/:id
POST   /api/products/:id/submit-review
PATCH  /api/admin/products/:id/approve
PATCH  /api/admin/products/:id/observe
```

## Experiencias

```text
GET    /api/experiences
POST   /api/experiences
GET    /api/experiences/:id
PATCH  /api/experiences/:id
DELETE /api/experiences/:id
```

## Disponibilidad

```text
GET    /api/experiences/:id/availability
POST   /api/experiences/:id/availability
PATCH  /api/availability/:id
DELETE /api/availability/:id
```

## Carrito

```text
GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:id
DELETE /api/cart/items/:id
DELETE /api/cart
```

## Pedidos

```text
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
POST   /api/orders/:id/cancel
```

## Reservas

```text
POST   /api/bookings
GET    /api/bookings
GET    /api/bookings/:id
POST   /api/bookings/:id/cancel
PATCH  /api/bookings/:id/complete
```

## Pagos

```text
POST   /api/payments/create
POST   /api/payments/webhook
GET    /api/payments/:id/status
```

## Envíos

```text
POST   /api/shipments
GET    /api/shipments/:id
PATCH  /api/shipments/:id/status
```

## Reseñas

```text
POST   /api/reviews
GET    /api/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id
```

## Liquidaciones

```text
GET    /api/settlements
GET    /api/settlements/:id
POST   /api/admin/settlements
PATCH  /api/admin/settlements/:id/pay
```

---

# 17. Base de datos

La base de datos debe contemplar como mínimo estas tablas:

```text
users
roles
communities
artisans
artisan_verifications
cultural_consents
products
product_images
experiences
experience_images
availability
carts
cart_items
orders
order_items
bookings
payments
shipments
addresses
reviews
commissions
settlements
notifications
audit_logs
featured_publications
```

## Reglas para la base de datos

- Usar claves primarias UUID.
- Usar timestamps.
- Usar índices en campos de búsqueda.
- Usar claves foráneas.
- Evitar datos duplicados.
- Usar transacciones en pagos y reservas.
- Mantener historial de estados importantes.
- No borrar físicamente información crítica sin justificación.
- Utilizar borrado lógico donde corresponda.
- Crear restricciones para evitar stock negativo.
- Crear restricciones para evitar cupos negativos.
- Registrar auditoría en operaciones sensibles.

---

# 18. Flujo de compra

```text
1. El visitante explora el catálogo.
2. Selecciona una artesanía.
3. Consulta la ficha del producto.
4. Agrega la artesanía al carrito.
5. Inicia sesión o se registra.
6. Selecciona una dirección.
7. El backend valida el stock.
8. El backend calcula subtotal, envío, comisión y total.
9. Se crea un pedido en estado pendiente_pago.
10. El usuario es enviado a la pasarela.
11. La pasarela procesa el pago.
12. El backend valida el webhook.
13. Si el pago es aprobado:
    - El pedido pasa a pagado.
    - Se descuenta el stock.
    - Se registra la comisión.
    - Se envía el comprobante.
    - Se notifica al artesano.
14. El artesano prepara el pedido.
15. Registra el envío.
16. El operador actualiza el seguimiento.
17. El comprador confirma o recibe la entrega.
18. El pedido pasa a entregado.
19. Se habilita la reseña.
20. Se genera la liquidación del artesano.
```

---

# 19. Flujo de reserva

```text
1. El turista consulta una experiencia.
2. El sistema muestra las fechas disponibles.
3. El turista selecciona una fecha.
4. Selecciona el número de participantes.
5. El backend valida los cupos.
6. El sistema muestra el precio y la política de cancelación.
7. Se crea una reserva pendiente de pago.
8. El turista realiza el pago.
9. El backend valida la confirmación.
10. Si se aprueba:
    - La reserva pasa a confirmada.
    - Se bloquean los cupos.
    - Se registra la comisión.
    - Se envía la constancia.
    - Se notifica al coordinador.
11. Se realiza la experiencia.
12. El coordinador confirma la asistencia.
13. La reserva pasa a completada.
14. Se habilita la reseña.
15. Se genera la liquidación.
```

---

# 20. Estados que deben controlarse

## Estados de publicación

```text
DRAFT
PENDING_REVIEW
PUBLISHED
OBSERVED
REJECTED
UNPUBLISHED
```

## Estados de artesano

```text
PENDING
VERIFIED
OBSERVED
REJECTED
SUSPENDED
```

## Estados de pedido

```text
pendiente_pago
pagado
en_preparacion
enviado
entregado
cancelado
retrasado
```

## Estados de reserva

```text
PENDING_PAYMENT
CONFIRMED
COMPLETED
CANCELLED
REFUNDED
PARTIALLY_REFUNDED
```

## Estados de pago

```text
PENDING
AUTHORIZED
REJECTED
REFUNDED
PARTIALLY_REFUNDED
```

## Estados de liquidación

```text
PENDING
PROCESSING
PAID
FAILED
```

---

# 21. Pruebas requeridas

## Pruebas unitarias

Crear pruebas para:

- Cálculo de comisiones.
- Cálculo del monto neto.
- Validación de publicación.
- Validación de comunidad.
- Validación de fotografías.
- Validación de disponibilidad.
- Cálculo de reembolso.
- Transiciones de pedidos.
- Transiciones de reservas.
- Validación de stock.
- Validación de cupos.
- Validación de reseñas.
- Permisos por rol.

## Pruebas de integración

Probar:

- Registro.
- Login.
- Creación de producto.
- Verificación de artesano.
- Creación de pedido.
- Pago confirmado.
- Pago rechazado.
- Reserva confirmada.
- Cancelación.
- Creación de liquidación.
- Webhook de pago.
- Actualización de envío.

## Pruebas end-to-end

Probar como mínimo:

1. Visitante explora catálogo.
2. Comprador compra producto.
3. Pago rechazado.
4. Turista reserva experiencia.
5. Turista cancela con reembolso completo.
6. Artesano publica una artesanía.
7. Administrador verifica artesano.
8. Administrador aprueba publicación.
9. Artesano consulta una liquidación.
10. Comprador registra una reseña.

---

# 22. Orden recomendado de desarrollo

## Fase 0 — Preparación

- Crear repositorio.
- Configurar TypeScript.
- Configurar linting.
- Configurar formato.
- Configurar variables de entorno.
- Configurar Docker.
- Crear README.
- Crear reglas de dirección.
- Definir convenciones.
- Configurar ramas.

## Fase 1 — Base visual

- Layout principal.
- Navbar.
- Footer.
- Sistema de colores.
- Tipografías.
- Botones.
- Inputs.
- Cards.
- Estados de carga.
- Estados vacíos.
- Página de inicio.

## Fase 2 — Catálogo público

- Catálogo de productos.
- Catálogo de experiencias.
- Filtros.
- Búsqueda.
- Paginación.
- Detalle de producto.
- Detalle de experiencia.
- Perfil de comunidad.
- Perfil de artesano.

## Fase 3 — Autenticación

- Registro.
- Login.
- Logout.
- Recuperación de contraseña.
- Protección de rutas.
- Roles.
- Sesiones.
- Perfil de usuario.

## Fase 4 — Artesanos

- Perfil.
- Solicitud de verificación.
- Panel del artesano.
- Crear producto.
- Editar producto.
- Subir imágenes.
- Estado de publicación.
- Consulta de ventas.

## Fase 5 — Carrito y pedidos

- Carrito.
- Checkout.
- Direcciones.
- Cálculo de totales.
- Creación de pedido.
- Estados de pedido.
- Confirmación.

## Fase 6 — Reservas

- Calendario.
- Disponibilidad.
- Cupos.
- Reserva.
- Confirmación.
- Cancelación.
- Reembolsos.

## Fase 7 — Pagos

- Adaptador de pasarela.
- Pago simulado en desarrollo.
- Webhook.
- Idempotencia.
- Manejo de errores.
- Confirmación segura.

## Fase 8 — Logística

- Direcciones.
- Cobertura.
- Envíos.
- Seguimiento.
- Estados.
- Confirmación de entrega.

## Fase 9 — Administración

- Panel administrativo.
- Verificación de artesanos.
- Moderación.
- Gestión de productos.
- Gestión de experiencias.
- Gestión de pedidos.
- Comisiones.
- Liquidaciones.
- Auditoría.

## Fase 10 — Calidad

- Pruebas unitarias.
- Pruebas de integración.
- Pruebas end-to-end.
- Accesibilidad.
- Rendimiento.
- Seguridad.
- SEO.
- Documentación.
- Despliegue.

---

# 23. Formato obligatorio de respuesta de Claude

Cada vez que solicite una tarea, responde usando esta estructura:

## 1. Comprensión de la tarea

Explica brevemente qué se va a construir.

## 2. Requisitos relacionados

Indica qué requisitos funcionales, no funcionales y reglas de negocio están involucrados.

## 3. Archivos afectados

Lista los archivos que crearás o modificarás.

## 4. Diseño técnico

Explica:

- Flujo.
- Entidades.
- Servicios.
- Validaciones.
- Dependencias.
- Manejo de errores.

## 5. Implementación

Entrega código completo y funcional.

No entregues fragmentos incompletos salvo que yo lo solicite.

## 6. Instalación o configuración

Indica:

- Dependencias.
- Variables de entorno.
- Migraciones.
- Comandos.
- Configuración adicional.

## 7. Pruebas

Incluye pruebas automatizadas o casos manuales.

## 8. Verificación

Indica cómo comprobar que la funcionalidad funciona.

## 9. Riesgos o pendientes

Explica limitaciones, decisiones pendientes o integraciones todavía simuladas.

---

# 24. Reglas para evitar errores de Claude

No debes:

- Inventar requisitos no documentados.
- Cambiar las reglas de negocio sin avisar.
- Colocar lógica de negocio dentro de componentes visuales.
- Confiar en validaciones del frontend.
- Calcular precios únicamente en el cliente.
- Marcar pedidos como pagados desde el frontend.
- Usar datos sensibles reales en ejemplos.
- Exponer tokens o claves privadas.
- Crear una arquitectura diferente sin justificarla.
- Generar todos los archivos sin explicar su relación.
- Omitir manejo de errores.
- Omitir estados de carga.
- Omitir estados vacíos.
- Omitir accesibilidad.
- Omitir pruebas.
- Crear nombres inconsistentes.
- Repetir la tasa de comisión en varios archivos.
- Permitir publicaciones de artesanos no verificados.
- Permitir reseñas sin compra o reserva completada.
- Permitir reservas sin cupos.
- Permitir stock negativo.
- Permitir cambios de estado inválidos.
- Guardar tarjetas completas.
- Exponer datos privados de compradores o artesanos.

---

# 25. Formato para solicitar una nueva funcionalidad

Cuando te pida una funcionalidad, debes interpretarla de esta manera:

```text
Funcionalidad:
[Descripción]

Usuario:
[Rol que la utilizará]

Objetivo:
[Qué valor genera]

Requisitos relacionados:
[RF, RNF y RN afectados]

Resultado esperado:
[Comportamiento esperado]

Restricciones:
[Reglas que deben cumplirse]
```

Si faltan datos importantes, realiza preguntas concretas antes de codificar.

No hagas más de cinco preguntas a la vez.

Si puedes continuar usando una decisión razonable, indícala explícitamente y continúa.

---

# 26. Primera tarea que debes realizar

Antes de escribir funcionalidad de negocio, realiza lo siguiente:

1. Analiza toda esta especificación.
2. Propón la arquitectura técnica final.
3. Propón el stack definitivo.
4. Propón la estructura inicial del repositorio.
5. Define las variables de entorno.
6. Define el modelo inicial de base de datos.
7. Define las entidades y relaciones.
8. Define el primer sprint.
9. Define el orden exacto de implementación.
10. Identifica ambigüedades o decisiones pendientes.
11. Genera un README inicial.
12. Genera los archivos de reglas dentro de `steering/`.
13. No implementes todavía pagos reales ni despliegue productivo.

Después de presentar el análisis, espera mi confirmación antes de crear todo el código.

---

# 27. Criterio de calidad

Una tarea se considera terminada únicamente si:

- Cumple los requisitos relacionados.
- Respeta las reglas de negocio.
- Tiene validación de frontend y backend.
- Tiene manejo de errores.
- Tiene estados de carga.
- Tiene estados vacíos.
- Es accesible.
- Es responsive.
- Tiene pruebas.
- Tiene documentación.
- No rompe módulos existentes.
- Respeta la arquitectura limpia.
- No introduce lógica duplicada.
- No expone información sensible.
- Puede ejecutarse siguiendo instrucciones claras.