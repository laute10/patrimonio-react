import { leerDatos, modificarDatos } from "../servicios/datos.js";
import { conEfecto, siguienteId } from "../servicios/movimientos.js";
import { deudaPeriodo } from "../servicios/totales.js";
import {
  etiquetaPeriodo,
  siguienteMes,
  periodoAbierto,
  siguienteIdPeriodo,
  siguienteIdConsumo,
  cambiarPeriodo,
} from "../servicios/tarjetas.js";
import { errorApi } from "../servicios/errorApi.js";
import { efectoMovimiento } from "../reglas/reglasPatrimonio.js";
import { validarId } from "../validaciones/comunes.js";
import { validarTarjeta, validarConsumo } from "../validaciones/tarjetas.js";

// ==========================================================================
// Controlador de /api/tarjetas.
//
// Reglas (las mismas que tenía el frontend):
// - Cada tarjeta tiene un solo período ABIERTA; los consumos se agregan,
//   editan y eliminan solo ahí.
// - Un consumo pasa dinero de Disponible a Reserva (el patrimonio no
//   cambia) y no puede superar el disponible.
// - Cerrar el período lo pasa a CERRADA y abre el del mes siguiente.
// - Pagar un período CERRADA lo pasa a PAGADA: sale de la Reserva, el
//   disponible no cambia y el patrimonio baja una sola vez por lo pagado.
//
// Las escrituras de consumos y períodos responden la tarjeta actualizada y
// el disponible del servidor: así la pantalla queda igual que el archivo
// aunque el consumo no tenga movimiento (pasa en los datos de ejemplo).
// ==========================================================================

function leerIdParametro(req, nombre) {
  const { error, id } = validarId(req.params[nombre]);
  if (error) throw errorApi(400, error);
  return id;
}

function buscarTarjeta(datos, id) {
  const tarjeta = datos.tarjetas.find((t) => t.id === id);
  if (!tarjeta) throw errorApi(404, `No existe la tarjeta ${id}.`);
  return tarjeta;
}

// El consumo tiene que existir en la tarjeta (404) y estar en su período
// abierto (400: los períodos cerrados o pagados ya no se tocan).
function buscarConsumoAbierto(tarjeta, consumoId) {
  const periodo = tarjeta.periodos.find((p) => p.consumos.some((c) => c.id === consumoId));
  if (!periodo) throw errorApi(404, `No existe el consumo ${consumoId} en esta tarjeta.`);
  if (periodo.estado !== "ABIERTA") {
    throw errorApi(400, "Solo se pueden modificar los consumos del período abierto.");
  }
  return { periodo, consumo: periodo.consumos.find((c) => c.id === consumoId) };
}

function reemplazarTarjeta(datos, tarjeta) {
  datos.tarjetas = datos.tarjetas.map((t) => (t.id === tarjeta.id ? tarjeta : t));
}

// Cuánto cambia el disponible un consumo de tarjeta de ese monto.
function efectoConsumo(monto) {
  return efectoMovimiento({ tipo: "tarjeta-consumo", monto });
}

// GET /api/tarjetas
export async function listarTarjetas(req, res) {
  const datos = await leerDatos();
  res.status(200).json(datos.tarjetas);
}

// GET /api/tarjetas/:id
export async function obtenerTarjeta(req, res) {
  const id = leerIdParametro(req, "id");
  const datos = await leerDatos();
  res.status(200).json(buscarTarjeta(datos, id));
}

// POST /api/tarjetas  { nombre }  -> la tarjeta con su período abierto
export async function crearTarjeta(req, res) {
  const { error, valores } = validarTarjeta(req.body);
  if (error) throw errorApi(400, error);

  const nueva = await modificarDatos((datos) => {
    const hoy = new Date();
    const tarjeta = {
      id: siguienteId(datos.tarjetas),
      nombre: valores.nombre,
      periodos: [
        {
          id: siguienteIdPeriodo(datos.tarjetas),
          mes: hoy.getMonth(),
          anio: hoy.getFullYear(),
          estado: "ABIERTA",
          consumos: [],
        },
      ],
    };
    datos.tarjetas.push(tarjeta);
    return tarjeta;
  });

  res.status(201).json(nueva);
}

