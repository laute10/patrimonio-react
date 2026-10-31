// ==========================================================================
// MovimientoItem - una fila de la lista "Últimos movimientos".
// Recibe un movimiento por props y no guarda estado propio.
// ==========================================================================

import { clasificar, formatearMonto, formatearTipo } from "../utils/formato";

function MovimientoItem({ movimiento }) {
  const tipoPunto = clasificar(movimiento.tipo);

  return (
    <li className="movimiento">
      <span className={`movimiento__punto movimiento__punto--${tipoPunto}`}></span>
      <div className="movimiento__info">
        <span className="movimiento__titulo">{movimiento.categoria}</span>
        <span className="movimiento__subtitulo">
          {movimiento.descripcion || formatearTipo(movimiento.tipo)}
        </span>
      </div>
      <span
        className={
          "movimiento__monto " +
          (movimiento.signo === "+" ? "movimiento__monto--positivo" : "") +
          (movimiento.signo === "-" ? "movimiento__monto--negativo" : "")
        }
      >
        {movimiento.signo === "+" ? "+ " : movimiento.signo === "-" ? "- " : ""}
        {formatearMonto(movimiento.monto)}
      </span>
    </li>
  );
}

export default MovimientoItem;
