import { leerDatos } from "../servicios/datos.js";
import { calcularTotales } from "../servicios/totales.js";

// GET /api/patrimonio - todo el estado más los totales calculados.
// Es async: si leer el archivo falla, Express 5 le pasa el error solo al
// middleware de errores (responde 500).
export async function obtenerPatrimonio(req, res) {
  const datos = await leerDatos();
  res.status(200).json({ ...datos, totales: calcularTotales(datos) });
}
