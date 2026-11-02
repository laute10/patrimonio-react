import { Router } from "express";
import {
  listarTarjetas,
  obtenerTarjeta,
  crearTarjeta,
  agregarConsumo,
  actualizarConsumo,
  eliminarConsumo,
  cerrarPeriodo,
  pagarPeriodo,
} from "../controllers/tarjetas.js";

// Rutas de /api/tarjetas: tarjetas, consumos del período abierto y
// cierre/pago de períodos.
const router = Router();

router.get("/", listarTarjetas);
router.get("/:id", obtenerTarjeta);
router.post("/", crearTarjeta);
router.post("/:id/consumos", agregarConsumo);
router.put("/:id/consumos/:consumoId", actualizarConsumo);
router.delete("/:id/consumos/:consumoId", eliminarConsumo);
router.post("/:id/cierre", cerrarPeriodo);
router.post("/:id/periodos/:periodoId/pago", pagarPeriodo);

export default router;
