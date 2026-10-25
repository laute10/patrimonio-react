import { useState } from "react";
import PanelGrafico from "../components/PanelGrafico";
import { formatearMonto } from "../utils/formato";

// ==========================================================================
// Estadísticas - gráficos calculados con los MISMOS movimientos que ven
// Inicio y Movimientos (una sola fuente de verdad: usePatrimonio).
// Nada de números escritos a mano: si el usuario registra un gasto, los
// gráficos cambian solos porque se recalculan en cada render.
// Los gráficos son <div> con altura/ancho en % y un SVG para la dona
// (excepción aprobada, ver index.css).
// ==========================================================================

const PERIODOS = [
  { id: "este-mes", texto: "Este mes" },
  { id: "mes-anterior", texto: "Mes anterior" },
  { id: "ultimos-3", texto: "Últimos 3 meses" },
  { id: "ultimos-12", texto: "Últimos 12 meses" },
  { id: "este-anio", texto: "Este año" },
];

// Devuelve el rango [desde, hasta) de fechas que corresponde al período.
function rangoPeriodo(id, hoy) {
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();

  if (id === "este-mes") return { desde: new Date(anio, mes, 1), hasta: new Date(anio, mes + 1, 1) };
  if (id === "mes-anterior") return { desde: new Date(anio, mes - 1, 1), hasta: new Date(anio, mes, 1) };
  if (id === "ultimos-3") return { desde: new Date(anio, mes - 2, 1), hasta: new Date(anio, mes + 1, 1) };
  if (id === "ultimos-12") return { desde: new Date(anio, mes - 11, 1), hasta: new Date(anio, mes + 1, 1) };
  return { desde: new Date(anio, 0, 1), hasta: new Date(anio + 1, 0, 1) };
}

function sumar(movimientos, signo) {
  return movimientos
    .filter((mov) => mov.signo === signo)
    .reduce((total, mov) => total + mov.monto, 0);
}

const CIRCUNFERENCIA = 439.82; // 2 * π * radio (70)

