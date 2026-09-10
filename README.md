# Cellbits

Plataforma web modular de inventario. Backend Express + API modular, frontend React (Vite), base de datos SQLite con login JWT.

## Requisitos
- Node.js >= 22.5 (probado en v24)

## Instalación y arranque
```bash
npm run setup        # instala dependencias y crea el admin por defecto
npm run dev          # levanta API (http://localhost:4000) y frontend (http://localhost:5173)
```

## Acceso por defecto
- Usuario: `admin`
- Contraseña: `admin123`

Cambia la contraseña editando el `.env` del servidor (`ADMIN_PASSWORD`) o viaja a la configuración. **Cambia la contraseña antes de usarla en producción.**

## Estructura
```
server/src
├── app.js                 # bootstrap de Express (middlewares globales, rutas, errores)
├── server.js              # entry point
├── config/                # variables de entorno validadas
├── core/                  # errores centralizados, validación, middleware de auth
├── db/                    # conexión, migraciones, seed
├── modules/               # ← módulos de dominio (auth, inventory)
│   ├── <modulo>/
│   │   ├── *.routes.js    # definición de rutas
│   │   ├── *.controller.js# HTTP: req/res
│   │   ├── *.service.js   # lógica de negocio
│   │   └── *.repository.js# acceso a datos (aislado para cambiar de DB)
└── shared/                # utilidades transversales

client/src
├── api/                   # cliente HTTP tipado por dominio
├── context/               # autenticación
├── pages/                 # vistas (login, inventario, formulario, imprimir, escanear)
└── components/            # componentes reutilizables
```

## Página pública de escaneo
Cada producto genera un QR con la URL `{APPDOMAIN}/scan/:id`. Esa ruta es pública y solo muestra la información y stock de ese producto.

## Escalabilidad
- **Modular por dominio**: cada módulo (`auth`, `inventory`, ...) agrupa rutas → controlador → servicio → repositorio. Para agregar un módulo nuevo se replica la estructura sin tocar el resto.
- **Acceso a datos aislado**: el repositorio oculta SQLite; migrar a PostgreSQL implica cambiar solo la capa de repositorio/conexión.
- **API stateless con JWT**: los clientes se autentican por token, no hay sesiones en memoria (fácil de escalar horizontalmente).