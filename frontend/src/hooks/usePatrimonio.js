import { useState, useEffect } from "react";
import { ICONOS, CATEGORIAS_GASTO, CATEGORIAS_INGRESO } from "../utils/formato";
import { pedir, movimientoDesdeApi } from "../utils/api";

// ==========================================================================
// usePatrimonio - estado financiero compartido de toda la app.
//
// Acá vive la ÚNICA fuente de verdad de movimientos, ahorros y tarjetas
// (documento de especificación, sección 39: Inicio, Movimientos y
// Estadísticas deben consultar los mismos datos, no lógica duplicada).
//
// Reglas financieras (sección 4 a 26 del documento). Ahora las aplica el
// backend (backend/src/reglas/reglasPatrimonio.js); el hook pide cada
// cambio a la API y actualiza el estado con lo que responde:
// - Patrimonio Total = Disponible + Ahorros + Reserva de tarjeta
// - Ingreso/Gasto: cambia Disponible y Patrimonio
// - Agregar/Retirar ahorro: transferencia interna (Patrimonio no cambia)
// - Usar ahorro para comprar: SÍ reduce el Patrimonio (gasto real)
// - Compra con tarjeta: Disponible -> Reserva, Patrimonio no cambia
// - Pagar período: sale de la Reserva; Disponible no cambia y el
//   Patrimonio baja una sola vez por el monto pagado
// ==========================================================================

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

