# Planificación de la aplicación (Ejercitación 4.1, etapa 1)

## Árbol de componentes

Ver `arbol-de-componentes.svg`. `App` decide qué se ve según tres estados (`usuario`, `pantallaAcceso` para login / crear cuenta / recuperar, y `paginaActual`) y reparte los datos a cada pantalla por props.

## Componentes reutilizables (se escriben una sola vez)

| Componente | Qué resuelve | Dónde se usa |
|---|---|---|
| `CampoFormulario` | label + input/select + mensaje de error junto al campo | Acceso (3), Inicio, Ahorros, Tarjetas, Configuración |
| `PanelLateral` | panel que se desliza desde la derecha con título, contenido y acciones | Inicio, Ahorros, Tarjetas, Configuración |
| `Overlay` | fondo oscuro detrás de paneles y modales | Inicio, Ahorros, Tarjetas, Configuración |
| `Modal` | ventana centrada con fondo oscuro (crear objetivo y confirmaciones) | Ahorros, Panel de objetivo, Panel de movimiento |
| `TarjetaObjetivo` | tarjeta clickeable de un objetivo con su barra de progreso | Ahorros (resumen y "Todos los objetivos") |
| `SelectorIcono` | botón que despliega la grilla de íconos | Crear y editar objetivo |
| `PanelObjetivo` | detalle del objetivo y sus acciones (agregar, retirar, utilizar, editar, eliminar) | Ahorros |
| `PanelMovimiento` | detalle de un movimiento; editar y eliminar si es ingreso o gasto | Movimientos |
| `TarjetaMini` | cifra con etiqueta y color (Disponible, Ahorros, Tarjeta) | Inicio (3 veces) |
| `MovimientoItem` | una fila de la lista de movimientos | Inicio (lista) |
| `EnlaceTexto` | botón con aspecto de enlace para cambiar de pantalla | Acceso (3) |
| `AuthLayout` | marco común de las pantallas de acceso | Acceso (3) |
| `Header` | barra de navegación; en celular, menú hamburguesa; botón "Ayuda" | App |
| `Footer` | pie de página común | App, AuthLayout |
| `EstadoCarga` | pantalla de "cargando" o de error mientras llegan los datos | App |
| `FormularioMovimiento` | formulario controlado de gasto o ingreso (mismo componente, cambia por props) | Inicio, Panel de movimiento |
| `SelectorCategoria` | lista de categorías con "Nueva categoría…" para crear una propia | Formulario de movimiento, Tarjetas |
| `PanelGrafico` | caja con título que envuelve cada gráfico | Estadísticas (4 veces) |
| `PanelAyuda` | panel lateral con preguntas frecuentes (cada una es un `<details>`) | App (desde el menú) |
| `Iconos` | íconos SVG en línea (volver, cerrar, avanzar, menú, flecha); toman el color del botón | Header, Modal, PanelLateral, PanelObjetivo, SelectorIcono, Ahorros, Movimientos |

## Datos y estado

**Estado (cambia mientras se usa la aplicación)**

| Estado | Vive en | Para qué |
|---|---|---|
| `usuario` | `App` | hay sesión o no; datos de la cuenta |
| `paginaActual`, `pantallaAcceso` | `App` | qué pantalla se muestra (sin Router) |
| `parametros` | `App` | filtros que una pantalla le pasa a otra al navegar |
| `ayudaAbierta` | `App` | si se ve el panel de Ayuda |
| `tema` | `App` | modo claro u oscuro (se recuerda en `localStorage`) |
| `disponible`, `objetivos`, `tarjetas`, `movimientos` | `usePatrimonio` (usado en `App`) | datos financieros: datos de ejemplo pedidos con `fetch` a `public/data/patrimonio.json`; los cambios viven solo en memoria (se pierden al recargar) |
| `categoriasPropias`, `categoriasIngresoPropias` | `usePatrimonio` | categorías de gasto e ingreso creadas por el usuario |
| `cargando`, `error` | `usePatrimonio` | pantalla de carga / de error |
| `periodoId` | `Estadisticas` | período que muestran los gráficos |
| `menuAbierto` | `Header` | menú hamburguesa en celular |
| `panelAbierto`, `modal` | cada pantalla | qué panel o modal está abierto |
| campos y errores del formulario | cada formulario | formularios controlados |
| filtros y búsqueda | `Movimientos`, `Tarjetas` | filtrar la lista |

**Props (pasan de un componente a otro)**

- `App` → pantallas: los datos (`movimientos`, `objetivos`, `tarjetas`, totales) y las acciones (`registrarGasto`, `crearObjetivo`, `pagarPeriodo`…).
- Pantalla → `PanelLateral`: `abierto`, `titulo`, `onCerrar`, `acciones`, y el formulario como `children`.
- Pantalla → `CampoFormulario`: `etiqueta`, `valor`, `onCambio`, `error`, `opciones`.
- `Inicio` → `TarjetaMini`: `etiqueta`, `monto`, `variante`.


## Conexiones entre pantallas (agregado)

- `App` guarda `parametros` y la función `navegar(pagina, parametros)`: así una pantalla abre otra ya filtrada (por ejemplo, Ahorros → Movimientos con tipo "ahorro" y el objetivo elegido, o Movimientos → Ahorros con el detalle del objetivo abierto).
- Ahorros tiene dos vistas por estado (`resumen` y `todos`) y abre `PanelObjetivo` con `objetivoAbiertoId`.
- Crear objetivo es un `Modal` centrado; el detalle, editar y los movimientos de dinero son paneles laterales.
- Movimientos tiene filtros aplicados (tipo, objetivo, fechas) y un borrador en la tarjeta de filtros que se aplica con el botón.
- Reglas: no se elimina un objetivo con dinero; los movimientos de ahorros y tarjetas se gestionan desde su pantalla; editar o eliminar un ingreso/gasto no puede dejar el disponible en negativo.


## Modo oscuro

- `App` guarda el estado `tema` ("claro" | "oscuro"), lo recuerda en `localStorage` (dentro de try/catch) y envuelve la aplicación en `<div className="app tema-oscuro">`.
- Todos los colores salen de variables CSS en `:root`; la clase `.tema-oscuro` solo redefine esas variables (misma familia slate, textos de acento más claros para mantener contraste AA).
- El selector está en Configuración › Preferencias › Apariencia. Verificado con axe-core en ambos temas (0 violaciones).


## Ventana de Ayuda

- Se abre desde "Ayuda" en el menú; `App` guarda el estado `ayudaAbierta`.
- `PanelAyuda` usa `PanelLateral` y muestra preguntas frecuentes, cada una en un `<details>` que se despliega con el navegador, sin JavaScript.
- No tiene estado propio: recibe `abierto` y `onCerrar` por props.


## Datos (estado actual)

- No hay backend: el inicio de sesión es simulado y los datos de ejemplo salen de `public/data/patrimonio.json`.
- El backend está en pausa hasta definir con el profesor si se hace con PHP + MySQL o con Node.
