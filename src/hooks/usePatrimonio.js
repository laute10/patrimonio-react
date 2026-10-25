import { useState, useEffect } from "react";
import { ICONOS, CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "../utils/formato";
import { efectoMovimiento } from "../utils/reglasPatrimonio";

// ==========================================================================
// usePatrimonio - estado financiero compartido de toda la app.
//
// Acá vive la ÚNICA fuente de verdad de movimientos, ahorros y tarjetas
// (documento de especificación, sección 39: Inicio, Movimientos y
// Estadísticas deben consultar los mismos datos, no lógica duplicada).
//
// Reglas financieras implementadas (sección 4 a 26 del documento); cuánto
// cambia cada parte está definido en utils/reglasPatrimonio.js:
// - Patrimonio Total = Disponible + Ahorros + Reserva de tarjeta
// - Ingreso/Gasto: cambia Disponible y Patrimonio
// - Agregar/Retirar ahorro: transferencia interna (Patrimonio no cambia)
// - Usar ahorro para comprar: SÍ reduce el Patrimonio (gasto real)
// - Compra con tarjeta: Disponible -> Reserva, Patrimonio no cambia
// - Pagar período: reduce Disponible, Reserva y Patrimonio
// ==========================================================================

let siguienteIdMovimiento = 100;
let siguienteIdGenerico = 1000;

function nuevoId() {
  siguienteIdGenerico += 1;
  return siguienteIdGenerico;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// La deuda de un período NO se guarda: siempre es la suma de sus consumos.
export function deudaPeriodo(periodo) {
  return periodo.consumos.reduce((suma, consumo) => suma + consumo.monto, 0);
}

// "Septiembre 2026"
export function etiquetaPeriodo(periodo) {
  return `${MESES[periodo.mes]} ${periodo.anio}`;
}

// "09/26" (formato corto para la tarjeta principal)
export function etiquetaCorta(periodo) {
  const mes = String(periodo.mes + 1).padStart(2, "0");
  return `${mes}/${String(periodo.anio).slice(-2)}`;
}

function siguienteMes(periodo) {
  return periodo.mes === 11
    ? { mes: 0, anio: periodo.anio + 1 }
    : { mes: periodo.mes + 1, anio: periodo.anio };
}

// Convierte "diasAtras" del JSON en una fecha real.
function convertirMovimiento(mov) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - mov.diasAtras);
  return { ...mov, fecha };
}

