// ==========================================================================
// CampoFormulario - un campo de formulario CONTROLADO y reutilizable.
// Recibe el valor y la función que lo cambia (props), y muestra el mensaje
// de error justo debajo. Si recibe "opciones" dibuja un <select>; si no,
// un <input>. Así todas las pantallas con formularios (Inicio, Ahorros,
// Tarjetas, Configuración y las de acceso) escriben cada campo una sola
// vez en lugar de repetir label + input + error.
// ==========================================================================

function CampoFormulario({ id, etiqueta, valor, onCambio, error = "", opciones, tipo = "text", ...resto }) {
  const idError = id + "-error";

  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>

      {opciones ? (
        <select id={id} value={valor} onChange={(e) => onCambio(e.target.value)}>
          {opciones.map((opcion) => {
            // Una opción puede ser un texto ("Ocio") o un objeto
            // { valor: 3, texto: "Viaje a Brasil" } cuando el valor es un id.
            const valorOpcion = typeof opcion === "object" ? opcion.valor : opcion;
            const textoOpcion = typeof opcion === "object" ? opcion.texto : opcion;
            return (
              <option key={valorOpcion} value={valorOpcion}>
                {textoOpcion}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          id={id}
          type={tipo}
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          aria-invalid={error !== "" ? "true" : undefined}
          aria-describedby={error !== "" ? idError : undefined}
          {...resto}
        />
      )}

      {error !== "" && (
        <p className="campo__error" id={idError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default CampoFormulario;
