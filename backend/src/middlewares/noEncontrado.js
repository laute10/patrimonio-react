// Se llega acá solo si ninguna ruta respondió: la ruta no existe.
function noEncontrado(req, res) {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.originalUrl}` });
}

export default noEncontrado;
