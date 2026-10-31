import { Router } from "express";
import { obtenerSalud } from "../controllers/salud.js";

// Rutas de /api/salud: sirven para comprobar que el servidor está andando.
const router = Router();

router.get("/", obtenerSalud);

export default router;
