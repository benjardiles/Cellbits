# Auditoría de Cellbits

> Generada a partir de una revisión completa del código fuente actual (backend `server/src`, frontend `client/src`, migraciones y configuración). No es un repositorio git, por lo que esta auditoría cubre el estado completo del código, no un diff.
>
> Antes de reportar, se leyó `DOCUMENTACION.md` completo. Las siguientes decisiones de diseño **deliberadas** documentadas ahí **no se reportan como bugs**: la transacción manual en `movements.repository.createForAdjustment` (actualiza `products.quantity` e inserta el movimiento en una misma transacción, tocando una tabla de otro módulo a propósito, por atomicidad); la no-atomicidad entre la fila de `services` y los movimientos de stock que descuenta en `services.service.js` (se valida todo el stock por adelantado, trade-off consciente para no duplicar la lógica transaccional de `movements`); las notificaciones de `service_notifications` como solo registro/cola sin envío real (falta proveedor de email/WhatsApp); y los precios de servicios (`price`) validados y guardados como enteros en CLP.

---

## CRÍTICO

### 1. `PUT /inventory/:id` permite editar `quantity` directamente, saltándose por completo la bitácora de `movements`

- `server/src/modules/inventory/inventory.routes.js:15-30` — `productSchema` incluye `quantity`, y `productUpdateSchema = productSchema.partial()` conserva ese campo como editable en el PUT.
- `server/src/modules/inventory/inventory.repository.js:105-135` — `update()` hace `UPDATE products SET quantity = ? ...` sin pasar por `movementsService`.
- `server/src/modules/inventory/inventory.service.js:62-76` — `update()` solo valida el número (`ensureValidQuantity`), no crea movimiento ni exige motivo.
- `client/src/pages/ProductFormPage.jsx:99-109,157` — el formulario de edición (`/productos/:id/editar`) muestra "Cantidad actual" como input numérico editable normal y siempre envía `quantity` en el payload del PUT.

**Escenario:** un usuario abre "Editar producto" para corregir el nombre o el SKU, cambia (o le queda pre-cargado y luego edita) el campo "Cantidad actual" de 10 a 50, y guarda. El stock salta a 50 sin ningún registro en `movements`, sin motivo, sin usuario asociado — exactamente lo que el módulo `movements` fue creado para evitar. Esto contradice directamente lo documentado en §4.3: *"Un solo flujo de ajuste [...] no hay dos caminos distintos para mover stock"*. En la práctica sí hay dos caminos, y el segundo (PUT genérico) no deja rastro auditable. Es el hallazgo más grave porque rompe silenciosamente la garantía central del sistema (bitácora confiable) usando el flujo más natural para el personal no técnico.

---

## ALTO

### 2. Paginación de `GET /inventory` está rota: `offset`/`limit` de la query string nunca se aplican

- `server/src/modules/inventory/inventory.routes.js:35` — la ruta `GET /` no tiene `validate(schema, 'query')`, a diferencia de `movements.routes.js:17-26` y `services.routes.js:38-46` (que usan `z.coerce.number()`).
- `server/src/modules/inventory/inventory.service.js:26-36` — `const offset = Number.isInteger(query.offset) ? query.offset : 0;`. Como Express siempre entrega los query params como **strings**, `Number.isInteger("20")` es `false` siempre, así que `offset` cae a `0` en cada request, y `limit` siempre queda en `50` (el default), ignorando lo que el cliente pida.
- `client/src/pages/InventoryPage.jsx:24-37` — implementa correctamente botones "Anterior"/"Siguiente" que cambian `offset`, pero el backend los ignora.

**Escenario:** con más de 20 productos, el usuario hace clic en "Siguiente" en `/inventario`; la UI cambia de página visualmente pero el backend devuelve siempre los mismos primeros 50 productos (offset 0), por lo que nunca se ve la página 2 en adelante. Es justo el tipo de inconsistencia entre el módulo "original" (`inventory`) y los "nuevos" (`movements`/`services`) que se pidió comparar: estos últimos sí resuelven bien la query (con `z.coerce.number()` + fallback `parseInt`), `inventory` no.

