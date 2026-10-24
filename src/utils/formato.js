// ==========================================================================
// Funciones de formato compartidas por varias pantallas y componentes.
// Antes cada página tenía su propia copia; ahora se escriben una sola vez.
// ==========================================================================

// 123456 -> "$123.456"
export function formatearMonto(numero) {
  return "$" + numero.toLocaleString("es-AR");
}

// "ahorro-agregado" -> "Ahorro agregado" (contenido, formato normal)
export function formatearTipo(tipo) {
  const texto = tipo.replace("-", " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Agrupa los tipos internos en las 4 categorías que usa la interfaz.
export function clasificar(tipo) {
  if (tipo === "ingreso" || tipo === "gasto") return tipo;
  if (tipo.startsWith("ahorro")) return "ahorro";
  return "tarjeta";
}

// Íconos disponibles para los objetivos de ahorro.
export const ICONOS = [
  "🏠", "🚗", "✈️", "🎓", "💍", "🎯", "📱", "🏖️",
  "💻", "🏍️", "🚲", "🎸", "🎮", "📷", "🛋️", "🔧",
  "👶", "🐶", "🐱", "🏥", "💪", "⚽", "🎁", "🎉",
  "🛒", "👕", "📚", "🍽️", "☕", "🌎", "⛰️", "🏕️",
  "🛡️", "💰", "📈", "⭐",
];

// Categorías predeterminadas. Las de gasto sirven también para los consumos
// de tarjeta; el usuario puede sumar las suyas desde el formulario.
export const CATEGORIAS_GASTO = [
  "Supermercado", "Transporte", "Facultad", "Ocio", "Comida", "Salud",
  "Hogar", "Servicios", "Ropa", "Suscripciones", "Regalos", "Mascotas",
  "Viajes", "Tecnología", "Educación", "Otros",
];
export const CATEGORIAS_INGRESO = [
  "Sueldo", "Freelance", "Regalo", "Venta", "Reintegro", "Aguinaldo",
  "Alquiler", "Beca", "Intereses", "Inversiones", "Bonos", "Otro",
];

// Etiqueta del tipo de movimiento para el detalle ("Ahorro", "Gasto"...).
export function etiquetaClase(tipo) {
  return { ingreso: "Ingreso", gasto: "Gasto", ahorro: "Ahorro", tarjeta: "Tarjeta" }[clasificar(tipo)];
}

// Fecha corta del detalle: 02/09/2026
export function formatearFechaCorta(fecha) {
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
