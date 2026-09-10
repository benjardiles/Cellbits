# Documentación de la Plataforma Cellbits

## 1. Resumen

`Cellbits` es una plataforma web de **inventario** construida con una arquitectura **modular y escalable**. El objetivo del proyecto es servir como base sobre la que se puedan agregar nuevos módulos (ventas, clientes, reportes, etc.) sin tener que reestructurar lo ya construido.

Actualmente están implementados el **módulo de inventario**, el **módulo de movimientos** y el **módulo de servicios técnicos**, que permiten:

- Añadir productos con sus especificaciones necesarias.
- Generar un **código QR por producto** para imprimir y pegar en el cajón o gaveta donde se guarda.
- **Escanear el QR desde el celular** y ver la información y la cantidad en stock del producto al instante.
- **Registrar cada entrada/salida de stock con motivo** (compra, venta, merma, corrección…) y consultar el **historial de movimientos**, tanto global como por producto.
- **Registrar servicios técnicos cobrados** (reparación, instalación, cambio de partes, diagnóstico), con seguimiento de estado (Recibido → … → Entregado), estado de pago, y repuestos usados que se descuentan automáticamente del inventario.

---

## 2. Pila tecnológica (stack)

| Capa         | Tecnología                              | Justificación                                                        |
| ------------ | --------------------------------------- | -------------------------------------------------------------------- |
| Backend      | Node.js + Express (estructura por módulos) | Ligero, maduro y fácil de escalar; separación clara de responsabilidades |
| Base de datos | SQLite (a través de `node:sqlite`)       | Cero instalación, archivo local; **migrable a PostgreSQL** después  |
| Autenticación | JWT (JSON Web Token) + bcrypt            | Sesión stateless, escalable horizontalmente                          |
| Frontend     | React (Vite) + React Router              | SPA rápida, componente reutilizable por página                        |
| QR           | `qrcode.react` (cliente) + URL pública  | El QR codifica una URL pública con la información del producto        |

**Decisión clave:** el proyecto usa *workspaces* de npm con dos paquetes independientes (`server` y `client`), de modo que frontend y backend pueden desplegarse/escalarse por separado.

---

## 3. Arquitectura

### 3.1 Estructura de carpetas

```
Cellbits/
├── package.json              # Raíz: gestiona server + client con workspaces
├── README.md                 # Guía rápida de instalación
├── server/
│   ├── .env                  # Variables de entorno (secreto JWT, admin, dominio)
│   ├── data/                 # Archivo SQLite (autogenerado)
│   └── src/
│       ├── server.js         # Punto de entrada (crea la app y escucha)
│       ├── app.js            # Bootstrap: middlewares globales + rutas + errores
│       ├── config/index.js   # Lee y valida variables de entorno
│       ├── db/
│       │   ├── connection.js # Conexión a SQLite (WAL, foreign keys)
│       │   ├── migrations.js # Migraciones versionadas de esquema
│       │   ├── seed.js       # Crea el usuario admin inicial
│       │   └── reset.js      # Borra la base de datos (útil en desarrollo)
│       ├── core/             # Infraestructura transversal
│       │   ├── errors.js     # Errores de dominio tipados (404, 401, 409…)
│       │   ├── http.js       # asyncHandler, validación Zod, handlers de error
│       │   └── auth.middleware.js # Firma y verificación de JWT
│       ├── modules/          # ★ Módulos de dominio (escalabilidad)
│       │   ├── auth/
│       │   │   ├── auth.routes.js
│       │   │   ├── auth.controller.js
│       │   │   ├── auth.service.js
│       │   │   └── auth.repository.js
│       │   ├── inventory/
│       │   │   ├── inventory.routes.js
│       │   │   ├── inventory.controller.js
│       │   │   ├── inventory.service.js
│       │   │   └── inventory.repository.js
│       │   ├── movements/        # ★ Historial de entradas/salidas de stock
│       │   │   ├── movements.routes.js
│       │   │   ├── movements.controller.js
│       │   │   ├── movements.service.js
│       │   │   └── movements.repository.js
│       │   └── services/         # ★ Servicios técnicos (reparación, instalación…)
│       │       ├── services.routes.js
│       │       ├── services.controller.js
│       │       ├── services.service.js
│       │       └── services.repository.js
│       ├── routes/index.js   # Registro único de módulos
│       └── shared/logger.js
└── client/
    ├── vite.config.js        # Proxy /api → backend (evita CORS en dev)
    └── src/
        ├── main.jsx / App.jsx  # Arranque y definición de rutas
        ├── api/                # Cliente HTTP por dominio (auth, inventory, movements, services)
        ├── context/AuthContext.jsx  # Estado de sesión
        ├── components/         # Layout, rutas protegidas, bits de UI (badges, etc.)
        ├── pages/              # Vistas de la aplicación (Movements*, Service*, etc.)
        └── utils/format.js     # Helpers (fechas, montos, badges de stock/movimiento/servicio)
```

