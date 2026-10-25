# Patrimonio (patrimonio-react)

Aplicación web de control de patrimonio personal: ahorros, tarjetas, gastos e ingresos diarios y estadísticas.
Proyecto final de **Programación 4** (Universidad Champagnat, prof. Ignacio G. Fontaine Digier). Autor: Lautaro Espejo.

- Repo: https://github.com/laute10/patrimonio-react (rama principal, Netlify republica solo con cada push)
- App publicada: https://patrimonio-react-laute.netlify.app
- Entorno del autor: Windows. Idioma de la interfaz y de los comentarios: español rioplatense (voseo: "Elegí", "Podés").

## Estado
- Entregadas: Ejercitación 3.1 (HTML/CSS/JS) y 4.1 (React). Lighthouse 100 en Accessibility y Best practices en las 9 pantallas.
- Hecho además: ventana de Ayuda, modo oscuro, categorías propias, 36 íconos para objetivos, íconos SVG de volver/cerrar, flujos de Figma (detalle de objetivos y movimientos, filtros).
- **Backend en pausa** hasta que el autor hable con el profesor (el examen final pide PHP + MySQL; las ejercitaciones 5.1/5.2 usan Node). No empezarlo sin que el autor lo confirme. Hoy los datos son simulados en `usePatrimonio` y se pierden al recargar; la autenticación es simulada.

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — compila (debe pasar sin errores antes de cada commit)
- `npm run lint` — oxlint (debe quedar sin errores)

## Reglas del curso (no romperlas)
- Solo herramientas vistas en el curso: React 19 + Vite. **Sin** React Router, Context, ni librerías de UI o de gráficos.
- Navegación por estado en `App` (usuario, paginaActual, parametros, ayudaAbierta, tema). Estado financiero levantado en el hook `usePatrimonio` (única fuente de verdad) y pasado por props.
- **Nada de manipulación directa del DOM** (sin document.querySelector, classList, etc.). Excepciones ya aprobadas: header fijo (sticky) y gráficos con SVG en línea.
- Mayúsculas solo con CSS (`text-transform`) en elementos de interfaz; el contenido se escribe en minúscula/normal.
- Componentes funcionales con hooks; un componente por archivo; props explícitas.
- Antes de usar `localStorage` o algo nuevo, tiene que estar dentro de lo visto en el curso (el tema oscuro ya usa localStorage con try/catch).

## Estructura
- `src/App.jsx` — raíz: sesión, navegación, tema (clase `tema-oscuro` en un div envolvente).
- `src/pages/` — Inicio, Movimientos, Ahorros, Tarjetas, Estadisticas, Configuracion, Login, CrearCuenta, Recuperar.
- `src/components/` — PanelLateral (con Overlay), Modal, PanelObjetivo, PanelMovimiento, PanelAyuda, SelectorIcono, SelectorCategoria, FormularioMovimiento, Iconos (SVG), etc.
- `src/hooks/usePatrimonio.js` — datos y reglas de negocio.
- `src/utils/formato.js` — formato de montos/fechas, íconos y categorías predeterminadas. `validacion.js` — validaciones.
- `src/index.css` — todos los estilos; colores en variables de `:root`, modo oscuro redefine las variables en `.tema-oscuro`. No usar colores fijos: crear/usar variables.
- `docs/` — planificación y árbol de componentes (actualizar al agregar componentes).

## Modelo financiero
- Patrimonio = Disponible + Ahorros + Reserva de tarjeta.
- Agregar/retirar ahorro = transferencia interna (no cuenta como ingreso ni gasto). "Utilizar" ahorro = gasto que baja el patrimonio.
- Un objetivo con dinero no se puede eliminar. La barra de progreso se corta en 100% pero el porcentaje puede superarlo.
- Los movimientos de ahorro y de tarjeta no se editan desde Movimientos; los de ingreso/gasto sí, pero no pueden dejar el disponible en negativo.

## Accesibilidad y calidad
- Mantener 100 en Lighthouse (Accessibility y Best practices). Probar con axe-core cuando se cambien pantallas.
- Contraste AA en ambos temas. Todo botón de ícono lleva `aria-label`. Los modales usan `role="dialog"` y `aria-modal`.
- Revisar siempre en 390 px de ancho (celular) y en escritorio, sin scroll horizontal.
- React reutiliza el mismo botón si está en la misma posición: usar `key` en fragmentos que cambian de acciones.

## Forma de trabajar con el autor
- Explicar paso a paso, sin suponer que ya sabe hacer algo (Windows, terminal, git).
- Antes de cambios grandes, resumir qué se va a tocar. Después de cada cambio: `npm run build` y `npm run lint`.
- Commits en español, claros y chicos. No tocar el README sin avisar (tiene el link de Netlify).
- Hay un `eslint.config.js` suelto que no es parte del proyecto: no agregarlo al commit.
