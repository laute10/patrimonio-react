import { Router } from "express";
import {
  listarObjetivos,
  obtenerObjetivo,
  crearObjetivo,
  actualizarObjetivo,
  eliminarObjetivo,
  moverAhorro,
} from "../controllers/objetivos.js";

// Rutas de /api/objetivos: el CRUD de los objetivos de ahorro, más mover
// dinero (agregar, retirar o usar) en uno de ellos.
const router = Router();

router.get("/", listarObjetivos);
router.get("/:id", obtenerObjetivo);
router.post("/", crearObjetivo);
router.put("/:id", actualizarObjetivo);
router.delete("/:id", eliminarObjetivo);
router.post("/:id/movimientos", moverAhorro);

export default router;