function usePatrimonio() {
  // El estado inicial se pide a la API (GET /patrimonio) con fetch dentro
  // de un useEffect, a través de pedir() (utils/api.js).
  // Todos los cambios (ingresos, gastos, ahorros, tarjetas y categorías
  // propias) se guardan en la API.
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
    pedir("/patrimonio")
      .then((datos) => {
        setDisponible(datos.disponible);
        // Cada objetivo guarda su ícono; si alguno no lo tiene, se le
        // asigna uno según su posición.
        setObjetivos(
          datos.objetivos.map((obj, indice) => ({
            icono: ICONOS[indice % ICONOS.length],
            ...obj,
          }))
        );
        setTarjetas(datos.tarjetas);
        setMovimientos(datos.movimientos.map(movimientoDesdeApi));
        setCategoriasPropias(datos.categoriasPropias.gasto);
        setCategoriasIngresoPropias(datos.categoriasPropias.ingreso);
        setCargando(false);
      })
      .catch((err) => {
        // El mensaje ya viene listo de pedir(): el { error } de la API o el
        // aviso de que no se pudo conectar.
        setError(err.message);
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

  // -- Ingresos y gastos (sección 11-12): se guardan en la API ------------
  // Son async: el estado cambia recién cuando la API responde bien, con el
  // "efecto" que calculó el servidor (el frontend no repite las reglas).
  // Si la API responde un error o no responde, pedir() lanza un Error con
  // el mensaje para el usuario y el estado queda como estaba.

  async function registrarMovimiento(tipo, { categoria, monto, descripcion }) {
    const nuevo = await pedir("/movimientos", {
      metodo: "POST",
      cuerpo: { tipo, categoria, monto, descripcion },
    });
    setDisponible((actual) => actual + nuevo.efecto.disponible);
    setMovimientos((anteriores) => [movimientoDesdeApi(nuevo), ...anteriores]);
  }

  function registrarIngreso(datos) {
    return registrarMovimiento("ingreso", datos);
  }

  function registrarGasto(datos) {
    return registrarMovimiento("gasto", datos);
  }

  // -- Ahorros y objetivos (sección 13-16): se guardan en la API ----------
  // Mismo esquema que ingresos y gastos: async, y el estado cambia recién
  // cuando la API responde bien. Las reglas (no superar el disponible ni lo
  // ahorrado, no eliminar un objetivo con dinero) las controla el servidor.

  async function crearObjetivo({ nombre, montoObjetivo, icono }) {
    const nuevo = await pedir("/objetivos", { metodo: "POST", cuerpo: { nombre, montoObjetivo, icono } });
    setObjetivos((anteriores) => [...anteriores, nuevo]);
  }

  // Editar nombre, monto objetivo e ícono. El servidor también renombra los
  // movimientos del objetivo; acá se hace lo mismo con los que ya están en
  // pantalla para que el historial coincida sin volver a pedirlos.
  async function editarObjetivo({ objetivoId, nombre, montoObjetivo, icono }) {
    const actualizado = await pedir(`/objetivos/${objetivoId}`, {
      metodo: "PUT",
      cuerpo: { nombre, montoObjetivo, icono },
    });
    setObjetivos((anteriores) => anteriores.map((obj) => (obj.id === objetivoId ? actualizado : obj)));
    setMovimientos((anteriores) =>
      anteriores.map((mov) => (mov.objetivoId === objetivoId ? { ...mov, categoria: actualizado.nombre } : mov))
    );
  }

  // Agregar, retirar y usar ahorro comparten el mismo camino. La API
  // responde el movimiento (con su efecto) y el objetivo ya actualizado.
  // Agregar y retirar son transferencias internas; usar SÍ es un gasto real
  // (el patrimonio baja, sección 6 del documento).
  async function moverAhorro(accion, { objetivoId, monto, descripcion }) {
    const { movimiento, objetivo } = await pedir(`/objetivos/${objetivoId}/movimientos`, {
      metodo: "POST",
      cuerpo: { accion, monto, descripcion },
    });
    setDisponible((actual) => actual + movimiento.efecto.disponible);
    setObjetivos((anteriores) => anteriores.map((obj) => (obj.id === objetivoId ? objetivo : obj)));
    setMovimientos((anteriores) => [movimientoDesdeApi(movimiento), ...anteriores]);
  }

  function agregarAhorro(datos) {
    return moverAhorro("agregar", datos);
  }

  function retirarAhorro(datos) {
    return moverAhorro("retirar", datos);
  }

  function usarAhorro(datos) {
    return moverAhorro("usar", datos);
  }

  // Regla sección 16: no se puede eliminar si todavía tiene dinero. La
  // pantalla ya lo avisa antes; si igual llega, el servidor responde 400.
  async function eliminarObjetivo(objetivoId) {
    await pedir(`/objetivos/${objetivoId}`, { metodo: "DELETE" });
    setObjetivos((anteriores) => anteriores.filter((obj) => obj.id !== objetivoId));
  }

  // -- Editar / eliminar ingresos y gastos: también en la API -------------
  // Solo los movimientos de tipo ingreso y gasto se gestionan desde
  // Movimientos; los de ahorros y tarjetas se gestionan desde su pantalla.
  // Las reglas (tipo editable, disponible no negativo) las controla el
  // servidor: si no se cumplen responde 400 y pedir() lanza su mensaje.

  async function editarMovimiento({ id, categoria, monto, descripcion }) {
    const anterior = movimientos.find((m) => m.id === id);
    const actualizado = await pedir(`/movimientos/${id}`, {
      metodo: "PUT",
      cuerpo: { categoria, monto, descripcion },
    });
    // Lo que cambia el disponible es el efecto nuevo menos el que tenía
    // (los dos los calculó el servidor).
    setDisponible((actual) => actual + actualizado.efecto.disponible - anterior.efecto.disponible);
    setMovimientos((anteriores) => anteriores.map((m) => (m.id === id ? movimientoDesdeApi(actualizado) : m)));
  }

  async function eliminarMovimiento(id) {
    const eliminado = movimientos.find((m) => m.id === id);
    // La API responde 204 (sin cuerpo): para deshacer el movimiento se usa
    // el efecto que ya había mandado el servidor al leerlo.
    await pedir(`/movimientos/${id}`, { metodo: "DELETE" });
    setDisponible((actual) => actual - eliminado.efecto.disponible);
    setMovimientos((anteriores) => anteriores.filter((m) => m.id !== id));
  }

  // -- Tarjetas y períodos (sección 17-26): se guardan en la API ----------
  // Las reglas las controla el servidor: un solo período abierto, consumos
  // solo en ese período y sin superar el disponible, cerrar abre el mes
  // siguiente, y solo se paga un período cerrado.
  // - Consumo: Disponible BAJA y Reserva SUBE en la misma medida (el
  //   patrimonio no cambia). La reserva se calcula sola con los consumos.
  // - Pago: sale de la Reserva; el disponible no cambia y el patrimonio
  //   baja una sola vez por lo pagado.
  // Las respuestas traen la tarjeta actualizada y el disponible del
  // servidor (un consumo de ejemplo puede no tener movimiento, así que no
  // siempre hay un "efecto" anterior del que partir).

  function aplicarTarjeta({ tarjeta, disponible: disponibleServidor }) {
    setTarjetas((anteriores) => anteriores.map((t) => (t.id === tarjeta.id ? tarjeta : t)));
    setDisponible(disponibleServidor);
  }

  async function crearTarjeta({ nombre }) {
    const nueva = await pedir("/tarjetas", { metodo: "POST", cuerpo: { nombre } });
    setTarjetas((anteriores) => [...anteriores, nueva]);
  }

  async function agregarConsumoTarjeta({ tarjetaId, categoria, monto, descripcion }) {
    const respuesta = await pedir(`/tarjetas/${tarjetaId}/consumos`, {
      metodo: "POST",
      cuerpo: { categoria, monto, descripcion },
    });
    aplicarTarjeta(respuesta);
    setMovimientos((anteriores) => [movimientoDesdeApi(respuesta.movimiento), ...anteriores]);
  }

  async function editarConsumoTarjeta({ tarjetaId, consumoId, categoria, monto, descripcion }) {
    const respuesta = await pedir(`/tarjetas/${tarjetaId}/consumos/${consumoId}`, {
      metodo: "PUT",
      cuerpo: { categoria, monto, descripcion },
    });
    aplicarTarjeta(respuesta);
    if (respuesta.movimiento) {
      setMovimientos((anteriores) =>
        anteriores.map((mov) => (mov.consumoId === consumoId ? movimientoDesdeApi(respuesta.movimiento) : mov))
      );
    }
  }

  async function eliminarConsumoTarjeta({ tarjetaId, consumoId }) {
    const respuesta = await pedir(`/tarjetas/${tarjetaId}/consumos/${consumoId}`, { metodo: "DELETE" });
    aplicarTarjeta(respuesta);
    setMovimientos((anteriores) => anteriores.filter((mov) => mov.consumoId !== consumoId));
  }

  // Cierre manual (sección 20): el período ABIERTO pasa a CERRADA y se abre
  // el del mes siguiente.
  async function cerrarPeriodo(tarjetaId) {
    const respuesta = await pedir(`/tarjetas/${tarjetaId}/cierre`, { metodo: "POST" });
    aplicarTarjeta(respuesta);
  }

  async function pagarPeriodo(tarjetaId, periodoId) {
    const respuesta = await pedir(`/tarjetas/${tarjetaId}/periodos/${periodoId}/pago`, { metodo: "POST" });
    aplicarTarjeta(respuesta);
    // Un período sin consumos se paga sin registrar un movimiento de $0.
    if (respuesta.movimiento) {
      setMovimientos((anteriores) => [movimientoDesdeApi(respuesta.movimiento), ...anteriores]);
    }
  }

  // -- Categorías propias: se guardan en la API ---------------------------
  // Suma una categoría propia (si no existe ya, sin distinguir mayúsculas)
  // y devuelve el nombre con el que quedó guardada. Las predeterminadas
  // están solo en el frontend: si coincide con una, no se llama a la API.
  async function agregarCategoriaDeTipo(tipo, nombre, predeterminadas, propias, setPropias) {
    const limpio = nombre.trim();
    const existente = [...predeterminadas, ...propias].find((c) => c.toLowerCase() === limpio.toLowerCase());
    if (existente) return existente;
    const guardada = await pedir("/categorias", { metodo: "POST", cuerpo: { tipo, nombre: limpio } });
    setPropias((anteriores) => (anteriores.includes(guardada.nombre) ? anteriores : [...anteriores, guardada.nombre]));
    return guardada.nombre;
  }

  function agregarCategoria(nombre) {
    return agregarCategoriaDeTipo("gasto", nombre, CATEGORIAS_GASTO, categoriasPropias, setCategoriasPropias);
  }

  function agregarCategoriaIngreso(nombre) {
    return agregarCategoriaDeTipo("ingreso", nombre, CATEGORIAS_INGRESO, categoriasIngresoPropias, setCategoriasIngresoPropias);
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
