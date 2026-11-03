// ==========================================================================
// validaciones/categorias.js - revisa los datos de las categorías propias
// ANTES de tocar el archivo. Escrito a mano, sin librerías.
// ==========================================================================

import { esObjeto, errorCategoria } from "./comunes.js";

const TIPOS = ["gasto", "ingreso"];

// :tipo de la URL o "tipo" del cuerpo. Devuelve "" si está bien, o el mensaje.
export function errorTipoCategoria(tipo) {
  if (tipo === undefined) return 'Falta el tipo: tiene que ser "gasto" o "ingreso".';
  if (!TIPOS.includes(tipo)) return 'El tipo tiene que ser "gasto" o "ingreso".';
  return "";
}

// POST /api/categorias: { tipo, nombre }
export function validarCategoriaNueva(cuerpo) {
  if (!esObjeto(cuerpo)) return { error: "Enviá los datos de la categoría como un objeto JSON." };
  const error = errorTipoCategoria(cuerpo.tipo) || errorCategoria(cuerpo.nombre);
  if (error) return { error };
  return { valores: { tipo: cuerpo.tipo, nombre: cuerpo.nombre.trim() } };
}