### 3. Repuestos duplicados en `parts` al crear un servicio burlan la validación previa de stock y dejan el servicio en estado inconsistente

- `server/src/modules/services/services.service.js:22-32` — `validatePartsAvailability` valida **cada línea de `parts` de forma independiente** contra el stock actual en BD, sin sumar cantidades cuando el mismo `productId` aparece más de una vez.
- `server/src/modules/services/services.routes.js:13-16` — `partSchema` no exige `productId` único dentro del arreglo.
- `client/src/pages/ServiceFormPage.jsx:194-215` — la UI de "Añadir repuesto" permite seleccionar el mismo producto varias veces sin restricción.
- `server/src/modules/services/services.service.js:63-87` — `create()` inserta la fila de `services` y luego, en un loop, llama `movementsService.register` por cada parte.

**Escenario:** stock de "Pantalla iPhone 13" = 5. El usuario agrega dos líneas de repuesto con el mismo producto, cantidad 3 cada una. La validación previa aprueba ambas líneas (5 ≥ 3 en cada chequeo aislado), aunque la demanda real es 6 > 5. Se crea la fila de `services`, la primera llamada a `movementsService.register` descuenta 3 (queda 2) y confirma, la segunda falla (2-3 < 0) y lanza `ValidationError`. El `POST /services` responde con error al cliente, pero **el servicio ya quedó creado en la BD** con solo un repuesto descontado — un registro "fantasma" que el usuario no ve confirmado pero que sí existe y sí movió stock. Esto va más allá del trade-off documentado en §4.4 (que habla de una "condición de carrera muy improbable"): aquí no hace falta concurrencia, es 100% determinístico con una sola petición.

---

## MEDIO

### 4. El esquema de BD no aplica el invariante "precio entero" — solo Zod lo hace

- `server/src/db/migrations.js:78` — `price REAL NOT NULL DEFAULT 0 CHECK (price >= 0)`. La columna es `REAL` y el `CHECK` solo exige `>= 0`, no que sea entero. El invariante "CLP sin decimales" documentado en §4.4 depende exclusivamente de la validación Zod en `services.routes.js:26`. Cualquier futura ruta, script de migración de datos o acceso directo a la BD podría insertar `15000.5` sin que la base de datos lo impida.

### 5. Eliminar un servicio no devuelve el stock de los repuestos consumidos

- `server/src/modules/services/services.service.js:113-116` y `services.repository.js` `delete()` — al borrar un servicio, sus movimientos quedan con `service_id = NULL` (documentado), pero no se genera ningún movimiento compensatorio de `entrada` para restituir el stock descontado por los repuestos usados.

**Escenario:** se crea un servicio por error con un repuesto que descontó 2 unidades de stock; el usuario lo borra pensando "deshacer la operación", pero las 2 unidades siguen fuera del inventario permanentemente, sin aviso de esta consecuencia en la UI.

### 6. Fuerza bruta contra `/auth/login` con credenciales por defecto aún activas

- `server/src/app.js:23-30` — el único rate limit es el genérico (300 peticiones/15 min a todo `/api`, no específico de login).
- `server/.env:10-11` — el archivo `.env` real del proyecto (no solo el `.env.example`) todavía tiene `ADMIN_USERNAME=admin` / `ADMIN_PASSWORD=admin123`, y `JWT_SECRET=cellbits_dev_secret_change_me` (línea 6).

**Escenario:** 300 intentos/15 min es suficiente margen para probar contraseñas comunes contra el único usuario conocido (`admin`) sin bloqueo específico de login; combinado con que las credenciales de fábrica siguen en el `.env` activo, un despliegue que se suba a producción "tal cual" queda expuesto. (El README advierte de cambiarlas, pero el estado *actual* del `.env` es el que se auditó.)

### 7. CORS con `origin: true` (refleja cualquier origen)

- `server/src/app.js:16` — `cors({ origin: true, credentials: false })` acepta y refleja cualquier `Origin`. El riesgo práctico es bajo porque no se usan cookies (el JWT va en `localStorage`, no accesible cross-origin sin XSS), pero es una política más abierta de lo necesario para una API que solo debería ser consumida por el propio frontend.

---

## BAJO

