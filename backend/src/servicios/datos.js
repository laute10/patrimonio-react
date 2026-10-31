import { readFile, writeFile } from "node:fs/promises";

// ==========================================================================
// datos.js - lee y guarda todo el estado en un archivo JSON.
//
// - semilla.json: datos de ejemplo, versionados en git. Guarda "diasAtras"
//   en vez de fechas para que el ejemplo nunca quede viejo.
// - patrimonio.json: el archivo que se lee y se escribe de verdad. No se
//   versiona: si no existe, se crea a partir de la semilla al arrancar.
//
// Todo vive en un solo archivo, así una acción que cambia varias partes
// (un movimiento, el disponible y un objetivo) se guarda en una sola
// escritura.
// ==========================================================================

// new URL(..., import.meta.url) arma la ruta desde la carpeta de este
// archivo, no desde donde se ejecutó "npm run dev".
const ARCHIVO_DATOS = new URL("../data/patrimonio.json", import.meta.url);
const ARCHIVO_SEMILLA = new URL("../data/semilla.json", import.meta.url);

const UN_DIA = 24 * 60 * 60 * 1000;

// Cambia "diasAtras" por una fecha ISO real (contando desde hoy).
function convertirSemilla(semilla) {
  const ahora = Date.now();
  return {
    ...semilla,
    movimientos: semilla.movimientos.map(({ diasAtras, ...mov }) => ({
      ...mov,
      fecha: new Date(ahora - diasAtras * UN_DIA).toISOString(),
    })),
  };
}

// Se llama una vez al arrancar el servidor.
export async function inicializarDatos() {
  try {
    await readFile(ARCHIVO_DATOS, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error; // ENOENT = el archivo no existe
    const semilla = JSON.parse(await readFile(ARCHIVO_SEMILLA, "utf8"));
    await guardarDatos(convertirSemilla(semilla));
    console.log("Se creó data/patrimonio.json a partir de la semilla.");
  }
}

export async function leerDatos() {
  const texto = await readFile(ARCHIVO_DATOS, "utf8");
  return JSON.parse(texto);
}

export async function guardarDatos(datos) {
  await writeFile(ARCHIVO_DATOS, JSON.stringify(datos, null, 2) + "\n", "utf8");
}

// Todas las escrituras pasan por acá: lee el archivo, aplica "cambiar" y
// guarda UNA sola vez. Si "cambiar" lanza un error (una regla que no se
// cumple), no se guarda nada.
// Las operaciones se hacen de a una, en fila: si llegan dos pedidos juntos
// (un doble clic), el segundo espera al primero y ninguno pisa al otro.
let fila = Promise.resolve();

export function modificarDatos(cambiar) {
  const operacion = fila.then(async () => {
    const datos = await leerDatos();
    const resultado = cambiar(datos);
    await guardarDatos(datos);
    return resultado;
  });
  // Si esta operación falla, la fila sigue para las que vienen después.
  fila = operacion.catch(() => {});
  return operacion;
}
