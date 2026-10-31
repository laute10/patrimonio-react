import { efectoMovimiento } from "../reglas/reglasPatrimonio.js";

// ==========================================================================
// movimientos.js - ayudas para preparar los movimientos que devuelve la API.
// ==========================================================================

// Agrega el campo "efecto" ({ disponible, ahorros, reserva }) calculado por
// el servidor. No se guarda en el archivo: se calcula al responder, así
// nunca queda desactualizado si cambia el monto.
export function conEfecto(movimiento) {
  return { ...movimiento, efecto: efectoMovimiento(movimiento) };
}

// Siguiente id libre: el más grande que hay, más uno.
export function siguienteId(lista) {
  return lista.reduce((maximo, item) => Math.max(maximo, item.id), 0) + 1;
}

// "ahorro-agregado" coincide con el filtro "ahorro" y con "ahorro-agregado".
function coincideTipo(tipoMovimiento, tipoFiltro) {
  return tipoMovimiento === tipoFiltro || tipoMovimiento.startsWith(tipoFiltro + "-");
}

// Aplica los filtros ya validados y ordena del más reciente al más viejo.
// La búsqueda es la misma que hace hoy la pantalla Movimientos: busca el
// texto en la categoría y la descripción, sin distinguir mayúsculas.
export function filtrarMovimientos(movimientos, { tipo, objetivoId, desde, hastaExclusivo, q }) {
  return movimientos
    .filter((mov) => {
      const fecha = new Date(mov.fecha);
      if (tipo !== undefined && !coincideTipo(mov.tipo, tipo)) return false;
      if (objetivoId !== undefined && mov.objetivoId !== objetivoId) return false;
      if (desde !== undefined && fecha < desde) return false;
      if (hastaExclusivo !== undefined && fecha >= hastaExclusivo) return false;
      if (q !== undefined && !(mov.categoria + " " + mov.descripcion).toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}
