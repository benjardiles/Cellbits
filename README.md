# Cellbits

Plataforma web modular de inventario. Backend Express + API modular, frontend React (Vite), base de datos SQLite con login JWT. Incluye módulos de inventario, movimientos de stock y servicios técnicos (ver `DOCUMENTACION.md` para el detalle completo).

## Requisitos
- Node.js >= 22.5 (probado en v24)

## Instalación y arranque (primera vez / colaboradores nuevos)
```bash
git clone git@github.com:benjardiles/Cellbits.git
cd Cellbits
npm run setup                        # instala dependencias y crea el admin por defecto
cp server/.env.example server/.env   # crea tu .env local (NO se sube a git)
npm run dev                          # levanta API (http://localhost:4000) y frontend (http://localhost:5173)
```

`server/.env` no está en el repositorio (está en `.gitignore` a propósito, porque ahí van claves reales). Cada persona que clone el proyecto necesita su propia copia a partir de `server/.env.example`:

| Variable | Para desarrollo local |
| --- | --- |
| `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Cualquier valor sirve, no necesita coincidir con el de nadie más |
| `APPDOMAIN` | `http://localhost:5173` funciona para desarrollo en tu propio equipo |
| `SMTP_*` | **Opcional.** Si lo dejas vacío, las notificaciones de servicio quedan en estado `pending` sin romper nada — para desarrollo normal no lo necesitas. Si necesitas probar el envío real de correos, pide las credenciales al dueño del proyecto por un canal seguro (nunca por un issue/PR/commit) |

## Acceso por defecto
- Usuario: `admin`
- Contraseña: `admin123`

Cambia la contraseña editando el `.env` del servidor (`ADMIN_PASSWORD`) o desde la app. **Cambia la contraseña antes de usarla en producción.**

## Estructura
```
server/src
├── app.js                 # bootstrap de Express (middlewares globales, rutas, errores)
├── server.js              # entry point (también arranca el worker de notificaciones)
├── config/                # variables de entorno validadas
├── core/                  # errores centralizados, validación, middleware de auth
├── db/                    # conexión, migraciones, seed
├── modules/               # ← módulos de dominio
│   ├── auth/
│   ├── inventory/
│   ├── movements/         # historial de entradas/salidas de stock
│   ├── services/          # servicios técnicos (reparación, instalación, etc.)
│   ├── notifications/     # envío de correo al cliente por cambio de estado
│   └── <modulo>/
│       ├── *.routes.js    # definición de rutas
│       ├── *.controller.js# HTTP: req/res
│       ├── *.service.js   # lógica de negocio
│       └── *.repository.js# acceso a datos (aislado para cambiar de DB)
└── shared/                # utilidades transversales

client/src
├── api/                   # cliente HTTP tipado por dominio
├── context/               # autenticación
├── pages/                 # vistas (login, inventario, movimientos, servicios, imprimir, escanear)
└── components/            # componentes reutilizables
```

Ver `DOCUMENTACION.md` para el detalle de arquitectura, endpoints y decisiones de diseño.

## Página pública de escaneo
Cada producto genera un QR con la URL `{APPDOMAIN}/scan/:id`. Esa ruta es pública y solo muestra la información y stock de ese producto.

## Escalabilidad
- **Modular por dominio**: cada módulo (`auth`, `inventory`, ...) agrupa rutas → controlador → servicio → repositorio. Para agregar un módulo nuevo se replica la estructura sin tocar el resto.
- **Acceso a datos aislado**: el repositorio oculta SQLite; migrar a PostgreSQL implica cambiar solo la capa de repositorio/conexión.
- **API stateless con JWT**: los clientes se autentican por token, no hay sesiones en memoria (fácil de escalar horizontalmente).