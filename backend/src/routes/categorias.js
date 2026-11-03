import { Router } from "express";
import { listarCategorias, crearCategoria, eliminarCategoria } from "../controllers/categorias.js";

// Rutas de /api/categorias: las categorías propias de gasto e ingreso.
const router = Router();

router.get("/", listarCategorias);
router.post("/", crearCategoria);
router.delete("/:tipo/:nombre", eliminarCategoria);

export default router;
