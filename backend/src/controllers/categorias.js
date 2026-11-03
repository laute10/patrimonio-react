import { leerDatos, modificarDatos } from "../servicios/datos.js";
import { errorApi } from "../servicios/errorApi.js";
import { errorTipoCategoria, validarCategoriaNueva } from "../validaciones/categorias.js";

// ==========================================================================
// Controlador de /api/categorias (categorías propias de gasto e ingreso).
//
// Solo se guardan las que crea el usuario: las predeterminadas (Comida,
// Sueldo...) están en el frontend. Los nombres se comparan sin distinguir
// mayúsculas: "comida" y "Comida" son la misma.
// ==========================================================================

const mismoNombre = (a, b) => a.toLowerCase() === b.toLowerCase();

// Cuántos movimientos (y, para gasto, consumos de tarjeta) usan la categoría.
function cantidadDeUsos(datos, tipo, nombre) {
  const movimientos = datos.movimientos.filter((mov) => mov.tipo === tipo && mismoNombre(mov.categoria, nombre)).length;
  if (tipo !== "gasto") return movimientos;
  const consumos = datos.tarjetas
    .flatMap((t) => t.periodos)
    .flatMap((p) => p.consumos)
    .filter((c) => mismoNombre(c.categoria, nombre)).length;
  return movimientos + consumos;
}

// GET /api/categorias -> { gasto: [...], ingreso: [...] }
export async function listarCategorias(req, res) {
  const datos = await leerDatos();
  res.status(200).json(datos.categoriasPropias);
}

// POST /api/categorias  { tipo, nombre }
// Si ya existe, no la duplica: responde 200 con el nombre que ya estaba
// guardado (así el selector la elige igual). Si es nueva, 201.
export async function crearCategoria(req, res) {
  const { error, valores } = validarCategoriaNueva(req.body);
  if (error) throw errorApi(400, error);

  const resultado = await modificarDatos((datos) => {
    const lista = datos.categoriasPropias[valores.tipo];
    const existente = lista.find((c) => mismoNombre(c, valores.nombre));
    if (existente) return { nueva: false, nombre: existente };
    lista.push(valores.nombre);
    return { nueva: true, nombre: valores.nombre };
  });

  res.status(resultado.nueva ? 201 : 200).json({ tipo: valores.tipo, nombre: resultado.nombre });
}

// DELETE /api/categorias/:tipo/:nombre
// No se puede borrar una categoría que ya usa algún movimiento o consumo.
export async function eliminarCategoria(req, res) {
  const { tipo, nombre } = req.params; // Express ya decodifica %20, tildes, etc.
  const errorTipo = errorTipoCategoria(tipo);
  if (errorTipo) throw errorApi(400, errorTipo);

  await modificarDatos((datos) => {
    const lista = datos.categoriasPropias[tipo];
    const guardada = lista.find((c) => mismoNombre(c, nombre));
    if (!guardada) throw errorApi(404, `No existe la categoría propia "${nombre}".`);
    const usos = cantidadDeUsos(datos, tipo, guardada);
    if (usos > 0) {
      const veces = usos === 1 ? "1 vez" : `${usos} veces`;
      throw errorApi(400, `No podés borrar la categoría "${guardada}" porque ya está en uso (${veces}).`);
    }
    datos.categoriasPropias[tipo] = lista.filter((c) => c !== guardada);
  });

  res.status(204).end();
}
