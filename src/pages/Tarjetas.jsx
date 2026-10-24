import { useState } from "react";
import Overlay from "../components/Overlay";
import PanelLateral from "../components/PanelLateral";
import CampoFormulario from "../components/CampoFormulario";
import { deudaPeriodo, etiquetaPeriodo, etiquetaCorta } from "../hooks/usePatrimonio";

// ==========================================================================
// Tarjetas - lista de tarjetas (solo período ABIERTO) e historial de
// períodos (sin ABIERTA). Sigue el diseño de Figma:
//   - "Resumen de tarjeta" es un PANEL lateral (frames RESUMEN - CERRAR /
//     PAGAR / PAGADO)
//   - "Agregar consumo" y "Editar consumo" son otros paneles, con flecha
//     "←" para volver al resumen
//   - cerrar período, pagar período y eliminar consumo son MODALES
//
// Estado propio de la página (solo de pantalla, no financiero):
//   - resumenActual: qué período se está mirando { tarjetaId, periodoId }
//   - panelAbierto: null | "resumen" | "consumo" | "tarjeta"
//   - modal: null | "cerrar" | "pagar" | "eliminar"
// Los datos financieros vienen siempre por props desde usePatrimonio.
// ==========================================================================

const CATEGORIAS_CONSUMO = ["Supermercado", "Transporte", "Facultad", "Ocio"];

function formatearMonto(numero) {
  return "$ " + numero.toLocaleString("es-AR");
}

function claseBadge(estado) {
  return "badge badge--" + estado.toLowerCase();
}

// Más nuevo primero: mayor año y mayor mes arriba
function valorOrden(periodo) {
  return periodo.anio * 12 + periodo.mes;
}

