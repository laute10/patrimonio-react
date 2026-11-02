import { Fragment, useState } from "react";
import Overlay from "./Overlay";
import PanelLateral from "./PanelLateral";
import Modal from "./Modal";
import FormularioMovimiento from "./FormularioMovimiento";
import { IconoTipoMovimiento } from "./Iconos";
import {
  clasificar,
  etiquetaClase,
  formatearMonto,
  formatearFechaCorta,
  formatearTipo,
} from "../utils/formato";
import { etiquetaPeriodo, deudaPeriodo } from "../hooks/usePatrimonio";

// ==========================================================================
// PanelMovimiento - detalle de un movimiento en un panel lateral.
// Según el tipo cambia lo que se puede hacer (diseño de Figma):
//   - ingreso / gasto: se pueden editar y eliminar desde acá.
//   - ahorro: informa que se gestiona desde Ahorros y lleva al objetivo.
//   - tarjeta: informa que se gestiona desde Tarjetas y lleva a la tarjeta.
// Estado propio: vista ("detalle" | "editar"), modal de eliminar y un aviso.
// ==========================================================================

function buscarConsumo(tarjetas, consumoId) {
  for (const tarjeta of tarjetas) {
    for (const periodo of tarjeta.periodos) {
      const consumo = periodo.consumos.find((c) => c.id === consumoId);
      if (consumo) return { tarjeta, periodo, consumo };
    }
  }
  return null;
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="detalle-fila">
      <span className="detalle-fila__etiqueta">{etiqueta}</span>
      <span className="detalle-fila__valor">{valor}</span>
    </div>
  );
}

