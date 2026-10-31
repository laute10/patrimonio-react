import { useState } from "react";
import { IconoChevron } from "./Iconos";
import { ICONOS } from "../utils/formato";

// ==========================================================================
// SelectorIcono - botón "Seleccionar ícono" que despliega la grilla de
// íconos. Es un componente controlado: el ícono elegido vive en el padre.
// ==========================================================================

function SelectorIcono({ valor, onCambio, textoBoton = "Seleccionar ícono" }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="campo">
      <span className="campo__etiqueta">Elegí un ícono</span>
      <button
        type="button"
        className="selector-icono__boton"
        aria-expanded={abierto}
        onClick={() => setAbierto(!abierto)}
      >
        <span className="selector-icono__actual" aria-hidden="true">{valor}</span>
        <span className="selector-icono__texto">{textoBoton}</span>
        <span aria-hidden="true"><IconoChevron abierto={abierto} /></span>
      </button>

      {abierto && (
        <div className="selector-icono__grilla" role="group" aria-label="Íconos disponibles">
          {ICONOS.map((icono) => (
            <button
              type="button"
              key={icono}
              className={icono === valor ? "selector-icono__opcion selector-icono__opcion--activa" : "selector-icono__opcion"}
              aria-pressed={icono === valor}
              onClick={() => {
                onCambio(icono);
                setAbierto(false);
              }}
            >
              {icono}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectorIcono;
