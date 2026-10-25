// ==========================================================================
// generar-arbol.mjs - arma docs/arbol-de-componentes.svg leyendo el código.
//
// Cómo se usa:   npm run arbol
//
// Qué hace:
//   1. Lee los import de App.jsx, src/pages y src/components para saber qué
//      componente usa a cuál.
//   2. Lee los useState de App.jsx (App y AppInterna) y los hooks propios.
//   3. Dibuja el árbol en SVG con el estilo del diagrama original.
// No hay ninguna lista para mantener a mano: si se agrega un componente,
// alcanza con volver a correr el script.
// Es una herramienta de documentación: no forma parte de la aplicación.
// ==========================================================================

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(RAIZ, "src");
const SALIDA = join(RAIZ, "docs", "arbol-de-componentes.svg");

// Se usan en casi todas las pantallas: se muestran una sola vez, abajo,
// para no repetirlos en cada rama.
const EN_TODOS_LADOS = ["Overlay", "Iconos"];

// Cómo se muestran en el diagrama los nombres que en el código van sin tilde.
const NOMBRES_VISIBLES = {
  Estadisticas: "Estadísticas",
  Configuracion: "Configuración",
};

function mostrar(nombre) {
  return NOMBRES_VISIBLES[nombre] ?? nombre;
}

// ---- 1. Leer el código ----------------------------------------------------

function leer(ruta) {
  return readFileSync(ruta, "utf8");
}

// Componentes que importa un archivo, en el orden en que aparecen.
// Solo cuentan los archivos propios con nombre en mayúscula (Header, Iconos…);
// quedan afuera los hooks, utils y el CSS.
function importsDe(codigo) {
  const usados = [];
  for (const [, ruta] of codigo.matchAll(/import\s+[\s\S]*?\s+from\s+"(\.{1,2}\/[^"]+)"/g)) {
    const nombre = basename(ruta).replace(/\.jsx$/, "");
    if (/^[A-Z]/.test(nombre) && !usados.includes(nombre)) {
      usados.push(nombre);
    }
  }
  return usados;
}

// Hooks propios que importa un archivo (los de la carpeta hooks/).
function hooksDe(codigo) {
  return [...codigo.matchAll(/from\s+"\.{1,2}\/hooks\/(use\w+)"/g)].map((m) => m[1]);
}

// Lee cada carpeta y devuelve { Nombre: [componentes que usa] }.
function leerCarpeta(carpeta) {
  const resultado = {};
  for (const archivo of readdirSync(join(SRC, carpeta)).sort()) {
    if (archivo.endsWith(".jsx")) {
      resultado[archivo.replace(/\.jsx$/, "")] = importsDe(leer(join(SRC, carpeta, archivo)));
    }
  }
  return resultado;
}

const paginas = leerCarpeta("pages");
const componentes = leerCarpeta("components");
const codigoApp = leer(join(SRC, "App.jsx"));
const usos = { ...componentes, ...paginas, App: importsDe(codigoApp) };

