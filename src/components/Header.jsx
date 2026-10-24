import { IconoCerrar, IconoMenu } from "./Iconos";
import { useState } from "react";

// ==========================================================================
// Header - barra de navegación superior.
// Como no usamos React Router, la navegación se maneja con un estado en
// App.jsx (paginaActual) y esta función onNavegar que lo actualiza.
// En pantallas chicas el menú se despliega con un botón hamburguesa cuyo
// estado (menuAbierto) vive acá, no en App.
// ==========================================================================

const ENLACES = [
  { id: "inicio", texto: "Inicio" },
  { id: "ahorros", texto: "Ahorros" },
  { id: "tarjetas", texto: "Tarjetas" },
  { id: "movimientos", texto: "Movimientos" },
  { id: "estadisticas", texto: "Estadísticas" },
  { id: "configuracion", texto: "Configuración" },
];

function Header({ paginaActual, onNavegar, onAbrirAyuda }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  function elegirPagina(id) {
    onNavegar(id);
    setMenuAbierto(false);
  }

  // Con Escape se cierra el menú (ayuda a quien navega con teclado).
  function manejarTecla(evento) {
    if (evento.key === "Escape" && menuAbierto) {
      setMenuAbierto(false);
    }
  }

  return (
    <header className="header" onKeyDown={manejarTecla}>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <div className="header__contenedor">
        <p className="logo">Patrimonio</p>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuAbierto}
          aria-controls="menu-principal"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? <IconoCerrar tamano={24} /> : <IconoMenu />}
        </button>

        <nav className={menuAbierto ? "nav nav--abierto" : "nav"} id="menu-principal" aria-label="Principal">
          {ENLACES.map((enlace) => (
            <button
              key={enlace.id}
              type="button"
              className={paginaActual === enlace.id ? "nav__link nav__link--activo" : "nav__link"}
              aria-current={paginaActual === enlace.id ? "page" : undefined}
              onClick={() => elegirPagina(enlace.id)}
            >
              {enlace.texto}
            </button>
          ))}
          <button
            type="button"
            className="nav__link nav__link--ayuda"
            onClick={() => {
              setMenuAbierto(false);
              onAbrirAyuda();
            }}
          >
            Ayuda
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
