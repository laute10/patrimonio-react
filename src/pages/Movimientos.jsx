import { useState } from "react";
import PanelMovimiento from "../components/PanelMovimiento";
import { clasificar, formatearMonto, formatearTipo } from "../utils/formato";

// ==========================================================================
// Movimientos - listado completo con:
//   - búsqueda en tiempo real,
//   - pestañas por tipo (Todos / Ingresos / Gastos / Ahorros / Tarjeta),
//   - tarjeta de "Filtros" (tipo, rango de fechas y, si el tipo es Ahorros,
//     objetivo), que se aplica con el botón "Aplicar filtros",
//   - detalle de cada movimiento en un panel lateral.
// Puede abrirse ya filtrado desde otra pantalla (por ejemplo, desde un
// objetivo): esos filtros llegan por la prop "filtroInicial".
// ==========================================================================

const TIPOS = [
  { id: "todos", texto: "Todos" },
  { id: "ingreso", texto: "Ingresos" },
  { id: "gasto", texto: "Gastos" },
  { id: "ahorro", texto: "Ahorros" },
  { id: "tarjeta", texto: "Tarjeta" },
];

function formatearFecha(fecha) {
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "long" });
}

// "2026-09-01" -> Date a las 00:00 locales (sin corrimiento de zona horaria)
function fechaDesdeCampo(texto, finDeDia) {
  if (texto === "") return null;
  const [anio, mes, dia] = texto.split("-").map(Number);
  return finDeDia ? new Date(anio, mes - 1, dia, 23, 59, 59) : new Date(anio, mes - 1, dia);
}

