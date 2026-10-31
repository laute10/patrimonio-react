import { Router } from "express";
import {
  listarMovimientos,
  obtenerMovimiento,
  crearMovimiento,
  actualizarMovimiento,
  eliminarMovimiento,
} from "../controllers/movimientos.js";

// Rutas de /api/movimientos: el CRUD del recurso principal.
const router = Router();

router.get("/", listarMovimientos);
router.get("/:id", obtenerMovimiento);
router.post("/", crearMovimiento);
router.put("/:id", actualizarMovimiento);
router.delete("/:id", eliminarMovimiento);

export default router;
