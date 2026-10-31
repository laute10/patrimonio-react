import { useState } from "react";
import Header from "./components/Header";
import Inicio from "./pages/Inicio";
import Movimientos from "./pages/Movimientos";
import Ahorros from "./pages/Ahorros";
import Tarjetas from "./pages/Tarjetas";
import Estadisticas from "./pages/Estadisticas";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/Login";
import CrearCuenta from "./pages/CrearCuenta";
import Recuperar from "./pages/Recuperar";
import Footer from "./components/Footer";
import EstadoCarga from "./components/EstadoCarga";
import PanelAyuda from "./components/PanelAyuda";
import usePatrimonio from "./hooks/usePatrimonio";
import { nombreDesdeCorreo } from "./utils/validacion";

// ==========================================================================
// App - componente raíz.
// Acá "levantamos el estado" financiero con usePatrimonio() y se lo
// pasamos como props a cada página (patrón visto en la Unidad 4), para
// que todas trabajen siempre con los mismos datos.
// Dos estados manejan la navegación sin Router:
//   - "usuario": null si no hay sesión (se ven las pantallas de acceso),
//     o { nombre, correo } si ya inició sesión.
//   - "pantallaAcceso" / "paginaActual": qué pantalla se muestra en cada caso.
// La autenticación es simulada hasta que exista el backend.
// ==========================================================================

