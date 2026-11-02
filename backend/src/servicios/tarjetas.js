// ==========================================================================
// tarjetas.js - ayudas para trabajar con tarjetas, períodos y consumos.
// Funciones puras: reciben datos y devuelven datos.
// ==========================================================================

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "Septiembre 2026" (mes va de 0 a 11, como en JavaScript)
export function etiquetaPeriodo(periodo) {
  return `${MESES[periodo.mes]} ${periodo.anio}`;
}

export function siguienteMes(periodo) {
  return periodo.mes === 11
    ? { mes: 0, anio: periodo.anio + 1 }
    : { mes: periodo.mes + 1, anio: periodo.anio };
}

// Regla: cada tarjeta tiene un solo período ABIERTA.
export function periodoAbierto(tarjeta) {
  return tarjeta.periodos.find((p) => p.estado === "ABIERTA");
}

// Los ids de períodos y de consumos son únicos entre TODAS las tarjetas
// (los movimientos guardan el consumoId sin la tarjeta).
export function siguienteIdPeriodo(tarjetas) {
  return tarjetas.flatMap((t) => t.periodos).reduce((maximo, p) => Math.max(maximo, p.id), 0) + 1;
}

export function siguienteIdConsumo(tarjetas) {
  return (
    tarjetas
      .flatMap((t) => t.periodos)
      .flatMap((p) => p.consumos)
      .reduce((maximo, c) => Math.max(maximo, c.id), 0) + 1
  );
}

// Devuelve una copia de la tarjeta con el período "periodoId" cambiado.
export function cambiarPeriodo(tarjeta, periodoId, cambiar) {
  return { ...tarjeta, periodos: tarjeta.periodos.map((p) => (p.id === periodoId ? cambiar(p) : p)) };
}
