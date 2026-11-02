// ==========================================================================
// validaciones/movimientos.js - revisa los datos que llegan en cada pedido
// ANTES de tocar el archivo. Escrito a mano, sin librerías.
//
// Cada función devuelve { error: "mensaje" } si algo está mal, o los
// valores ya limpios (textos sin espacios de más) si está todo bien.
// Solo se toman los campos conocidos: si el pedido manda "id", "fecha" u
// otro campo, se ignora (esos los pone el servidor).
// ==========================================================================

import { esObjeto, validarId, errorMonto, errorDescripcion, errorCategoria } from "./comunes.js";

export { validarId };

// Tipos que se pueden filtrar: la clase (como las pestañas de Movimientos)
// o el tipo exacto.
const TIPOS_FILTRO = [
  "ingreso", "gasto", "ahorro", "tarjeta",
  "ahorro-agregado", "ahorro-retirado", "ahorro-usado", "tarjeta-consumo", "tarjeta-pago",
];

// Categoría, monto y descripción: lo común de POST y PUT.
function validarCampos(cuerpo) {
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

// ---- Lo que usa el controlador -----------------------------------------

// POST /api/movimientos: { tipo, categoria, monto, descripcion? }
export function validarMovimientoNuevo(cuerpo) {
  if (!esObjeto(cuerpo)) {
    return { error: "Enviá los datos del movimiento como un objeto JSON." };
  }
  const { tipo } = cuerpo;
  if (tipo === undefined) return { error: 'Falta el tipo: tiene que ser "ingreso" o "gasto".' };
  if (typeof tipo === "string" && (tipo.startsWith("ahorro") || tipo.startsWith("tarjeta"))) {
    return { error: "Los movimientos de ahorro y de tarjeta no se crean desde Movimientos: se registran desde Ahorros y Tarjetas." };
  }
  if (tipo !== "ingreso" && tipo !== "gasto") return { error: 'El tipo tiene que ser "ingreso" o "gasto".' };

  const resultado = validarCampos(cuerpo);
  if (resultado.error) return resultado;
  return { valores: { tipo, ...resultado.valores } };
}

// PUT /api/movimientos/:id: { categoria, monto, descripcion? }
// Es un reemplazo completo de lo editable: categoría y monto son obligatorios.
export function validarCambiosMovimiento(cuerpo) {
  if (!esObjeto(cuerpo)) {
    return { error: "Enviá los datos del movimiento como un objeto JSON." };
  }
  const resultado = validarCampos(cuerpo);
  if (resultado.error) return resultado;
  // El tipo no se edita; si viene, se controla en el controlador contra el
  // tipo que ya tiene el movimiento.
  return { valores: { ...resultado.valores, tipo: cuerpo.tipo } };
}

// "2026-10-30" -> Date al comienzo de ese día (hora local), o null.
function leerFecha(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!partes) return null;
  const anio = Number(partes[1]);
  const mes = Number(partes[2]) - 1;
  const dia = Number(partes[3]);
  const fecha = new Date(anio, mes, dia);
  // new Date "corrige" fechas imposibles (31/02 -> 03/03): si cambió, no existía.
  if (fecha.getMonth() !== mes || fecha.getDate() !== dia) return null;
  return fecha;
}

// GET /api/movimientos?tipo=&objetivoId=&desde=&hasta=&q=
// Todos son optativos; un filtro vacío (?tipo=) es como no mandarlo.
export function validarFiltros(query) {
  const filtros = {};
  for (const nombre of ["tipo", "objetivoId", "desde", "hasta", "q"]) {
    const valor = query[nombre];
    if (Array.isArray(valor)) return { error: `El filtro "${nombre}" se puede enviar una sola vez.` };
    if (valor !== undefined && valor.trim() !== "") filtros[nombre] = valor.trim();
  }

  const valores = {};
  if (filtros.tipo !== undefined) {
    if (!TIPOS_FILTRO.includes(filtros.tipo)) {
      return { error: `El tipo "${filtros.tipo}" no existe. Usá: ${TIPOS_FILTRO.join(", ")}.` };
    }
    valores.tipo = filtros.tipo;
  }
  if (filtros.objetivoId !== undefined) {
    const { error, id } = validarId(filtros.objetivoId);
    if (error) return { error: "El objetivoId tiene que ser un número entero positivo." };
    valores.objetivoId = id;
  }
  if (filtros.desde !== undefined) {
    valores.desde = leerFecha(filtros.desde);
    if (valores.desde === null) return { error: "La fecha desde tiene que tener el formato AAAA-MM-DD y existir." };
  }
  if (filtros.hasta !== undefined) {
    const hasta = leerFecha(filtros.hasta);
    if (hasta === null) return { error: "La fecha hasta tiene que tener el formato AAAA-MM-DD y existir." };
    // "hasta" incluye todo ese día: se corta al comienzo del día siguiente.
    valores.hastaExclusivo = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate() + 1);
  }
  if (valores.desde && valores.hastaExclusivo && valores.desde >= valores.hastaExclusivo) {
    return { error: "La fecha desde no puede ser posterior a la fecha hasta." };
  }
  if (filtros.q !== undefined) valores.q = filtros.q.toLowerCase();

  return { valores };
}
