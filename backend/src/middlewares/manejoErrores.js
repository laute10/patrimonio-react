// Middleware de errores: Express lo reconoce porque recibe 4 parámetros.
// Atrapa cualquier error que no se manejó en un controlador. "_next" no se
// usa, pero tiene que estar para que sean 4 (el "_" le avisa al linter).
function manejoErrores(error, req, res, _next) {
  // Si el cuerpo del pedido no es un JSON válido, la culpa es de quien lo
  // envió: corresponde 400, no 500.
  if (error.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo del pedido no es un JSON válido." });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Ocurrió un error en el servidor." });
}

export default manejoErrores;