### 3.2 Patrón por módulo (rutas → controlador → servicio → repositorio)

Cada módulo sigue la misma convención en 4 capas:

1. **Rutas** (`*.routes.js`): definen endpoints, validan entradas (Zod) y asignan el controlador.
2. **Controlador** (`*.controller.js`): solo maneja HTTP (recibe `req/res`). No tiene lógica de negocio.
3. **Servicio** (`*.service.js`): contiene la lógica de negocio (reglas, conflictos, normalización).
4. **Repositorio** (`*.repository.js`): único punto de acceso a la base de datos (SQL parametrizado).

Beneficios:

- **Responsabilidad única**: cada capa hace una sola cosa.
- **Aislar la base de datos**: si mañana cambias a PostgreSQL, solo se modifica la capa de repositorio y la conexión; servicios y controladores no cambian.
- **Reutilización**: el repositorio sirve a cualquier endpoint (ej. la consulta pública de QR usa `findById`).

### 3.3 Cómo agregar un módulo nuevo (ejemplo: ventas)

1. Crear `server/src/modules/sales/` con sus 4 archivos (routes, controller, service, repository).
2. Agregar la migración en `db/migrations.js`.
3. Registrar la ruta en `routes/index.js`:

```js
import { salesRoutes } from '../modules/sales/sales.routes.js';
router.use('/sales', salesRoutes);
```

4. (Opcional) Crear su carpeta en el frontend con sus páginas.

No hace falta tocar nada del resto del sistema.

> Los módulos `movements` y `services` (§4.1, §5, §8) son ejemplos reales de este patrón ya aplicado: se agregaron sin modificar `auth` y casi sin tocar `inventory` (solo el endpoint de ajuste de stock delega en `movementsService`, ver §4.3; `services` a su vez llama a `movementsService.register` para descontar repuestos, ver §4.4).

---

## 4. Base de datos

### 4.1 Esquema

```sql
users      (id, username UNIQUE, password_hash, created_at, updated_at)
categories (id, name UNIQUE, created_at)
products   (id TEXT PK, name, sku UNIQUE, description, quantity CHECK>=0,
            min_quantity, unit, location, category_id FK→categories,
            specs JSON, created_at, updated_at)
movements  (id TEXT PK, product_id FK→products (ON DELETE CASCADE),
            type CHECK IN ('entrada','salida','ajuste'), delta CHECK!=0,
            reason, quantity_before, quantity_after CHECK>=0,
            user_id FK→users (ON DELETE SET NULL),
            service_id FK→services (ON DELETE SET NULL, nullable), created_at)
services   (id TEXT PK, type CHECK IN ('reparacion','instalacion','cambio_partes',
            'diagnostico','otro'), customer_name, customer_phone, customer_email,
            device, description, status CHECK IN ('recibido','en_diagnostico',
            'en_reparacion','listo_para_entrega','entregado','cancelado'),
            payment_status CHECK IN ('pendiente','pagado'), price CHECK>=0 (CLP, entero),
            paid_at, user_id FK→users (ON DELETE SET NULL), created_at, updated_at)
service_notifications (id TEXT PK, service_id FK→services (ON DELETE CASCADE),
            status, message, channel CHECK IN ('pending','email','whatsapp'),
            sent_at, created_at)
```

### 4.2 Decisiones

- **SQLite en modo WAL**: permite lecturas concurrentes sin bloquear, con el archivo `cellbits.sqlite` en `server/data/`.
- **Migraciones versionadas**: en `_migrations` se registra qué migraciones ya se aplicaron; nunca se re-ejecutan. Para evolucionar el esquema, se añade un `CREATE TABLE...` / `ALTER...` al arreglo.
- **`specs` como JSON**: las especificaciones son dinámicas (`[{key: "Marca", value: "Apple"}, ...]`), así cada producto puede tener especificaciones distintas sin cambiar el esquema.
- **`id` de producto es un UUID** (generado en el servidor con `randomUUID()`), porque el código QR debe ser único y no adivinarle.
- **Consultas parametrizadas**: toda consulta usa sentencias preparadas, lo que previene inyección SQL.

### 4.3 Movimientos de stock (bitácora auditable)

