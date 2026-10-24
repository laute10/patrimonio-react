// ==========================================================================
// Iconos - íconos SVG en línea (trazo redondeado) para volver, cerrar,
// avanzar y abrir el menú. Usan "currentColor", así que toman el color del
// botón que los contiene (y cambian solos con el modo oscuro).
// Son decorativos: el botón que los contiene lleva el aria-label.
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
