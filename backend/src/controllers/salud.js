// GET /api/salud - responde siempre lo mismo si el servidor está en marcha.
export function obtenerSalud(req, res) {
  res.status(200).json({ estado: "ok" });
}
