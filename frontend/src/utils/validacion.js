// ==========================================================================
// Funciones de validación compartidas por los formularios de acceso
// (Login, Crear cuenta, Recuperar contraseña). Cada una devuelve el
// mensaje de error en texto, o "" si el valor está bien. Así cada
// formulario decide qué mensaje mostrar junto a cada campo.
// ==========================================================================

const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCorreo(correo) {
  const limpio = correo.trim();
  if (limpio === "") {
    return "Ingresá tu correo electrónico.";
  }
  if (!regexCorreo.test(limpio)) {
    return "El correo no tiene un formato válido (ej. nombre@correo.com).";
  }
  return "";
}

export function validarNombre(nombre) {
  return nombre.trim() === "" ? "Ingresá tu nombre." : "";
}

export function validarContrasena(contrasena, mensajeVacio = "Ingresá tu contraseña.") {
  if (contrasena === "") {
    return mensajeVacio;
  }
  return "";
}

export function validarContrasenaNueva(contrasena) {
  if (contrasena === "") {
    return "Creá una contraseña.";
  }
  if (contrasena.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  return "";
}

export function validarConfirmacion(contrasena, confirmar) {
  if (confirmar === "") {
    return "Repetí tu contraseña.";
  }
  if (contrasena !== confirmar) {
    return "Las contraseñas no coinciden.";
  }
  return "";
}

// "lautaro@correo.com" -> "Lautaro" (nombre provisorio hasta tener backend)
export function nombreDesdeCorreo(correo) {
  const parte = correo.trim().split("@")[0];
  return parte.charAt(0).toUpperCase() + parte.slice(1);
}