function Movimientos({
  movimientos,
  objetivos,
  tarjetas,
  disponible,
  filtroInicial,
  editarMovimiento,
  eliminarMovimiento,
  onVerObjetivo,
  onVerTarjetas,
}) {
  // Filtros APLICADOS (son los que filtran la lista)
  const [tipo, setTipo] = useState(filtroInicial.tipo ?? "todos");
  const [objetivoId, setObjetivoId] = useState(filtroInicial.objetivoId ?? "todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Borrador de la tarjeta de filtros (se aplica recién con el botón)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [bTipo, setBTipo] = useState("todos");
  const [bObjetivo, setBObjetivo] = useState("todos");
  const [bDesde, setBDesde] = useState("");
  const [bHasta, setBHasta] = useState("");
  const [errorFechas, setErrorFechas] = useState("");

  const [seleccionadoId, setSeleccionadoId] = useState(null);

  function alternarFiltros() {
    if (!filtrosAbiertos) {
      setBTipo(tipo);
      setBObjetivo(objetivoId);
      setBDesde(desde);
      setBHasta(hasta);
      setErrorFechas("");
    }
    setFiltrosAbiertos(!filtrosAbiertos);
  }

  function aplicarFiltros() {
    if (bDesde !== "" && bHasta !== "" && bDesde > bHasta) {
      setErrorFechas("La fecha inicial no puede ser posterior a la final.");
      return;
    }
    setTipo(bTipo);
    setObjetivoId(bTipo === "ahorro" ? bObjetivo : "todos");
    setDesde(bDesde);
    setHasta(bHasta);
    setFiltrosAbiertos(false);
  }

  function limpiarFiltros() {
    setBTipo("todos");
    setBObjetivo("todos");
    setBDesde("");
    setBHasta("");
    setErrorFechas("");
    setTipo("todos");
    setObjetivoId("todos");
    setDesde("");
    setHasta("");
  }

  function elegirPestana(nuevoTipo) {
    setTipo(nuevoTipo);
    if (nuevoTipo !== "ahorro") setObjetivoId("todos");
  }

  const texto = busqueda.toLowerCase().trim();
  const fechaDesde = fechaDesdeCampo(desde, false);
  const fechaHasta = fechaDesdeCampo(hasta, true);

  const movimientosFiltrados = movimientos.filter((mov) => {
    const coincideTipo = tipo === "todos" || clasificar(mov.tipo) === tipo;
    const coincideObjetivo = objetivoId === "todos" || mov.objetivoId === Number(objetivoId);
    const coincideTexto = (mov.categoria + " " + mov.descripcion).toLowerCase().includes(texto);
    const coincideDesde = fechaDesde === null || mov.fecha >= fechaDesde;
    const coincideHasta = fechaHasta === null || mov.fecha <= fechaHasta;
    return coincideTipo && coincideObjetivo && coincideTexto && coincideDesde && coincideHasta;
  });

  // Agrupa por día conservando el orden (más reciente primero).
  const grupos = [];
  movimientosFiltrados.forEach((mov) => {
    const clave = formatearFecha(mov.fecha);
    let grupo = grupos.find((g) => g.clave === clave);
    if (!grupo) {
      grupo = { clave, items: [] };
      grupos.push(grupo);
    }
    grupo.items.push(mov);
  });

  const objetivoFiltrado = objetivos.find((obj) => obj.id === Number(objetivoId));
  const movimientoSeleccionado = movimientos.find((mov) => mov.id === seleccionadoId);

  return (
    <main className="main" id="contenido">
      <section className="pagina-header">
        <h1>Movimientos</h1>

        <div className="barra-busqueda">
          <input
            type="text"
            className="buscador"
            placeholder="Buscar movimiento..."
            aria-label="Buscar movimiento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" className="btn--filtros" aria-expanded={filtrosAbiertos} onClick={alternarFiltros}>
            Filtros
          </button>
        </div>

        {filtrosAbiertos && (
          <div className="tarjeta-filtros">
            <h2 className="tarjeta-filtros__titulo">Filtrar movimientos</h2>
            <div className="tarjeta-filtros__campos">
              <div className="campo">
                <label htmlFor="filtro-tipo">Tipo</label>
                <select id="filtro-tipo" value={bTipo} onChange={(e) => setBTipo(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t.id} value={t.id}>{t.texto}</option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label htmlFor="filtro-desde">Fecha</label>
                <div className="tarjeta-filtros__fechas">
                  <input id="filtro-desde" type="date" aria-label="Desde" value={bDesde} onChange={(e) => setBDesde(e.target.value)} />
                  <input id="filtro-hasta" type="date" aria-label="Hasta" value={bHasta} onChange={(e) => setBHasta(e.target.value)} />
                </div>
              </div>

              {bTipo === "ahorro" && (
                <div className="campo">
                  <label htmlFor="filtro-objetivo">Objetivo</label>
                  <select id="filtro-objetivo" value={bObjetivo} onChange={(e) => setBObjetivo(e.target.value)}>
                    <option value="todos">Todos los objetivos</option>
                    {objetivos.map((obj) => (
                      <option key={obj.id} value={obj.id}>{obj.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {errorFechas !== "" && <p className="campo__error" role="alert">{errorFechas}</p>}

            <div className="tarjeta-filtros__acciones">
              <button type="button" className="btn btn--secundario btn--texto-secundario btn--chico" onClick={limpiarFiltros}>Limpiar</button>
              <button type="button" className="btn btn--primario btn--chico" onClick={aplicarFiltros}>Aplicar filtros</button>
            </div>
          </div>
        )}

        <div className="filtros-tipo">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tipo === t.id ? "filtro-tab filtro-tab--activo" : "filtro-tab"}
              aria-pressed={tipo === t.id}
              onClick={() => elegirPestana(t.id)}
            >
              {t.texto}
            </button>
          ))}
        </div>

        {(objetivoFiltrado || desde !== "" || hasta !== "") && (
          <div className="filtros-activos">
            {objetivoFiltrado && (
              <button type="button" className="filtro-chip" onClick={() => setObjetivoId("todos")}>
                Objetivo: {objetivoFiltrado.nombre} ✕
              </button>
            )}
            {(desde !== "" || hasta !== "") && (
              <button type="button" className="filtro-chip" onClick={() => { setDesde(""); setHasta(""); }}>
                Fechas: {desde || "…"} a {hasta || "…"} ✕
              </button>
            )}
          </div>
        )}
      </section>

      {grupos.length === 0 ? (
        <section className="estado-vacio">
          <div className="estado-vacio__icono">!</div>
          <p className="estado-vacio__titulo">No hay movimientos</p>
          <p className="estado-vacio__subtitulo">No encontramos movimientos con ese filtro o búsqueda</p>
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => { limpiarFiltros(); setBusqueda(""); }}>
            Limpiar filtros
          </button>
        </section>
      ) : (
        <section className="grupo-fecha">
          {grupos.map((grupo) => (
            <div className="grupo-dia" key={grupo.clave}>
              <p className="grupo-fecha__dia">{grupo.clave}</p>
              <div className="lista-movimientos">
                {grupo.items.map((mov) => {
                  const tipoClasificado = clasificar(mov.tipo);
                  const icono = { ingreso: "↑", gasto: "↓", ahorro: "$", tarjeta: "C" }[tipoClasificado];

                  return (
                    <button type="button" className="item-movimiento" key={mov.id} onClick={() => setSeleccionadoId(mov.id)}>
                      <span className={`item-movimiento__icono item-movimiento__icono--${tipoClasificado}`} aria-hidden="true">
                        {icono}
                      </span>
                      <div className="item-movimiento__info">
                        <span className="item-movimiento__titulo">{mov.categoria}</span>
                        <span className="item-movimiento__subtitulo">
                          {mov.descripcion || formatearTipo(mov.tipo)}
                        </span>
                      </div>
                      <span className={`item-movimiento__monto item-movimiento__monto--${tipoClasificado}`}>
                        {mov.signo === "+" ? "+ " : mov.signo === "-" ? "- " : ""}
                        {formatearMonto(mov.monto)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {movimientoSeleccionado && (
        <PanelMovimiento
          key={movimientoSeleccionado.id}
          movimiento={movimientoSeleccionado}
          disponible={disponible}
          tarjetas={tarjetas}
          onCerrar={() => setSeleccionadoId(null)}
          onVerObjetivo={onVerObjetivo}
          onVerTarjetas={onVerTarjetas}
          editarMovimiento={editarMovimiento}
          eliminarMovimiento={eliminarMovimiento}
        />
      )}
    </main>
  );
}

export default Movimientos;
