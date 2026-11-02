// ==========================================================================
// validaciones/objetivos.js - revisa los datos de los objetivos de ahorro
// ANTES de tocar el archivo. Escrito a mano, sin librerías.
//
// Igual que en movimientos: cada función devuelve { error: "mensaje" } o
// los valores ya limpios, y solo toma los campos conocidos.
// ==========================================================================

import { esObjeto, errorMonto, errorDescripcion } from "./comunes.js";

const MAX_NOMBRE = 40; // el mismo límite que el frontend (maxLength)
const MAX_ICONO = 16; // un emoji puede ocupar varios caracteres (✈️ son 2)
const ACCIONES = ["agregar", "retirar", "usar"];

function errorNombre(nombre) {
  if (nombre === undefined) return "Falta el nombre del objetivo.";
  if (typeof nombre !== "string") return "El nombre tiene que ser un texto.";
  if (nombre.trim() === "") return "Ingresá el nombre del objetivo.";
  if (nombre.trim().length > MAX_NOMBRE) return `El nombre puede tener hasta ${MAX_NOMBRE} caracteres.`;
  return "";
}

function errorIcono(icono) {
  if (icono === undefined) return "Falta el ícono del objetivo.";
  if (typeof icono !== "string" || icono.trim() === "") return "El ícono tiene que ser un texto (un emoji).";
  if (icono.length > MAX_ICONO) return "El ícono tiene que ser un solo emoji.";
  return "";
}

// POST /api/objetivos y PUT /api/objetivos/:id: { nombre, montoObjetivo, icono }
// El PUT es un reemplazo completo, así que los tres son obligatorios en los dos.
// montoActual no se recibe: empieza en 0 y solo cambia con los movimientos.
export function validarObjetivo(cuerpo) {
  if (!esObjeto(cuerpo)) {
    return { error: "Enviá los datos del objetivo como un objeto JSON." };
  }
  const error =
    errorNombre(cuerpo.nombre) || errorMonto(cuerpo.montoObjetivo, "el monto objetivo") || errorIcono(cuerpo.icono);
  if (error) return { error };
  return {
    valores: {
      nombre: cuerpo.nombre.trim(),
      montoObjetivo: cuerpo.montoObjetivo,
      icono: cuerpo.icono.trim(),
    },
  };
}

// POST /api/objetivos/:id/movimientos: { accion, monto, descripcion? }
export function validarMovimientoAhorro(cuerpo) {
  if (!esObjeto(cuerpo)) {
    return { error: "Enviá los datos del movimiento como un objeto JSON." };
  }
  if (cuerpo.accion === undefined) return { error: 'Falta la acción: tiene que ser "agregar", "retirar" o "usar".' };
  if (!ACCIONES.includes(cuerpo.accion)) return { error: 'La acción tiene que ser "agregar", "retirar" o "usar".' };
  const error = errorMonto(cuerpo.monto) || errorDescripcion(cuerpo.descripcion);
  if (error) return { error };
  return {
    valores: {
      accion: cuerpo.accion,
      monto: cuerpo.monto,
      descripcion: (cuerpo.descripcion ?? "").trim(),
    },
  };
}
