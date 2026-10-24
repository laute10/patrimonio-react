// ==========================================================================
// EstadoCarga - lo que ve el usuario mientras llegan los datos (o si la
// petición falla). Sigue el patrón "cargando / error / datos listos" de la
// Unidad 4: App.jsx decide cuándo mostrarlo con un return temprano.
// ==========================================================================

function EstadoCarga({ error, onReintentar }) {
  if (error !== "") {
    return (
      <main className="main" id="contenido">
        <section className="estado-vacio" role="alert">
          <div className="estado-vacio__icono">!</div>
          <p className="estado-vacio__titulo">No se pudieron cargar los datos</p>
          <p className="estado-vacio__subtitulo">{error}</p>
          <button type="button" className="btn btn--primario" onClick={onReintentar}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="main" id="contenido">
      <section className="estado-vacio" role="status">
        <p className="estado-vacio__titulo">Cargando…</p>
        <p className="estado-vacio__subtitulo">Estamos trayendo tus datos</p>
      </section>
    </main>
  );
}

export default EstadoCarga;
