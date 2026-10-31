// Crea un error con el código HTTP que corresponde (400, 404...). Los
// controladores lo lanzan con "throw" y el middleware de errores responde
// { error: mensaje } con ese código. El mensaje es para el usuario: en
// español y sin detalles internos.
export function errorApi(estado, mensaje) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}
