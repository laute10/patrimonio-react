import { efectoMovimiento } from "../reglas/reglasPatrimonio.js";

// ==========================================================================
// movimientos.js - ayudas para preparar los movimientos que devuelve la API.
// ==========================================================================

// Agrega el campo "efecto" ({ disponible, ahorros, reserva }) calculado por
// el servidor. No se guarda en el archivo: se calcula al responder, así
// nunca queda desactualizado si cambia el monto.
export function conEfecto(movimiento) {
  return { ...movimiento, efecto: efectoMovimiento(movimiento) };
}