### 8. `ProductDetailPage.loadMovements()` sin `.catch()`

- `client/src/pages/ProductDetailPage.jsx:32-38` — la cadena `movementsApi.list(...).then(...).finally(...)` no tiene `.catch()`. Si la petición falla (red, 401, etc.), queda una promesa rechazada sin manejar (warning en consola) y la sección de historial simplemente muestra "Sin movimientos registrados" en vez de un error, ocultando el fallo real al usuario.

### 9. `customerEmail`/`customerPhone` sin validación de formato en backend

- `server/src/modules/services/services.routes.js:21-22` — `customerEmail: z.string().trim().max(160)` no usa `.email()`. El frontend pone `type="email"` (`ServiceFormPage.jsx:165`), pero es trivialmente evitable (o el campo puede llegar vía API directa). Hoy no tiene impacto funcional porque no se envían notificaciones reales, pero quedará como deuda técnica cuando se conecte el envío real (§4.4 "próximos pasos").

### 10. Inconsistencia de `CHECK` entre columnas hermanas en `service_notifications`

- `server/src/db/migrations.js:99-109` — `channel` tiene `CHECK (channel IN ('pending','email','whatsapp'))` pero `status` (que replica los mismos valores que `services.status`) no tiene ningún `CHECK`. No es explotable hoy (siempre se inserta con `service.status` ya validado), pero es una asimetría de rigor entre columnas del mismo módulo nuevo, útil de corregir si se amplía el módulo.

### 11. `server/src/db/reset.js:2-3` — dos `import` separados del mismo módulo

```js
import { dbPath } from './connection.js';
import { db } from './connection.js';
```

Trivial, solo cuestión de limpieza (podría ser un único `import { db, dbPath } from './connection.js'`).

### 12. `services.service.js:58` — el detalle de un servicio limita repuestos mostrados a 100

- `getDetail()` llama `movementsService.list({ serviceId: id, limit: 100 })`. Un servicio con más de 100 líneas de repuestos (escenario extremadamente improbable en este dominio) truncaría silenciosamente la lista sin indicar que hay más.

### 13. Sin `app.set('trust proxy', ...)`

- `server/src/app.js` — si el proyecto se despliega detrás de un proxy/balanceador (Nginx, etc.), `express-rate-limit` y cualquier log de IP quedarían midiendo la IP del proxy en vez de la del cliente real. No aplica mientras corra standalone/LAN como está documentado en §9, pero es un punto ciego para cuando pase a producción real.

---

## Verificación de inyección SQL

Confirmado: **todas** las consultas en los cuatro repositorios (`auth`, `inventory`, `movements`, `services`) usan sentencias preparadas con parámetros `?`; los únicos fragmentos con interpolación de plantillas (`${where}`, `${patch.join(',')}`, `${PRODUCT_SELECT}`, etc.) construyen nombres de columna fijos o cláusulas `WHERE` a partir de literales controlados por el propio código, nunca con valores de usuario embebidos directamente. No hay XSS vía `dangerouslySetInnerHTML`/`innerHTML` en el frontend (React escapa todo el contenido de texto). El claim de la documentación §4.2/§6 se sostiene.

---

## Veredicto general

El proyecto tiene una arquitectura limpia y consistente para lo que se propone, con validación Zod sistemática, SQL parametrizado sin excepciones, y un módulo `movements` bien pensado como bitácora atómica. Sin embargo, el hallazgo crítico (#1) es serio: el endpoint de edición general de producto reabre exactamente el "segundo camino para mover stock" que el módulo `movements` fue diseñado para eliminar, dejando la bitácora auditable con agujeros silenciosos en el flujo de uso más común (editar un producto). Sumado a la paginación rota de `/inventory` (#2) y al hueco de validación de repuestos duplicados en servicios (#3), el estado de salud es de un proyecto sólido en sus fundamentos pero con retrocompatibilidad incompleta entre el módulo original (`inventory`) y los módulos añadidos después (`movements`/`services`) — los tres hallazgos de mayor severidad son, precisamente, lugares donde la integración entre módulos quedó a medias. Ninguno de estos requiere una reescritura: son fixes puntuales y acotados.
