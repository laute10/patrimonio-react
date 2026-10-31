// ==========================================================================
// totales.js - los totales no se guardan: se calculan siempre a partir de
// los datos, igual que en el frontend.
//
// Patrimonio = Disponible + Ahorros + Reserva de tarjeta
// ==========================================================================

// La deuda de un período es la suma de sus consumos.
export function deudaPeriodo(periodo) {
  return periodo.consumos.reduce((suma, consumo) => suma + consumo.monto, 0);
}

export function calcularTotales({ disponible, objetivos, tarjetas }) {
  const ahorrosTotal = objetivos.reduce((total, obj) => total + obj.montoActual, 0);
  // La reserva es lo que se debe de los períodos que todavía no se pagaron.
  const reservaTarjeta = tarjetas.reduce((total, tarjeta) => {
    const deudaTarjeta = tarjeta.periodos
      .filter((periodo) => periodo.estado !== "PAGADA")
      .reduce((suma, periodo) => suma + deudaPeriodo(periodo), 0);
    return total + deudaTarjeta;
  }, 0);
  return {
    disponible,
    ahorrosTotal,
    reservaTarjeta,
    patrimonioTotal: disponible + ahorrosTotal + reservaTarjeta,
  };
}