function PanelMovimiento({
  categoriasGasto,
  agregarCategoria,
  categoriasIngreso,
  agregarCategoriaIngreso,
  movimiento,
  disponible,
  tarjetas,
  onCerrar,
  onVerObjetivo,
  onVerTarjetas,
  editarMovimiento,
  eliminarMovimiento,
}) {
  const [vista, setVista] = useState("detalle");
  const [modalEliminar, setModalEliminar] = useState(false);
  const [aviso, setAviso] = useState("");
  // true mientras se espera la respuesta de la API (botones deshabilitados).
  const [guardando, setGuardando] = useState(false);

  const clase = clasificar(movimiento.tipo);
  const editable = movimiento.tipo === "ingreso" || movimiento.tipo === "gasto";
  const signo = movimiento.signo === "+" ? "+ " : movimiento.signo === "-" ? "- " : "";
  const datosConsumo = clase === "tarjeta" ? buscarConsumo(tarjetas, movimiento.consumoId) : null;

  const subtitulo = {
    ingreso: "Ingreso recibido",
    gasto: "Gasto realizado",
    ahorro: formatearTipo(movimiento.tipo),
    tarjeta: "Compra con tarjeta",
  }[clase];

  // editarMovimiento y eliminarMovimiento (del hook) son async: si la API
  // responde un error, lanzan su mensaje (por ejemplo, que el cambio dejaría
  // el disponible en negativo) y se muestra en el aviso.
  async function guardar(datos) {
    if (guardando) return;
    setGuardando(true);
    setAviso("");
    try {
      await editarMovimiento({ id: movimiento.id, ...datos });
      setVista("detalle");
    } catch (error) {
      setAviso(error.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarEliminar() {
    if (guardando) return;
    setGuardando(true);
    setAviso("");
    try {
      await eliminarMovimiento(movimiento.id);
      onCerrar();
    } catch (error) {
      setAviso(error.message);
      setModalEliminar(false);
    } finally {
      setGuardando(false);
    }
  }

  const textoTipo = movimiento.tipo === "ingreso" ? "ingreso" : "gasto";

  return (
    <>
      <Overlay visible={true} onClick={onCerrar} />

      {vista === "editar" ? (
        <PanelLateral
          abierto={true}
          titulo={`Editar ${textoTipo}`}
          descripcion={`Modificá la información de este ${textoTipo}`}
          onCerrar={onCerrar}
          onVolver={() => { setAviso(""); setVista("detalle"); }}
          acciones={
            <Fragment key="editar">
              <button type="submit" form="form-editar-movimiento" className="btn btn--primario" disabled={guardando}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => setVista("detalle")}>Cancelar</button>
            </Fragment>
          }
        >
          <FormularioMovimiento
            id="form-editar-movimiento"
            categorias={movimiento.tipo === "ingreso" ? categoriasIngreso : categoriasGasto}
            onNuevaCategoria={movimiento.tipo === "ingreso" ? agregarCategoriaIngreso : agregarCategoria}
            maximo={movimiento.tipo === "gasto" ? disponible + movimiento.monto : undefined}
            inicial={{ categoria: movimiento.categoria, monto: movimiento.monto, descripcion: movimiento.descripcion }}
            onRegistrar={guardar}
          />
          {aviso !== "" && <p className="campo__error" role="alert">{aviso}</p>}
        </PanelLateral>
      ) : (
        <PanelLateral
          abierto={true}
          titulo="Detalle del movimiento"
          onCerrar={onCerrar}
          acciones={
            editable ? (
              <Fragment key="detalle">
                <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => setVista("editar")}>Editar movimiento</button>
                <button type="button" className="btn btn--destructivo" onClick={() => setModalEliminar(true)}>Eliminar movimiento</button>
              </Fragment>
            ) : null
          }
        >
          <div className="detalle-mov__cabecera">
            <span className={`item-movimiento__icono item-movimiento__icono--${clase} detalle-mov__icono`} aria-hidden="true">
              <IconoTipoMovimiento tipo={clase} tamano={22} />
            </span>
            <div>
              <h3 className="detalle-mov__titulo">{datosConsumo ? datosConsumo.consumo.categoria : movimiento.categoria}</h3>
              <p className="detalle-mov__clase">{etiquetaClase(movimiento.tipo)}</p>
            </div>
          </div>

          <p className={`detalle-mov__monto item-movimiento__monto--${clase}`}>
            {signo}{formatearMonto(movimiento.monto)}
          </p>
          <p className="detalle-mov__subtitulo">{subtitulo}</p>

          <div className="detalle-filas">
            <Fila etiqueta="Fecha" valor={formatearFechaCorta(movimiento.fecha)} />
            {clase === "ahorro" && <Fila etiqueta="Objetivo" valor={movimiento.categoria} />}
            {(clase === "ingreso" || clase === "gasto") && <Fila etiqueta="Categoría" valor={movimiento.categoria} />}
            {clase === "tarjeta" && datosConsumo && (
              <>
                <Fila etiqueta="Categoría" valor={datosConsumo.consumo.categoria} />
                <Fila etiqueta="Tarjeta" valor={datosConsumo.tarjeta.nombre} />
              </>
            )}
            {clase === "tarjeta" && !datosConsumo && <Fila etiqueta="Detalle" valor={movimiento.categoria} />}
            <Fila etiqueta="Descripción" valor={movimiento.descripcion || "Sin descripción"} />
            {datosConsumo && (
              <>
                <Fila
                  etiqueta="Estado"
                  valor={datosConsumo.periodo.estado === "PAGADA" ? "Pagado" : "Pendiente de pago"}
                />
                <Fila
                  etiqueta="Resumen"
                  valor={`${etiquetaPeriodo(datosConsumo.periodo)} (${formatearMonto(deudaPeriodo(datosConsumo.periodo))})`}
                />
              </>
            )}
          </div>

          {aviso !== "" && <p className="campo__error" role="alert">{aviso}</p>}

          {clase === "ahorro" && (
            <div className="detalle-vinculo">
              <p className="detalle-vinculo__titulo"><span className="detalle-vinculo__icono" aria-hidden="true">!</span> Movimiento vinculado a ahorros</p>
              <p className="detalle-vinculo__texto">
                Este movimiento fue generado desde un objetivo de ahorro y debe gestionarse desde Ahorros
              </p>
              {movimiento.objetivoId !== null && movimiento.objetivoId !== undefined && (
                <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => onVerObjetivo(movimiento.objetivoId)}>
                  Ver objetivo {movimiento.categoria}
                </button>
              )}
            </div>
          )}

          {clase === "tarjeta" && (
            <div className="detalle-vinculo">
              <p className="detalle-vinculo__titulo"><span className="detalle-vinculo__icono" aria-hidden="true">!</span> Movimiento vinculado a tarjeta</p>
              <p className="detalle-vinculo__texto">
                Este movimiento fue generado desde una tarjeta y debe gestionarse desde Tarjetas
              </p>
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={onVerTarjetas}>
                {datosConsumo ? `Ver tarjeta ${datosConsumo.tarjeta.nombre}` : "Ver tarjetas"}
              </button>
            </div>
          )}
        </PanelLateral>
      )}

      {modalEliminar && (
        <Modal titulo="¿Eliminar movimiento?" onCerrar={() => setModalEliminar(false)}>
          <p className="modal__texto modal__texto--junto">
            Vas a eliminar este {textoTipo} de {formatearMonto(movimiento.monto)}
          </p>
          <p className="modal__texto">Esta acción revertirá su impacto en el patrimonio</p>
          <div className="modal__detalle">
            <span>{movimiento.categoria}<br />{etiquetaClase(movimiento.tipo)} - {formatearFechaCorta(movimiento.fecha)}</span>
            <span>{signo}{formatearMonto(movimiento.monto)}</span>
          </div>
          <div className="modal__acciones">
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={() => setModalEliminar(false)} disabled={guardando}>Cancelar</button>
            <button type="button" className="btn btn--destructivo" onClick={confirmarEliminar} disabled={guardando}>
              {guardando ? "Guardando…" : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default PanelMovimiento;