// POST /api/tarjetas/:id/consumos  { categoria, monto, descripcion? }
export async function agregarConsumo(req, res) {
  const tarjetaId = leerIdParametro(req, "id");
  const { error, valores } = validarConsumo(req.body);
  if (error) throw errorApi(400, error);

  const resultado = await modificarDatos((datos) => {
    const tarjeta = buscarTarjeta(datos, tarjetaId);
    const abierto = periodoAbierto(tarjeta);
    if (!abierto) throw errorApi(400, "La tarjeta no tiene un período abierto.");
    const efecto = efectoConsumo(valores.monto);
    if (datos.disponible + efecto.disponible < 0) {
      throw errorApi(400, "No tenés dinero disponible suficiente para este consumo.");
    }

    const consumo = { id: siguienteIdConsumo(datos.tarjetas), ...valores };
    const actualizada = cambiarPeriodo(tarjeta, abierto.id, (p) => ({ ...p, consumos: [...p.consumos, consumo] }));
    const movimiento = {
      id: siguienteId(datos.movimientos),
      tipo: "tarjeta-consumo",
      categoria: tarjeta.nombre,
      tarjetaId,
      consumoId: consumo.id, // vínculo para mantener el movimiento sincronizado
      descripcion: valores.descripcion,
      monto: valores.monto,
      signo: null, // pasa a la reserva: no afecta el patrimonio
      fecha: new Date().toISOString(),
    };
    datos.disponible += efecto.disponible; // la reserva sube sola (suma de consumos)
    reemplazarTarjeta(datos, actualizada);
    datos.movimientos.unshift(movimiento);
    return { tarjeta: actualizada, movimiento: conEfecto(movimiento), disponible: datos.disponible };
  });

  res.status(201).json(resultado);
}

// PUT /api/tarjetas/:id/consumos/:consumoId  { categoria, monto, descripcion? }
export async function actualizarConsumo(req, res) {
  const tarjetaId = leerIdParametro(req, "id");
  const consumoId = leerIdParametro(req, "consumoId");
  const { error, valores } = validarConsumo(req.body);
  if (error) throw errorApi(400, error);

  const resultado = await modificarDatos((datos) => {
    const tarjeta = buscarTarjeta(datos, tarjetaId);
    const { periodo, consumo } = buscarConsumoAbierto(tarjeta, consumoId);
    // Si el monto sube, baja el disponible y sube la deuda (y al revés).
    const impacto = efectoConsumo(valores.monto).disponible - efectoConsumo(consumo.monto).disponible;
    if (datos.disponible + impacto < 0) {
      throw errorApi(400, "No tenés dinero disponible suficiente para este consumo.");
    }

    const actualizada = cambiarPeriodo(tarjeta, periodo.id, (p) => ({
      ...p,
      consumos: p.consumos.map((c) => (c.id === consumoId ? { ...c, ...valores } : c)),
    }));
    datos.disponible += impacto;
    reemplazarTarjeta(datos, actualizada);
    let movimiento = null;
    datos.movimientos = datos.movimientos.map((mov) => {
      if (mov.consumoId !== consumoId) return mov;
      movimiento = { ...mov, monto: valores.monto, descripcion: valores.descripcion };
      return movimiento;
    });
    return {
      tarjeta: actualizada,
      movimiento: movimiento && conEfecto(movimiento), // null si el consumo no tenía movimiento
      disponible: datos.disponible,
    };
  });

  res.status(200).json(resultado);
}

