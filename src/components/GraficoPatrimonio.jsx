import { formatearMonto } from "../utils/formato";

// ==========================================================================
// GraficoPatrimonio - progreso del patrimonio en áreas apiladas: disponible
// (abajo), ahorros y reserva de tarjeta (arriba); el borde superior es el
// patrimonio total. Recibe el resultado de historialPatrimonio() por props
// y no guarda estado propio.
// Las áreas son un SVG en línea (excepción aprobada para gráficos); los ejes,
// la frase y la tabla son HTML para que se lean bien en cualquier ancho.
// Los colores salen de variables CSS, así que cambian solos en modo oscuro.
// ==========================================================================

const CAPAS = [
  { id: "disponible", texto: "Disponible", clase: "disponible" },
  { id: "ahorros", texto: "Ahorros", clase: "ahorros" },
  { id: "reserva", texto: "Reserva de tarjeta", clase: "tarjeta" },
];

const CIERRE = { dia: "de cada día", semana: "de cada semana", mes: "de cada mes" };

// 2000000 -> "$2 M", 500000 -> "$500 mil" (para el eje, donde hay poco lugar)
function montoCorto(numero) {
  return "$" + numero.toLocaleString("es-AR", { notation: "compact", maximumFractionDigits: 1 });
}

// Un máximo "redondo" para el eje: 1.750.000 -> 2.000.000
function maximoRedondo(valor) {
  if (valor <= 0) return 1;
  const paso = 10 ** Math.floor(Math.log10(valor)) / 2;
  return Math.ceil(valor / paso) * paso;
}

function GraficoPatrimonio({ historial }) {
  const { puntos, inicio, fin, diferencia, porcentaje, granularidad, suficientes } = historial;

  if (!suficientes) {
    return (
      <p className="subtitulo">
        Todavía hay muy pocos días en este período para mostrar el progreso. Elegí un período más
        largo, como “Últimos 3 meses”.
      </p>
    );
  }

  const hastaHoy = fin.momento === Infinity;
  const etiquetaFin = hastaHoy ? `hoy, ${fin.etiqueta}` : fin.etiqueta;
  const sube = diferencia >= 0;
  const textoPorcentaje =
    porcentaje === null
      ? ""
      : ` (${porcentaje.toLocaleString("es-AR", { maximumFractionDigits: 1, signDisplay: "always" })} %)`;
  const textoDiferencia = (sube ? "+ " : "- ") + formatearMonto(Math.abs(diferencia)) + textoPorcentaje;

  // Escala: de 0 (o del mínimo, si hubiera algo negativo) a un máximo redondo.
  const maximo = maximoRedondo(Math.max(...puntos.map((p) => p.total)));
  const minimo = Math.min(0, ...puntos.map((p) => p.disponible));
  const x = (i) => (i / (puntos.length - 1)) * 100;
  const y = (valor) => 100 - ((valor - minimo) / (maximo - minimo)) * 100;

  // Cada capa va desde la suma de las de abajo hasta esa suma más su valor.
  const areas = CAPAS.map((capa, indice) => {
    const base = (p) => CAPAS.slice(0, indice).reduce((suma, c) => suma + p[c.id], 0);
    const arriba = puntos.map((p, i) => `${x(i)} ${y(base(p) + p[capa.id])}`);
    const abajo = puntos.map((p, i) => `${x(i)} ${y(base(p))}`).reverse();
    return { ...capa, d: `M${arriba.join(" L")} L${abajo.join(" L")} Z` };
  });
  const lineaTotal = "M" + puntos.map((p, i) => `${x(i)} ${y(p.total)}`).join(" L");

  const descripcion =
    `Áreas apiladas del ${inicio.etiqueta} al ${fin.etiqueta}. ` +
    `El patrimonio pasó de ${formatearMonto(inicio.total)} a ${formatearMonto(fin.total)}. ` +
    `Al final: disponible ${formatearMonto(fin.disponible)}, ahorros ${formatearMonto(fin.ahorros)} ` +
    `y reserva de tarjeta ${formatearMonto(fin.reserva)}.`;

  const medio = puntos[Math.floor((puntos.length - 1) / 2)];

  return (
    <div className="grafico-patrimonio">
      <p className="grafico-patrimonio__resumen">
        Al inicio del período ({inicio.etiqueta}) tenías <strong>{formatearMonto(inicio.total)}</strong>; al
        final ({etiquetaFin}), <strong>{formatearMonto(fin.total)}</strong>. Diferencia:{" "}
        <span className={"grafico-patrimonio__diferencia grafico-patrimonio__diferencia--" + (sube ? "sube" : "baja")}>
          {textoDiferencia}
        </span>
        .
      </p>

      <div className="grafico-leyenda">
        {CAPAS.map((capa) => (
          <span key={capa.id}>
            <span className={"leyenda-punto leyenda-punto--" + capa.clase}></span>
            {capa.texto}
          </span>
        ))}
        <span>
          <span className="leyenda-linea"></span>
          Patrimonio total
        </span>
      </div>

      <div className="grafico-patrimonio__lienzo">
        <div className="grafico-patrimonio__eje-y" aria-hidden="true">
          <span>{montoCorto(maximo)}</span>
          <span>{montoCorto((maximo + minimo) / 2)}</span>
          <span>{montoCorto(minimo)}</span>
        </div>
        <svg
          className="grafico-patrimonio__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={descripcion}
        >
          {[0, 50, 100].map((posicion) => (
            <line
              key={posicion}
              className="grafico-patrimonio__guia"
              x1="0"
              x2="100"
              y1={posicion}
              y2={posicion}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {areas.map((area) => (
            <path
              key={area.id}
              className={"grafico-patrimonio__capa grafico-patrimonio__capa--" + area.clase}
              d={area.d}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path className="grafico-patrimonio__total" d={lineaTotal} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="grafico-patrimonio__eje-x" aria-hidden="true">
          <span>{inicio.etiqueta}</span>
          <span>{medio.etiqueta}</span>
          <span>{fin.etiqueta}</span>
        </div>
      </div>

      <details className="grafico-patrimonio__datos">
        <summary>Ver los valores del gráfico</summary>
        <div className="tabla-desplazable" tabIndex={0} role="region" aria-label="Valores del progreso del patrimonio">
          <table className="tabla-valores">
            <caption>Patrimonio al cierre {CIERRE[granularidad]}</caption>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                {CAPAS.map((capa) => (
                  <th scope="col" key={capa.id}>{capa.id === "reserva" ? "Tarjeta" : capa.texto}</th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {puntos.map((p) => (
                <tr key={p.momento}>
                  <th scope="row">
                    {p.etiqueta}
                    {p.inicio ? " (inicio)" : ""}
                    {p.momento === Infinity ? " (hoy)" : ""}
                  </th>
                  {CAPAS.map((capa) => (
                    <td key={capa.id}>{formatearMonto(p[capa.id])}</td>
                  ))}
                  <td>{formatearMonto(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export default GraficoPatrimonio;
