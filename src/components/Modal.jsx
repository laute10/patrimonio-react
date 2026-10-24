import Overlay from "./Overlay";

// ==========================================================================
// Modal - ventana centrada sobre un fondo oscuro (distinta del panel
// lateral). Se usa para crear un objetivo y para las confirmaciones.
// Recibe el título, qué hacer al cerrar, el contenido como children y,
// si "conCerrar" es true, muestra la X de cierre.
// ==========================================================================

function Modal({ titulo, descripcion, onCerrar, conCerrar = false, ancho, children }) {
  return (
    <>
      <Overlay visible={true} onClick={onCerrar} />
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => {
          if (evento.target === evento.currentTarget) onCerrar();
        }}
      >
        <div className="modal__contenido" style={ancho ? { width: ancho } : undefined}>
          <div className="modal__encabezado">
            <h2 className="modal__titulo">{titulo}</h2>
            {conCerrar && (
              <button type="button" className="panel__cerrar" onClick={onCerrar} aria-label="Cerrar">
                X
              </button>
            )}
          </div>
          {descripcion && <p className="modal__texto">{descripcion}</p>}
          {children}
        </div>
      </div>
    </>
  );
}

export default Modal;