// Estado de App.jsx separado por función (App y AppInterna).
// split con el nombre capturado deja: [antes, nombre1, cuerpo1, nombre2, …]
function estadoPorFuncion(codigo) {
  const hooksPropios = hooksDe(codigo);
  const partes = codigo.split(/^function\s+(\w+)\s*\(/m);
  const funciones = [];
  for (let i = 1; i < partes.length; i += 2) {
    const cuerpo = partes[i + 1];
    funciones.push({
      nombre: partes[i],
      estados: [...cuerpo.matchAll(/const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g)].map((m) => m[1]),
      hooks: hooksPropios.filter((hook) => cuerpo.includes(hook + "(")),
    });
  }
  // Primero la función que se exporta (la raíz), después las de adentro.
  const raiz = codigo.match(/export\s+default\s+(\w+)/)?.[1];
  return funciones
    .filter((f) => f.estados.length > 0 || f.hooks.length > 0)
    .sort((a, b) => (b.nombre === raiz) - (a.nombre === raiz));
}

const funcionesApp = estadoPorFuncion(codigoApp);

// ---- 2. Armar las filas del árbol ----------------------------------------

function hijosVisibles(nombre) {
  return (usos[nombre] ?? []).filter((n) => !EN_TODOS_LADOS.includes(n));
}

// Un componente que a su vez usa otros se detalla en una fila propia, debajo,
// solo la primera vez que aparece; las demás veces se dibuja con borde
// punteado ("se detalla en otra rama").
const detallados = new Set();
const filas = [];

function agregarFila(fila, hijos, nivel) {
  const conDetalle = hijos.map((nombre) => {
    const seDetallaAca = hijosVisibles(nombre).length > 0 && !detallados.has(nombre);
    if (seDetallaAca) detallados.add(nombre);
    return { nombre, seDetallaAca, repetido: hijosVisibles(nombre).length > 0 && !seDetallaAca };
  });
  filas.push({ ...fila, nivel, hijos: conDetalle });
  for (const hijo of conDetalle) {
    if (hijo.seDetallaAca) {
      agregarFila({ etiqueta: hijo.nombre, tipo: "componente" }, hijosVisibles(hijo.nombre), nivel + 1);
    }
  }
}

const paginasDeApp = usos.App.filter((n) => n in paginas);
// Las pantallas de acceso se reconocen porque usan AuthLayout.
const paginasAcceso = paginasDeApp.filter((n) => paginas[n].includes("AuthLayout"));
const paginasConSesion = paginasDeApp.filter((n) => !paginasAcceso.includes(n));

agregarFila(
  { etiqueta: "Estructura común", tipo: "grupo" },
  usos.App.filter((n) => !(n in paginas) && !EN_TODOS_LADOS.includes(n)),
  0,
);
if (paginasAcceso.length > 0) {
  const hijosAcceso = [...new Set(paginasAcceso.flatMap(hijosVisibles))];
  agregarFila(
    { etiqueta: "Pantallas de acceso", subtitulo: paginasAcceso.map(mostrar).join(" · "), tipo: "grupo" },
    hijosAcceso,
    0,
  );
}
for (const pagina of paginasConSesion) {
  agregarFila({ etiqueta: pagina, tipo: "pantalla" }, hijosVisibles(pagina), 0);
}

// ---- 3. Dibujar -----------------------------------------------------------

const COLOR = {
  appFondo: "#1E293B",
  appTitulo: "#F8FAFC",
  appEstado: "#93C5FD",
  appRotulo: "#CBD5E1",
  linea: "#94A3B8",
  cajaFondo: "#FFFFFF",
  grupoFondo: "#F8FAFC",
  cajaTexto: "#1E293B",
  pildoraFondo: "#DBEAFE",
  pildoraBorde: "#2563EB",
  pildoraTexto: "#1E3A8A",
  textoSecundario: "#334155",
  marco: "#E2E8F0",
};

const MARGEN = 24;
const ALTO = 52; // alto de cajas y píldoras
const ALTO_CON_SUBTITULO = 76;
const ENTRE_FILAS = 18;
const ENTRE_GRUPOS = 14; // aire extra antes de cada fila de primer nivel
const SANGRIA = 40; // cuánto se corre cada nivel
const ENTRE_PILDORAS = 14;

// Ancho aproximado de un texto (no hay navegador para medirlo): las
// mayúsculas ocupan más que las minúsculas, y las letras finas, menos.
function anchoTexto(texto, tamano = 24) {
  let ancho = 0;
  for (const letra of texto) {
    if (/[ilj.,·:'()]/.test(letra)) ancho += 7;
    else if (/[ftr ]/.test(letra)) ancho += 8.5;
    else if (/[mwMW]/.test(letra)) ancho += 20;
    else if (/[A-Z]/.test(letra)) ancho += 16;
    else ancho += 13;
  }
  return (ancho * tamano) / 24;
}

function escapar(texto) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function texto(x, y, contenido, { tamano = 24, peso = 500, color = COLOR.cajaTexto, ancla = "middle" } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${ancla}" font-size="${tamano}" font-weight="${peso}" fill="${color}">${escapar(contenido)}</text>`;
}

function linea(d) {
  return `<path d="${d}" stroke="${COLOR.linea}" stroke-width="3" fill="none"/>`;
}

function pildora(x, y, componente, { repetido = false } = {}) {
  const nombre = mostrar(componente);
  const ancho = Math.round(anchoTexto(nombre) + 40);
  const borde = repetido ? ` stroke-dasharray="7 5"` : "";
  return {
    ancho,
    svg:
      `<rect x="${x}" y="${y}" width="${ancho}" height="${ALTO}" rx="${ALTO / 2}" fill="${COLOR.pildoraFondo}" stroke="${COLOR.pildoraBorde}" stroke-width="2"${borde}/>\n` +
      texto(x + ancho / 2, y + 34, nombre, { color: COLOR.pildoraTexto }),
  };
}

// Recuadro de App: título, estado y hooks de cada función de App.jsx.
const lineasApp = [];
funcionesApp.forEach((f, i) => {
  if (i > 0) lineasApp.push({ separacion: 22 });
  lineasApp.push({ contenido: f.nombre, tamano: i === 0 ? 36 : 28, peso: 700, color: COLOR.appTitulo, alto: i === 0 ? 46 : 40 });
  if (f.estados.length > 0) {
    lineasApp.push({ contenido: "estado", tamano: 18, peso: 500, color: COLOR.appRotulo, alto: 28 });
    for (const estado of f.estados) {
      lineasApp.push({ contenido: estado, tamano: 22, peso: 500, color: COLOR.appEstado, alto: 30 });
    }
  }
  if (f.hooks.length > 0) {
    lineasApp.push({ contenido: "hook", tamano: 18, peso: 500, color: COLOR.appRotulo, alto: 28 });
    for (const hook of f.hooks) {
      lineasApp.push({ contenido: hook + "()", tamano: 22, peso: 500, color: COLOR.appEstado, alto: 30 });
    }
  }
});
const anchoApp = Math.round(
  Math.max(220, ...lineasApp.filter((l) => l.contenido).map((l) => anchoTexto(l.contenido, l.tamano) + 56)),
);
const xTronco = anchoApp + 28;

// Posición vertical de cada fila.
let y = 0;
filas.forEach((fila, i) => {
  if (i > 0 && fila.nivel === 0) y += ENTRE_GRUPOS;
  fila.alto = fila.subtitulo ? ALTO_CON_SUBTITULO : ALTO;
  fila.y = y;
  fila.centro = y + fila.alto / 2;
  y += fila.alto + ENTRE_FILAS;
});
const altoFilas = y - ENTRE_FILAS;

// Todas las cajas de un mismo nivel tienen el mismo ancho, y las píldoras
// empiezan todas en la misma columna.
const anchoPorNivel = {};
for (const fila of filas) {
  const ancho = Math.max(
    anchoTexto(mostrar(fila.etiqueta), 24) + 48,
    fila.subtitulo ? anchoTexto(fila.subtitulo, 18) + 40 : 0,
  );
  anchoPorNivel[fila.nivel] = Math.round(Math.max(anchoPorNivel[fila.nivel] ?? 0, ancho));
}
const xCaja = (nivel) => xTronco + 28 + nivel * SANGRIA;
const xPildoras = Math.max(...filas.map((f) => xCaja(f.nivel) + anchoPorNivel[f.nivel])) + 36;

const partes = [];

// App y el tronco que lo une con las filas de primer nivel.
partes.push(`<rect x="0" y="0" width="${anchoApp}" height="${altoFilas}" rx="16" fill="${COLOR.appFondo}"/>`);
const altoTextoApp = lineasApp.reduce((suma, l) => suma + (l.separacion ?? l.alto), 0);
let yTexto = altoFilas / 2 - altoTextoApp / 2;
for (const l of lineasApp) {
  if (l.separacion) {
    yTexto += l.separacion;
    continue;
  }
  yTexto += l.alto;
  partes.push(texto(anchoApp / 2, Math.round(yTexto - l.alto * 0.28), l.contenido, l));
}
const primerNivel = filas.filter((f) => f.nivel === 0);
partes.push(linea(`M${anchoApp} ${altoFilas / 2} H${xTronco}`));
partes.push(linea(`M${xTronco} ${primerNivel[0].centro} V${primerNivel.at(-1).centro}`));

let anchoTotal = xPildoras;
filas.forEach((fila, i) => {
  const x = xCaja(fila.nivel);
  const ancho = anchoPorNivel[fila.nivel];

  // Conexión con el padre: el tronco (nivel 0) o la caja de arriba.
  if (fila.nivel === 0) {
    partes.push(linea(`M${xTronco} ${fila.centro} H${x}`));
  } else {
    const padre = filas.slice(0, i).findLast((f) => f.nivel === fila.nivel - 1);
    const xBajada = xCaja(padre.nivel) + 20;
    partes.push(linea(`M${xBajada} ${padre.y + padre.alto} V${fila.centro} H${x}`));
  }

  const fondo = fila.tipo === "grupo" ? COLOR.grupoFondo : COLOR.cajaFondo;
  partes.push(`<rect x="${x}" y="${fila.y}" width="${ancho}" height="${fila.alto}" rx="12" fill="${fondo}" stroke="${COLOR.linea}" stroke-width="2"/>`);
  if (fila.subtitulo) {
    partes.push(texto(x + ancho / 2, fila.y + 32, fila.etiqueta, { peso: 600 }));
    partes.push(texto(x + ancho / 2, fila.y + 60, fila.subtitulo, { tamano: 18, color: COLOR.textoSecundario }));
  } else {
    partes.push(texto(x + ancho / 2, fila.y + 34, mostrar(fila.etiqueta), { peso: 600 }));
  }

  if (fila.hijos.length > 0) {
    partes.push(linea(`M${x + ancho} ${fila.centro} H${xPildoras}`));
  }
  let xHijo = xPildoras;
  for (const hijo of fila.hijos) {
    const p = pildora(xHijo, fila.centro - ALTO / 2, hijo.nombre, hijo);
    partes.push(p.svg);
    xHijo += p.ancho + ENTRE_PILDORAS;
  }
  anchoTotal = Math.max(anchoTotal, xHijo - ENTRE_PILDORAS);
});

// Referencias: los componentes de todos lados y qué significa el borde punteado.
function enLista(nombres) {
  if (nombres.length <= 1) return nombres.join("");
  return nombres.slice(0, -1).join(", ") + " y " + nombres.at(-1);
}

const yReferencias = altoFilas + 32;
const EJEMPLO_REPETIDO = "Componente";
const xRefTexto = 40 + Math.max(...[...EN_TODOS_LADOS, EJEMPLO_REPETIDO].map((n) => anchoTexto(n) + 40)) + 20;
const anchoTextoRef = anchoTotal - xRefTexto - 24;
const referencias = [];
let yRef = yReferencias + 48;
referencias.push(texto(24, yReferencias + 38, "Usados en todos lados (no se repiten en cada rama)", { peso: 600, ancla: "start" }));

// Parte una lista de nombres en renglones que entren en el ancho disponible.
function renglones(prefijo, nombres, tamano) {
  const resultado = [];
  let actual = prefijo;
  nombres.forEach((nombre, i) => {
    const pieza = nombre + (i < nombres.length - 2 ? ", " : i === nombres.length - 2 ? " y " : "");
    if (anchoTexto(actual + pieza, tamano) > anchoTextoRef && actual !== prefijo) {
      resultado.push(actual.trimEnd());
      actual = "";
    }
    actual += pieza;
  });
  resultado.push(actual);
  return resultado;
}

for (const nombre of EN_TODOS_LADOS) {
  const quienes = Object.keys(usos)
    .filter((n) => usos[n].includes(nombre))
    .sort()
    .map(mostrar);
  const lineasRef = renglones("Lo usan: ", quienes, 20);
  const altoBloque = Math.max(ALTO, lineasRef.length * 28 + 12);
  referencias.push(pildora(40, yRef + (altoBloque - ALTO) / 2, nombre).svg);
  const yPrimera = yRef + altoBloque / 2 - ((lineasRef.length - 1) * 28) / 2 + 7;
  lineasRef.forEach((renglon, i) => {
    referencias.push(texto(xRefTexto, yPrimera + i * 28, renglon, { tamano: 20, color: COLOR.textoSecundario, ancla: "start" }));
  });
  yRef += altoBloque + 12;
}
referencias.push(pildora(40, yRef, EJEMPLO_REPETIDO, { repetido: true }).svg);
referencias.push(
  texto(xRefTexto, yRef + 33, "Borde punteado: el componente usa otros, pero se detalla en otra rama.", {
    tamano: 20,
    color: COLOR.textoSecundario,
    ancla: "start",
  }),
);
yRef += ALTO + 24;
partes.push(
  `<rect x="0" y="${yReferencias}" width="${anchoTotal}" height="${yRef - yReferencias}" rx="16" fill="${COLOR.grupoFondo}" stroke="${COLOR.linea}" stroke-width="2"/>`,
  ...referencias,
);

// Descripción en texto para lectores de pantalla, armada con los mismos datos.
const descripcion = [
  ...funcionesApp.map((f) => {
    const piezas = [];
    if (f.estados.length) piezas.push(`guarda el estado ${enLista(f.estados)}`);
    if (f.hooks.length) piezas.push(`usa el hook ${enLista(f.hooks)}`);
    return `${f.nombre} ${piezas.join(" y ")}.`;
  }),
  ...filas
    .filter((f) => f.hijos.length > 0)
    .map((f) => {
      const etiqueta = mostrar(f.etiqueta);
      const quien = f.subtitulo ? `${etiqueta} (${enLista(f.subtitulo.split(" · "))})` : etiqueta;
      return `${quien}: ${enLista(f.hijos.map((h) => mostrar(h.nombre)))}.`;
    }),
  `${enLista(EN_TODOS_LADOS)} se usan en casi todas las pantallas.`,
].join(" ");

const ancho = anchoTotal + MARGEN * 2;
const alto = yRef + MARGEN * 2;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-labelledby="titulo descripcion" font-family="Inter, Arial, sans-serif">
<title id="titulo">Árbol de componentes de Patrimonio</title>
<desc id="descripcion">${escapar(descripcion)}</desc>
<!-- Generado con "npm run arbol" (scripts/generar-arbol.mjs). No editar a mano. -->
<rect x="0" y="0" width="${ancho}" height="${alto}" rx="20" fill="#FFFFFF" stroke="${COLOR.marco}" stroke-width="2"/>
<g transform="translate(${MARGEN} ${MARGEN})">
${partes.join("\n")}
</g>
</svg>
`;

writeFileSync(SALIDA, svg);

// Aviso si algún componente o pantalla no quedó en el diagrama.
const enElDiagrama = new Set([
  ...paginasDeApp,
  ...EN_TODOS_LADOS,
  ...filas.flatMap((f) => [f.etiqueta, ...f.hijos.map((h) => h.nombre)]),
]);
const faltan = [...Object.keys(paginas), ...Object.keys(componentes)].filter((n) => !enElDiagrama.has(n));

console.log(`Listo: docs/arbol-de-componentes.svg (${filas.length} filas, ${ancho}x${alto} px)`);
if (faltan.length > 0) {
  console.log(`Aviso: no aparecen en el árbol (nadie los importa): ${faltan.join(", ")}`);
}
