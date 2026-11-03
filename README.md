# Patrimonio

Aplicación web para controlar el patrimonio personal: dinero disponible, ahorros, tarjetas de crédito, ingresos, gastos y estadísticas.
Proyecto final de **Programación 4** · Universidad Champagnat · Prof. Lic. Ignacio G. Fontaine Digier.

**Integrantes:** Lautaro Espejo

- 🎨 Prototipo en Figma: https://www.figma.com/design/mAGqEaUlhmfvLpwQLg1DWA/Design-System-Patrimonio
- 📊 Presentación: [COMPLETAR]
- 🌐 Versión anterior publicada (Ejercitación 4.1, solo interfaz): https://patrimonio-react-laute.netlify.app
- 📄 Sitio anterior (HTML, CSS y JS, Ejercitación 3.1): https://github.com/laute10/patrimonio-web

## ¿Qué problema resuelve?

Muchas personas no saben cuánto dinero tienen realmente disponible, porque una parte está ahorrada y otra ya está comprometida con la tarjeta. Patrimonio muestra en una sola pantalla el patrimonio total y cómo se reparte:

**Patrimonio = Disponible + Ahorros + Reserva de tarjeta**

- Registrar un ingreso o un gasto cambia el disponible.
- Agregar o retirar ahorro mueve dinero entre el disponible y un objetivo (el patrimonio no cambia). Utilizar un ahorro es un gasto real.
- Una compra con tarjeta pasa dinero del disponible a la reserva. Pagar el período sale de la reserva: el disponible no cambia y el patrimonio baja una sola vez.

## Cómo está armado

El repositorio tiene dos partes, cada una con su propio `package.json`:

- **`backend/`**: API con **Node.js y Express** (módulos ES). Usa `express.Router()`, controladores, middlewares y guarda los datos en un archivo JSON con `fs/promises`. Solo depende de `express` y `cors`; la validación está escrita a mano.
- **`frontend/`**: aplicación con **React + Vite**. Consume la API con `fetch` y toma la dirección de la variable `VITE_API_URL`.

## Cómo instalarlo y ejecutarlo

Requisitos: **Node.js 20 o superior** (probado con Node 24) y **Git**.

```bash
git clone -b full-stack https://github.com/laute10/patrimonio-react.git
cd patrimonio-react
```

Se necesitan **dos terminales**, una para cada parte.

**Terminal 1: backend**

```bash
cd backend
npm install
npm run dev
```

Queda escuchando en `http://localhost:3000`. La primera vez crea el archivo de datos y muestra `Se creó data/patrimonio.json a partir de la semilla.`
Para comprobar que anda, abrí `http://localhost:3000/api/salud`: tiene que responder `{"estado":"ok"}`.

- `npm run dev` reinicia el servidor solo al guardar un archivo (`node --watch`). `npm start` lo corre sin reinicio automático.
- El puerto sale de la variable `PORT` (3000 si no está definida). Para usar otro:
  - PowerShell: `$env:PORT=4000; npm run dev`
  - Bash: `PORT=4000 npm run dev`

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev
```

Abrí la dirección que muestra (normalmente `http://localhost:5173`). Para entrar, cualquier correo con formato válido y una contraseña no vacía.

**La dirección de la API (`VITE_API_URL`)**

El frontend no tiene la dirección de la API escrita en el código: la toma del archivo `frontend/.env`, que ya viene en el repositorio:

```
VITE_API_URL=http://localhost:3000/api
```

Si el backend corre en otro puerto o en otro servidor, cambiá ese valor y reiniciá `npm run dev` del frontend. En `frontend/.env.example` está el mismo ejemplo.

Si el backend está apagado, la aplicación muestra "No pudimos conectarnos con el servidor" y un botón **Reintentar**.

**Otros comandos del frontend:** `npm run build` (versión de producción en `dist/`), `npm run lint` (revisa el código) y `npm run preview` (prueba la versión de producción).

## Datos de ejemplo y cómo reiniciarlos

- `backend/src/data/semilla.json`: datos de ejemplo, incluidos en el repositorio. Las fechas se guardan como "días atrás" para que el ejemplo nunca quede viejo.
- `backend/src/data/patrimonio.json`: los datos reales. No está en el repositorio: se crea a partir de la semilla la primera vez que arranca el backend. Todos los cambios hechos desde la aplicación se guardan acá y siguen después de reiniciar el servidor.

Para **volver a los datos de ejemplo**:

1. Detené el backend (Ctrl + C en la terminal 1).
2. Borrá el archivo de datos:
   - PowerShell: `Remove-Item backend/src/data/patrimonio.json`
   - Bash: `rm backend/src/data/patrimonio.json`
