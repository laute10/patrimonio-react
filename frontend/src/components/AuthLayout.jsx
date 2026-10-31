// ==========================================================================
// AuthLayout - marco común de las tres pantallas de acceso: header solo
// con el logo, una tarjeta centrada con título y subtítulo, y un pie con
// el enlace para cambiar de pantalla. Cada pantalla le pasa su contenido
// (el formulario) como children y el resto como props.
// ==========================================================================

import Footer from "./Footer";

function AuthLayout({ titulo, subtitulo, pie, children }) {
  return (
    <>
      <header className="header">
        <div className="header__contenedor">
          <p className="logo">Patrimonio</p>
        </div>
      </header>

      <main className="auth-layout" id="contenido">
        <div className="tarjeta-auth">
          <h1 className="tarjeta-auth__titulo">{titulo}</h1>
          <p className="tarjeta-auth__subtitulo">{subtitulo}</p>

          {children}

          <p className="auth-pie">{pie}</p>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default AuthLayout;
