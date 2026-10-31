# Patrimonio (patrimonio-react)

Aplicación web de control de patrimonio personal: ahorros, tarjetas, gastos e ingresos diarios y estadísticas.
Proyecto final de **Programación 4** (Universidad Champagnat, prof. Ignacio G. Fontaine Digier). Autor: Lautaro Espejo.

- Repo: https://github.com/laute10/patrimonio-react (rama principal, Netlify republica solo con cada push)
- App publicada: https://patrimonio-react-laute.netlify.app
- Entorno del autor: Windows. Idioma de la interfaz y de los comentarios: español rioplatense (voseo: "Elegí", "Podés").

## Estado
- Entregadas: Ejercitación 3.1 (HTML/CSS/JS) y 4.1 (React). Lighthouse 100 en Accessibility y Best practices en las 9 pantallas.
- Hecho además: ventana de Ayuda, modo oscuro, categorías propias, 36 íconos para objetivos, íconos SVG de volver/cerrar, flujos de Figma (detalle de objetivos y movimientos, filtros).
- **Backend en curso** (Ejercitación 5.1) en la rama `full-stack`: Node + Express en `backend/`, con lo visto en la unidad 5. Hechos los pasos 1 y 2 del plan: esqueleto y `GET /api/patrimonio`, que el frontend usa para la carga inicial (`src/utils/api.js`). Las escrituras siguen siendo locales y se pierden al recargar hasta migrar cada acción. `frontend/public/data/patrimonio.json` ya no se usa (se borra en la limpieza final). La autenticación sigue simulada.
- No mergear `full-stack` a `main` sin decidir antes dónde se publica la API: Netlify no ejecuta Node. Además, al mergear hay que cambiar en Netlify el "Base directory" a `frontend`.
- El README todavía tiene los comandos para correr la app desde la raíz: hay que actualizarlo (avisando antes al autor).
- Lista de control oficial de la 5.1: (1) todos los endpoints responden con el código correcto, también en errores; (2) una ruta inexistente devuelve 404 en JSON; (3) los cambios desde la interfaz se guardan en el JSON y siguen al reiniciar el servidor; (4) el frontend toma la API de `VITE_API_URL`; (5) sin errores en la consola del navegador ni en la terminal del servidor; (6) siguiendo el README otra persona puede clonar y ejecutar ambas partes; (7) se puede recorrer el user flow completo con datos reales.

## Comandos
El repo tiene dos partes, cada una con su `package.json` y su `node_modules`: `frontend/` y `backend/`. Los comandos se corren dentro de cada carpeta (`cd frontend` o `cd backend`).
- En `frontend/`: `npm run dev` (servidor de desarrollo), `npm run build` (debe pasar sin errores antes de cada commit), `npm run lint` (oxlint, debe quedar sin errores; revisa solo `frontend/`), `npm run arbol` (regenera `docs/arbol-de-componentes.svg`).
- En `backend/`: `npm run dev` (con `node --watch`) o `npm start`. Puerto desde `process.env.PORT`, 3000 por defecto.

## Reglas del curso (no romperlas)
- Solo herramientas vistas en el curso: React 19 + Vite. **Sin** React Router, Context, ni librerías de UI o de gráficos.
- Navegación por estado en `App` (usuario, paginaActual, parametros, ayudaAbierta, tema). Estado financiero levantado en el hook `usePatrimonio` (única fuente de verdad) y pasado por props.
- **Nada de manipulación directa del DOM** (sin document.querySelector, classList, etc.). Excepciones ya aprobadas: header fijo (sticky) y gráficos con SVG en línea.
- Mayúsculas solo con CSS (`text-transform`) en elementos de interfaz; el contenido se escribe en minúscula/normal.
- Componentes funcionales con hooks; un componente por archivo; props explícitas.
- Antes de usar `localStorage` o algo nuevo, tiene que estar dentro de lo visto en el curso (el tema oscuro ya usa localStorage con try/catch).
- Backend: solo Node + Express (módulos ES), `express.Router()`, controladores, middlewares y persistencia en un archivo JSON con `fs/promises`. **Sin** base de datos, **sin** librerías de validación (se valida a mano) y sin generadores de proyectos. Dependencias: solo `express` y `cors`.
- El frontend toma la dirección de la API de `VITE_API_URL` (en `.env`), nunca escrita a mano.

## Estructura
En la raíz solo están `CLAUDE.md`, `README.md`, `frontend/` y `backend/`. Las rutas `src/`, `public/`, `docs/` y `scripts/` de abajo son dentro de `frontend/`.
- `src/App.jsx` — raíz: sesión, navegación, tema (clase `tema-oscuro` en un div envolvente).
- `src/pages/` — Inicio, Movimientos, Ahorros, Tarjetas, Estadisticas, Configuracion, Login, CrearCuenta, Recuperar.
- `src/components/` — PanelLateral (con Overlay), Modal, PanelObjetivo, PanelMovimiento, PanelAyuda, SelectorIcono, SelectorCategoria, FormularioMovimiento, Iconos (SVG), etc.
- `src/hooks/usePatrimonio.js` — datos y reglas de negocio.
- `src/utils/formato.js` — formato de montos/fechas, íconos y categorías predeterminadas. `validacion.js` — validaciones.
- `src/index.css` — todos los estilos; colores en variables de `:root`, modo oscuro redefine las variables en `.tema-oscuro`. No usar colores fijos: crear/usar variables.
- `docs/` — planificación y árbol de componentes (actualizar al agregar componentes, con `npm run arbol`).
- `backend/src/index.js` — arma la app de Express: middlewares, rutas, 404 y errores.
- `backend/src/routes/` (un `express.Router()` por recurso), `controllers/`, `middlewares/` (registro, noEncontrado, manejoErrores), `data/` (archivo JSON), y más adelante `reglas/` (`efectoMovimiento`), `validaciones/` y `servicios/`.
- Errores de la API siempre en JSON: `{ "error": "mensaje en español" }`. Códigos: 200, 201, 204, 400, 404 y 500.

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
- Nunca ejecutar git push: lo hace el autor una vez por sesión de trabajo.
