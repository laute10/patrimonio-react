import { IconoVolver, IconoCerrar } from "./Iconos";

// ==========================================================================
// PanelLateral - panel que se desliza desde la derecha (side panel).
// Reemplaza al patrón "panel.classList.toggle('panel--abierto')" que
// usábamos en cada archivo JS vanilla. Ahora es un componente genérico:
// recibe si está abierto, qué hacer al cerrarlo, un título y el
// contenido (formulario + botones) como children.
//
// Si se le pasa "onVolver", el header muestra una flecha "←" a la izquierda
// (para volver al panel anterior) y el título baja al cuerpo del panel,
// como en los paneles "Agregar/Editar consumo" del diseño en Figma.
// ==========================================================================

function PanelLateral({ abierto, titulo, descripcion, onCerrar, onVolver, children, acciones, extraHeader }) {
  return (
    <aside className={abierto ? "panel panel--abierto" : "panel"}>
      <div className="panel__header">
        {onVolver ? (
          <button type="button" className="panel__volver" onClick={onVolver} aria-label="Volver">
            <IconoVolver />
          </button>
        ) : (
          titulo && <h2 className="panel__titulo">{titulo}</h2>
        )}
        <div className="panel__header-derecha">
          {extraHeader}
          <button type="button" className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <IconoCerrar />
          </button>
        </div>
      </div>

      {onVolver && <h2 className="panel__titulo panel__titulo--cuerpo">{titulo}</h2>}

      {descripcion && <p className="panel__descripcion">{descripcion}</p>}

      {children}

      <div className="panel__acciones">{acciones}</div>
    </aside>
  );
}

export default PanelLateral;
