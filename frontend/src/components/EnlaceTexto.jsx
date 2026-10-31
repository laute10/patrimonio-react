// ==========================================================================
// EnlaceTexto - botón con aspecto de enlace para cambiar de pantalla sin
// React Router. Se usa dentro del pie de las pantallas de acceso, donde
// la "navegación" es solo cambiar un estado en App.jsx.
// ==========================================================================

function EnlaceTexto({ onClick, children, className = "" }) {
  return (
    <button type="button" className={"enlace-texto " + className} onClick={onClick}>
      {children}
    </button>
  );
}

export default EnlaceTexto;
