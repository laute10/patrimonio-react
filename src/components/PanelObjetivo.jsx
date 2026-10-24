import { Fragment, useState } from "react";
import Overlay from "./Overlay";
import PanelLateral from "./PanelLateral";
import Modal from "./Modal";
import CampoFormulario from "./CampoFormulario";
import SelectorIcono from "./SelectorIcono";
import { formatearMonto } from "../utils/formato";

// ==========================================================================
// PanelObjetivo - detalle de UN objetivo en un panel lateral y todo lo que
// se hace desde ahí: agregar, retirar o utilizar dinero, editar y eliminar.
//
// Estado propio (solo lo usa este panel):
//   - vista: "detalle" | "agregar" | "retirar" | "utilizar" | "editar"
//   - modal: null | "usar" | "eliminar" | "no-eliminar"
//   - menuAbierto: el menú de los tres puntos
// El objetivo y las acciones llegan por props desde usePatrimonio.
// ==========================================================================

const TEXTOS_MONTO = {
  agregar: { titulo: "Agregar dinero", campo: "Monto a agregar" },
  retirar: { titulo: "Retirar dinero", campo: "Monto a retirar" },
  utilizar: { titulo: "Utilizar dinero", campo: "Monto a utilizar" },
};

function PanelObjetivo({
  objetivo,
  disponible,
  onCerrar,
  onVerMovimientos,
  agregarAhorro,
  retirarAhorro,
  usarAhorro,
  editarObjetivo,
  eliminarObjetivo,
}) {
  const [vista, setVista] = useState("detalle");
  const [modal, setModal] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorMonto, setErrorMonto] = useState("");

  const [nombre, setNombre] = useState(objetivo.nombre);
  const [montoObjetivo, setMontoObjetivo] = useState(String(objetivo.montoObjetivo));
  const [icono, setIcono] = useState(objetivo.icono);
  const [errorNombre, setErrorNombre] = useState("");
  const [errorMontoObjetivo, setErrorMontoObjetivo] = useState("");

  const porcentajeReal = Math.round((objetivo.montoActual / objetivo.montoObjetivo) * 100);
  const porcentajeBarra = Math.min(100, porcentajeReal);
  const cumplido = objetivo.montoActual >= objetivo.montoObjetivo;

  function irA(nuevaVista) {
    setMonto("");
    setDescripcion("");
    setErrorMonto("");
    setMenuAbierto(false);
    if (nuevaVista === "editar") {
      setNombre(objetivo.nombre);
      setMontoObjetivo(String(objetivo.montoObjetivo));
      setIcono(objetivo.icono);
      setErrorNombre("");
      setErrorMontoObjetivo("");
    }
    setVista(nuevaVista);
  }

  // Dinero máximo que se puede mover: agregar usa el disponible; retirar
  // y utilizar usan lo que ya hay ahorrado en el objetivo.
  const maximo = vista === "agregar" ? disponible : objetivo.montoActual;

  function validarMonto() {
    const valor = Number(monto);
    if (monto === "" || valor <= 0) {
      setErrorMonto("Ingresá un monto mayor a cero.");
      return null;
    }
    if (valor > maximo) {
      setErrorMonto(
        vista === "agregar"
          ? "⚠ No tenés dinero suficiente disponible."
          : "⚠ El monto supera el dinero de este objetivo."
      );
      return null;
    }
    return valor;
  }

  function manejarMovimiento(evento) {
    evento.preventDefault();
    const valor = validarMonto();
    if (valor === null) return;

    if (vista === "utilizar") {
      setModal("usar"); // antes de gastar, se pide confirmación
      return;
    }
    const datos = { objetivoId: objetivo.id, monto: valor, descripcion: descripcion.trim() };
    if (vista === "agregar") agregarAhorro(datos);
    else retirarAhorro(datos);
    irA("detalle");
  }

  function confirmarUso() {
    usarAhorro({ objetivoId: objetivo.id, monto: Number(monto), descripcion: descripcion.trim() });
    setModal(null);
    irA("detalle");
  }

  function manejarEdicion(evento) {
    evento.preventDefault();
    const mensajeNombre = nombre.trim() === "" ? "Ingresá el nombre del objetivo." : "";
    const mensajeMonto = Number(montoObjetivo) <= 0 ? "Ingresá un monto mayor a cero." : "";
    setErrorNombre(mensajeNombre);
    setErrorMontoObjetivo(mensajeMonto);
    if (mensajeNombre !== "" || mensajeMonto !== "") return;

    editarObjetivo({ objetivoId: objetivo.id, nombre: nombre.trim(), montoObjetivo: Number(montoObjetivo), icono });
    irA("detalle");
  }

  function pedirEliminar() {
    setMenuAbierto(false);
    // Regla: no se puede eliminar un objetivo que todavía tiene dinero.
    setModal(objetivo.montoActual > 0 ? "no-eliminar" : "eliminar");
  }

  function confirmarEliminar() {
    eliminarObjetivo(objetivo.id);
    setModal(null);
    onCerrar();
  }

  const botonesVolver = vista !== "detalle" ? () => irA("detalle") : undefined;

  // ---- contenido según la vista ----------------------------------------

  let titulo = "";
  let contenido = null;
  let acciones = null;
  let descripcionPanel;

  if (vista === "detalle") {
    contenido = (
      <>
        <div className="detalle-objetivo__cabecera">
          <span className="objetivo-card__icono" aria-hidden="true">{objetivo.icono}</span>
          <h2 className="detalle-objetivo__nombre">{objetivo.nombre}</h2>
        </div>
        <p className="detalle-objetivo__monto">{formatearMonto(objetivo.montoActual)}</p>
        <p className="objetivo-card__meta">De {formatearMonto(objetivo.montoObjetivo)}</p>
        <div className="barra-progreso">
          <div
            className={cumplido ? "barra-progreso__relleno barra-progreso__relleno--cumplido" : "barra-progreso__relleno"}
            style={{ width: `${porcentajeBarra}%` }}
          ></div>
        </div>
        {cumplido ? (
          <p className="detalle-objetivo__cumplido">✓ Objetivo cumplido · {porcentajeReal}%</p>
        ) : (
          <span className="objetivo-card__porcentaje">{porcentajeReal}% completado</span>
        )}
      </>
    );
    acciones = (
      <Fragment key={vista}>
        <button type="button" className="btn btn--primario" onClick={() => irA("agregar")}>Agregar dinero</button>
        <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => irA("retirar")}>Retirar dinero</button>
        <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => irA("utilizar")}>Utilizar dinero</button>
        <button type="button" className="detalle-objetivo__enlace" onClick={() => onVerMovimientos(objetivo.id)}>
          Ver movimientos del objetivo →
        </button>
      </Fragment>
    );
  } else if (vista === "editar") {
    titulo = "Editar objetivo";
    descripcionPanel = "Modificá la información de este objetivo";
    contenido = (
      <form id="form-editar-objetivo" onSubmit={manejarEdicion} noValidate>
        <CampoFormulario
          id="editar-objetivo-nombre"
          etiqueta="Nombre del objetivo"
          valor={nombre}
          onCambio={(nuevo) => { setNombre(nuevo); setErrorNombre(""); }}
          error={errorNombre}
        />
        <CampoFormulario
          id="editar-objetivo-monto"
          etiqueta="Monto objetivo"
          tipo="number"
          min="0"
          step="1"
          valor={montoObjetivo}
          onCambio={(nuevo) => { setMontoObjetivo(nuevo); setErrorMontoObjetivo(""); }}
          error={errorMontoObjetivo}
        />
        <SelectorIcono valor={icono} onCambio={setIcono} textoBoton="Cambiar ícono" />
      </form>
    );
    acciones = (
      <Fragment key={vista}>
        <button type="submit" form="form-editar-objetivo" className="btn btn--primario">Guardar cambios</button>
        <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => irA("detalle")}>Cancelar</button>
      </Fragment>
    );
  } else {
    const textos = TEXTOS_MONTO[vista];
    titulo = textos.titulo;
    contenido = (
      <form id="form-monto-objetivo" onSubmit={manejarMovimiento} noValidate>
        <p className="panel__etiqueta-chica">Objetivo</p>
        <div className="detalle-objetivo__cabecera detalle-objetivo__cabecera--linea">
          <span className="objetivo-card__icono" aria-hidden="true">{objetivo.icono}</span>
          <span className="detalle-objetivo__nombre">{objetivo.nombre}</span>
        </div>
        <CampoFormulario
          id="objetivo-monto-mov"
          etiqueta={textos.campo}
          tipo="number"
          placeholder="$ 0"
          min="0"
          step="1"
          valor={monto}
          onCambio={(nuevo) => { setMonto(nuevo); setErrorMonto(""); }}
          error={errorMonto}
        />
        {errorMonto.startsWith("⚠") && (
          <p className="campo__ayuda">
            {vista === "agregar" ? "Disponible" : "Disponible en el objetivo"}: {formatearMonto(maximo)}
          </p>
        )}
        <CampoFormulario
          id="objetivo-descripcion-mov"
          etiqueta="Descripción (opcional)"
          placeholder="Ej. Ahorro del sueldo"
          valor={descripcion}
          onCambio={setDescripcion}
        />
      </form>
    );
    acciones = (
      <Fragment key={vista}>
        <button type="submit" form="form-monto-objetivo" className="btn btn--primario">{textos.titulo}</button>
        <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => irA("detalle")}>Cancelar</button>
      </Fragment>
    );
  }

  const menu =
    vista === "detalle" ? (
      <div className="menu-puntos">
        <button
          type="button"
          className="menu-puntos__boton"
          aria-label="Más opciones"
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          ⋮
        </button>
        {menuAbierto && (
          <div className="menu-puntos__lista" role="menu">
            <button type="button" role="menuitem" className="menu-puntos__item" onClick={() => irA("editar")}>
              Editar objetivo
            </button>
            <button type="button" role="menuitem" className="menu-puntos__item menu-puntos__item--peligro" onClick={pedirEliminar}>
              Eliminar objetivo
            </button>
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <Overlay visible={true} onClick={onCerrar} />
      <PanelLateral
        abierto={true}
        titulo={titulo}
        descripcion={descripcionPanel}
        onCerrar={onCerrar}
        onVolver={botonesVolver}
        extraHeader={menu}
        acciones={acciones}
      >
        {contenido}
      </PanelLateral>

      {modal === "usar" && (
        <Modal titulo="¿Utilizar este dinero?" onCerrar={() => setModal(null)}>
          <p className="modal__texto modal__texto--junto">
            Vas a utilizar {formatearMonto(Number(monto))} de {objetivo.nombre}.
          </p>
          <p className="modal__texto">Este dinero se registrará como un gasto y dejará de formar parte de tus ahorros.</p>
          <div className="modal__detalle modal__detalle--columna">
            <span>Objetivo: <b>{objetivo.nombre}</b></span>
            <span>Monto utilizado: <b>{formatearMonto(Number(monto))}</b></span>
          </div>
          <div className="modal__acciones">
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => setModal(null)}>Cancelar</button>
            <button type="button" className="btn btn--primario" onClick={confirmarUso}>Confirmar gasto</button>
          </div>
        </Modal>
      )}

      {modal === "eliminar" && (
        <Modal titulo="¿Eliminar objetivo?" onCerrar={() => setModal(null)}>
          <p className="modal__texto">Vas a eliminar el objetivo {objetivo.nombre}. Esta acción no se puede deshacer.</p>
          <div className="modal__acciones">
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => setModal(null)}>Cancelar</button>
            <button type="button" className="btn btn--destructivo" onClick={confirmarEliminar}>Eliminar</button>
          </div>
        </Modal>
      )}

      {modal === "no-eliminar" && (
        <Modal titulo="No podés eliminar este objetivo" onCerrar={() => setModal(null)}>
          <p className="modal__texto">
            {objetivo.nombre} todavía tiene {formatearMonto(objetivo.montoActual)}. Retirá o utilizá ese dinero
            antes de eliminarlo.
          </p>
          <div className="modal__acciones">
            <button type="button" className="btn btn--primario" onClick={() => setModal(null)}>Entendido</button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default PanelObjetivo;
