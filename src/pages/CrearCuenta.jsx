import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import CampoFormulario from "../components/CampoFormulario";
import EnlaceTexto from "../components/EnlaceTexto";
import {
  validarNombre,
  validarCorreo,
  validarContrasenaNueva,
  validarConfirmacion,
} from "../utils/validacion";

// ==========================================================================
// CrearCuenta - formulario controlado con cuatro campos. Valida todos a la
// vez al enviar y muestra el error junto a cada campo. Si está todo bien,
// llama a onCrear(nombre, correo) y App abre la sesión.
// ==========================================================================

const SIN_ERRORES = { nombre: "", correo: "", contrasena: "", confirmar: "" };

function CrearCuenta({ onCrear, onIrALogin }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState(SIN_ERRORES);

  function manejarEnvio(evento) {
    evento.preventDefault();

    const nuevosErrores = {
      nombre: validarNombre(nombre),
      correo: validarCorreo(correo),
      contrasena: validarContrasenaNueva(contrasena),
      confirmar: validarConfirmacion(contrasena, confirmar),
    };
    setErrores(nuevosErrores);

    const hayErrores = Object.values(nuevosErrores).some((mensaje) => mensaje !== "");
    if (hayErrores) {
      return;
    }
    onCrear(nombre.trim(), correo.trim());
  }

  // Al escribir en un campo, desaparece solo su error.
  function cambiar(campo, setter) {
    return function (nuevo) {
      setter(nuevo);
      setErrores({ ...errores, [campo]: "" });
    };
  }

  return (
    <AuthLayout
      titulo="Crear cuenta"
      subtitulo="Creá tu cuenta para comenzar a administrar tus finanzas"
      pie={
        <>
          ¿Ya tenés una cuenta? <EnlaceTexto onClick={onIrALogin}>Iniciar sesión</EnlaceTexto>
        </>
      }
    >
      <form onSubmit={manejarEnvio} noValidate>
        <CampoFormulario
          id="cuenta-nombre"
          etiqueta="Nombre"
          placeholder="Ingresá tu nombre"
          autoComplete="given-name"
          valor={nombre}
          onCambio={cambiar("nombre", setNombre)}
          error={errores.nombre}
        />
        <CampoFormulario
          id="cuenta-correo"
          etiqueta="Correo electrónico"
          tipo="email"
          placeholder="Ingresá tu correo"
          autoComplete="email"
          valor={correo}
          onCambio={cambiar("correo", setCorreo)}
          error={errores.correo}
        />
        <CampoFormulario
          id="cuenta-contrasena"
          etiqueta="Contraseña"
          tipo="password"
          placeholder="Creá tu contraseña"
          autoComplete="new-password"
          valor={contrasena}
          onCambio={cambiar("contrasena", setContrasena)}
          error={errores.contrasena}
        />
        <CampoFormulario
          id="cuenta-confirmar"
          etiqueta="Confirmar contraseña"
          tipo="password"
          placeholder="Repetí tu contraseña"
          autoComplete="new-password"
          valor={confirmar}
          onCambio={cambiar("confirmar", setConfirmar)}
          error={errores.confirmar}
        />

        <button type="submit" className="btn btn--primario btn--block">
          Crear cuenta
        </button>
      </form>
    </AuthLayout>
  );
}

export default CrearCuenta;
