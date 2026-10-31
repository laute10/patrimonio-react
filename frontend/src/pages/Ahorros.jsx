import { IconoVolver, IconoAvanzar } from "../components/Iconos";
import { useState } from "react";
import Overlay from "../components/Overlay";
import PanelLateral from "../components/PanelLateral";
import CampoFormulario from "../components/CampoFormulario";
import Modal from "../components/Modal";
import SelectorIcono from "../components/SelectorIcono";
import TarjetaObjetivo from "../components/TarjetaObjetivo";
import PanelObjetivo from "../components/PanelObjetivo";
import { ICONOS } from "../utils/formato";

// ==========================================================================
// Ahorros - resumen + grilla de objetivos + movimientos recientes.
// Conectado a usePatrimonio: ya no hay objetivos ni montos de mentira.
// ==========================================================================

// En el resumen se ven los primeros objetivos; el resto, en "Todos los objetivos".
const MAX_OBJETIVOS_RESUMEN = 3;

function formatearMonto(numero) {
  return "$ " + numero.toLocaleString("es-AR");
}

// "ahorro-agregado" -> "Ahorro agregado" (contenido, formato normal)
function formatearTipo(tipo) {
  const texto = tipo.replace("-", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function Ahorros({
  objetivos,
  ahorrosTotal,
  movimientos,
  disponible,
  parametros,
  crearObjetivo,
  editarObjetivo,
  agregarAhorro,
  retirarAhorro,
  usarAhorro,
  eliminarObjetivo,
  onVerMovimientos,
}) {
  // Qué se ve y qué está abierto (todo se maneja con estado, sin Router):
  const [vista, setVista] = useState("resumen"); // "resumen" | "todos"
  const [panelAbierto, setPanelAbierto] = useState(null); // null | "crear" | "agregar"
  const [objetivoAbiertoId, setObjetivoAbiertoId] = useState(parametros.objetivoId ?? null);
  const [iconoObjetivo, setIconoObjetivo] = useState(ICONOS[0]);

  const [nombreObjetivo, setNombreObjetivo] = useState("");
  const [montoObjetivo, setMontoObjetivo] = useState("");

  const [objetivoElegido, setObjetivoElegido] = useState(objetivos[0]?.id ?? "");
  const [montoAhorro, setMontoAhorro] = useState("");
  const [descripcionAhorro, setDescripcionAhorro] = useState("");

  // Un mensaje de error por campo (se muestra justo debajo de cada uno).
  const [errorNombre, setErrorNombre] = useState("");
  const [errorMontoObjetivo, setErrorMontoObjetivo] = useState("");
  const [errorMontoAhorro, setErrorMontoAhorro] = useState("");

  function cerrarPanel() {
    setPanelAbierto(null);
  }

  function manejarCrearObjetivo(evento) {
    evento.preventDefault();

    const mensajeNombre = nombreObjetivo.trim() === "" ? "Ingresá el nombre del objetivo." : "";
    const mensajeMonto = Number(montoObjetivo) <= 0 ? "Ingresá un monto mayor a cero." : "";
    setErrorNombre(mensajeNombre);
    setErrorMontoObjetivo(mensajeMonto);
    if (mensajeNombre !== "" || mensajeMonto !== "") return;

    crearObjetivo({ nombre: nombreObjetivo.trim(), montoObjetivo: Number(montoObjetivo), icono: iconoObjetivo });

    setNombreObjetivo("");
    setMontoObjetivo("");
    setIconoObjetivo(ICONOS[0]);
    setErrorNombre("");
    setErrorMontoObjetivo("");
    cerrarPanel();
  }

  function manejarAgregarAhorro(evento) {
    evento.preventDefault();

    if (montoAhorro === "" || Number(montoAhorro) <= 0) {
      setErrorMontoAhorro("Ingresá un monto mayor a cero.");
      return;
    }
    if (objetivoElegido === "") return;
    if (Number(montoAhorro) > disponible) {
      setErrorMontoAhorro("⚠ No tenés dinero suficiente disponible.");
      return;
    }

    agregarAhorro({
      objetivoId: Number(objetivoElegido),
      monto: Number(montoAhorro),
      descripcion: descripcionAhorro,
    });

    setMontoAhorro("");
    setDescripcionAhorro("");
    setErrorMontoAhorro("");
    cerrarPanel();
  }

  const totalObjetivo = objetivos.reduce((suma, obj) => suma + obj.montoObjetivo, 0);
  const progresoGeneral = totalObjetivo === 0 ? 0 : Math.round((ahorrosTotal / totalObjetivo) * 100);

  const movimientosDeAhorro = movimientos
    .filter((mov) => mov.tipo.startsWith("ahorro"))
    .slice(0, 4);

  const objetivoAbierto = objetivos.find((obj) => obj.id === objetivoAbiertoId);

  const modalCrear = panelAbierto === "crear" && (
    <Modal titulo="Crear objetivo" descripcion="Creá un objetivo para organizar tus ahorros" onCerrar={cerrarPanel} conCerrar>
      <form id="form-crear-objetivo" onSubmit={manejarCrearObjetivo} noValidate>
        <CampoFormulario
          id="objetivo-nombre"
          etiqueta="Nombre del objetivo"
          placeholder="Ej. Viaje a Brasil"
          valor={nombreObjetivo}
          onCambio={(nuevo) => {
            setNombreObjetivo(nuevo);
            setErrorNombre("");
          }}
          error={errorNombre}
        />
        <CampoFormulario
          id="objetivo-monto"
          etiqueta="Monto objetivo"
          tipo="number"
          placeholder="$ 0"
          min="0"
          step="1"
          valor={montoObjetivo}
          onCambio={(nuevo) => {
            setMontoObjetivo(nuevo);
            setErrorMontoObjetivo("");
          }}
          error={errorMontoObjetivo}
        />
        <SelectorIcono valor={iconoObjetivo} onCambio={setIconoObjetivo} />
        <div className="modal__acciones modal__acciones--separadas">
          <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarPanel}>Cancelar</button>
          <button type="submit" className="btn btn--primario">Crear objetivo</button>
        </div>
      </form>
    </Modal>
  );

  // ---- Pantalla "Todos los objetivos" -------------------------------------
  if (vista === "todos") {
    return (
      <main className="main" id="contenido">
        <section className="pagina-header pagina-header--con-acciones">
          <div className="pagina-header__texto">
            <h1 className="titulo-con-volver">
              <button type="button" className="panel__volver" aria-label="Volver a Ahorros" onClick={() => setVista("resumen")}>
                <IconoVolver />
              </button>
              Todos los objetivos
            </h1>
            <p>
              {objetivos.length === 0
                ? "Todavía no tenés ningún objetivo"
                : `${objetivos.length} ${objetivos.length === 1 ? "objetivo" : "objetivos"}`}
            </p>
          </div>
          {objetivos.length > 0 && (
            <div className="pagina-header__acciones">
              <button type="button" className="btn btn--primario" onClick={() => setPanelAbierto("crear")}>
                + Crear objetivo
              </button>
            </div>
          )}
        </section>

        {objetivos.length === 0 ? (
          <section className="estado-vacio" style={{ marginTop: "var(--espacio-6)" }}>
            <div className="estado-vacio__icono">!</div>
            <p className="estado-vacio__titulo">No hay objetivos</p>
            <p className="estado-vacio__subtitulo">Todavía no creaste ningún objetivo</p>
            <button type="button" className="btn btn--primario" onClick={() => setPanelAbierto("crear")}>
              + Crear objetivo
            </button>
          </section>
        ) : (
          <div className="grilla-objetivos">
            {objetivos.map((obj) => (
              <TarjetaObjetivo key={obj.id} objetivo={obj} onAbrir={setObjetivoAbiertoId} />
            ))}
          </div>
        )}

        {modalCrear}
        {objetivoAbierto && renderPanelObjetivo()}
      </main>
    );
  }

  function renderPanelObjetivo() {
    return (
      <PanelObjetivo
        key={objetivoAbierto.id}
        objetivo={objetivoAbierto}
        disponible={disponible}
        onCerrar={() => setObjetivoAbiertoId(null)}
        onVerMovimientos={(id) => onVerMovimientos({ tipo: "ahorro", objetivoId: id })}
        agregarAhorro={agregarAhorro}
        retirarAhorro={retirarAhorro}
        usarAhorro={usarAhorro}
        editarObjetivo={editarObjetivo}
        eliminarObjetivo={eliminarObjetivo}
      />
    );
  }

  return (
    <main className="main" id="contenido">
      <section className="pagina-header pagina-header--con-acciones">
        <div className="pagina-header__texto">
          <h1>Ahorros</h1>
          <p>Organizá tus ahorros y seguí el progreso de tus objetivos</p>
        </div>
        <div className="pagina-header__acciones">
          <button type="button" className="btn btn--secundario" onClick={() => setPanelAbierto("crear")}>
            + Crear objetivo
          </button>
          <button type="button" className="btn btn--primario" onClick={() => setPanelAbierto("agregar")}>
            + Agregar ahorro
          </button>
        </div>
      </section>

      <section className="tarjetas-resumen">
        <div className="tarjeta-stat">
          <span className="etiqueta">Total ahorrado</span>
          <span className="valor">{formatearMonto(ahorrosTotal)}</span>
          <span className="detalle">Dinero reservado en ahorros</span>
        </div>
        <div className="tarjeta-stat">
          <span className="etiqueta">Objetivos activos</span>
          <span className="valor">{objetivos.length}</span>
          <span className="detalle">Objetivos en curso</span>
        </div>
        <div className="tarjeta-stat">
          <span className="etiqueta">Progreso general</span>
          <span className="valor">{progresoGeneral}%</span>
          <span className="detalle">Del total de tus objetivos</span>
        </div>
      </section>

      <section>
        <div className="seccion-header">
          <h2>Mis objetivos</h2>
          {objetivos.length > 0 && (
            <button type="button" className="link" onClick={() => setVista("todos")}>Ver todos <IconoAvanzar /></button>
          )}
        </div>

        {objetivos.length === 0 ? (
          <section className="estado-vacio" style={{ marginTop: "var(--espacio-4)" }}>
            <div className="estado-vacio__icono">!</div>
            <p className="estado-vacio__titulo">Todavía no tenés objetivos</p>
            <p className="estado-vacio__subtitulo">Creá uno para empezar a organizar tus ahorros</p>
          </section>
        ) : (
          <div className="grilla-objetivos">
            {objetivos.slice(0, MAX_OBJETIVOS_RESUMEN).map((obj) => (
              <TarjetaObjetivo key={obj.id} objetivo={obj} onAbrir={setObjetivoAbiertoId} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="seccion-header">
          <h2>Movimientos recientes</h2>
          {movimientosDeAhorro.length > 0 && (
            <button type="button" className="link" onClick={() => onVerMovimientos({ tipo: "ahorro" })}>Ver todos <IconoAvanzar /></button>
          )}
        </div>

        {movimientosDeAhorro.length === 0 ? (
          <p className="subtitulo" style={{ marginTop: "var(--espacio-3)" }}>
            Todavía no registraste movimientos de ahorro
          </p>
        ) : (
          <div className="lista-recientes" style={{ marginTop: "var(--espacio-4)" }}>
            {movimientosDeAhorro.map((mov) => {
              const esPositivo = mov.tipo === "ahorro-agregado";
              return (
                <button
                  type="button"
                  className="recientes-item recientes-item--clic"
                  key={mov.id}
                  onClick={() => onVerMovimientos({ tipo: "ahorro", objetivoId: mov.objetivoId ?? undefined })}
                >
                  <span
                    className={
                      "recientes-item__icono " +
                      (esPositivo ? "recientes-item__icono--positivo" : "recientes-item__icono--negativo")
                    }
                    aria-hidden="true"
                  >
                    {esPositivo ? "+" : "−"}
                  </span>
                  <span className="recientes-item__info">
                    <span className="recientes-item__titulo">{formatearTipo(mov.tipo)}</span>
                    <span className="recientes-item__subtitulo">{mov.categoria}</span>
                  </span>
                  <span
                    className={
                      "recientes-item__monto " +
                      (esPositivo ? "recientes-item__monto--positivo" : "recientes-item__monto--negativo")
                    }
                  >
                    {formatearMonto(mov.monto)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {modalCrear}
      {objetivoAbierto && renderPanelObjetivo()}

      <Overlay visible={panelAbierto === "agregar"} onClick={cerrarPanel} />

      <PanelLateral
        abierto={panelAbierto === "agregar"}
        titulo="Agregar ahorro"
        descripcion="Reservá dinero disponible en uno de los objetivos"
        onCerrar={cerrarPanel}
        acciones={
          <>
            <button type="submit" form="form-agregar-ahorro" className="btn btn--primario">Agregar ahorro</button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarPanel}>Cancelar</button>
          </>
        }
      >
        <form id="form-agregar-ahorro" onSubmit={manejarAgregarAhorro} noValidate>
          <CampoFormulario
            id="ahorro-objetivo"
            etiqueta="Objetivo"
            opciones={objetivos.map((obj) => ({ valor: obj.id, texto: obj.nombre }))}
            valor={objetivoElegido}
            onCambio={setObjetivoElegido}
          />
          <CampoFormulario
            id="ahorro-monto"
            etiqueta="Monto a agregar"
            tipo="number"
            placeholder="$ 0"
            min="0"
            step="1"
            valor={montoAhorro}
            onCambio={(nuevo) => {
              setMontoAhorro(nuevo);
              setErrorMontoAhorro("");
            }}
            error={errorMontoAhorro}
          />
          {errorMontoAhorro.startsWith("⚠") && (
            <p className="campo__ayuda">Disponible: {formatearMonto(disponible)}</p>
          )}
          <CampoFormulario
            id="ahorro-descripcion"
            etiqueta="Descripción (opcional)"
            placeholder="Ej. Parte de mi sueldo mensual"
            valor={descripcionAhorro}
            onCambio={setDescripcionAhorro}
          />
        </form>
      </PanelLateral>
    </main>
  );
}

export default Ahorros;
