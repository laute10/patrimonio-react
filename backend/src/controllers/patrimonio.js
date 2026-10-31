import { leerDatos } from "../servicios/datos.js";
import { calcularTotales } from "../servicios/totales.js";
import { conEfecto } from "../servicios/movimientos.js";

// GET /api/patrimonio - todo el estado más los totales calculados.
// Cada movimiento lleva su "efecto": el frontend lo necesita para deshacer
// un movimiento (al eliminarlo la respuesta es 204, sin cuerpo).
// Es async: si leer el archivo falla, Express 5 le pasa el error solo al
// middleware de errores (responde 500).
export async function obtenerPatrimonio(req, res) {
  const datos = await leerDatos();
  res.status(200).json({
    ...datos,
    movimientos: datos.movimientos.map(conEfecto),
    totales: calcularTotales(datos),
  });
}
