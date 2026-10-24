import { formatearMonto } from "../utils/formato";

// ==========================================================================
// TarjetaObjetivo - tarjeta de un objetivo de ahorro. Es un botón: al
// tocarla se abre el detalle del objetivo (onAbrir).
// El porcentaje real puede superar el 100%, pero la barra se recorta ahí.
// ==========================================================================

function TarjetaObjetivo({ objetivo, onAbrir }) {
  const porcentajeReal = Math.round((objetivo.montoActual / objetivo.montoObjetivo) * 100);
  const porcentajeBarra = Math.min(100, porcentajeReal);

  return (
    <button type="button" className="objetivo-card objetivo-card--clic" onClick={() => onAbrir(objetivo.id)}>
      <span className="objetivo-card__encabezado">
        <span className="objetivo-card__icono" aria-hidden="true">{objetivo.icono}</span>
        <span>
          <span className="objetivo-card__nombre">{objetivo.nombre}</span>
          <span className="objetivo-card__tipo">Objetivo de ahorro</span>
        </span>
      </span>
      <span className="objetivo-card__monto">{formatearMonto(objetivo.montoActual)}</span>
      <span className="objetivo-card__meta">De {formatearMonto(objetivo.montoObjetivo)}</span>
      <span className="barra-progreso">
        <span className="barra-progreso__relleno" style={{ width: `${porcentajeBarra}%` }}></span>
      </span>
      <span className="objetivo-card__porcentaje">{porcentajeReal}% completado</span>
    </button>
  );
}

export default TarjetaObjetivo;
