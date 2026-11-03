import { useState } from "react";

// ==========================================================================
// SelectorCategoria - lista de categorías con la opción "Nueva categoría…".
// Al elegirla aparece un campo para escribir el nombre; al confirmarlo se
// avisa al padre (onNueva guarda la categoría en la API y devuelve el nombre
// final) y queda seleccionada. Es un componente controlado.
// onNueva es async: mientras responde la API el botón dice "Guardando…", y
// si falla se muestra el mensaje del servidor debajo del campo.
// ==========================================================================

const NUEVA = "__nueva__";

function SelectorCategoria({ id, categorias, valor, onCambio, onNueva }) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function confirmar() {
    if (guardando) return;
    const limpio = nombre.trim();
    if (limpio === "") {
      setError("Escribí el nombre de la categoría.");
      return;
    }
    if (limpio.length > 25) {
      setError("Usá 25 caracteres o menos.");
      return;
    }
    setGuardando(true);
    try {
      onCambio(await onNueva(limpio));
      setCreando(false);
      setNombre("");
      setError("");
    } catch (errorApi) {
      setError(errorApi.message);
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    setCreando(false);
    setNombre("");
    setError("");
  }

  return (
    <div className="campo">
      <label htmlFor={id}>Categoría</label>
      <select
        id={id}
        value={creando ? NUEVA : valor}
        onChange={(e) => {
          if (e.target.value === NUEVA) setCreando(true);
          else onCambio(e.target.value);
        }}
      >
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={NUEVA}>+ Nueva categoría…</option>
      </select>

      {creando && (
        <div className="categoria-nueva">
          <input
            id={id + "-nueva"}
            type="text"
            placeholder="Ej. Peluquería"
            aria-label="Nombre de la nueva categoría"
            aria-invalid={error !== "" ? "true" : undefined}
            aria-describedby={error !== "" ? id + "-nueva-error" : undefined}
            value={nombre}
            maxLength={30}
            autoFocus
            onChange={(e) => {
              setNombre(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // no enviar el formulario de afuera
                confirmar();
              }
            }}
          />
          <div className="categoria-nueva__acciones">
            <button type="button" className="btn btn--primario" onClick={confirmar} disabled={guardando}>
              {guardando ? "Guardando…" : "Agregar"}
            </button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cancelar}>
              Cancelar
            </button>
          </div>
          {error !== "" && (
            <p className="campo__error" id={id + "-nueva-error"} role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default SelectorCategoria;
