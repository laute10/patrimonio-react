# Patrimonio (versión React)

Aplicación web para controlar el patrimonio personal: dinero disponible, ahorros, tarjetas de crédito, ingresos, gastos y estadísticas.
Proyecto final de **Programación 4** · Universidad Champagnat · Prof. Lic. Ignacio G. Fontaine Digier.

**Integrantes:** Lautaro Espejo

- 🌐 Aplicación publicada: https://patrimonio-react-laute.netlify.app
- 🎨 Prototipo en Figma: https://www.figma.com/design/mAGqEaUlhmfvLpwQLg1DWA/Design-System-Patrimonio
- 📄 Sitio anterior (HTML, CSS y JS, Ejercitación 3.1): https://github.com/laute10/patrimonio-web

## ¿Qué problema resuelve?

Muchas personas no saben cuánto dinero tienen realmente disponible porque parte está ahorrado y parte ya está comprometido con la tarjeta. Patrimonio muestra en una sola pantalla el patrimonio total, cuánto está disponible, cuánto hay ahorrado y cuánto está reservado para pagar tarjetas.

## Pantallas

| Pantalla | Qué permite |
|---|---|
| Iniciar sesión, Crear cuenta y Recuperar contraseña | Formularios con validación por campo (la verificación de la contraseña es simulada hasta tener backend) |
| Inicio | Ver el patrimonio, registrar gastos e ingresos y ver los últimos movimientos |
| Ahorros | Crear objetivos (ventana centrada), ver todos, detalle de cada objetivo (agregar, retirar, utilizar, editar, eliminar) |
| Tarjetas | Cargar consumos, cerrar y pagar períodos, filtrar el historial |
| Movimientos | Buscar y filtrar todos los movimientos |
| Estadísticas | Gráficos por período calculados con los movimientos reales |
| Configuración | Editar nombre y correo, ver preferencias y cerrar sesión con confirmación |

## Cómo ejecutarlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev       # modo desarrollo: http://localhost:5173
npm run build     # versión de producción en la carpeta dist/
npm run preview   # prueba local de la versión de producción
```

## Cómo está armado

- **Vite + React** con componentes funcionales y hooks. Sin librerías de componentes, sin frameworks de CSS y sin React Router.
- **Estado compartido:** el hook `usePatrimonio` vive en `App.jsx` y reparte los datos y las acciones a cada pantalla por props (patrón "levantar el estado").
- **Datos externos:** `usePatrimonio` pide `public/data/patrimonio.json` con `fetch` dentro de un `useEffect`. Mientras llegan los datos se ve "Cargando…" y, si falla la petición, un mensaje de error con un botón para reintentar. Ese JSON se puede reemplazar más adelante por una API propia.
- **Navegación y sesión:** dos estados en `App.jsx` (`usuario` y `paginaActual`) y renderizado condicional, sin React Router. Sin sesión se ven las pantallas de acceso; con sesión, las del menú.
- **Formularios controlados** con validación y un mensaje de error junto a cada campo.
- **Accesibilidad:** contraste AA, foco visible, enlace "Saltar al contenido", menú hamburguesa con `aria-expanded` y Esc, `aria-live` en avisos.

```
src/
├── App.jsx                     sesión, navegación y carga de datos
├── hooks/usePatrimonio.js      estado financiero + fetch con useEffect
├── utils/                      formato.js (montos y tipos), validacion.js (formularios)
├── components/                 Header, Footer, AuthLayout, Overlay, PanelLateral,
│                               CampoFormulario, EnlaceTexto, FormularioMovimiento,
│                               TarjetaMini, MovimientoItem, PanelGrafico, EstadoCarga
├── pages/                      Login, CrearCuenta, Recuperar, Inicio, Ahorros,
│                               Tarjetas, Movimientos, Estadisticas, Configuracion
└── index.css                   estilos migrados de la Ejercitación 3.1
public/data/patrimonio.json     datos de ejemplo (se piden con fetch)
```

## Planificación

El árbol de componentes, los componentes reutilizables y qué es estado y qué es props están en la carpeta `docs/` (`arbol-de-componentes.svg` y `planificacion.md`).

## Verificación (Lighthouse)

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

Después de agregar el detalle de objetivos y movimientos, los filtros y la ventana de crear objetivo, se revisaron esos paneles y ventanas con axe-core (el motor de accesibilidad de Lighthouse), en escritorio y en celular, sin violaciones.

`npm run build` termina sin errores y la consola del navegador no muestra errores ni advertencias, ni en modo desarrollo (donde React avisa de las `key` faltantes).

## Limitaciones conocidas

- Los datos se cargan desde un archivo JSON y los cambios no se guardan al recargar la página. En la unidad de Node.js ese archivo se reemplaza por una API propia.
- La sesión es simulada: cualquier correo con formato válido y una contraseña no vacía permite ingresar.
