import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import CampoFormulario from "../components/CampoFormulario";
import EnlaceTexto from "../components/EnlaceTexto";
import { validarCorreo, validarContrasena } from "../utils/validacion";

// ==========================================================================
// Login - pantalla "Iniciar sesión". Formulario controlado: cada campo
// vive en el estado, y cada uno tiene su propio mensaje de error.
// Cuando los datos son correctos llama a onIngresar (prop): App guarda la
// sesión y muestra la pantalla Inicio. Por ahora la verificación de la
// contraseña es simulada; cuando exista el backend se reemplaza ahí.
// ==========================================================================

function Login({ onIngresar, onIrACrearCuenta, onIrARecuperar }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errores, setErrores] = useState({ correo: "", contrasena: "" });

  function manejarEnvio(evento) {
    evento.preventDefault();

    const nuevosErrores = {
      correo: validarCorreo(correo),
      contrasena: validarContrasena(contrasena),
    };
    setErrores(nuevosErrores);

    if (nuevosErrores.correo !== "" || nuevosErrores.contrasena !== "") {
      return;
    }
    onIngresar(correo.trim());
  }

  function cambiarCorreo(nuevo) {
    setCorreo(nuevo);
    setErrores({ ...errores, correo: "" });
  }

  function cambiarContrasena(nuevo) {
    setContrasena(nuevo);
    setErrores({ ...errores, contrasena: "" });
  }

  return (
    <AuthLayout
      titulo="Iniciar sesión"
      subtitulo="Administrá tus finanzas de forma simple"
      pie={
        <>
          ¿No tenés cuenta? <EnlaceTexto onClick={onIrACrearCuenta}>Crear cuenta</EnlaceTexto>
        </>
      }
    >
      <form onSubmit={manejarEnvio} noValidate>
        <CampoFormulario
          id="login-correo"
          etiqueta="Correo electrónico"
          tipo="email"
          placeholder="Ingresá tu correo"
          autoComplete="email"
          valor={correo}
          onCambio={cambiarCorreo}
          error={errores.correo}
        />
        <CampoFormulario
          id="login-contrasena"
          etiqueta="Contraseña"
          tipo="password"
          placeholder="Ingresá tu contraseña"
          autoComplete="current-password"
          valor={contrasena}
          onCambio={cambiarContrasena}
          error={errores.contrasena}
        />

        <EnlaceTexto onClick={onIrARecuperar} className="enlace-derecha">
          ¿Olvidaste tu contraseña?
        </EnlaceTexto>

        <button type="submit" className="btn btn--primario btn--block">
          Ingresar
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
