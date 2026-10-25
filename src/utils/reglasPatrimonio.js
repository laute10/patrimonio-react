// ==========================================================================
// reglasPatrimonio - cuánto cambia cada parte del patrimonio con un
// movimiento. Es la ÚNICA definición de las reglas: la usan usePatrimonio
// (para aplicar las acciones) y el historial de Estadísticas (para
// deshacerlas hacia atrás). Función pura: no usa React ni modifica nada.
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
    case "tarjeta-pago":
      return { disponible: -monto, ahorros: 0, reserva: -monto };
    default:
      return { disponible: 0, ahorros: 0, reserva: 0 };
  }
}
