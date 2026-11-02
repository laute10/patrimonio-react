// ==========================================================================
// validaciones/tarjetas.js - revisa los datos de tarjetas y consumos ANTES
// de tocar el archivo. Escrito a mano, sin librerías.
//
// Igual que en el resto: cada función devuelve { error: "mensaje" } o los
// valores ya limpios, y solo toma los campos conocidos.
// ==========================================================================

import { esObjeto, errorMonto, errorDescripcion, errorCategoria } from "./comunes.js";

const MAX_NOMBRE = 30; // el mismo límite que el frontend (maxLength)

// POST /api/tarjetas: { nombre }
// El primer período (ABIERTA, del mes actual) lo crea el servidor.
export function validarTarjeta(cuerpo) {
  if (!esObjeto(cuerpo)) return { error: "Enviá los datos de la tarjeta como un objeto JSON." };
  const { nombre } = cuerpo;
  if (nombre === undefined) return { error: "Falta el nombre de la tarjeta." };
  if (typeof nombre !== "string") return { error: "El nombre tiene que ser un texto." };
  if (nombre.trim() === "") return { error: "Ingresá el nombre de la tarjeta." };
  if (nombre.trim().length > MAX_NOMBRE) return { error: `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.` };
  return { valores: { nombre: nombre.trim() } };
}

// POST y PUT de consumos: { categoria, monto, descripcion? }
// El PUT es un reemplazo completo: categoría y monto son obligatorios.
export function validarConsumo(cuerpo) {
  if (!esObjeto(cuerpo)) return { error: "Enviá los datos del consumo como un objeto JSON." };
  const error = errorCategoria(cuerpo.categoria) || errorMonto(cuerpo.monto) || errorDescripcion(cuerpo.descripcion);
  if (error) return { error };
  return {
    valores: {
      categoria: cuerpo.categoria.trim(),
      monto: cuerpo.monto,
      descripcion: (cuerpo.descripcion ?? "").trim(),
    },
  };
}
