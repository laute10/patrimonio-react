// ==========================================================================
// PanelGrafico - caja blanca con un título que envuelve a cada gráfico de
// Estadísticas. Se reutiliza 4 veces; lo único que cambia es el título y
// lo que va adentro (children).
// ==========================================================================

function PanelGrafico({ titulo, children }) {
  return (
    <section className="panel-grafico">
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export default PanelGrafico;