function Estadisticas({ movimientos, objetivos, disponible, ahorrosTotal, reservaTarjeta, patrimonioTotal }) {
  const [periodoId, setPeriodoId] = useState("este-mes");
  const [hoy] = useState(() => new Date()); // fecha de hoy, se calcula una sola vez

  const { desde, hasta } = rangoPeriodo(periodoId, hoy);
  const delPeriodo = movimientos.filter((mov) => mov.fecha >= desde && mov.fecha < hasta);

  const ingresos = sumar(delPeriodo, "+");
  const gastos = sumar(delPeriodo, "-");

  // Gastos por categoría (solo los gastos "comunes"), de mayor a menor.
  const porCategoria = [];
  delPeriodo
    .filter((mov) => mov.tipo === "gasto")
    .forEach((mov) => {
      const fila = porCategoria.find((f) => f.categoria === mov.categoria);
      if (fila) fila.total += mov.monto;
      else porCategoria.push({ categoria: mov.categoria, total: mov.monto });
    });
  porCategoria.sort((a, b) => b.total - a.total);
  const mayorCategoria = porCategoria.length > 0 ? porCategoria[0].total : 1;

  // Ingresos y gastos mes a mes dentro del período.
  const meses = [];
  const cursor = new Date(desde);
  while (cursor < hasta && cursor <= hoy) {
    const inicio = new Date(cursor);
    const fin = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const delMes = delPeriodo.filter((mov) => mov.fecha >= inicio && mov.fecha < fin);
    meses.push({
      clave: inicio.getFullYear() + "-" + inicio.getMonth(),
      etiqueta: inicio.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
      ingresos: sumar(delMes, "+"),
      gastos: sumar(delMes, "-"),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const mayorMes = Math.max(1, ...meses.map((m) => Math.max(m.ingresos, m.gastos)));

  // Distribución del patrimonio (dona)
  const partes = [
    { id: "disponible", texto: "Disponible", monto: disponible },
    { id: "ahorros", texto: "Ahorros", monto: ahorrosTotal },
    { id: "tarjeta", texto: "Tarjeta", monto: reservaTarjeta },
  ];
  let acumulado = 0;
  const segmentos = partes.map((parte) => {
    const largo = patrimonioTotal > 0 ? (parte.monto / patrimonioTotal) * CIRCUNFERENCIA : 0;
    const segmento = { ...parte, largo, desfase: -acumulado };
    acumulado += largo;
    return segmento;
  });

  return (
    <main className="main" id="contenido">
      <section className="pagina-header">
        <h1>Estadísticas</h1>
        <p className="subtitulo">Analizá la evolución de tus finanzas</p>
      </section>

      <select
        className="selector-periodo"
        aria-label="Período de las estadísticas"
        value={periodoId}
        onChange={(e) => setPeriodoId(e.target.value)}
      >
        {PERIODOS.map((periodo) => (
          <option key={periodo.id} value={periodo.id}>
            {periodo.texto}
          </option>
        ))}
      </select>

      <section>
        <h2 className="titulo-seccion">Resumen financiero</h2>
        <div className="tarjetas-resumen-financiero">
          <div className="tarjeta-resumen-chica">
            <span className="etiqueta">Ingresos</span>
            <span className="monto">{formatearMonto(ingresos)}</span>
          </div>
          <div className="tarjeta-resumen-chica">
            <span className="etiqueta">Gastos</span>
            <span className="monto">{formatearMonto(gastos)}</span>
          </div>
          <div className="tarjeta-resumen-chica">
            <span className="etiqueta">Ahorro del período</span>
            <span className="monto">{formatearMonto(ingresos - gastos)}</span>
          </div>
        </div>
      </section>

      {delPeriodo.length === 0 ? (
        <section className="estado-vacio">
          <div className="estado-vacio__icono">!</div>
          <p className="estado-vacio__titulo">No hay datos en este período</p>
          <p className="estado-vacio__subtitulo">Elegí otro período o registrá movimientos desde Inicio</p>
        </section>
      ) : (
        <>
          <PanelGrafico titulo="Gastos por categoría">
            {porCategoria.length === 0 ? (
              <p className="subtitulo">No hay gastos en este período.</p>
            ) : (
              <div className="grafico-barras-h">
                {porCategoria.map((fila) => (
                  <div className="barra-h-fila" key={fila.categoria}>
                    <span>{fila.categoria}</span>
                    <div className="barra-h-pista">
                      <div className="barra-h-relleno" style={{ width: (fila.total / mayorCategoria) * 100 + "%" }}></div>
                    </div>
                    <span>{formatearMonto(fila.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </PanelGrafico>

          <PanelGrafico titulo="Ingresos vs. gastos">
            <div className="grafico-leyenda">
              <span><span className="leyenda-punto leyenda-punto--ingreso"></span>Ingresos</span>
              <span><span className="leyenda-punto leyenda-punto--gasto"></span>Gastos</span>
            </div>
            <div className="grafico-barras-dobles">
              {meses.map((mes) => (
                <div className="barras-dobles-grupo" key={mes.clave}>
                  <div className="barras-dobles-par">
                    <div
                      className="barras-dobles-barra barras-dobles-barra--ingreso"
                      style={{ height: (mes.ingresos / mayorMes) * 100 + "%" }}
                      title={"Ingresos: " + formatearMonto(mes.ingresos)}
                    ></div>
                    <div
                      className="barras-dobles-barra barras-dobles-barra--gasto"
                      style={{ height: (mes.gastos / mayorMes) * 100 + "%" }}
                      title={"Gastos: " + formatearMonto(mes.gastos)}
                    ></div>
                  </div>
                  <span className="barra-v-etiqueta">{mes.etiqueta}</span>
                </div>
              ))}
            </div>
          </PanelGrafico>
        </>
      )}

      <PanelGrafico titulo="Progreso de objetivos">
        <div className="lista-progreso-objetivos">
          {objetivos.map((obj) => {
            const porcentaje = Math.min(100, Math.round((obj.montoActual / obj.montoObjetivo) * 100));
            return (
              <div className="progreso-objetivo-fila" key={obj.id}>
                <div className="encabezado">
                  <span>{obj.nombre}</span>
                  <span className="monto">
                    {porcentaje}% · {formatearMonto(obj.montoActual)} / {formatearMonto(obj.montoObjetivo)}
                  </span>
                </div>
                <div className="barra-progreso">
                  <div className="barra-progreso__relleno" style={{ width: porcentaje + "%" }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </PanelGrafico>

      <PanelGrafico titulo="Distribución del patrimonio">
        <div className="distribucion-contenido">
          <svg
            className="grafico-dona"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Distribución del patrimonio entre disponible, ahorros y tarjetas"
          >
            {segmentos.map((segmento) => (
              <circle
                key={segmento.id}
                cx="100"
                cy="100"
                r="70"
                className={"grafico-dona__segmento grafico-dona__segmento--" + segmento.id}
                strokeDasharray={segmento.largo + " " + CIRCUNFERENCIA}
                strokeDashoffset={segmento.desfase}
              ></circle>
            ))}
            <text x="100" y="95" className="grafico-dona__total">{formatearMonto(patrimonioTotal)}</text>
            <text x="100" y="115" className="grafico-dona__total-etiqueta">PATRIMONIO</text>
          </svg>

          <div className="leyenda-distribucion">
            {partes.map((parte) => (
              <div className="leyenda-distribucion-item" key={parte.id}>
                <span>
                  <span className={"leyenda-punto leyenda-punto--" + parte.id}></span>
                  {parte.texto}
                </span>
                <span>
                  {formatearMonto(parte.monto)}
                  {patrimonioTotal > 0 && " · " + Math.round((parte.monto / patrimonioTotal) * 100) + "%"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PanelGrafico>
    </main>
  );
}

export default Estadisticas;