// DELETE /api/tarjetas/:id/consumos/:consumoId
// Responde 200 (no 204) porque devuelve la tarjeta y el disponible nuevos.
export async function eliminarConsumo(req, res) {
  const tarjetaId = leerIdParametro(req, "id");
  const consumoId = leerIdParametro(req, "consumoId");

  const resultado = await modificarDatos((datos) => {
    const tarjeta = buscarTarjeta(datos, tarjetaId);
    const { periodo, consumo } = buscarConsumoAbierto(tarjeta, consumoId);
    const actualizada = cambiarPeriodo(tarjeta, periodo.id, (p) => ({
      ...p,
      consumos: p.consumos.filter((c) => c.id !== consumoId),
    }));
    // El dinero reservado vuelve a estar disponible (se deshace el consumo).
    datos.disponible -= efectoConsumo(consumo.monto).disponible;
    reemplazarTarjeta(datos, actualizada);
    datos.movimientos = datos.movimientos.filter((mov) => mov.consumoId !== consumoId);
    return { tarjeta: actualizada, disponible: datos.disponible };
  });

  res.status(200).json(resultado);
}

// POST /api/tarjetas/:id/cierre
// El período ABIERTA pasa a CERRADA y se abre el del mes siguiente.
export async function cerrarPeriodo(req, res) {
  const tarjetaId = leerIdParametro(req, "id");

  const resultado = await modificarDatos((datos) => {
    const tarjeta = buscarTarjeta(datos, tarjetaId);
    const abierto = periodoAbierto(tarjeta);
    if (!abierto) throw errorApi(400, "La tarjeta no tiene un período abierto para cerrar.");
    const nuevo = { id: siguienteIdPeriodo(datos.tarjetas), ...siguienteMes(abierto), estado: "ABIERTA", consumos: [] };
    const actualizada = cambiarPeriodo(tarjeta, abierto.id, (p) => ({ ...p, estado: "CERRADA" }));
    actualizada.periodos.push(nuevo);
    reemplazarTarjeta(datos, actualizada);
    return { tarjeta: actualizada, disponible: datos.disponible };
  });

  res.status(201).json(resultado);
}

// POST /api/tarjetas/:id/periodos/:periodoId/pago
// No hace falta controlar el disponible: el dinero quedó reservado con cada
// consumo. Al pasar a PAGADA, el período deja de sumar a la Reserva.
export async function pagarPeriodo(req, res) {
  const tarjetaId = leerIdParametro(req, "id");
  const periodoId = leerIdParametro(req, "periodoId");

  const resultado = await modificarDatos((datos) => {
    const tarjeta = buscarTarjeta(datos, tarjetaId);
    const periodo = tarjeta.periodos.find((p) => p.id === periodoId);
    if (!periodo) throw errorApi(404, `No existe el período ${periodoId} en esta tarjeta.`);
    if (periodo.estado === "PAGADA") throw errorApi(400, "Este período ya está pagado.");
    if (periodo.estado === "ABIERTA") throw errorApi(400, "Primero cerrá el período: solo se pagan períodos cerrados.");

    const deuda = deudaPeriodo(periodo);
    const actualizada = cambiarPeriodo(tarjeta, periodoId, (p) => ({ ...p, estado: "PAGADA" }));
    reemplazarTarjeta(datos, actualizada);
    // Un período sin consumos se marca pagado sin registrar un pago de $0.
    let movimiento = null;
    if (deuda > 0) {
      movimiento = {
        id: siguienteId(datos.movimientos),
        tipo: "tarjeta-pago",
        categoria: `Pago ${tarjeta.nombre} - ${etiquetaPeriodo(periodo)}`,
        tarjetaId,
        periodoId,
        descripcion: "",
        monto: deuda,
        signo: "-",
        fecha: new Date().toISOString(),
      };
      datos.movimientos.unshift(movimiento);
    }
    return { tarjeta: actualizada, movimiento: movimiento && conEfecto(movimiento), disponible: datos.disponible };
  });

  res.status(201).json(resultado);
}
