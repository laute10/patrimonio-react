// Middleware propio de registro: muestra en la terminal cada pedido con su
// código de respuesta y cuánto tardó. Se escribe cuando la respuesta
// termina ("finish"), porque recién ahí se conoce el código.
function registro(req, res, next) {
  const inicio = Date.now();
  res.on("finish", () => {
    const duracion = Date.now() - inicio;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${duracion} ms)`);
  });
  next();
}

export default registro;
