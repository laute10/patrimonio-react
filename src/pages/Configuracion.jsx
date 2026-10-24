import { useState } from "react";
import CampoFormulario from "../components/CampoFormulario";
import Overlay from "../components/Overlay";
import PanelLateral from "../components/PanelLateral";
import { validarNombre, validarCorreo } from "../utils/validacion";

// ==========================================================================
// Configuración - datos de la cuenta, preferencias y cierre de sesión.
// "usuario" llega por props desde App (ahí vive la sesión). Acá solo hay
// estado de interfaz: qué panel/modal está abierto y el borrador del
// formulario "Editar datos", que no se guarda hasta apretar el botón.
// ==========================================================================

function Configuracion({ tema, onCambiarTema, usuario, onGuardar, onCerrarSesion }) {
  // abierto: null | "editar" | "cerrar-sesion"  (uno solo a la vez)
  const [abierto, setAbierto] = useState(null);
  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [errores, setErrores] = useState({ nombre: "", correo: "" });
  const [aviso, setAviso] = useState("");

  function abrirEdicion() {
    // Cada vez que se abre, el borrador vuelve a los datos guardados.
    setNombre(usuario.nombre);
    setCorreo(usuario.correo);
    setErrores({ nombre: "", correo: "" });
    setAviso("");
    setAbierto("editar");
  }

  function cerrarTodo() {
    setAbierto(null);
  }

  function manejarEnvio(evento) {
    evento.preventDefault();

    const nuevosErrores = { nombre: validarNombre(nombre), correo: validarCorreo(correo) };
    setErrores(nuevosErrores);
    if (nuevosErrores.nombre !== "" || nuevosErrores.correo !== "") {
      return;
    }

    onGuardar(nombre.trim(), correo.trim());
    setAviso("Tus datos se guardaron.");
    setAbierto(null);
  }

  return (
    <>
      <main className="main" id="contenido">
        <section className="pagina-header">
          <h1>Configuración</h1>
          <p className="subtitulo">Administrá tu cuenta y preferencias</p>
        </section>

        {aviso !== "" && (
          <p className="aviso-exito" role="status">
            {aviso}
          </p>
        )}

        <section className="config-seccion">
          <h2>Mi cuenta</h2>
          <div className="config-card">
            <div className="config-card__datos">
              <div className="config-dato">
                <span className="etiqueta">Nombre:</span>{" "}
                <span className="valor">{usuario.nombre}</span>
              </div>
              <div className="config-dato">
                <span className="etiqueta">Correo electrónico:</span>{" "}
                <span className="valor">{usuario.correo}</span>
              </div>
            </div>
            <button type="button" className="btn btn--secundario btn--texto-secundario btn--chico" onClick={abrirEdicion}>
              Editar datos
            </button>
          </div>
        </section>

        <section className="config-seccion">
          <h2>Preferencias</h2>
          <div className="config-card">
            <div className="config-dato">
              <span className="etiqueta">Moneda:</span> <span className="valor">Pesos argentinos (ARS)</span>
              <p className="descripcion">Moneda utilizada para mostrar tus valores y movimientos</p>
            </div>
            <div className="config-dato">
              <span className="etiqueta" id="etiqueta-tema">Apariencia:</span>
              <p className="descripcion">Elegí cómo querés ver la aplicación</p>
              <div className="selector-tema" role="group" aria-labelledby="etiqueta-tema">
                <button
                  type="button"
                  className={tema === "claro" ? "btn btn--primario" : "btn btn--secundario"}
                  aria-pressed={tema === "claro"}
                  onClick={() => onCambiarTema("claro")}
                >
                  Claro
                </button>
                <button
                  type="button"
                  className={tema === "oscuro" ? "btn btn--primario" : "btn btn--secundario"}
                  aria-pressed={tema === "oscuro"}
                  onClick={() => onCambiarTema("oscuro")}
                >
                  Oscuro
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="config-seccion">
          <h2>Sesión</h2>
          <div className="config-card">
            <span className="config-card__sesion-texto">Cerrar sesión</span>
            <button type="button" className="btn btn--destructivo btn--chico" onClick={() => setAbierto("cerrar-sesion")}>
              Cerrar sesión
            </button>
          </div>
        </section>
      </main>

      <Overlay visible={abierto !== null} onClick={cerrarTodo} />

      <PanelLateral
        abierto={abierto === "editar"}
        titulo="Editar datos"
        onCerrar={cerrarTodo}
        acciones={
          <>
            <button type="submit" form="form-editar-datos" className="btn btn--primario">
              Guardar cambios
            </button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarTodo}>
              Cancelar
            </button>
          </>
        }
      >
        <form id="form-editar-datos" onSubmit={manejarEnvio} noValidate>
          <CampoFormulario
            id="dato-nombre"
            etiqueta="Nombre"
            valor={nombre}
            onCambio={(nuevo) => {
              setNombre(nuevo);
              setErrores({ ...errores, nombre: "" });
            }}
            error={errores.nombre}
          />
          <CampoFormulario
            id="dato-correo"
            etiqueta="Correo electrónico"
            tipo="email"
            valor={correo}
            onCambio={(nuevo) => {
              setCorreo(nuevo);
              setErrores({ ...errores, correo: "" });
            }}
            error={errores.correo}
          />
        </form>
      </PanelLateral>

      {abierto === "cerrar-sesion" && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-cerrar-sesion">
          <div className="modal__contenido">
            <p className="modal__titulo" id="titulo-cerrar-sesion">
              ¿Cerrar sesión?
            </p>
            <p className="modal__texto">Vas a salir de tu cuenta y volver a la pantalla de inicio de sesión</p>
            <div className="modal__acciones">
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarTodo}>
                Cancelar
              </button>
              <button type="button" className="btn btn--destructivo" onClick={onCerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Configuracion;
