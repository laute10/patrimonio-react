import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import CampoFormulario from "../components/CampoFormulario";
import EnlaceTexto from "../components/EnlaceTexto";
import { validarCorreo } from "../utils/validacion";

// ==========================================================================
// Recuperar - pide el correo y, si es válido, reemplaza el formulario por
// un mensaje de confirmación. "enviado" es un estado: cambiarlo alcanza
// para que la interfaz muestre una cosa u otra (renderizado condicional).
// ==========================================================================

function Recuperar({ onIrALogin }) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  function manejarEnvio(evento) {
    evento.preventDefault();

    const mensaje = validarCorreo(correo);
    setError(mensaje);
    if (mensaje === "") {
      setEnviado(true);
    }
  }

  function cambiarCorreo(nuevo) {
    setCorreo(nuevo);
    setError("");
  }

  return (
    <AuthLayout
      titulo="Recuperar contraseña"
      subtitulo="Ingresá tu correo y te enviaremos instrucciones para recuperar tu contraseña"
      pie={<EnlaceTexto onClick={onIrALogin}>Volvé a iniciar sesión</EnlaceTexto>}
    >
      {enviado ? (
        <p className="mensaje-exito" role="status">
          Te enviamos las instrucciones. Revisá tu correo.
        </p>
      ) : (
        <form onSubmit={manejarEnvio} noValidate>
          <CampoFormulario
            id="recuperar-correo"
            etiqueta="Correo electrónico"
            tipo="email"
            placeholder="Ingresá tu correo"
            autoComplete="email"
            valor={correo}
            onCambio={cambiarCorreo}
            error={error}
          />
          <button type="submit" className="btn btn--primario btn--block">
            Enviar instrucciones
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

export default Recuperar;
