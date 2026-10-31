import { Router } from "express";
import { obtenerPatrimonio } from "../controllers/patrimonio.js";

// Rutas de /api/patrimonio: el estado completo para la carga inicial.
const router = Router();

router.get("/", obtenerPatrimonio);

export default router;
