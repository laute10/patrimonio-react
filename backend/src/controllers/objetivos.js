import { leerDatos, modificarDatos } from "../servicios/datos.js";
import { conEfecto, siguienteId } from "../servicios/movimientos.js";
import { errorApi } from "../servicios/errorApi.js";
import { efectoMovimiento } from "../reglas/reglasPatrimonio.js";
import { validarId } from "../validaciones/comunes.js";
import { validarObjetivo, validarMovimientoAhorro } from "../validaciones/objetivos.js";

// ==========================================================================
// Controlador de /api/objetivos (objetivos de ahorro).
//
// Mismo esquema que movimientos: los errores se lanzan con errorApi() y las
// escrituras pasan por modificarDatos() (si una regla falla, no se guarda
// nada).
//
// Agregar y retirar ahorro son transferencias internas (el patrimonio no
// cambia); usar ahorro es un gasto real. Cuánto cambia cada parte lo dice
// efectoMovimiento, igual que para el resto de los movimientos.
// ==========================================================================

// accion del pedido -> tipo de movimiento y signo con que se muestra.
const MOVIMIENTOS_AHORRO = {
  agregar: { tipo: "ahorro-agregado", signo: null },
  retirar: { tipo: "ahorro-retirado", signo: null },
  usar: { tipo: "ahorro-usado", signo: "-" },
};

function leerId(req) {
  const { error, id } = validarId(req.params.id);
  if (error) throw errorApi(400, error);
  return id;
}

function buscarObjetivo(datos, id) {
  const objetivo = datos.objetivos.find((obj) => obj.id === id);
  if (!objetivo) throw errorApi(404, `No existe el objetivo ${id}.`);
  return objetivo;
}

// GET /api/objetivos
export async function listarObjetivos(req, res) {
  const datos = await leerDatos();
  res.status(200).json(datos.objetivos);
}

// GET /api/objetivos/:id
export async function obtenerObjetivo(req, res) {
  const id = leerId(req);
  const datos = await leerDatos();
  res.status(200).json(buscarObjetivo(datos, id));
}

// POST /api/objetivos  { nombre, montoObjetivo, icono }
export async function crearObjetivo(req, res) {
  const { error, valores } = validarObjetivo(req.body);
  if (error) throw errorApi(400, error);

  const nuevo = await modificarDatos((datos) => {
    const objetivo = {
      id: siguienteId(datos.objetivos),
      nombre: valores.nombre,
      montoObjetivo: valores.montoObjetivo,
      montoActual: 0, // empieza vacío: el dinero entra con "agregar"
      icono: valores.icono,
    };
    datos.objetivos.push(objetivo);
    return objetivo;
  });

  res.status(201).json(nuevo);
}

// PUT /api/objetivos/:id  { nombre, montoObjetivo, icono }
// El nombre nuevo también se actualiza en los movimientos del objetivo para
// que el historial coincida.
export async function actualizarObjetivo(req, res) {
  const id = leerId(req);
  const { error, valores } = validarObjetivo(req.body);
  if (error) throw errorApi(400, error);

  const actualizado = await modificarDatos((datos) => {
    const objetivo = { ...buscarObjetivo(datos, id), ...valores };
    datos.objetivos = datos.objetivos.map((obj) => (obj.id === id ? objetivo : obj));
    datos.movimientos = datos.movimientos.map((mov) =>
      mov.objetivoId === id ? { ...mov, categoria: objetivo.nombre } : mov
    );
    return objetivo;
  });

  res.status(200).json(actualizado);
}

// DELETE /api/objetivos/:id
export async function eliminarObjetivo(req, res) {
  const id = leerId(req);

  await modificarDatos((datos) => {
    const objetivo = buscarObjetivo(datos, id);
    if (objetivo.montoActual > 0) {
      throw errorApi(400, "No podés eliminar un objetivo que todavía tiene dinero. Retirá o utilizá ese dinero antes.");
    }
    datos.objetivos = datos.objetivos.filter((obj) => obj.id !== id);
  });

  res.status(204).end();
}

// POST /api/objetivos/:id/movimientos  { accion, monto, descripcion? }
// Responde el movimiento creado (con su efecto) y el objetivo actualizado.
export async function moverAhorro(req, res) {
  const id = leerId(req);
  const { error, valores } = validarMovimientoAhorro(req.body);
  if (error) throw errorApi(400, error);

  const resultado = await modificarDatos((datos) => {
    const objetivo = buscarObjetivo(datos, id);
    const { tipo, signo } = MOVIMIENTOS_AHORRO[valores.accion];

    // Agregar usa el disponible; retirar y usar, lo que ya hay en el objetivo.
    if (valores.accion === "agregar" && valores.monto > datos.disponible) {
      throw errorApi(400, "No tenés dinero suficiente disponible.");
    }
    if (valores.accion !== "agregar" && valores.monto > objetivo.montoActual) {
      throw errorApi(400, "El monto supera el dinero de este objetivo.");
    }

    const movimiento = {
      id: siguienteId(datos.movimientos),
      tipo,
      categoria: objetivo.nombre,
      objetivoId: objetivo.id,
      descripcion: valores.descripcion,
      monto: valores.monto,
      signo,
      fecha: new Date().toISOString(),
    };
    const efecto = efectoMovimiento(movimiento);
    const objetivoActualizado = { ...objetivo, montoActual: objetivo.montoActual + efecto.ahorros };
    datos.disponible += efecto.disponible;
    datos.objetivos = datos.objetivos.map((obj) => (obj.id === id ? objetivoActualizado : obj));
    datos.movimientos.unshift(movimiento);
    return { movimiento, objetivo: objetivoActualizado };
  });

  res.status(201).json({ movimiento: conEfecto(resultado.movimiento), objetivo: resultado.objetivo });
}
