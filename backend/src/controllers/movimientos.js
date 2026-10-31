import { leerDatos, modificarDatos } from "../servicios/datos.js";
import { conEfecto, siguienteId, filtrarMovimientos } from "../servicios/movimientos.js";
import { errorApi } from "../servicios/errorApi.js";
import { efectoMovimiento } from "../reglas/reglasPatrimonio.js";
import {
  validarId,
  validarFiltros,
  validarMovimientoNuevo,
  validarCambiosMovimiento,
} from "../validaciones/movimientos.js";

// ==========================================================================
// Controlador de /api/movimientos.
//
// Los errores se lanzan con throw errorApi(código, mensaje) y los responde
// el middleware de errores. Son funciones async: Express 5 le pasa solo al
// middleware cualquier error que ocurra adentro.
// Las escrituras usan modificarDatos(): si una regla falla adentro, no se
// guarda nada.
//
// Desde acá solo se crean, editan y eliminan ingresos y gastos; los
// movimientos de ahorro y de tarjeta se ven, pero se gestionan desde su
// propio recurso.
// ==========================================================================

function leerId(req) {
  const { error, id } = validarId(req.params.id);
  if (error) throw errorApi(400, error);
  return id;
}

function buscarMovimiento(datos, id) {
  const movimiento = datos.movimientos.find((mov) => mov.id === id);
  if (!movimiento) throw errorApi(404, `No existe el movimiento ${id}.`);
  return movimiento;
}

// Para editar o eliminar: tiene que existir y ser ingreso o gasto.
function buscarEditable(datos, id) {
  const movimiento = buscarMovimiento(datos, id);
  if (movimiento.tipo !== "ingreso" && movimiento.tipo !== "gasto") {
    throw errorApi(400, "Los movimientos de ahorro y de tarjeta no se editan ni se eliminan desde Movimientos.");
  }
  return movimiento;
}

// GET /api/movimientos?tipo=&objetivoId=&desde=&hasta=&q=
export async function listarMovimientos(req, res) {
  const { error, valores } = validarFiltros(req.query);
  if (error) throw errorApi(400, error);
  const datos = await leerDatos();
  res.status(200).json(filtrarMovimientos(datos.movimientos, valores).map(conEfecto));
}

// GET /api/movimientos/:id
export async function obtenerMovimiento(req, res) {
  const id = leerId(req);
  const datos = await leerDatos();
  res.status(200).json(conEfecto(buscarMovimiento(datos, id)));
}

// POST /api/movimientos  { tipo, categoria, monto, descripcion? }
export async function crearMovimiento(req, res) {
  const { error, valores } = validarMovimientoNuevo(req.body);
  if (error) throw errorApi(400, error);

  const nuevo = await modificarDatos((datos) => {
    const movimiento = {
      id: siguienteId(datos.movimientos),
      tipo: valores.tipo,
      categoria: valores.categoria,
      descripcion: valores.descripcion,
      monto: valores.monto,
      signo: valores.tipo === "ingreso" ? "+" : "-",
      fecha: new Date().toISOString(), // la fecha es automática
    };
    const efecto = efectoMovimiento(movimiento);
    if (datos.disponible + efecto.disponible < 0) {
      throw errorApi(400, "No tenés dinero disponible suficiente para este monto.");
    }
    datos.disponible += efecto.disponible;
    datos.movimientos.unshift(movimiento); // el más reciente, primero
    return movimiento;
  });

  res.status(201).json(conEfecto(nuevo));
}

// PUT /api/movimientos/:id  { categoria, monto, descripcion? }
export async function actualizarMovimiento(req, res) {
  const id = leerId(req);
  const { error, valores } = validarCambiosMovimiento(req.body);
  if (error) throw errorApi(400, error);

  const actualizado = await modificarDatos((datos) => {
    const anterior = buscarEditable(datos, id);
    if (valores.tipo !== undefined && valores.tipo !== anterior.tipo) {
      throw errorApi(400, "No se puede cambiar el tipo de un movimiento.");
    }
    const movimiento = {
      ...anterior,
      categoria: valores.categoria,
      monto: valores.monto,
      descripcion: valores.descripcion,
    };
    // Lo que cambia el disponible es el efecto nuevo menos el que tenía.
    const impacto = efectoMovimiento(movimiento).disponible - efectoMovimiento(anterior).disponible;
    if (datos.disponible + impacto < 0) {
      throw errorApi(400, "Ese cambio dejaría tu dinero disponible en negativo.");
    }
    datos.disponible += impacto;
    datos.movimientos = datos.movimientos.map((mov) => (mov.id === id ? movimiento : mov));
    return movimiento;
  });

  res.status(200).json(conEfecto(actualizado));
}

// DELETE /api/movimientos/:id
export async function eliminarMovimiento(req, res) {
  const id = leerId(req);

  await modificarDatos((datos) => {
    const movimiento = buscarEditable(datos, id);
    // Eliminar deshace el efecto del movimiento.
    const impacto = -efectoMovimiento(movimiento).disponible;
    if (datos.disponible + impacto < 0) {
      throw errorApi(400, "No se puede eliminar: ese dinero ya fue utilizado y quedaría en negativo.");
    }
    datos.disponible += impacto;
    datos.movimientos = datos.movimientos.filter((mov) => mov.id !== id);
  });

  res.status(204).end();
}