function usePatrimonio() {
  // Los datos ya NO están escritos en el código: se piden al archivo
  // public/data/patrimonio.json con fetch dentro de un useEffect.
  // (useEffect y fetch los pide la Ejercitación 4.1; en la unidad 4 de la
  // cátedra el estado "cargando / error / datos" se simula con setTimeout.)
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0); // al cambiar, se vuelve a pedir

  const [disponible, setDisponible] = useState(0);
  const [objetivos, setObjetivos] = useState([]);
  const [tarjetas, setTarjetas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [categoriasPropias, setCategoriasPropias] = useState([]);
  const [categoriasIngresoPropias, setCategoriasIngresoPropias] = useState([]);

  useEffect(() => {
    fetch("data/patrimonio.json")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("Respuesta " + respuesta.status);
        }
        return respuesta.json();
      })
      .then((datos) => {
        setDisponible(datos.disponible);
        // Cada objetivo tiene su ícono; los movimientos de ahorro se
        // vinculan al objetivo por id (antes solo guardaban el nombre).
        const objetivosConIcono = datos.objetivos.map((obj, indice) => ({
          icono: ICONOS[indice % ICONOS.length],
          ...obj,
        }));
        setObjetivos(objetivosConIcono);
        setTarjetas(datos.tarjetas);
        // El JSON guarda "diasAtras" para que el ejemplo nunca quede viejo;
        // una API real devolvería la fecha ya calculada.
        setMovimientos(
          datos.movimientos.map((mov) => {
            const convertido = convertirMovimiento(mov);
            if (mov.tipo.startsWith("ahorro")) {
              const objetivo = objetivosConIcono.find((obj) => obj.nombre === mov.categoria);
              convertido.objetivoId = objetivo ? objetivo.id : null;
            }
            return convertido;
          })
        );
        setCargando(false);
      })
      .catch(() => {
        setError("No pudimos cargar tus datos. Revisá tu conexión e intentá de nuevo.");
        setCargando(false);
      });
  }, [intento]);

  function recargar() {
    setCargando(true);
    setError("");
    setIntento((actual) => actual + 1);
  }

  // -- Totales derivados (no se guardan aparte, se calculan siempre) -----

  const ahorrosTotal = objetivos.reduce((total, obj) => total + obj.montoActual, 0);

  const reservaTarjeta = tarjetas.reduce((total, tarjeta) => {
    const deudaTarjeta = tarjeta.periodos
      .filter((periodo) => periodo.estado !== "PAGADA")
      .reduce((suma, periodo) => suma + deudaPeriodo(periodo), 0);
    return total + deudaTarjeta;
  }, 0);

  const patrimonioTotal = disponible + ahorrosTotal + reservaTarjeta;

  // -- Helper interno: agrega un movimiento al historial -----------------

  function agregarMovimiento(datos) {
    // "La fecha es automática" (secciones 11 y 12 del documento).
    const nuevo = { id: siguienteIdMovimiento, fecha: new Date(), ...datos };
    siguienteIdMovimiento += 1;
    setMovimientos((anteriores) => [nuevo, ...anteriores]);
  }

  // -- Ingresos y gastos (sección 11-12) ----------------------------------

  function registrarIngreso({ categoria, monto, descripcion }) {
    const datos = { tipo: "ingreso", categoria, descripcion, monto, signo: "+" };
    const efecto = efectoMovimiento(datos);
    setDisponible((actual) => actual + efecto.disponible);
    agregarMovimiento(datos);
  }

  function registrarGasto({ categoria, monto, descripcion }) {
    const datos = { tipo: "gasto", categoria, descripcion, monto, signo: "-" };
    const efecto = efectoMovimiento(datos);
    setDisponible((actual) => actual + efecto.disponible);
    agregarMovimiento(datos);
  }

  // -- Ahorros y objetivos (sección 13-16) --------------------------------

  function crearObjetivo({ nombre, montoObjetivo, icono }) {
    setObjetivos((anteriores) => [
      ...anteriores,
      {
        id: nuevoId(),
        nombre,
        montoObjetivo: Number(montoObjetivo),
        montoActual: 0,
        icono: icono || ICONOS[anteriores.length % ICONOS.length],
      },
    ]);
  }

  // Editar nombre, monto objetivo e ícono. El nombre nuevo también se
  // actualiza en los movimientos del objetivo para que el historial coincida.
  function editarObjetivo({ objetivoId, nombre, montoObjetivo, icono }) {
    setObjetivos((anteriores) =>
      anteriores.map((obj) =>
        obj.id === objetivoId ? { ...obj, nombre, montoObjetivo: Number(montoObjetivo), icono } : obj
      )
    );
    setMovimientos((anteriores) =>
      anteriores.map((mov) => (mov.objetivoId === objetivoId ? { ...mov, categoria: nombre } : mov))
    );
  }

  // Agregar, retirar y usar ahorro comparten el mismo camino: el efecto del
  // movimiento dice cuánto cambian el disponible y el objetivo.
  function moverAhorro(datos) {
    const efecto = efectoMovimiento(datos);
    setDisponible((actual) => actual + efecto.disponible);
    setObjetivos((anteriores) =>
      anteriores.map((obj) =>
        obj.id === datos.objetivoId ? { ...obj, montoActual: obj.montoActual + efecto.ahorros } : obj
      )
    );
    agregarMovimiento(datos);
  }

  function nombreObjetivo(objetivoId) {
    const objetivo = objetivos.find((obj) => obj.id === objetivoId);
    return objetivo ? objetivo.nombre : "";
  }

  function agregarAhorro({ objetivoId, monto, descripcion }) {
    moverAhorro({
      tipo: "ahorro-agregado",
      categoria: nombreObjetivo(objetivoId),
      objetivoId,
      descripcion,
      monto,
      signo: null, // transferencia interna: no suma ni resta al patrimonio
    });
  }

  function retirarAhorro({ objetivoId, monto, descripcion }) {
    moverAhorro({
      tipo: "ahorro-retirado",
      categoria: nombreObjetivo(objetivoId),
      objetivoId,
      descripcion,
      monto,
      signo: null,
    });
  }

  function usarAhorro({ objetivoId, monto, descripcion }) {
    // A diferencia de agregar/retirar, usar el ahorro para comprar algo
    // SÍ es un gasto real: el Patrimonio baja (sección 6 del documento).
    moverAhorro({
      tipo: "ahorro-usado",
      categoria: nombreObjetivo(objetivoId),
      objetivoId,
      descripcion,
      monto,
      signo: "-",
    });
  }

  function eliminarObjetivo(objetivoId) {
    const objetivo = objetivos.find((obj) => obj.id === objetivoId);
    if (!objetivo || objetivo.montoActual > 0) {
      // Regla sección 16: no se puede eliminar si todavía tiene dinero.
      return false;
    }
    setObjetivos((anteriores) => anteriores.filter((obj) => obj.id !== objetivoId));
    return true;
  }

  // -- Editar / eliminar ingresos y gastos --------------------------------
  // Solo los movimientos de tipo ingreso y gasto se gestionan desde
  // Movimientos; los de ahorros y tarjetas se gestionan desde su pantalla.
  // Devuelven true si se pudo, false si el cambio dejaría el dinero
  // disponible en negativo.

  function editarMovimiento({ id, categoria, monto, descripcion }) {
    const mov = movimientos.find((m) => m.id === id);
    if (!mov || (mov.tipo !== "ingreso" && mov.tipo !== "gasto")) return false;

    // Lo que cambia el disponible es el efecto nuevo menos el que tenía.
    const impacto = efectoMovimiento({ ...mov, monto }).disponible - efectoMovimiento(mov).disponible;
    if (disponible + impacto < 0) return false;

    setDisponible((actual) => actual + impacto);
    setMovimientos((anteriores) =>
      anteriores.map((m) => (m.id === id ? { ...m, categoria, monto, descripcion } : m))
    );
    return true;
  }

  function eliminarMovimiento(id) {
    const mov = movimientos.find((m) => m.id === id);
    if (!mov || (mov.tipo !== "ingreso" && mov.tipo !== "gasto")) return false;

    // Eliminar deshace el efecto del movimiento.
    const impacto = -efectoMovimiento(mov).disponible;
    if (disponible + impacto < 0) return false;

    setDisponible((actual) => actual + impacto);
    setMovimientos((anteriores) => anteriores.filter((m) => m.id !== id));
    return true;
  }

  // -- Tarjetas y períodos (sección 17-26) --------------------------------

  function periodoAbierto(tarjeta) {
    return tarjeta.periodos.find((p) => p.estado === "ABIERTA");
  }

  // Aplica una función solo al período ABIERTO de una tarjeta.
  function modificarPeriodoAbierto(tarjetaId, transformar) {
    setTarjetas((anteriores) =>
      anteriores.map((tarjeta) =>
        tarjeta.id !== tarjetaId
          ? tarjeta
          : {
              ...tarjeta,
              periodos: tarjeta.periodos.map((p) => (p.estado === "ABIERTA" ? transformar(p) : p)),
            }
      )
    );
  }

  function crearTarjeta({ nombre }) {
    const hoy = new Date();
    setTarjetas((anteriores) => [
      ...anteriores,
      {
        id: nuevoId(),
        nombre,
        periodos: [
          { id: nuevoId(), mes: hoy.getMonth(), anio: hoy.getFullYear(), estado: "ABIERTA", consumos: [] },
        ],
      },
    ]);
  }

  function agregarConsumoTarjeta({ tarjetaId, categoria, monto, descripcion }) {
    // Sección 24: Disponible BAJA y Reserva SUBE en la misma medida,
    // por eso el Patrimonio total no cambia.
    const consumoId = nuevoId();
    const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
    const datos = {
      tipo: "tarjeta-consumo",
      categoria: tarjeta ? tarjeta.nombre : "",
      descripcion,
      monto,
      signo: null, // transferencia a "reservado", no afecta el patrimonio
      consumoId, // vínculo para mantener el movimiento sincronizado
    };
    // La reserva sube sola: se calcula sumando los consumos del período.
    const efecto = efectoMovimiento(datos);
    setDisponible((actual) => actual + efecto.disponible);
    modificarPeriodoAbierto(tarjetaId, (p) => ({
      ...p,
      consumos: [...p.consumos, { id: consumoId, categoria, descripcion, monto }],
    }));
    agregarMovimiento(datos);
  }

  function editarConsumoTarjeta({ tarjetaId, consumoId, categoria, monto, descripcion }) {
    const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
    const abierto = tarjeta && periodoAbierto(tarjeta);
    const anterior = abierto && abierto.consumos.find((c) => c.id === consumoId);
    if (!anterior) return;

    // Si el monto sube, baja Disponible y sube la deuda (y al revés).
    const consumo = { tipo: "tarjeta-consumo" };
    const impacto =
      efectoMovimiento({ ...consumo, monto }).disponible - efectoMovimiento({ ...consumo, monto: anterior.monto }).disponible;
    setDisponible((actual) => actual + impacto);
    modificarPeriodoAbierto(tarjetaId, (p) => ({
      ...p,
      consumos: p.consumos.map((c) => (c.id === consumoId ? { ...c, categoria, monto, descripcion } : c)),
    }));
    setMovimientos((anteriores) =>
      anteriores.map((mov) => (mov.consumoId === consumoId ? { ...mov, monto, descripcion } : mov))
    );
  }

  function eliminarConsumoTarjeta({ tarjetaId, consumoId }) {
    const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
    const abierto = tarjeta && periodoAbierto(tarjeta);
    const consumo = abierto && abierto.consumos.find((c) => c.id === consumoId);
    if (!consumo) return;

    // El dinero reservado vuelve a estar disponible (se deshace el consumo).
    const impacto = -efectoMovimiento({ tipo: "tarjeta-consumo", monto: consumo.monto }).disponible;
    setDisponible((actual) => actual + impacto);
    modificarPeriodoAbierto(tarjetaId, (p) => ({
      ...p,
      consumos: p.consumos.filter((c) => c.id !== consumoId),
    }));
    setMovimientos((anteriores) => anteriores.filter((mov) => mov.consumoId !== consumoId));
  }

  function cerrarPeriodo(tarjetaId) {
    // Cierre manual (sección 20): el período ABIERTO pasa a CERRADA y se
    // abre automáticamente el del mes siguiente. Solo hay uno abierto.
    setTarjetas((anteriores) =>
      anteriores.map((tarjeta) => {
        if (tarjeta.id !== tarjetaId) return tarjeta;
        const abierto = periodoAbierto(tarjeta);
        if (!abierto) return tarjeta;
        const proximo = siguienteMes(abierto);
        return {
          ...tarjeta,
          periodos: [
            ...tarjeta.periodos.map((p) => (p.id === abierto.id ? { ...p, estado: "CERRADA" } : p)),
            { id: nuevoId(), ...proximo, estado: "ABIERTA", consumos: [] },
          ],
        };
      })
    );
  }

  // Devuelve true si se pagó, false si no alcanza el dinero disponible.
  function pagarPeriodo(tarjetaId, periodoId) {
    const tarjeta = tarjetas.find((t) => t.id === tarjetaId);
    const periodo = tarjeta && tarjeta.periodos.find((p) => p.id === periodoId);
    if (!periodo || periodo.estado === "PAGADA") return false;

    const deuda = deudaPeriodo(periodo);
    if (deuda > disponible) return false;

    const datos = {
      tipo: "tarjeta-pago",
      categoria: `Pago ${tarjeta.nombre} - ${etiquetaPeriodo(periodo)}`,
      descripcion: "",
      monto: deuda,
      signo: "-",
    };
    const efecto = efectoMovimiento(datos);
    setDisponible((actual) => actual + efecto.disponible);
    setTarjetas((anteriores) =>
      anteriores.map((t) =>
        t.id !== tarjetaId
          ? t
          : { ...t, periodos: t.periodos.map((p) => (p.id === periodoId ? { ...p, estado: "PAGADA" } : p)) }
      )
    );
    agregarMovimiento(datos);
    return true;
  }

  // Suma una categoría propia de gasto (si no existe ya, sin distinguir
  // mayúsculas). Devuelve el nombre con el que quedó guardada.
  function agregarCategoria(nombre) {
    const limpio = nombre.trim();
    const existente = [...CATEGORIAS_GASTO, ...categoriasPropias].find(
      (c) => c.toLowerCase() === limpio.toLowerCase()
    );
    if (existente) return existente;
    setCategoriasPropias([...categoriasPropias, limpio]);
    return limpio;
  }

  // Igual que agregarCategoria, pero para las categorías de ingreso.
  function agregarCategoriaIngreso(nombre) {
    const limpio = nombre.trim();
    const existente = [...CATEGORIAS_INGRESO, ...categoriasIngresoPropias].find(
      (c) => c.toLowerCase() === limpio.toLowerCase()
    );
    if (existente) return existente;
    setCategoriasIngresoPropias([...categoriasIngresoPropias, limpio]);
    return limpio;
  }

  return {
    // Estado de la carga de datos
    cargando,
    error,
    recargar,
    // Totales
    disponible,
    ahorrosTotal,
    reservaTarjeta,
    patrimonioTotal,
    // Datos
    categoriasGasto: [...CATEGORIAS_GASTO, ...categoriasPropias],
    agregarCategoria,
    categoriasIngreso: [...CATEGORIAS_INGRESO, ...categoriasIngresoPropias],
    agregarCategoriaIngreso,
    objetivos,
    tarjetas,
    movimientos,
    // Acciones
    registrarIngreso,
    registrarGasto,
    crearObjetivo,
    editarObjetivo,
    editarMovimiento,
    eliminarMovimiento,
    agregarAhorro,
    retirarAhorro,
    usarAhorro,
    eliminarObjetivo,
    crearTarjeta,
    agregarConsumoTarjeta,
    editarConsumoTarjeta,
    eliminarConsumoTarjeta,
    cerrarPeriodo,
    pagarPeriodo,
  };
}

export default usePatrimonio;
