// ==========================================================================
// Overlay - fondo oscuro detrás de paneles/modales.
// "visible" reemplaza al classList.add/remove("overlay--visible") que
// usábamos en JS vanilla; acá es simplemente una clase condicional según
// el estado que le pase el componente padre.
// ==========================================================================

function Overlay({ visible, onClick }) {
  return (
    <div
      className={visible ? "overlay overlay--visible" : "overlay"}
      onClick={onClick}
    ></div>
  );
}

export default Overlay;
