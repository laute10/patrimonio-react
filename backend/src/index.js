import express from "express";
import cors from "cors";
import saludRouter from "./routes/salud.js";
import registro from "./middlewares/registro.js";
import noEncontrado from "./middlewares/noEncontrado.js";
import manejoErrores from "./middlewares/manejoErrores.js";

// ==========================================================================
// index.js - punto de entrada del backend de Patrimonio.
//
// El orden de los middlewares importa: primero el registro (así se anota
// todo pedido, incluso uno con JSON inválido), después cors y json, las
// rutas, y al final el 404 y el de errores, que solo se usan si ninguna
// ruta respondió.
// ==========================================================================

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(registro);
app.use(cors());
app.use(express.json());

app.use("/api/salud", saludRouter);

app.use(noEncontrado);
app.use(manejoErrores);

app.listen(PUERTO, () => {
  console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
});