function AppInterna({ tema, onCambiarTema }) {
  const [usuario, setUsuario] = useState(null);
  const [pantallaAcceso, setPantallaAcceso] = useState("login");
  const [paginaActual, setPaginaActual] = useState("inicio");
  // Datos que una pantalla le pasa a otra al navegar (por ejemplo, el
  // filtro con el que se abre Movimientos). Se leen al montar la pantalla.
  const [parametros, setParametros] = useState({});
  // El panel de Ayuda se puede abrir desde cualquier pantalla.
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  function navegar(pagina, nuevosParametros = {}) {
    setParametros(nuevosParametros);
    setPaginaActual(pagina);
  }

  // usePatrimonio() se llama siempre (los hooks no pueden ir dentro de un
  // if), pero sus datos solo se muestran cuando hay sesión.
  const patrimonio = usePatrimonio();

  function abrirSesion(nombre, correo) {
    setUsuario({ nombre, correo });
    setPaginaActual("inicio");
  }

  // Editar datos en Configuración: actualiza al usuario SIN cambiar de pantalla.
  function guardarDatos(nombre, correo) {
    setUsuario({ nombre, correo });
  }

  function cerrarSesion() {
    setUsuario(null);
    setPantallaAcceso("login");
  }

  if (usuario === null) {
    if (pantallaAcceso === "crear") {
      return <CrearCuenta onCrear={abrirSesion} onIrALogin={() => setPantallaAcceso("login")} />;
    }
    if (pantallaAcceso === "recuperar") {
      return <Recuperar onIrALogin={() => setPantallaAcceso("login")} />;
    }
    return (
      <Login
        onIngresar={(correo) => abrirSesion(nombreDesdeCorreo(correo), correo)}
        onIrACrearCuenta={() => setPantallaAcceso("crear")}
        onIrARecuperar={() => setPantallaAcceso("recuperar")}
      />
    );
  }

  // Mientras llegan los datos (o si fallan) no se muestra ninguna pantalla
  // con números vacíos: se ve un mensaje claro. Es el patrón de "retornos
  // tempranos" de la Unidad 4 (cargando / error / datos listos).
  if (patrimonio.cargando || patrimonio.error !== "") {
    return (
      <>
        <Header paginaActual={paginaActual} onNavegar={(pagina) => navegar(pagina)} onAbrirAyuda={() => setAyudaAbierta(true)} />
        <EstadoCarga error={patrimonio.error} onReintentar={patrimonio.recargar} />
        <PanelAyuda abierto={ayudaAbierta} onCerrar={() => setAyudaAbierta(false)} />
      </>
    );
  }

  function renderizarPagina() {
    switch (paginaActual) {
      case "inicio":
        return (
          <Inicio
            categoriasGasto={patrimonio.categoriasGasto}
            agregarCategoria={patrimonio.agregarCategoria}
            categoriasIngreso={patrimonio.categoriasIngreso}
            agregarCategoriaIngreso={patrimonio.agregarCategoriaIngreso}
            patrimonioTotal={patrimonio.patrimonioTotal}
            disponible={patrimonio.disponible}
            ahorrosTotal={patrimonio.ahorrosTotal}
            reservaTarjeta={patrimonio.reservaTarjeta}
            movimientos={patrimonio.movimientos}
            registrarIngreso={patrimonio.registrarIngreso}
            registrarGasto={patrimonio.registrarGasto}
            onVerTodos={() => navegar("movimientos")}
          />
        );
      case "movimientos":
        return (
          <Movimientos
            categoriasGasto={patrimonio.categoriasGasto}
            agregarCategoria={patrimonio.agregarCategoria}
            categoriasIngreso={patrimonio.categoriasIngreso}
            agregarCategoriaIngreso={patrimonio.agregarCategoriaIngreso}
            movimientos={patrimonio.movimientos}
            objetivos={patrimonio.objetivos}
            tarjetas={patrimonio.tarjetas}
            disponible={patrimonio.disponible}
            filtroInicial={parametros}
            editarMovimiento={patrimonio.editarMovimiento}
            eliminarMovimiento={patrimonio.eliminarMovimiento}
            onVerObjetivo={(objetivoId) => navegar("ahorros", { objetivoId })}
            onVerTarjetas={() => navegar("tarjetas")}
          />
        );
      case "ahorros":
        return (
          <Ahorros
            objetivos={patrimonio.objetivos}
            ahorrosTotal={patrimonio.ahorrosTotal}
            movimientos={patrimonio.movimientos}
            disponible={patrimonio.disponible}
            parametros={parametros}
            crearObjetivo={patrimonio.crearObjetivo}
            editarObjetivo={patrimonio.editarObjetivo}
            agregarAhorro={patrimonio.agregarAhorro}
            retirarAhorro={patrimonio.retirarAhorro}
            usarAhorro={patrimonio.usarAhorro}
            eliminarObjetivo={patrimonio.eliminarObjetivo}
            onVerMovimientos={(filtro) => navegar("movimientos", filtro)}
          />
        );
      case "tarjetas":
        return (
          <Tarjetas
            categoriasGasto={patrimonio.categoriasGasto}
            agregarCategoria={patrimonio.agregarCategoria}
            categoriasIngreso={patrimonio.categoriasIngreso}
            agregarCategoriaIngreso={patrimonio.agregarCategoriaIngreso}
            tarjetas={patrimonio.tarjetas}
            crearTarjeta={patrimonio.crearTarjeta}
            agregarConsumoTarjeta={patrimonio.agregarConsumoTarjeta}
            editarConsumoTarjeta={patrimonio.editarConsumoTarjeta}
            eliminarConsumoTarjeta={patrimonio.eliminarConsumoTarjeta}
            cerrarPeriodo={patrimonio.cerrarPeriodo}
            pagarPeriodo={patrimonio.pagarPeriodo}
          />
        );
      case "estadisticas":
        return (
          <Estadisticas
            movimientos={patrimonio.movimientos}
            objetivos={patrimonio.objetivos}
            disponible={patrimonio.disponible}
            ahorrosTotal={patrimonio.ahorrosTotal}
            reservaTarjeta={patrimonio.reservaTarjeta}
            patrimonioTotal={patrimonio.patrimonioTotal}
          />
        );
      case "configuracion":
        return <Configuracion tema={tema} onCambiarTema={onCambiarTema} usuario={usuario} onGuardar={guardarDatos} onCerrarSesion={cerrarSesion} />;
      default:
        return null;
    }
  }

  return (
    <>
      <Header paginaActual={paginaActual} onNavegar={(pagina) => navegar(pagina)} onAbrirAyuda={() => setAyudaAbierta(true)} />
      {renderizarPagina()}
      <Footer />
      <PanelAyuda abierto={ayudaAbierta} onCerrar={() => setAyudaAbierta(false)} />
    </>
  );
}

// App guarda el tema ("claro" u "oscuro") y envuelve todo en un div con la
// clase correspondiente: el CSS cambia los colores sin tocar el DOM a mano.
// La elección se recuerda en localStorage (puede fallar en navegación privada).
function App() {
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem("tema") === "oscuro" ? "oscuro" : "claro";
    } catch {
      return "claro";
    }
  });

  function cambiarTema(nuevo) {
    setTema(nuevo);
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      // Sin almacenamiento: el tema vale solo para esta visita.
    }
  }

  return (
    <div className={tema === "oscuro" ? "app tema-oscuro" : "app"}>
      <AppInterna tema={tema} onCambiarTema={cambiarTema} />
    </div>
  );
}

export default App;