- **Alcance**: `movements` es un **historial de entradas/salidas**, no un módulo de ventas con precios. Cada cambio de cantidad queda registrado con `type` (`entrada`/`salida`/`ajuste`), el `delta` aplicado, un `reason` obligatorio y quién lo hizo.
- **Un solo flujo de ajuste**: `PATCH /inventory/:id/quantity` (antes solo pedía `{delta}`) ahora exige `{type, delta, reason}` y delega en `movementsService.register`, que valida el stock resultante y crea el movimiento — no hay dos caminos distintos para mover stock. Para que esto sea cierto de verdad, `PUT /inventory/:id` (edición general del producto) **excluye explícitamente `quantity`** de su schema (`productSchema.omit({ quantity: true })` en `inventory.routes.js`) y `inventoryRepository.update()` ni siquiera acepta ese campo — antes era posible cambiar el stock silenciosamente desde "Editar producto" sin dejar rastro en `movements`; se corrigió (auditoría 2026-09-09, hallazgo crítico #1). La cantidad inicial solo se pide una vez, al crear el producto.
- **Atomicidad**: `movements.repository.createForAdjustment` actualiza `products.quantity` e inserta la fila de `movements` dentro de una misma transacción (`BEGIN`/`COMMIT`/`ROLLBACK`), para que el historial nunca pueda desincronizarse del stock real. Es la única excepción a "cada repositorio solo toca sus propias tablas", justificada por esa necesidad de atomicidad.
- **Consistencia tipo/signo**: `entrada` exige `delta > 0`, `salida` exige `delta < 0`; `ajuste` acepta cualquier valor distinto de cero (para correcciones de conteo en cualquier dirección).
- **Borrado en cascada**: si se elimina un producto, sus movimientos se eliminan automáticamente (`ON DELETE CASCADE`).

### 4.4 Servicios técnicos

Cellbits es un taller de reparación de celulares/computadores, así que además de vender productos se cobra por **mano de obra** (reparación, instalación, cambio de partes, diagnóstico). Un servicio no siempre tiene un producto asociado (ej. una instalación de software), por lo que **no encaja en la tabla `movements`** (exige `product_id` y un cambio de cantidad) — de ahí el módulo `services` separado.

- **Repuestos opcionales**: al crear un servicio se puede adjuntar una lista `parts: [{ productId, quantity }]`. `services.service.js` **fusiona líneas repetidas del mismo producto sumando sus cantidades** (`mergeParts`) antes de validar, para que dos líneas de "3" del mismo repuesto con solo 5 en stock se evalúen como una demanda de 6 y se rechacen — antes cada línea se validaba por separado y ambas pasaban, dejando un servicio creado a medias cuando la segunda fallaba al aplicarse (auditoría 2026-09-09, hallazgo alto #3). Ya fusionada y validada la demanda total, crea el servicio y llama a `movementsService.register(...)` por cada repuesto (tipo `salida`, motivo automático, `serviceId` vinculado). Así el consumo de repuestos queda visible tanto en el detalle del servicio como en `/movimientos` (columna "Servicio").
- **Moneda: CLP (peso chileno)**: `price` se valida y almacena como **entero** (`z.number().int()` en `services.routes.js`), porque el CLP no usa decimales/centavos. El frontend formatea con `formatMoney()` (`Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })`, ej. `$45.500`) y el input de precio usa `step="1"`. Si el negocio llegara a necesitar otra moneda, este es el único punto a tocar (validación + `formatMoney`).
- **Sin atomicidad estricta entre servicio y repuestos, con compensación si falla**: a diferencia de `movements` (que sí es una transacción única), crear el servicio y descontar cada repuesto son pasos secuenciales. Con la demanda ya validada de antemano (punto anterior), un fallo a mitad de camino solo puede venir de una condición de carrera real (ej. otra petición descontó stock del mismo repuesto en el instante entre la validación y el registro). Para ese caso, `create()` ahora captura el error, **revierte con movimientos de tipo `entrada` cada repuesto ya descontado** y borra el servicio recién creado, para nunca dejar un registro fantasma con stock a medio consumir.
- **Flujo de estados**: `recibido → en_diagnostico → en_reparacion → listo_para_entrega → entregado`, con `cancelado` disponible en cualquier momento. Se cambia con `PATCH /services/:id/status`, separado de la edición general (`PUT /services/:id`), igual que el patrón ya usado para el stock en `inventory`/`movements`.
- **Estado de pago con `paid_at`**: cambiar `paymentStatus` a `pagado` fija `paid_at` a la fecha actual (si no la tenía); volver a `pendiente` la limpia. Esto permite calcular ingresos "de hoy" / "del mes" de forma exacta en el panel, sin depender de `updated_at`.
- **Notificaciones al cliente — correo real conectado (2026-09-09), WhatsApp sigue pendiente**: cada vez que cambia el estado (incluida la creación, que registra el estado inicial `recibido`) se inserta una fila en `service_notifications` con el mensaje ya redactado (`"Hola {cliente}, el estado de "{equipo}" cambió a: {estado}."`) y `channel = 'pending'`.
  - **Envío por correo** (`server/src/modules/notifications/`): `notifications.worker.js` corre cada 60s (arrancado desde `server.js` al levantar el servidor) y procesa `service_notifications WHERE channel='pending' AND sent_at IS NULL` — solo las filas cuyo servicio tiene `customer_email`; las que no, quedan en `pending` para cuando se conecte WhatsApp. Envía con `nodemailer` (`notifications.mailer.js`) usando SMTP genérico, así que sirve tanto para Gmail (contraseña de aplicación) como para Resend (SMTP relay) sin cambiar código — solo configurar `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` en `server/.env` (ver `server/.env.example` para las dos opciones). **Si esas variables están vacías, el worker no arranca el intervalo y todo queda en `pending`** — no rompe el arranque del servidor. Verificado end-to-end contra una cuenta SMTP desechable (Ethereal): el correo se arma, envía y la fila pasa a `channel='email'` + `sent_at`.
  - ⚠️ Antes de activar SMTP real en producción, revisa si hay filas de prueba viejas en `service_notifications` (de datos de desarrollo) — al arrancar con SMTP configurado, el worker intenta enviar TODO lo que esté `pending` con correo de cliente, incluidas notificaciones de prueba antiguas. `npm run db:reset -w server` limpia la base si hace falta partir de cero.
  - **WhatsApp — pendiente, ver §10** (requiere WhatsApp Business Cloud API de Meta: Phone Number ID, token y una plantilla de mensaje aprobada).

---

## 5. API (endpoints)

Base URL: `http://localhost:4000/api`

| Método | Ruta                          | Autenticación | Descripción                                             |
| ------ | ----------------------------- | ------------- | ------------------------------------------------------- |
| GET    | `/health`                     | No            | Estado del servidor                                     |
| POST   | `/auth/login`                 | No            | Inicia sesión, devuelve `{ token, user }`               |
| GET    | `/auth/me`                    | Sí            | Devuelve los datos del usuario autenticado              |
| GET    | `/inventory`                  | Sí            | Lista productos (búsqueda, filtro stock bajo, paginado) |
| POST   | `/inventory`                  | Sí            | Crea un producto, devuelve `{ product, scanUrl }`       |
| GET    | `/inventory/dashboard`        | Sí            | Totales + stock bajo + recientes (panel)                |
| GET    | `/inventory/categories`       | Sí            | Lista de categorías con conteo de productos             |
| POST   | `/inventory/categories`       | Sí            | Crea una categoría                                      |
| GET    | `/inventory/:id`              | Sí            | Detalle de un producto                                  |
| PUT    | `/inventory/:id`              | Sí            | Actualiza datos de un producto (no acepta `quantity` — ver §4.3) |
| PATCH  | `/inventory/:id/quantity`     | Sí            | Ajusta stock y registra un movimiento (`{type, delta, reason}`), devuelve `{ product, movement }` |
| DELETE | `/inventory/:id`              | Sí            | Elimina un producto (borra sus movimientos en cascada)  |
| GET    | `/inventory/:id/qr`           | Sí            | Devuelve el payload del QR para el producto             |
| **GET**| **`/inventory/public/:id`**    | **No**        | **★ Consulta pública usada por el QR (info + stock)**   |
| GET    | `/movements`                  | Sí            | Historial de movimientos (filtros `search`, `type`, `productId`, `serviceId`, paginado) |
| GET    | `/services`                   | Sí            | Lista servicios (filtros `search`, `status`, `paymentStatus`, paginado) |
| GET    | `/services/dashboard`         | Sí            | Totales por estado, pagos pendientes, ingresos hoy/mes (panel) |
| GET    | `/services/:id`                | Sí            | Detalle: `{ service, parts, notifications }` (repuestos usados y cola de notificaciones) |
| POST   | `/services`                   | Sí            | Crea un servicio; `parts` opcional descuenta stock automáticamente |
| PUT    | `/services/:id`                | Sí            | Edita datos generales (cliente, equipo, precio, tipo, estado de pago) |
| PATCH  | `/services/:id/status`         | Sí            | Cambia el estado y registra una notificación pendiente   |
| DELETE | `/services/:id`                | Sí            | Elimina un servicio (sus movimientos quedan con `service_id = NULL`) |

**Público**: la única ruta de datos abierta es `/inventory/public/:id` (y la página `/scan/:id` del frontend), porque un QR pegado en un cajón debe poder consultarse sin iniciar sesión. El resto del inventario exige token.

Ejemplo de respuesta de creación:

```json
{
  "product": {
    "id": "b627d119-d734-46fb-8f5e-e1ca71a286dd",
    "name": "iPhone 13 128GB",
    "sku": "CEL-IPHONE-13",
    "quantity": 10,
    "minQuantity": 3,
    "unit": "unidad",
    "location": "Cajón B-12",
    "specs": [{ "key": "Marca", "value": "Apple" }],
    "categoryName": null
  },
  "scanUrl": "http://localhost:5173/scan/b627d119-d734-46fb-8f5e-e1ca71a286dd"
}
```

Ejemplo de ajuste de stock (`PATCH /inventory/:id/quantity`):

```json
// request
{ "type": "salida", "delta": -3, "reason": "Venta mostrador" }

// response
{
  "product": { "id": "b627d119-...", "quantity": 7, "...": "..." },
  "movement": {
    "id": "3f9a2e10-...",
    "productId": "b627d119-...",
    "type": "salida",
    "delta": -3,
    "reason": "Venta mostrador",
    "quantityBefore": 10,
    "quantityAfter": 7,
    "username": "admin",
    "createdAt": "2026-09-09 04:46:37"
  }
}
```

Ejemplo de creación de servicio (`POST /services`) con repuesto:

```json
// request
{
  "type": "cambio_partes",
  "customerName": "Juan Pérez",
  "customerPhone": "5511223344",
  "device": "iPhone 13 - pantalla rota",
  "price": 45000,
  "parts": [{ "productId": "c940c53f-...", "quantity": 1 }]
}

// response { service }
{
  "id": "0a3c246d-...",
  "status": "recibido",
  "paymentStatus": "pendiente",
  "price": 45000,
  "paidAt": null,
  "...": "..."
}
```

---

## 6. Seguridad (pilares aplicados)

| Medida                 | Dónde se aplica                                              |
| ---------------------- | ------------------------------------------------------------ |
| Contraseñas hasheadas  | `bcrypt` con salt de 12 rondas (`seed.js`)                    |
| Sesiones con JWT       | Token firmado con secreto de entorno (`JWT_SECRET`), expiración configurable |
| Headers de seguridad   | `helmet` elimina encabezados inseguros                        |
| Anti fuerza bruta      | `express-rate-limit`: 300 peticiones/15 min a `/api`          |
| Inyección SQL          | Solo sentencias preparadas (parámetros `?`)                   |
| Validación de entrada  | `zod` valida cuerpo y parámetros antes de llegar al servicio  |
| Errores controlados    | Manejador central devuelve JSON estructurado, evita filtrar trazas |
| Sin secretos en el código | Todo lo sensible vive en `server/.env` (gitignore)           |
| Puerta de acceso       | Todas las rutas de inventario exigen `Authorization: Bearer <token>`, salvo la pública del QR |

---

## 7. Flujo del código QR

```
[Admin añade producto]
        │
        ▼
POST /api/inventory ──► crea producto ──► devuelve scanUrl
        │                                   │
        ▼                                   ▼
/scan/:id   (público)                 /productos/:id/imprimir  (etiqueta)
        │                                   │
        ▼                                   ▼
Muestra nombre, stock,              Imprime el QR (window.print) y
ubicación y especificaciones        se pega en el cajón
        ▲                                   │
        └────────  el celular escanea el QR impreso  ──┘
```

- El QR **no contiene datos sensibles**: solo la URL de la página (incluye el id). La info se trae por API en el momento, así **siempre muestra el stock actualizado** y no una copia vieja impresa.
- `APPDOMAIN` en `server/.env` define el dominio que se incrusta en el QR. Para probar desde el celular en la misma red:

```env
APPDOMAIN=http://192.168.1.50:5173   # tu IP local
```

---

## 8. Frontend (React)

| Ruta                      | Función                                             | Acceso |
| ------------------------- | --------------------------------------------------- | ------ |
| `/login`                  | Inicio de sesión                                    | Público|
| `/`                       | Panel resumen (totales, stock bajo, recientes)      | Login  |
| `/inventario`             | Lista con búsqueda, filtro y paginado               | Login  |
| `/productos/nuevo`        | Formulario de alta (con especificaciones dinámicas) | Login  |
| `/productos/:id`          | Detalle + ajuste de stock + QR                      | Login  |
| `/productos/:id/editar`   | Edición (la cantidad se muestra solo de lectura; se ajusta desde el detalle) | Login  |
| `/productos/:id/imprimir` | Etiqueta QR imprimible                              | Login  |
| `/movimientos`            | Historial global de movimientos (búsqueda, filtro por tipo, filtro por producto/servicio vía `?productId=`/`?serviceId=`) | Login |
| `/servicios`              | Lista de servicios (búsqueda, filtro por estado y por pago) | Login |
| `/servicios/nuevo`        | Alta de servicio, con repuestos opcionales           | Login  |
| `/servicios/:id`          | Detalle: estado, pago, repuestos usados, notificaciones | Login |
| `/servicios/:id/editar`   | Edición de datos generales del servicio              | Login  |
| `/scan/:id`               | ★ Consulta pública del QR desde el celular          | Público|

Detalles implementados:

- **AuthContext** guarda el usuario y el token; el interceptor de Axios agrega el token a cada petición y, si recibe `401`, cierra la sesión.
- **Rutas protegidas**: `<ProtectedRoute>` redirige a `/login` si no hay sesión.
- **Ajuste de stock con motivo** desde el detalle del producto (entrada/salida + motivo obligatorio), que registra un movimiento.
- **Historial de movimientos** visible tanto en el detalle de cada producto (últimos 10, con link "Ver todo") como en la página global `/movimientos`.
- **Servicios técnicos**: alta con repuestos (selector de producto + cantidad, se valida y descuenta stock), cambio de estado desde el detalle, y una sección "Notificaciones al cliente" que muestra el mensaje generado por cada cambio de estado marcado como **"Pendiente de envío"** (el envío real aún no está conectado, ver §4.4).
- **Panel**: además de los totales de inventario, muestra servicios activos, pagos pendientes, ingresos de hoy/mes y los servicios más recientes.
- **Etiqueta imprimible** con CSS `@media print` que oculta la interfaz y solo imprime la etiqueta del QR.

### 8.1 Identidad de marca

- **Logo**: `client/src/assets/logo-cellbits.png` (512×512, generado a partir de `server/src/image/Logo redondo dorado.png` — el original es de 4500×4500 y no se usa directamente en la UI por peso). El favicon (`client/public/favicon.png`, 64×64) sale de la misma fuente. Se usa en el header (`Layout.jsx`), en `LoginPage`, y en el pie de la etiqueta imprimible (`PrintLabelPage`).
- **Paleta** (`client/src/styles/globals.css`): `--primary: #916014` (bronce, antes `#2563eb` azul) y `--primary-hover: #7a5010` son el color de acción en toda la app (botones, links, foco). El dorado claro de marca (`--gold: #cba44e`, `--gold-light: #f4cd79`) **no** se usa como texto sobre fondo claro — el contraste contra blanco es ~2.3:1 (falla WCAG AA, mínimo 4.5:1) — solo se usa sobre fondo negro (nav activo en el header) y como acento decorativo. `--brand-black: #000000` es el fondo del header, igual al del logo.
- **Tipografía**: Kanit (Google Fonts, cargada en `client/index.html`) para `h1`, `h2` y el wordmark "CellBits" (`.brand-word`). El resto del texto sigue en la fuente de sistema original, por legibilidad a tamaños chicos.
- Los colores semánticos (verde/ámbar/rojo de stock, movimientos, estado de servicio y pago) **no** cambiaron — son señales funcionales, no de marca.

### 8.2 Navegación (`Layout.jsx`)

- **Header** en negro (`--brand-black`) con el logo + wordmark, en vez del navy `#0f172a` anterior.
- **Botón de acción contextual**: en vez de un único "+ Añadir producto" fijo, `getQuickAction(pathname)` en `Layout.jsx` decide el botón según la sección — "+ Añadir producto" en `/inventario`·`/productos/*`, "+ Nuevo servicio" en `/servicios/*`, ninguno en Panel/Movimientos.
- **Breadcrumbs** (`client/src/components/Breadcrumbs.jsx`): reemplazan los links "← Volver" en páginas de detalle/edición/impresión (`ProductDetailPage`, `ProductFormPage`, `PrintLabelPage`, `ServiceDetailPage`, `ServiceFormPage`). Recibe `items: [{label, to?}]`; el último ítem (o uno sin `to`) se muestra como texto plano, no como link.
- **Menú móvil**: bajo 860px (`.header-nav-desktop`/`.header-actions-desktop` se ocultan vía media query en `globals.css`) el nav se colapsa a un botón hamburguesa (`.header-hamburger`) que abre un panel desplegable de ancho completo con los mismos 4 ítems + usuario + "Salir". Antes el nav no tenía ningún tratamiento responsive.

---

## 9. Cómo ejecutar el proyecto

Requisitos: **Node.js ≥ 22.5** (probado en v24). No requiere instalar nada más (el SQLite es nativo de Node).

```bash
npm run setup      # 1°) instala dependencias y crea el admin
npm run dev        # 2°) levanta API (:4000) y frontend (:5173) a la vez
```

Credenciales por defecto:

- Usuario: `admin`
- Contraseña: `admin123`

Otros comandos útiles:

| Comando                | Efecto                                      |
| ---------------------- | ------------------------------------------- |
| `npm run build`        | Compila el frontend para producción          |
| `npm run start`        | Sirve solo la API                           |
| `npm run db:reset`     | Borra la base de datos (desarrollo)         |
| `npm run db:seed`      | Recrea el usuario admin                     |

> ⚠️ **Antes de usar en producción**: cambia `JWT_SECRET` y `ADMIN_PASSWORD` en `server/.env`, y apunta `APPDOMAIN` al dominio real.

---

## 10. Estado del proyecto y siguientes pasos

**Hecho y verificado:**
- Login con JWT (verificado: login OK, sin token → 401).
- CRUD de productos con categorías y especificaciones dinámicas.
- Ajuste de stock y alertas de stock bajo.
- Generación de QR + página pública de escaneo (verificada sin autenticación).
- Compilación del frontend en modo producción (sin errores).
- **Módulo de movimientos** (histórico de entradas/salidas con motivo, tipo y usuario): verificado end-to-end vía API — entrada/salida ajustan stock correctamente, se rechaza salida que dejaría stock negativo, se rechaza motivo vacío, se rechaza delta con signo inconsistente con el tipo, filtros de historial (`productId`, `type`, `search`) funcionan, y los movimientos se borran en cascada al eliminar el producto. Frontend (`/movimientos`, historial en detalle de producto) compila sin errores.
- **Módulo de servicios técnicos** (reparación, instalación, cambio de partes, diagnóstico, con precio, cliente, equipo, estado y estado de pago): verificado end-to-end vía API — crear un servicio con repuestos descuenta el stock correctamente y queda vinculado en `/movimientos`, se rechaza stock insuficiente antes de crear nada, cambiar a un estado igual al actual se rechaza, marcar como pagado registra `paidAt` y se refleja en el dashboard (`paidTodayTotal`), y cada cambio de estado (incluida la creación) queda en `service_notifications` como pendiente de envío. Frontend (`/servicios`, alta, detalle, resumen en el Panel) compila sin errores. **No verificado visualmente en navegador** (sin herramienta de automatización de browser disponible en esa sesión) — solo build + pruebas de API.
- **Precios en CLP**: `price` de un servicio se valida como entero (sin decimales) tanto en creación como en edición; verificado que un precio con decimales (`15000.50`) es rechazado con 400 y uno entero (`15000`) se acepta. El frontend formatea todos los montos de servicios con `Intl.NumberFormat('es-CL', { currency: 'CLP' })`.
- **Auditoría de código (2026-09-09)**: revisión completa de seguridad/corrección/consistencia (ver `AUDITORIA.md` en la raíz del proyecto para el reporte completo). Se corrigieron los 3 hallazgos crítico/alto, todos verificados end-to-end tras el fix:
  1. *Crítico* — `PUT /inventory/:id` permitía cambiar `quantity` sin pasar por `movements`, dejando la bitácora con agujeros. Corregido: el campo se excluye del schema de edición; verificado que un PUT con `quantity` en el body ya no lo modifica.
  2. *Alto* — la paginación de `GET /inventory` estaba rota (`offset`/`limit` de la query string nunca se aplicaban porque llegaban como texto sin coerción). Corregido con `z.coerce.number()` en `inventory.routes.js`, igual que en `movements`/`services`; verificado con 25+ productos que offset=0 y offset=20 devuelven páginas distintas.
  3. *Alto* — líneas de repuestos duplicadas (mismo producto dos veces) en la creación de un servicio se validaban por separado y podían dejar un servicio creado a medias si la segunda línea fallaba. Corregido fusionando cantidades por producto antes de validar, más una compensación (reversión de stock + borrado del servicio) si aun así falla a mitad de camino por una condición de carrera real. Verificado: una demanda combinada que excede el stock se rechaza sin crear nada, y dos líneas del mismo repuesto dentro del stock disponible se fusionan en un solo movimiento.
  - Hallazgos medios/bajos del reporte (columna `price` sin `CHECK` de entero a nivel de BD, sin reversión de stock al borrar un servicio, credenciales por defecto en `.env`, CORS abierto, etc.) quedan pendientes — ver `AUDITORIA.md`.
- **Rediseño de navegación + identidad de marca (2026-09-09)**: ver §8.1/§8.2. Verificado en navegador (login, panel, inventario, detalle de producto, etiqueta imprimible, servicios, movimientos) y en un iframe de 390×844 para simular el menú móvil (el entorno de esta sesión no permite redimensionar la ventana real del navegador). `npm run build -w client` compila sin errores.

**Próximos pasos sugeridos (arquitectura ya preparada):**
1. **Notificaciones por correo — hecho y con credenciales reales (2026-09-10).** `server/.env` está configurado con Gmail (`cellbits.cl@gmail.com` + contraseña de aplicación), `SMTP_FROM=CellBits <cellbits.cl@gmail.com>`. Verificado con `transporter.verify()` (autenticación SMTP contra Gmail exitosa). Límite de Gmail directo: ~500 correos/día — si el volumen de servicios crece, migrar a Resend con dominio propio verificado (ver `server/.env.example`, opción B) sin tocar código, solo las variables de entorno.
2. **Notificaciones por WhatsApp — pendiente, dos caminos posibles, a decidir por el dueño:**
   - **API oficial de WhatsApp Business (Meta)** — la ruta estable/legítima. Requiere: cuenta de Meta Business Manager verificada, un número de teléfono dado de alta en la API, una plantilla de mensaje aprobada por Meta (los mensajes iniciados por el negocio fuera de una conversación de 24h deben usar plantilla) y un token de acceso (`Phone Number ID` + `access token`) guardado en `server/.env`. Tiene cuota gratuita (~1.000 conversaciones de servicio/mes al momento de escribir esto), pero la verificación inicial puede tardar días. Una vez aprobado: mismo patrón que el correo — un worker que lea `service_notifications WHERE channel='pending' AND sent_at IS NULL` (para las filas sin correo, o con preferencia de canal WhatsApp) y llame al endpoint de Cloud API por cada una.
   - **Librerías no oficiales** (whatsapp-web.js, Baileys) — gratis, sin aprobación, pero simulan una sesión de WhatsApp normal logueada por QR en un número real: van contra los términos de uso de WhatsApp, el número se puede banear, y se rompen con cada cambio de WhatsApp. No recomendado si se busca estabilidad.
   - Antes de implementar, decidir cuál camino tomar — cambia bastante el trabajo de configuración (aprobación de Meta vs. nada).
3. **Despliegue en producción — gratis pero estable, pendiente.** El backend usa `node:sqlite` (archivo local en `server/data/`), así que necesita un host con disco persistente — descarta hosting serverless puro (funciones de Vercel/Netlify borran el filesystem entre invocaciones). Plan sugerido:
   - **Frontend** (build estático de `npm run build -w client`) → Cloudflare Pages o Vercel (gratis, sin "dormirse").
   - **Backend** (Express + SQLite) → Fly.io, tier gratuito con volumen persistente para el `.sqlite` y sin el "sleep" de 15 min de inactividad que tiene Render free (ese sleep sería mala experiencia: un cliente escaneando el QR del producto tendría que esperar ~30-50s en el primer request tras inactividad).
   - Antes de publicarlo, pasar de valores de desarrollo a reales:
     - `JWT_SECRET` y `ADMIN_PASSWORD` (hoy son los de `.env.example`, ver auditoría hallazgo medio/bajo en §10 arriba).
     - Restringir CORS en `server/src/app.js` (hoy `cors({ origin: true })`, abierto a cualquier origen) al dominio real del frontend desplegado.
     - `APPDOMAIN` apuntando a la URL pública real — si no, los QR impresos codifican `localhost` y no funcionan fuera de la red local.
4. Exportación de reportes CSV/PDF (inventario, movimientos y/o servicios).
5. Migración a PostgreSQL en producción (solo repositorio + conexión) — necesaria si se descarta SQLite+volumen persistente a favor de un host puramente serverless.
6. Roles de usuario (admin, cajero/lector) aprovechando el JWT existente.