3. Volvé a iniciar el backend con `npm run dev`: se crea de nuevo desde la semilla.

## API

Base: `http://localhost:3000/api`. Los cuerpos se envían en JSON (`Content-Type: application/json`).
Los errores siempre responden JSON con la forma `{ "error": "mensaje" }`. El `id` y la fecha de cada registro los pone el servidor.

**Códigos que usa la API:**
- **200**: salió bien.
- **201**: se creó algo.
- **204**: se eliminó, sin cuerpo.
- **400**: datos inválidos, o una regla que no se cumple (por ejemplo, dejar el disponible en negativo).
- **404**: no existe.
- **500**: error del servidor, sin detalles internos.

### General

| Método | Ruta | Qué hace | Códigos |
|---|---|---|---|
| GET | `/salud` | Comprueba que el servidor está andando | 200 |
| GET | `/patrimonio` | Todo el estado más los totales (disponible, ahorros, reserva y patrimonio) | 200 |
| (cualquiera) | ruta inexistente | Responde que la ruta no existe | 404 |

### Movimientos (recurso principal)

Desde acá se crean, editan y eliminan **ingresos y gastos**. Los movimientos de ahorro y de tarjeta se ven, pero se gestionan desde su propio recurso.

| Método | Ruta | Cuerpo | Qué hace | Códigos |
|---|---|---|---|---|
| GET | `/movimientos` | | Lista, del más reciente al más viejo. Filtros por query string (ver abajo) | 200, 400 |
| GET | `/movimientos/:id` | | Un movimiento | 200, 400, 404 |
| POST | `/movimientos` | `{ tipo, categoria, monto, descripcion? }` | Registra un ingreso o un gasto (`tipo`: `"ingreso"` o `"gasto"`) | 201, 400 |
| PUT | `/movimientos/:id` | `{ categoria, monto, descripcion? }` | Edita un ingreso o un gasto | 200, 400, 404 |
| DELETE | `/movimientos/:id` | | Elimina un ingreso o un gasto y deshace su efecto | 204, 400, 404 |

**Filtros de `GET /movimientos`** (todos opcionales y combinables):
- `tipo`: `ingreso`, `gasto`, `ahorro`, `tarjeta`, o un tipo exacto como `ahorro-usado`.
- `objetivoId`: id del objetivo de ahorro.
- `desde` y `hasta`: fechas `AAAA-MM-DD`, incluidas.
- `q`: búsqueda de texto en la categoría y la descripción, sin distinguir mayúsculas.

Ejemplo: `GET /movimientos?tipo=gasto&q=alquiler`

### Objetivos de ahorro

| Método | Ruta | Cuerpo | Qué hace | Códigos |
|---|---|---|---|---|
| GET | `/objetivos` | | Lista de objetivos | 200 |
| GET | `/objetivos/:id` | | Un objetivo | 200, 400, 404 |
| POST | `/objetivos` | `{ nombre, montoObjetivo, icono }` | Crea un objetivo (empieza en $0) | 201, 400 |
| PUT | `/objetivos/:id` | `{ nombre, montoObjetivo, icono }` | Edita el objetivo y renombra sus movimientos | 200, 400, 404 |
| DELETE | `/objetivos/:id` | | Elimina un objetivo (no se puede si todavía tiene dinero) | 204, 400, 404 |
| POST | `/objetivos/:id/movimientos` | `{ accion, monto, descripcion? }` | `accion`: `"agregar"`, `"retirar"` o `"usar"`. Responde el movimiento y el objetivo actualizado | 201, 400, 404 |

### Tarjetas

| Método | Ruta | Cuerpo | Qué hace | Códigos |
|---|---|---|---|---|
| GET | `/tarjetas` | | Lista de tarjetas con sus períodos y consumos | 200 |
| GET | `/tarjetas/:id` | | Una tarjeta | 200, 400, 404 |
| POST | `/tarjetas` | `{ nombre }` | Crea la tarjeta con su período abierto del mes actual | 201, 400 |
| POST | `/tarjetas/:id/consumos` | `{ categoria, monto, descripcion? }` | Agrega un consumo al período abierto (no puede superar el disponible) | 201, 400, 404 |
| PUT | `/tarjetas/:id/consumos/:consumoId` | `{ categoria, monto, descripcion? }` | Edita un consumo del período abierto | 200, 400, 404 |
| DELETE | `/tarjetas/:id/consumos/:consumoId` | | Elimina un consumo del período abierto; responde la tarjeta y el disponible nuevos | 200, 400, 404 |
| POST | `/tarjetas/:id/cierre` | | Cierra el período abierto y abre el del mes siguiente | 201, 400, 404 |
| POST | `/tarjetas/:id/periodos/:periodoId/pago` | | Paga un período cerrado | 201, 400, 404 |

