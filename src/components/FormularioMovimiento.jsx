import { useState } from "react";
import CampoFormulario from "./CampoFormulario";
import SelectorCategoria from "./SelectorCategoria";

// ==========================================================================
// FormularioMovimiento - formulario controlado para registrar un gasto o un
// ingreso. Es el mismo componente para los dos: cambian por props las
// categorías, el id y (para el gasto) el máximo que se puede gastar.
// Cada campo muestra su propio mensaje de error.
// ==========================================================================

function FormularioMovimiento({ id, categorias, maximo, onRegistrar, inicial, onNuevaCategoria }) {
  const [categoria, setCategoria] = useState(inicial ? inicial.categoria : categorias[0]);
  const [monto, setMonto] = useState(inicial ? String(inicial.monto) : "");
  const [descripcion, setDescripcion] = useState(inicial ? inicial.descripcion : "");
  const [errorMonto, setErrorMonto] = useState("");

  function manejarEnvio(evento) {
    evento.preventDefault();

    const valor = Number(monto);
    if (monto === "" || valor <= 0) {
      setErrorMonto("Ingresá un monto mayor a cero.");
      return;
    }
    if (maximo !== undefined && valor > maximo) {
      setErrorMonto("No tenés dinero disponible suficiente para este monto.");
      return;
    }

    onRegistrar({ categoria, monto: valor, descripcion: descripcion.trim() });
  }

  function cambiarMonto(nuevo) {
    setMonto(nuevo);
    setErrorMonto(""); // al corregir el campo, su error desaparece
  }

  return (
    <form id={id} onSubmit={manejarEnvio} noValidate>
      {onNuevaCategoria ? (
        <SelectorCategoria
          id={id + "-categoria"}
          categorias={categorias}
          valor={categoria}
          onCambio={setCategoria}
          onNueva={onNuevaCategoria}
        />
      ) : (
        <CampoFormulario
          id={id + "-categoria"}
          etiqueta="Categoría"
          opciones={categorias}
          valor={categoria}
          onCambio={setCategoria}
        />
      )}
      <CampoFormulario
        id={id + "-monto"}
        etiqueta="Monto"
        tipo="number"
        placeholder="$ 0"
        min="0"
        step="1"
        valor={monto}
        onCambio={cambiarMonto}
        error={errorMonto}
      />
      <CampoFormulario
        id={id + "-descripcion"}
        etiqueta="Descripción (opcional)"
        placeholder="Ej. Compra semanal"
        valor={descripcion}
        onCambio={setDescripcion}
      />
    </form>
  );
}

export default FormularioMovimiento;
