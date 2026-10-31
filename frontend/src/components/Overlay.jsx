// ==========================================================================
// Overlay - fondo oscuro detrás de paneles/modales.
// "visible" reemplaza al classList.add/remove("overlay--visible") que
// usábamos en JS vanilla; acá es simplemente una clase condicional según
// el estado que le pase el componente padre.
// ==========================================================================

// "alto" lo sube por encima de los paneles laterales (para modales abiertos desde un panel).
function Overlay({ visible, onClick, alto = false }) {
  return (
    <div
      className={(visible ? "overlay overlay--visible" : "overlay") + (alto ? " overlay--alto" : "")}
      onClick={onClick}
    ></div>
  );
}

export default Overlay;
