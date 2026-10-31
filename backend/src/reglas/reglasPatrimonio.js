// ==========================================================================
// reglasPatrimonio - cuánto cambia cada parte del patrimonio con un
// movimiento. Copia de frontend/src/utils/reglasPatrimonio.js: el backend
// pasa a ser el dueño de las reglas y la copia del frontend se borra cuando
// todas las acciones usen la API. Hasta entonces, si se cambia una regla,
// hay que cambiarla en los dos archivos.
// Cada movimiento que devuelve la API lleva su "efecto" calculado acá.
// Función pura: no lee ni modifica nada.
//
// Patrimonio = Disponible + Ahorros + Reserva de tarjeta
// ==========================================================================

// Devuelve { disponible, ahorros, reserva }: lo que suma (o resta, si es
// negativo) cada parte cuando ocurre el movimiento.
export function efectoMovimiento({ tipo, monto }) {
  switch (tipo) {
    case "ingreso":
      return { disponible: monto, ahorros: 0, reserva: 0 };
    case "gasto":
      return { disponible: -monto, ahorros: 0, reserva: 0 };
    // Transferencias internas: el patrimonio no cambia.
    case "ahorro-agregado":
      return { disponible: -monto, ahorros: monto, reserva: 0 };
    case "ahorro-retirado":
      return { disponible: monto, ahorros: -monto, reserva: 0 };
    // Usar el ahorro para comprar algo SÍ es un gasto real.
    case "ahorro-usado":
      return { disponible: 0, ahorros: -monto, reserva: 0 };
    // Compra con tarjeta: el dinero pasa de Disponible a Reserva.
    case "tarjeta-consumo":
      return { disponible: -monto, ahorros: 0, reserva: monto };
    // Pago de la tarjeta: el dinero ya reservado se va. Disponible no cambia
    // y el patrimonio baja una sola vez por el monto pagado.
    case "tarjeta-pago":
      return { disponible: 0, ahorros: 0, reserva: -monto };
    default:
      return { disponible: 0, ahorros: 0, reserva: 0 };
  }
}