### Categorías propias

Las categorías predeterminadas (Comida, Sueldo…) están en el frontend. Acá se guardan las que crea el usuario.

| Método | Ruta | Cuerpo | Qué hace | Códigos |
|---|---|---|---|---|
| GET | `/categorias` | | `{ gasto: [...], ingreso: [...] }` | 200 |
| POST | `/categorias` | `{ tipo, nombre }` | Crea una categoría (201). Si ya existe, no la duplica y responde 200 | 201, 200, 400 |
| DELETE | `/categorias/:tipo/:nombre` | | Elimina una categoría (no se puede si un movimiento o un consumo la usa) | 204, 400, 404 |

## Estructura

```
backend/
├── package.json             scripts dev y start
└── src/
    ├── index.js             arma la app: middlewares, rutas, 404 y errores; puerto desde PORT
    ├── routes/              un express.Router() por recurso
    ├── controllers/         qué hace cada endpoint y con qué código responde
    ├── middlewares/         registro (propio), noEncontrado (404) y manejoErrores (500)
    ├── validaciones/        validación de los datos de cada pedido, escrita a mano
    ├── reglas/              efectoMovimiento: cuánto cambia cada parte del patrimonio
    ├── servicios/           lectura y escritura del JSON, totales y ayudas
    └── data/                semilla.json (y patrimonio.json, que se crea al arrancar)

frontend/
├── .env                     VITE_API_URL
├── src/
│   ├── App.jsx              sesión y navegación
│   ├── hooks/usePatrimonio.js   estado financiero: cada acción llama a la API
│   ├── utils/api.js         pedir(): arma la dirección con VITE_API_URL y maneja los errores
│   ├── pages/               Inicio, Movimientos, Ahorros, Tarjetas, Estadisticas, Configuracion…
│   └── components/          paneles, modales, formularios y gráficos
└── docs/                    planificación, árbol de componentes y capturas de la API
```

## Pruebas de la API

Capturas de pedidos reales hechos con Thunder Client, en `frontend/docs/capturas-api/`:

| Captura | Qué muestra |
|---|---|
| `01-get-movimientos-200.png` | Lista de movimientos (200) |
| `02-get-movimiento-404.png` | Pedir un movimiento que no existe (404) |
| `03-post-movimiento-201.png` | Registrar un gasto (201) |
| `04-post-monto-texto-400.png` | Monto enviado como texto (400) |
| `05-post-sin-saldo-400.png` | Gasto mayor al disponible (400) |
| `06-put-movimiento-200.png` | Editar un movimiento (200) |
| `07-put-disponible-negativo-400.png` | Edición que dejaría el disponible en negativo (400) |
| `08-delete-movimiento-204.png` | Eliminar un movimiento (204) |
| `09-delete-movimiento-404.png` | Eliminar un movimiento que ya no existe (404) |
| `10-get-ruta-inexistente-404.png` | Ruta inexistente (404 en JSON) |
| `11-delete-categoria-en-uso-400.png` | Borrar una categoría que está en uso (400) |
| `12-delete-categoria-204.png` | Borrar una categoría sin uso (204) |

## Verificación (Ejercitación 4.1)

Medido con Lighthouse sobre la versión de producción (`npm run preview`), en escritorio y en celular (390 px). Iniciar sesión se midió con carga de página completa; las demás pantallas con el modo *snapshot* de Lighthouse, porque la aplicación no recarga la página al navegar.

| Pantalla | Accesibilidad | Buenas prácticas |
|---|---|---|
| Iniciar sesión | 100 | 100 |
| Crear cuenta | 100 | 100 |
| Recuperar contraseña | 100 | 100 |
| Inicio | 100 | 100 |
| Ahorros | 100 | 100 |
| Tarjetas | 100 | 100 |
| Movimientos | 100 | 100 |
| Estadísticas | 100 | 100 |
| Configuración | 100 | 100 |

El 2 de noviembre de 2026, con el backend ya integrado, se revisaron con axe-core (el motor de accesibilidad de Lighthouse) 94 estados de la aplicación: las seis pantallas, la Ayuda, cada panel lateral y cada ventana de confirmación, en tema claro y oscuro, y también a 390 px. No se encontraron violaciones.

## Limitaciones conocidas

- La sesión es simulada: cualquier correo con formato válido y una contraseña no vacía permite ingresar. Hay un solo conjunto de datos, compartido.
- Las categorías propias se crean desde el formulario, pero la aplicación no tiene una pantalla para borrarlas (se puede con `DELETE /api/categorias/...`).
