// ==========================================================================
// TarjetaMini - cuadro chico con una etiqueta y un monto (Disponible,
// Ahorros, Tarjeta). Se usa 3 veces en Inicio con datos distintos.
// "variante" solo cambia el color del monto.
// ==========================================================================

import { formatearMonto } from "../utils/formato";

function TarjetaMini({ etiqueta, monto, variante }) {
  return (
    <div className="tarjeta-mini">
      <span className="etiqueta">{etiqueta}</span>
      <span className={"monto monto--" + variante}>{formatearMonto(monto)}</span>
    </div>
  );
}

export default TarjetaMini;
