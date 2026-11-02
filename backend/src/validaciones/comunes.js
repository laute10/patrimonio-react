// ==========================================================================
// validaciones/comunes.js - lo que comparten las validaciones de cada
// recurso. Las funciones "error..." devuelven "" si el valor está bien, o
// el mensaje para el usuario.
// ==========================================================================

const MAX_DESCRIPCION = 100; // el mismo límite que el frontend (maxLength)

export function esObjeto(valor) {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// :id de la URL. Devuelve { error } o { id } (ya como número).
export function validarId(texto) {
  if (!/^[1-9]\d*$/.test(texto)) {
    return { error: "El id tiene que ser un número entero positivo." };
  }
  return { id: Number(texto) };
}

// campo: cómo se llama en el mensaje ("el monto", "el monto objetivo").
export function errorMonto(monto, campo = "el monto") {
  const Campo = campo.charAt(0).toUpperCase() + campo.slice(1);
  if (monto === undefined) return `Falta ${campo}.`;
  // "500" (con comillas) es un texto, no un número.
  if (typeof monto !== "number" || !Number.isFinite(monto)) return `${Campo} tiene que ser un número.`;
  if (monto <= 0) return "Ingresá un monto mayor a cero.";
  return "";
}

// La descripción es optativa: si no viene, queda "".
export function errorDescripcion(descripcion) {
  if (descripcion === undefined) return "";
  if (typeof descripcion !== "string") return "La descripción tiene que ser un texto.";
  if (descripcion.trim().length > MAX_DESCRIPCION) return `La descripción puede tener hasta ${MAX_DESCRIPCION} caracteres.`;
  return "";
}
