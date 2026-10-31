// ==========================================================================
// api.js - un solo lugar para hablar con el backend.
//
// La dirección NO está escrita acá: sale de VITE_API_URL (archivo .env).
// pedir() devuelve los datos de la respuesta o lanza un Error con un
// mensaje listo para mostrarle al usuario: el { error } que mandó la API,
// o uno propio si ni siquiera se pudo conectar.
// ==========================================================================

const API_URL = import.meta.env.VITE_API_URL;

// ruta: "/patrimonio", "/movimientos/3"...
// cuerpo: objeto que se envía como JSON (para POST y PUT).
export async function pedir(ruta, { metodo = "GET", cuerpo } = {}) {
  if (!API_URL) {
    throw new Error("Falta configurar VITE_API_URL en el archivo frontend/.env.");
  }

  const opciones = { method: metodo };
  if (cuerpo !== undefined) {
    opciones.headers = { "Content-Type": "application/json" };
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, opciones);
  } catch {
    // fetch solo falla así cuando no hay respuesta (servidor apagado, sin red).
    throw new Error("No pudimos conectarnos con el servidor. Revisá que esté encendido e intentá de nuevo.");
  }

  // 204 = salió bien pero no hay contenido (por ejemplo, al eliminar).
  if (respuesta.status === 204) return null;

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // La respuesta no era JSON: se resuelve abajo con un mensaje genérico.
  }

  if (!respuesta.ok || datos === null) {
    throw new Error(datos && datos.error ? datos.error : `El servidor respondió con un error (${respuesta.status}).`);
  }
  return datos;
}
