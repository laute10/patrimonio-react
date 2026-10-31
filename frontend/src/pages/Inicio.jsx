import { useState } from "react";
import Overlay from "../components/Overlay";
import PanelLateral from "../components/PanelLateral";
import TarjetaMini from "../components/TarjetaMini";
import MovimientoItem from "../components/MovimientoItem";
import FormularioMovimiento from "../components/FormularioMovimiento";
import { formatearMonto } from "../utils/formato";

// ==========================================================================
// Inicio - dashboard principal.
// Recibe los datos y las acciones desde usePatrimonio (vía App.jsx,
// "levantando el estado"). Los dos formularios del panel lateral son el
// mismo componente (FormularioMovimiento) con distintas props.
// ==========================================================================


function Inicio({
  categoriasGasto,
  agregarCategoria,
  categoriasIngreso,
  agregarCategoriaIngreso,
  patrimonioTotal,
  disponible,
  ahorrosTotal,
  reservaTarjeta,
  movimientos,
  registrarIngreso,
  registrarGasto,
  onVerTodos,
}) {
  const [panelAbierto, setPanelAbierto] = useState(null); // null | "gasto" | "ingreso"
  // Cada vez que se abre un panel cambia "version": como se usa de key del
  // formulario, React lo vuelve a crear vacío y sin errores viejos.
  const [version, setVersion] = useState(0);
  const [aviso, setAviso] = useState("");

  function abrirPanel(tipo) {
    setVersion(version + 1);
    setPanelAbierto(tipo);
  }

  function cerrarPanel() {
    setPanelAbierto(null);
  }

  function manejarGasto(datos) {
    registrarGasto(datos);
    setAviso("Gasto registrado: " + formatearMonto(datos.monto));
    cerrarPanel();
  }

  function manejarIngreso(datos) {
    registrarIngreso(datos);
    setAviso("Ingreso registrado: " + formatearMonto(datos.monto));
    cerrarPanel();
  }

  return (
    <main className="main" id="contenido">
      <section className="page-intro">
        <h1>Buenos días</h1>
        <p className="subtitulo">Este es el resumen de tu situación financiera</p>
      </section>

      <section className="resumen">
        <div className="resumen__total">
          <span className="etiqueta">Patrimonio total</span>
          <span className="monto">{formatearMonto(patrimonioTotal)}</span>
        </div>

        <div className="resumen__detalle">
          <TarjetaMini etiqueta="Disponible" monto={disponible} variante="disponible" />
          <TarjetaMini etiqueta="Ahorros" monto={ahorrosTotal} variante="ahorros" />
          <TarjetaMini etiqueta="Tarjeta" monto={reservaTarjeta} variante="tarjeta" />
        </div>
      </section>

      <section className="acciones">
        <h2>Registrar</h2>
        <div className="acciones__botones">
          <button type="button" className="btn btn--primario" onClick={() => abrirPanel("gasto")}>
            + Registrar gasto
          </button>
          <button type="button" className="btn btn--secundario" onClick={() => abrirPanel("ingreso")}>
            + Registrar ingreso
          </button>
        </div>
      </section>

      <section className="movimientos">
        <div className="movimientos__header">
          <h2>Últimos movimientos</h2>
          <button type="button" className="link link--boton" onClick={onVerTodos}>
            Ver todos
          </button>
        </div>

        {aviso !== "" && (
          <p className="aviso-exito" role="status">
            {aviso}
          </p>
        )}

        {movimientos.length === 0 ? (
          <section className="estado-vacio">
            <div className="estado-vacio__icono">!</div>
            <p className="estado-vacio__titulo">No hay movimientos registrados</p>
            <p className="estado-vacio__subtitulo">Registrá tu primer gasto o ingreso para empezar</p>
          </section>
        ) : (
          <ul className="movimientos__lista">
            {movimientos.slice(0, 4).map((mov) => (
              <MovimientoItem key={mov.id} movimiento={mov} />
            ))}
          </ul>
        )}
      </section>

      <Overlay visible={panelAbierto !== null} onClick={cerrarPanel} />

      <PanelLateral
        abierto={panelAbierto === "gasto"}
        titulo="Registrar gasto"
        descripcion="Registrá un nuevo gasto para actualizar tu dinero disponible"
        onCerrar={cerrarPanel}
        acciones={
          <>
            <button type="submit" form="form-gasto" className="btn btn--primario">Registrar gasto</button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarPanel}>Cancelar</button>
          </>
        }
      >
        <FormularioMovimiento
          key={"gasto-" + version}
          id="form-gasto"
          categorias={categoriasGasto}
          onNuevaCategoria={agregarCategoria}
          maximo={disponible}
          onRegistrar={manejarGasto}
        />
      </PanelLateral>

      <PanelLateral
        abierto={panelAbierto === "ingreso"}
        titulo="Registrar ingreso"
        descripcion="Registrá un nuevo ingreso para actualizar tu dinero disponible"
        onCerrar={cerrarPanel}
        acciones={
          <>
            <button type="submit" form="form-ingreso" className="btn btn--primario">Registrar ingreso</button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarPanel}>Cancelar</button>
          </>
        }
      >
        <FormularioMovimiento
          key={"ingreso-" + version}
          id="form-ingreso"
          categorias={categoriasIngreso}
          onNuevaCategoria={agregarCategoriaIngreso}
          onRegistrar={manejarIngreso}
        />
      </PanelLateral>
    </main>
  );
}

export default Inicio;
