// ==========================================================================
// Iconos - íconos SVG en línea (trazo redondeado) para volver, cerrar,
// avanzar, abrir el menú y para cada tipo de movimiento (ingreso, gasto,
// ahorro y tarjeta). Usan "currentColor", así que toman el color del
// elemento que los contiene (y cambian solos con el modo oscuro).
// Son decorativos: el botón que los contiene lleva el aria-label, o el
// texto de al lado ya dice lo mismo.
// ==========================================================================

function Svg({ children, tamano = 20 }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="icono"
    >
      {children}
    </svg>
  );
}

export function IconoVolver({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Svg>
  );
}

export function IconoAvanzar({ tamano = 16 }) {
  return (
    <Svg tamano={tamano}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

export function IconoCerrar({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Svg>
  );
}

export function IconoMenu({ tamano = 24 }) {
  return (
    <Svg tamano={tamano}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconoChevron({ abierto, tamano = 16 }) {
  return (
    <Svg tamano={tamano}>
      <path d={abierto ? "m18 15-6-6-6 6" : "m9 18 6-6-6-6"} />
    </Svg>
  );
}

// ---- Tipos de movimiento ---------------------------------------------------

// Ingreso: flecha que entra (↙).
export function IconoIngreso({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <path d="M18 6 6 18" />
      <path d="M17 18H6V7" />
    </Svg>
  );
}

// Gasto: flecha que sale (↗).
export function IconoGasto({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <path d="M6 18 18 6" />
      <path d="M7 6h11v11" />
    </Svg>
  );
}

// Ahorro: alcancía de perfil (cuerpo con patas, hocico, cola y ojo).
export function IconoAhorro({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
      <path d="M2 9v1c0 1.1.9 2 2 2h1" />
      <path d="M16 11h.01" />
    </Svg>
  );
}

// Tarjeta: tarjeta de crédito con la banda y una línea de número.
export function IconoTarjeta({ tamano }) {
  return (
    <Svg tamano={tamano}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </Svg>
  );
}

// Elige el ícono según el tipo ya clasificado ("ingreso", "gasto",
// "ahorro" o "tarjeta", como lo devuelve clasificar() de utils/formato).
const ICONO_POR_TIPO = {
  ingreso: IconoIngreso,
  gasto: IconoGasto,
  ahorro: IconoAhorro,
  tarjeta: IconoTarjeta,
};

export function IconoTipoMovimiento({ tipo, tamano }) {
  const Icono = ICONO_POR_TIPO[tipo] ?? IconoTarjeta;
  return <Icono tamano={tamano} />;
}
