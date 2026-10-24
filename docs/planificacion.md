# Planificación de la aplicación (Ejercitación 4.1, etapa 1)

## Árbol de componentes

Ver `arbol-de-componentes.svg`. `App` decide qué se ve según dos estados (`usuario` y `paginaActual`) y reparte los datos a cada pantalla por props.

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

## Datos y estado

**Estado (cambia mientras se usa la aplicación)**

| Estado | Vive en | Para qué |
|---|---|---|
| `usuario` | `App` | hay sesión o no; datos de la cuenta |
| `paginaActual`, `pantallaAcceso` | `App` | qué pantalla se muestra (sin Router) |
| `disponible`, `objetivos`, `tarjetas`, `movimientos` | `usePatrimonio` (usado en `App`) | datos financieros, cargados con `fetch` |
| `cargando`, `error` | `usePatrimonio` | pantalla de carga / de error |
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