function Tarjetas({
  tarjetas,
  crearTarjeta,
  agregarConsumoTarjeta,
  editarConsumoTarjeta,
  eliminarConsumoTarjeta,
  cerrarPeriodo,
  pagarPeriodo,
}) {
  const [resumenActual, setResumenActual] = useState(null); // { tarjetaId, periodoId }
  const [panelAbierto, setPanelAbierto] = useState(null);
  const [modal, setModal] = useState(null);
  const [errorModal, setErrorModal] = useState("");

  const [filtroTarjeta, setFiltroTarjeta] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Formulario "Agregar tarjeta"
  const [nombreTarjeta, setNombreTarjeta] = useState("");
  const [limiteTarjeta, setLimiteTarjeta] = useState("");
  const [errorTarjeta, setErrorTarjeta] = useState("");

  // Formulario de consumo (sirve para agregar y para editar)
  const [consumoEditando, setConsumoEditando] = useState(null); // null = agregando
  const [categoriaConsumo, setCategoriaConsumo] = useState(CATEGORIAS_CONSUMO[0]);
  const [montoConsumo, setMontoConsumo] = useState("");
  const [descripcionConsumo, setDescripcionConsumo] = useState("");
  const [errorConsumo, setErrorConsumo] = useState("");

  // -- Datos derivados del resumen elegido ---------------------------------
  // Se buscan en los datos actuales para que el panel siempre esté al día.

  const tarjetaResumen = resumenActual && tarjetas.find((t) => t.id === resumenActual.tarjetaId);
  const periodoResumen =
    tarjetaResumen && tarjetaResumen.periodos.find((p) => p.id === resumenActual.periodoId);

  // -- Abrir / cerrar ------------------------------------------------------

  function periodoAbierto(tarjeta) {
    return tarjeta.periodos.find((p) => p.estado === "ABIERTA");
  }

  function abrirResumen(tarjetaId, periodoId) {
    setResumenActual({ tarjetaId, periodoId });
    setPanelAbierto("resumen");
  }

  // La X y el overlay cierran el panel, pero NO borran resumenActual:
  // así el contenido no desaparece mientras el panel se desliza hacia afuera.
  function cerrarPanel() {
    setPanelAbierto(null);
    setModal(null);
    setErrorModal("");
  }

  // La flecha "←" y "Cancelar" de los paneles de consumo vuelven al resumen.
  function volverAlResumen() {
    setPanelAbierto("resumen");
    setModal(null);
    setErrorModal("");
  }

  function cerrarModal() {
    setModal(null);
    setErrorModal("");
  }

  // -- Agregar tarjeta -----------------------------------------------------

  function manejarAgregarTarjeta(evento) {
    evento.preventDefault();
    if (nombreTarjeta.trim() === "") {
      setErrorTarjeta("Ingresá el nombre de la tarjeta.");
      return;
    }
    crearTarjeta({ nombre: nombreTarjeta.trim() });
    setNombreTarjeta("");
    setLimiteTarjeta("");
    setErrorTarjeta("");
    cerrarPanel();
  }

  // -- Consumos ------------------------------------------------------------

  function abrirPanelAgregarConsumo() {
    setConsumoEditando(null);
    setCategoriaConsumo(CATEGORIAS_CONSUMO[0]);
    setMontoConsumo("");
    setDescripcionConsumo("");
    setErrorConsumo("");
    setPanelAbierto("consumo");
  }

  function abrirPanelEditarConsumo(consumo) {
    setConsumoEditando(consumo.id);
    setCategoriaConsumo(consumo.categoria);
    setMontoConsumo(String(consumo.monto));
    setDescripcionConsumo(consumo.descripcion);
    setErrorConsumo("");
    setPanelAbierto("consumo");
  }

  function manejarGuardarConsumo(evento) {
    evento.preventDefault();
    if (montoConsumo === "" || Number(montoConsumo) <= 0) {
      setErrorConsumo("Ingresá un monto mayor a cero.");
      return;
    }

    const datos = {
      tarjetaId: resumenActual.tarjetaId,
      categoria: categoriaConsumo,
      monto: Number(montoConsumo),
      descripcion: descripcionConsumo.trim(),
    };

    if (consumoEditando === null) {
      agregarConsumoTarjeta(datos);
    } else {
      editarConsumoTarjeta({ ...datos, consumoId: consumoEditando });
    }
    volverAlResumen();
  }

  function confirmarEliminarConsumo() {
    eliminarConsumoTarjeta({ tarjetaId: resumenActual.tarjetaId, consumoId: consumoEditando });
    volverAlResumen();
  }

  // -- Cerrar y pagar período ---------------------------------------------

  function confirmarCerrarPeriodo() {
    cerrarPeriodo(resumenActual.tarjetaId);
    // El período pasó a CERRADA y se abrió uno nuevo: cerramos el panel.
    cerrarPanel();
  }

  function confirmarPagarPeriodo() {
    const pagado = pagarPeriodo(resumenActual.tarjetaId, resumenActual.periodoId);
    if (!pagado) {
      setErrorModal("No tenés dinero disponible suficiente para pagar este período");
      return;
    }
    // Volvemos al resumen, que ahora se ve como PAGADA (sin botón de pago).
    cerrarModal();
  }

  // -- Historial: períodos que NO están abiertos, más nuevos primero ------

  const historial = tarjetas
    .flatMap((tarjeta) =>
      tarjeta.periodos
        .filter((p) => p.estado !== "ABIERTA")
        .map((p) => ({ tarjeta, periodo: p }))
    )
    .filter((item) => filtroTarjeta === "todas" || String(item.tarjeta.id) === filtroTarjeta)
    .filter((item) => filtroEstado === "todos" || item.periodo.estado === filtroEstado)
    .sort((a, b) => valorOrden(b.periodo) - valorOrden(a.periodo));

  const deudaResumen = periodoResumen ? deudaPeriodo(periodoResumen) : 0;
  // Solo el nombre del mes ("Septiembre"), como dicen los modales del diseño.
  const mesResumen = periodoResumen ? etiquetaPeriodo(periodoResumen).split(" ")[0] : "";
  const consumoAEliminar =
    periodoResumen && periodoResumen.consumos.find((c) => c.id === consumoEditando);
  const esAbierta = periodoResumen && periodoResumen.estado === "ABIERTA";
  const esCerrada = periodoResumen && periodoResumen.estado === "CERRADA";

  return (
    <main className="main" id="contenido">
      <section className="pagina-header">
        <h1>Tarjetas</h1>
        <p className="subtitulo">Administrá tus tarjetas y sus períodos</p>
        <button
          type="button"
          className="btn btn--primario"
          style={{ width: "200px", marginTop: "var(--espacio-2)" }}
          onClick={() => setPanelAbierto("tarjeta")}
        >
          + Agregar tarjeta
        </button>
      </section>

      <section>
        <div className="seccion-header">
          <h2>Mis tarjetas</h2>
        </div>

        {tarjetas.length === 0 ? (
          <section className="estado-vacio" style={{ marginTop: "var(--espacio-4)" }}>
            <div className="estado-vacio__icono">!</div>
            <p className="estado-vacio__titulo">Todavía no tenés tarjetas</p>
            <p className="estado-vacio__subtitulo">Agregá una para empezar a registrar consumos</p>
          </section>
        ) : (
          <div className="grilla-tarjetas">
            {tarjetas.map((tarjeta) => {
              const abierto = periodoAbierto(tarjeta);
              const pendientes = tarjeta.periodos.filter((p) => p.estado === "CERRADA").length;

              return (
                <div className="tarjeta-principal" key={tarjeta.id}>
                  <div className="tarjeta-principal__encabezado">
                    <div>
                      <p className="tarjeta-principal__nombre">{tarjeta.nombre}</p>
                      <p className="tarjeta-principal__periodo">
                        Período {abierto ? etiquetaCorta(abierto) : "-"}
                      </p>
                    </div>
                    <span className="badge badge--abierta">Abierta</span>
                  </div>

                  <div className="tarjeta-principal__deuda">
                    <span className="etiqueta">Deuda</span>
                    <span className="monto">{formatearMonto(abierto ? deudaPeriodo(abierto) : 0)}</span>
                  </div>

                  {pendientes > 0 && (
                    <p className="tarjeta-principal__aviso">
                      {pendientes === 1
                        ? "1 período pendiente de pago"
                        : `${pendientes} períodos pendientes de pago`}
                    </p>
                  )}

                  <div className="tarjeta-principal__pie">
                    <button
                      type="button"
                      className="btn btn--primario btn--chico"
                      onClick={() => abrirResumen(tarjeta.id, abierto.id)}
                    >
                      Ver resumen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="seccion-header">
          <h2>Historial de períodos</h2>
        </div>

        <div className="filtros-historial">
          <select
            className="select-filtro"
            aria-label="Filtrar por tarjeta"
            value={filtroTarjeta}
            onChange={(e) => setFiltroTarjeta(e.target.value)}
          >
            <option value="todas">Todas las tarjetas</option>
            {tarjetas.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.nombre}</option>
            ))}
          </select>

          <select
            className="select-filtro"
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="CERRADA">Cerradas</option>
            <option value="PAGADA">Pagadas</option>
          </select>
        </div>

        {historial.length === 0 ? (
          <p className="subtitulo" style={{ marginTop: "var(--espacio-3)" }}>
            No hay períodos para mostrar
          </p>
        ) : (
          <div>
            {historial.map(({ tarjeta, periodo }) => (
              <div
                className="historial-item"
                key={periodo.id}
                style={{ cursor: "pointer" }}
                onClick={() => abrirResumen(tarjeta.id, periodo.id)}
              >
                <div className="historial-item__info">
                  <span className="historial-item__nombre">{tarjeta.nombre}</span>
                  <span className="historial-item__periodo">{etiquetaPeriodo(periodo)}</span>
                </div>
                <div className="historial-item__derecha">
                  <span className={claseBadge(periodo.estado)}>{periodo.estado}</span>
                  <span className="historial-item__monto">{formatearMonto(deudaPeriodo(periodo))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Overlay visible={panelAbierto !== null || modal !== null} onClick={cerrarPanel} />

      {/* ---------- Panel: Agregar tarjeta ---------- */}
      <PanelLateral
        abierto={panelAbierto === "tarjeta"}
        titulo="Agregar tarjeta"
        descripcion="Registrá una tarjeta para comenzar a administrar sus períodos y consumos"
        onCerrar={cerrarPanel}
        acciones={
          <>
            <button type="submit" form="form-agregar-tarjeta" className="btn btn--primario">
              Agregar tarjeta
            </button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarPanel}>
              Cancelar
            </button>
          </>
        }
      >
        <form id="form-agregar-tarjeta" onSubmit={manejarAgregarTarjeta} noValidate>
          <CampoFormulario
            id="tarjeta-nombre"
            etiqueta="Nombre de la tarjeta"
            placeholder="Ej. Visa"
            valor={nombreTarjeta}
            onCambio={(nuevo) => {
              setNombreTarjeta(nuevo);
              setErrorTarjeta("");
            }}
            error={errorTarjeta}
          />
          <CampoFormulario
            id="tarjeta-limite"
            etiqueta="Límite de crédito"
            tipo="number"
            placeholder="$ 0"
            min="0"
            step="1"
            valor={limiteTarjeta}
            onCambio={setLimiteTarjeta}
          />
        </form>
      </PanelLateral>

      {/* ---------- Panel: Resumen de tarjeta ---------- */}
      <PanelLateral
        abierto={panelAbierto === "resumen"}
        titulo="Resumen de tarjeta"
        onCerrar={cerrarPanel}
        acciones={
          <>
            {esAbierta && (
              <button type="button" className="btn btn--primario" onClick={() => setModal("cerrar")}>
                Cerrar período
              </button>
            )}
            {esCerrada && (
              <button type="button" className="btn btn--primario" onClick={() => setModal("pagar")}>
                Pagar período
              </button>
            )}
          </>
        }
      >
        {tarjetaResumen && periodoResumen && (
          <>
            <p className="resumen-panel__nombre">{tarjetaResumen.nombre}</p>
            <p className="resumen-panel__periodo">
              Período {etiquetaCorta(periodoResumen)} - {periodoResumen.estado}
            </p>

            <p className="resumen-panel__deuda-etiqueta">Deuda actual</p>
            <p className="resumen-panel__deuda">{formatearMonto(deudaResumen)}</p>

            {esAbierta && (
              <button type="button" className="btn btn--primario" style={{ width: "100%" }} onClick={abrirPanelAgregarConsumo}>
                Agregar consumo
              </button>
            )}

            <p className="resumen-panel__subtitulo">Consumos del período</p>

            {periodoResumen.consumos.length === 0 ? (
              <p className="consumo-fila__descripcion">Este período todavía no tiene consumos</p>
            ) : (
              periodoResumen.consumos.map((consumo) => {
                const contenido = (
                  <>
                    <span>
                      <span className="consumo-fila__categoria">{consumo.categoria}</span>
                      <span className="consumo-fila__descripcion">{consumo.descripcion}</span>
                    </span>
                    <span className="consumo-fila__monto">{formatearMonto(consumo.monto)}</span>
                  </>
                );

                // Solo el período ABIERTO permite editar: ahí cada fila es un botón.
                return esAbierta ? (
                  <button
                    type="button"
                    className="consumo-fila"
                    key={consumo.id}
                    onClick={() => abrirPanelEditarConsumo(consumo)}
                  >
                    {contenido}
                  </button>
                ) : (
                  <div className="consumo-fila" key={consumo.id}>
                    {contenido}
                  </div>
                );
              })
            )}
          </>
        )}
      </PanelLateral>

      {/* ---------- Panel: Agregar / Editar consumo ---------- */}
      <PanelLateral
        abierto={panelAbierto === "consumo"}
        titulo={consumoEditando === null ? "Agregar consumo" : "Editar consumo"}
        descripcion={consumoEditando === null ? "Registrá un consumo realizado con tu tarjeta" : undefined}
        onVolver={volverAlResumen}
        onCerrar={cerrarPanel}
        acciones={
          <>
            <button type="submit" form="form-consumo" className="btn btn--primario">
              {consumoEditando === null ? "Agregar consumo" : "Guardar cambios"}
            </button>
            <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={volverAlResumen}>
              Cancelar
            </button>
            {consumoEditando !== null && (
              <button type="button" className="btn btn--destructivo" onClick={() => setModal("eliminar")}>
                Eliminar consumo
              </button>
            )}
          </>
        }
      >
        <form id="form-consumo" onSubmit={manejarGuardarConsumo} noValidate>
          <CampoFormulario
            id="consumo-categoria"
            etiqueta="Categoría"
            opciones={CATEGORIAS_CONSUMO}
            valor={categoriaConsumo}
            onCambio={setCategoriaConsumo}
          />
          <CampoFormulario
            id="consumo-monto"
            etiqueta="Monto"
            tipo="number"
            placeholder="$ 0"
            min="0"
            step="1"
            valor={montoConsumo}
            onCambio={(nuevo) => {
              setMontoConsumo(nuevo);
              setErrorConsumo("");
            }}
            error={errorConsumo}
          />
          <CampoFormulario
            id="consumo-descripcion"
            etiqueta="Descripción (opcional)"
            placeholder="Ej. Compra de alimentos"
            valor={descripcionConsumo}
            onCambio={setDescripcionConsumo}
          />
        </form>
      </PanelLateral>

      {/* ---------- Modales de confirmación (textos del diseño en Figma) ---------- */}
      {modal === "cerrar" && periodoResumen && (
        <div className="modal">
          <div className="modal__contenido">
            <p className="modal__titulo">¿Cerrar período?</p>
            <p className="modal__texto">
              Vas a cerrar el período {mesResumen} con una deuda de {formatearMonto(deudaResumen)}. Una vez
              cerrado, no podrás agregar nuevos consumos a este período.
            </p>
            <div className="modal__acciones">
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primario" onClick={confirmarCerrarPeriodo}>
                Cerrar período
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "pagar" && periodoResumen && (
        <div className="modal">
          <div className="modal__contenido">
            <p className="modal__titulo">¿Pagar período?</p>
            <p className="modal__texto">
              Vas a pagar {formatearMonto(deudaResumen)} correspondientes al período {mesResumen} de tu
              tarjeta {tarjetaResumen.nombre}. Este pago reducirá tu patrimonio disponible.
            </p>
            {errorModal !== "" && <p className="mensaje-error">{errorModal}</p>}
            <div className="modal__acciones">
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button type="button" className="btn btn--primario" onClick={confirmarPagarPeriodo}>
                Pagar período
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "eliminar" && consumoAEliminar && (
        <div className="modal">
          <div className="modal__contenido">
            <p className="modal__titulo">¿Eliminar consumo?</p>
            <p className="modal__texto" style={{ marginBottom: "var(--espacio-4)" }}>
              Vas a eliminar el consumo de {formatearMonto(consumoAEliminar.monto)} de tu tarjeta{" "}
              {tarjetaResumen.nombre}. Esta acción devolverá ese dinero a tu dinero disponible.
            </p>
            <div className="modal__detalle">
              <span>{consumoAEliminar.categoria}</span>
              <span>{formatearMonto(consumoAEliminar.monto)}</span>
            </div>
            <div className="modal__acciones">
              <button type="button" className="btn btn--secundario btn--texto-secundario" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: "var(--color-destructivo-solido)", color: "var(--color-texto-inverso)", border: "none" }}
                onClick={confirmarEliminarConsumo}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Tarjetas;
