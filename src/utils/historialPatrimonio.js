import { efectoMovimiento } from "./reglasPatrimonio";

// ==========================================================================
// historialPatrimonio - reconstruye cómo fue cambiando el patrimonio.
//
// El historial no se guarda: se parte de los valores de HOY y se va hacia
// atrás deshaciendo cada movimiento con las mismas reglas que usa
// usePatrimonio (efectoMovimiento). El saldo en un momento es el de hoy
// menos todo lo que pasó después de ese momento.
//
// Función pura: recibe datos y devuelve datos, sin React y sin cambiar nada.
// ==========================================================================

const MAXIMO_PUNTOS = 60;
const MINIMO_PUNTOS = 3; // con menos, el gráfico no muestra nada útil
const UN_DIA = 24 * 60 * 60 * 1000;

// Saldo justo antes del instante "momento": a los valores de hoy se les
// restan los efectos de los movimientos ocurridos desde ese instante.
function saldoEn(momento, actuales, movimientos) {
  const saldo = { ...actuales };
  for (const mov of movimientos) {
    if (mov.fecha >= momento) {
      const efecto = efectoMovimiento(mov);
      saldo.disponible -= efecto.disponible;
      saldo.ahorros -= efecto.ahorros;
      saldo.reserva -= efecto.reserva;
    }
  }
  return { ...saldo, total: saldo.disponible + saldo.ahorros + saldo.reserva };
}

// Día, semana o mes, para no pasar de MAXIMO_PUNTOS puntos.
function elegirGranularidad(desde, hasta) {
  const dias = Math.ceil((hasta - desde) / UN_DIA);
  if (dias <= MAXIMO_PUNTOS) return "dia";
  if (dias <= MAXIMO_PUNTOS * 7) return "semana";
  return "mes";
}

// Siguiente corte después de "fecha" según la granularidad.
function siguienteCorte(fecha, granularidad) {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const dia = fecha.getDate();
  if (granularidad === "dia") return new Date(anio, mes, dia + 1);
  if (granularidad === "semana") return new Date(anio, mes, dia + 7);
  return new Date(anio, mes + 1, 1);
}

// Etiqueta de un punto: el último día que cubre (o el mes).
function etiquetar(cierre, granularidad) {
  const ultimoDia = new Date(cierre.getTime() - 1);
  if (granularidad === "mes") {
    return ultimoDia.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }).replace(".", "");
  }
  return ultimoDia.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

// Recibe los valores de hoy, todos los movimientos y el período
// [desde, hasta). Devuelve los puntos (el primero es el saldo al empezar el
// período; cada uno de los demás, el saldo al cierre de un día, una semana o
// un mes) y el resumen de inicio, fin y diferencia.
export function historialPatrimonio({ disponible, ahorros, reserva, movimientos, desde, hasta, hoy }) {
  const actuales = { disponible, ahorros, reserva };
  const incluyeHoy = hasta > hoy;
  const limite = incluyeHoy ? hoy : hasta;
  const granularidad = elegirGranularidad(desde, limite);

  // "momento": el saldo del punto es el que había justo antes de ese instante
  // (Infinity = los valores de hoy).
  const puntos = [
    {
      ...saldoEn(desde, actuales, movimientos),
      momento: desde.getTime(),
      etiqueta: etiquetar(new Date(desde.getTime() + 1), "dia"),
      inicio: true,
    },
  ];
  let corte = desde;
  while (corte < limite) {
    corte = siguienteCorte(corte, granularidad);
    const ultimo = corte >= limite;
    // El último punto de un período que llega hasta hoy son los valores
    // actuales tal cual (incluye cualquier movimiento recién registrado).
    const hastaHoy = ultimo && incluyeHoy;
    const momento = hastaHoy ? Infinity : Math.min(corte, hasta);
    // etiquetar() muestra el día anterior al cierre: para "hoy" se le pasa
    // un instante después de hoy; si no, el cierre (sin pasarse del período).
    const etiqueta = etiquetar(hastaHoy ? new Date(limite.getTime() + 1) : new Date(momento), granularidad);
    puntos.push({ ...saldoEn(momento, actuales, movimientos), momento, etiqueta, inicio: false });
  }

  const inicio = puntos[0];
  const fin = puntos.at(-1);
  const diferencia = fin.total - inicio.total;
  return {
    granularidad,
    puntos,
    suficientes: puntos.length >= MINIMO_PUNTOS,
    inicio,
    fin,
    diferencia,
    // Sin patrimonio al inicio no hay porcentaje que calcular.
    porcentaje: inicio.total !== 0 ? (diferencia / Math.abs(inicio.total)) * 100 : null,
  };
}
