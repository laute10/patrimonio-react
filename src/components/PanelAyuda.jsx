import Overlay from "./Overlay";
import PanelLateral from "./PanelLateral";

// ==========================================================================
// PanelAyuda - panel lateral con preguntas frecuentes sobre cómo funciona
// la aplicación. Se abre desde "Ayuda" en el menú. No tiene estado propio:
// App decide si está abierto. Cada pregunta es un <details>, que se
// despliega con el navegador, sin JavaScript.
// ==========================================================================

const SECCIONES = [
  {
    titulo: "Conceptos básicos",
    preguntas: [
      {
        pregunta: "¿Qué es el patrimonio total?",
        respuesta:
          "Es todo lo que tenés: el dinero disponible, más lo que guardaste en tus objetivos de ahorro, más el dinero reservado para pagar tarjetas.",
      },
      {
        pregunta: "¿Qué es el dinero disponible?",
        respuesta:
          "Es el dinero libre que podés gastar hoy. No incluye lo que está en tus objetivos ni lo que ya compraste con tarjeta y todavía no pagaste.",
      },
      {
        pregunta: "¿Qué es la reserva de tarjeta?",
        respuesta:
          "Cuando comprás con tarjeta, ese dinero sale de tu disponible y queda reservado hasta que pagues el resumen. Así siempre sabés cuánto tenés realmente libre.",
      },
    ],
  },
  {
    titulo: "Inicio, gastos e ingresos",
    preguntas: [
      {
        pregunta: "¿Cómo registro un gasto o un ingreso?",
        respuesta:
          "En Inicio tocá Registrar gasto o Registrar ingreso, elegí la categoría, escribí el monto y, si querés, una descripción. La fecha se guarda sola.",
      },
      {
        pregunta: "¿Por qué no me deja registrar un gasto?",
        respuesta:
          "Un gasto no puede ser mayor que tu dinero disponible. Revisá el monto o registrá antes un ingreso.",
      },
    ],
  },
  {
    titulo: "Ahorros y objetivos",
    preguntas: [
      {
        pregunta: "¿Cómo creo un objetivo de ahorro?",
        respuesta:
          "En Ahorros tocá Crear objetivo, escribí un nombre, el monto que querés juntar y elegí un ícono.",
      },
      {
        pregunta: "¿Cómo agrego o retiro dinero de un objetivo?",
        respuesta:
          "Tocá la tarjeta del objetivo para ver su detalle y elegí Agregar dinero o Retirar dinero. Agregar usa tu dinero disponible; retirar lo devuelve. Tu patrimonio total no cambia, porque el dinero solo cambia de lugar.",
      },
      {
        pregunta: "¿Qué significa utilizar dinero de un objetivo?",
        respuesta:
          "Es gastar lo que ahorraste, por ejemplo al comprar el auto. Se registra como un gasto y ese dinero deja de formar parte de tus ahorros, así que tu patrimonio baja.",
      },
      {
        pregunta: "¿Por qué no puedo eliminar un objetivo?",
        respuesta:
          "Solo se puede eliminar un objetivo que no tiene dinero. Primero retirá o utilizá lo que tiene guardado.",
      },
      {
        pregunta: "¿Qué pasa si paso la meta de un objetivo?",
        respuesta:
          "La barra se llena al 100%, pero el porcentaje y el monto muestran lo real, así que pueden superar la meta.",
      },
    ],
  },
  {
    titulo: "Tarjetas",
    preguntas: [
      {
        pregunta: "¿Cómo registro una compra con tarjeta?",
        respuesta:
          "En Tarjetas abrí el resumen de la tarjeta y agregá un consumo. El monto sale de tu disponible y pasa a la reserva de tarjeta. Tu patrimonio no cambia.",
      },
      {
        pregunta: "¿Cómo funcionan los períodos?",
        respuesta:
          "Cada tarjeta tiene un período abierto por vez, donde se cargan los consumos. Vos lo cerrás cuando llega el resumen, y se abre el del mes siguiente. Después lo pagás.",
      },
      {
        pregunta: "¿Qué pasa cuando pago un período?",
        respuesta:
          "Se paga con la reserva de la tarjeta, que ya guardaste con cada consumo: tu dinero disponible no cambia y tu patrimonio baja una sola vez, en el monto pagado.",
      },
    ],
  },
  {
    titulo: "Movimientos",
    preguntas: [
      {
        pregunta: "¿Cómo busco o filtro movimientos?",
        respuesta:
          "En Movimientos escribí en el buscador o tocá una pestaña (Ingresos, Gastos, Ahorros, Tarjeta). Con el botón Filtros podés elegir también un rango de fechas y, en Ahorros, un objetivo.",
      },
      {
        pregunta: "¿Puedo editar o eliminar un movimiento?",
        respuesta:
          "Los ingresos y gastos sí: tocá el movimiento y elegí Editar o Eliminar. Los de ahorros y tarjetas se gestionan desde Ahorros o Tarjetas, y el detalle tiene un botón para ir directo.",
      },
    ],
  },
  {
    titulo: "Estadísticas y cuenta",
    preguntas: [
      {
        pregunta: "¿Cómo cambio el período de las estadísticas?",
        respuesta:
          "Con el selector de período de Estadísticas: todos los gráficos se actualizan juntos. Los movimientos entre tus propios ahorros no cuentan como ingresos ni gastos.",
      },
      {
        pregunta: "¿Cómo se calcula el progreso del patrimonio?",
        respuesta:
          "La app no guarda un historial aparte: parte de tus valores de hoy y va hacia atrás deshaciendo cada movimiento, con las mismas reglas que usa al registrarlo. Así, el gráfico siempre coincide con tus movimientos. Muestra un punto por día, o por semana en los períodos largos, y abajo podés ver la tabla con los valores.",
      },
      {
        pregunta: "¿Cómo cambio mis datos o cierro sesión?",
        respuesta: "Desde Configuración podés editar tu nombre y correo, y cerrar sesión.",
      },
      {
        pregunta: "¿Cómo activo el modo oscuro?",
        respuesta:
          "En Configuración › Preferencias › Apariencia elegí Oscuro. La aplicación recuerda tu elección en este navegador.",
      },
      {
        pregunta: "¿Por qué mis datos desaparecen al recargar la página?",
        respuesta:
          "Esta versión todavía no guarda la información en un servidor, así que al recargar vuelven los datos de ejemplo.",
      },
    ],
  },
];

function PanelAyuda({ abierto, onCerrar }) {
  return (
    <>
      <Overlay visible={abierto} onClick={onCerrar} />
      <PanelLateral
        abierto={abierto}
        titulo="Ayuda"
        descripcion="Respuestas rápidas sobre cómo funciona Patrimonio"
        onCerrar={onCerrar}
      >
        <div className="ayuda">
          {SECCIONES.map((seccion) => (
            <section className="ayuda__seccion" key={seccion.titulo}>
              <h3 className="ayuda__titulo">{seccion.titulo}</h3>
              {seccion.preguntas.map((item) => (
                <details className="ayuda__item" key={item.pregunta}>
                  <summary>{item.pregunta}</summary>
                  <p>{item.respuesta}</p>
                </details>
              ))}
            </section>
          ))}
        </div>
      </PanelLateral>
    </>
  );
}

export default PanelAyuda;
