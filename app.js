const STORAGE_KEY = "bibliotecaFacilLibros";
const BACKUP_KEY = "bibliotecaFacilBackups";
let libros = [];
let editandoId = null;
let portadaSeleccionada = "";
let valoracionSeleccionada = 0;
let scannerActivo = false;
let scannerStream = null;
let scannerDetector = null;

const form = document.getElementById("formLibro");
const inputIsbn = document.getElementById("isbn");
const inputTipo = document.getElementById("tipo");
const inputTitulo = document.getElementById("titulo");
const inputAutor = document.getElementById("autor");
const inputEditorial = document.getElementById("editorial");
const inputAnio = document.getElementById("anio");
const inputCategoria = document.getElementById("categoria");
const camposComic = document.getElementById("camposComic");
const inputSerie = document.getElementById("serie");
const inputNumeroTomo = document.getElementById("numeroTomo");
const inputVolumen = document.getElementById("volumen");
const inputGuionista = document.getElementById("guionista");
const inputDibujante = document.getElementById("dibujante");
const inputUniverso = document.getElementById("universo");
const inputPortada = document.getElementById("portada");
const inputPaginas = document.getElementById("paginas");
const inputFechaFin = document.getElementById("fechaFin");
const inputPersonaPrestamo = document.getElementById("personaPrestamo");
const inputFechaPrestamo = document.getElementById("fechaPrestamo");
const inputFechaDevolucion = document.getElementById("fechaDevolucion");
const inputColeccion = document.getElementById("coleccion");
const inputNotas = document.getElementById("notas");
const checkboxWishlist = document.getElementById("wishlist");
const checkboxFavorite = document.getElementById("favorite");
const selectEstado = document.getElementById("estado");
const previewPortadaContenedor = document.getElementById("previewPortadaContenedor");
const previewPortada = document.getElementById("previewPortada");
const estrellas = document.getElementById("valoracionEstrellas");
const listaLibros = document.getElementById("listaLibros");
const buscador = document.getElementById("buscar");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroEstado = document.getElementById("filtroEstado");
const filtroColeccion = document.getElementById("filtroColeccion");
const filtroTipo = document.getElementById("filtroTipo");
const filtroOrden = document.getElementById("filtroOrden");
const btnVistaSeries = document.getElementById("btnVistaSeries");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const btnExportar = document.getElementById("btnExportar");
const btnImportar = document.getElementById("btnImportar");
const btnBuscarIsbn = document.getElementById("btnBuscarIsbn");
const btnEscanear = document.getElementById("btnEscanear");
const btnDetenerScanner = document.getElementById("btnDetenerScanner");
const scannerContainer = document.getElementById("scannerContainer");
const videoScanner = document.getElementById("videoScanner");
const estadoBusqueda = document.getElementById("estadoBusqueda");
const inputImportar = document.getElementById("inputImportar");
const contadorLibros = document.getElementById("contadorLibros");
const estadoVacio = document.getElementById("estadoVacio");
const estadisticasBiblioteca = document.getElementById("estadisticasBiblioteca");
const chartContainer = document.getElementById("chartContainer");
const btnTheme = document.getElementById("btnTheme");

function normalizarLibro(libro, index = 0) {
  const tipo = libro.type === "comic" ? "comic" : "book";
  return {
    id: libro.id || `${Date.now()}-${index}`,
    titulo: libro.titulo || libro.title || "",
    autor: libro.autor || libro.author || "",
    editorial: libro.editorial || libro.publisher || "",
    year: libro.year || "",
    categoria: libro.categoria || libro.category || "",
    status: libro.status || "Pending",
    cover: libro.cover || "",
    rating: Number(libro.rating || 0),
    pages: libro.pages || "",
    finishDate: libro.finishDate || "",
    notes: libro.notes || "",
    isbn: libro.isbn || "",
    loanTo: libro.loanTo || "",
    loanDate: libro.loanDate || "",
    returnDate: libro.returnDate || "",
    wishlist: Boolean(libro.wishlist),
    favorite: Boolean(libro.favorite),
    collection: libro.collection || "",
    type: tipo,
    serie: libro.serie || libro.series || "",
    issueNumber: libro.issueNumber || libro.numeroTomo || "",
    volume: libro.volume || libro.volumen || "",
    writer: libro.writer || libro.guionista || "",
    artist: libro.artist || libro.dibujante || "",
    universe: libro.universe || libro.universo || ""
  };
}

function cargarLibros() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    libros = Array.isArray(guardado) ? guardado.map(normalizarLibro) : [];
  } catch (error) {
    libros = [];
  }

  if (libros.length === 0) {
    const respaldo = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
    if (respaldo && Array.isArray(respaldo.libros)) {
      libros = respaldo.libros.map(normalizarLibro);
    }
  }
}

function guardarLibros() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libros));
  const backup = { timestamp: new Date().toISOString(), libros: libros.map((libro) => ({ ...libro })) };
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function obtenerEtiquetaEstado(status) {
  switch (status) {
    case "Reading":
      return "Leyendo";
    case "Pending":
      return "Pendiente";
    default:
      return "Leído";
  }
}

function actualizarTextoGuardar() {
  if (editandoId) {
    btnGuardar.textContent = "Guardar cambios";
    return;
  }
  btnGuardar.textContent = inputTipo.value === "comic" ? "Añadir cómic" : "Añadir libro";
}

function toggleCamposComic() {
  const esComic = inputTipo.value === "comic";
  camposComic.classList.toggle("hidden", !esComic);
  actualizarTextoGuardar();
}

function resetFormulario() {
  form.reset();
  inputTipo.value = "book";
  selectEstado.value = "Read";
  valoracionSeleccionada = 0;
  portadaSeleccionada = "";
  previewPortada.src = "";
  previewPortadaContenedor.classList.add("hidden");
  inputPortada.value = "";
  editandoId = null;
  toggleCamposComic();
  btnCancelar.classList.add("hidden");
  actualizarEstrellas();
}

function actualizarOpcionesCategorias() {
  const categorias = [...new Set(libros.map((libro) => String(libro.categoria || "").trim()).filter(Boolean))].sort();
  const categoriaActual = filtroCategoria.value;

  filtroCategoria.innerHTML = '<option value="todas">Todas las categorías</option>';
  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria;
    filtroCategoria.appendChild(option);
  });

  if (categoriaActual && categorias.includes(categoriaActual)) {
    filtroCategoria.value = categoriaActual;
  } else {
    filtroCategoria.value = "todas";
  }
}

function actualizarOpcionesColecciones() {
  const colecciones = [...new Set(libros.map((libro) => String(libro.collection || "").trim()).filter(Boolean))].sort();
  const coleccionActual = filtroColeccion.value;

  filtroColeccion.innerHTML = '<option value="todas">Todas las colecciones</option>';
  colecciones.forEach((coleccion) => {
    const option = document.createElement("option");
    option.value = coleccion;
    option.textContent = coleccion;
    filtroColeccion.appendChild(option);
  });

  if (coleccionActual && colecciones.includes(coleccionActual)) {
    filtroColeccion.value = coleccionActual;
  } else {
    filtroColeccion.value = "todas";
  }
}

function actualizarEstrellas() {
  const botones = estrellas.querySelectorAll(".estrella");
  botones.forEach((boton) => {
    const value = Number(boton.dataset.value);
    boton.classList.toggle("activa", value <= valoracionSeleccionada);
  });
}

function mostrarPreviewPortada(dataUrl) {
  portadaSeleccionada = dataUrl;
  previewPortada.src = dataUrl;
  previewPortadaContenedor.classList.remove("hidden");
}

function manejarSeleccionPortada(event) {
  const archivo = event.target.files[0];
  if (!archivo) {
    return;
  }
  if (!archivo.type.startsWith("image/")) {
    alert("Selecciona un archivo de imagen válido.");
    inputPortada.value = "";
    return;
  }
  const lector = new FileReader();
  lector.onload = () => mostrarPreviewPortada(lector.result);
  lector.readAsDataURL(archivo);
}

function mostrarEstadoBusqueda(mensaje) {
  estadoBusqueda.textContent = mensaje;
}

async function buscarLibroPorISBN(isbn) {
  const valor = isbn.trim();
  if (!valor) {
    return;
  }

  mostrarEstadoBusqueda("Buscando datos en Open Library...");

  try {
    const respuesta = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(valor)}&jscmd=data&format=json`);
    if (!respuesta.ok) {
      throw new Error("No se pudo recuperar la información");
    }
    const data = await respuesta.json();
    const libro = data[`ISBN:${valor}`];

    if (!libro) {
      throw new Error("ISBN no encontrado");
    }

    inputTitulo.value = libro.title || inputTitulo.value;
    inputAutor.value = (libro.authors || []).map((autor) => autor.name).join(", ") || inputAutor.value;
    inputEditorial.value = (libro.publishers || []).map((editorial) => editorial.name || editorial).join(", ") || inputEditorial.value;
    inputAnio.value = libro.publish_date ? libro.publish_date.match(/\d{4}/)?.[0] || "" : inputAnio.value;
    const coverUrl = libro.cover?.large || libro.cover?.medium || libro.cover?.small || `https://covers.openlibrary.org/b/isbn/${valor}-L.jpg`;
    if (coverUrl) {
      portadaSeleccionada = coverUrl;
      previewPortada.src = coverUrl;
      previewPortadaContenedor.classList.remove("hidden");
    }

    mostrarEstadoBusqueda("Datos cargados automáticamente desde Open Library.");
  } catch (error) {
    mostrarEstadoBusqueda("No se pudieron cargar los datos automáticamente. Puedes completarlos manualmente.");
  }
}

async function iniciarEscaneoIsbn() {
  if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
    mostrarEstadoBusqueda("Tu navegador no admite escaneo de cámara. Puedes introducir el ISBN manualmente.");
    return;
  }

  scannerContainer.classList.remove("hidden");
  mostrarEstadoBusqueda("Apunta la cámara al código ISBN...");
  scannerActivo = true;

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    videoScanner.srcObject = scannerStream;
    await videoScanner.play();

    if (!scannerDetector) {
      scannerDetector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "code_128"] });
    }

    const scan = async () => {
      if (!scannerActivo) {
        return;
      }
      try {
        const codigos = await scannerDetector.detect(videoScanner);
        if (codigos.length > 0) {
          const valor = codigos[0].rawValue;
          if (valor) {
            scannerActivo = false;
            await detenerEscaneoIsbn();
            inputIsbn.value = valor;
            await buscarLibroPorISBN(valor);
            return;
          }
        }
      } catch (error) {
        // Ignorar errores del escáner y seguir intentando.
      }
      window.setTimeout(scan, 1000);
    };

    scan();
  } catch (error) {
    mostrarEstadoBusqueda("No se pudo iniciar la cámara. Intenta de nuevo o introduce el ISBN manualmente.");
    await detenerEscaneoIsbn();
  }
}

async function detenerEscaneoIsbn() {
  scannerActivo = false;
  scannerContainer.classList.add("hidden");
  if (scannerStream) {
    scannerStream.getTracks().forEach((track) => track.stop());
    scannerStream = null;
  }
  if (videoScanner.srcObject) {
    videoScanner.srcObject = null;
  }
}

function compararPorCampo(a, b, orden) {
  switch (orden) {
    case "serie":
      return String(a.serie || "").localeCompare(String(b.serie || ""), "es", { sensitivity: "base" });
    case "numero": {
      const numeroA = Number(a.issueNumber || 0);
      const numeroB = Number(b.issueNumber || 0);
      if (numeroA !== numeroB) {
        return numeroA - numeroB;
      }
      return String(a.titulo || "").localeCompare(String(b.titulo || ""), "es", { sensitivity: "base" });
    }
    case "autor":
      return String(a.autor || "").localeCompare(String(b.autor || ""), "es", { sensitivity: "base" });
    case "editorial":
      return String(a.editorial || "").localeCompare(String(b.editorial || ""), "es", { sensitivity: "base" });
    case "fecha": {
      const fechaA = a.finishDate || a.year || "";
      const fechaB = b.finishDate || b.year || "";
      return String(fechaA).localeCompare(String(fechaB), "es", { sensitivity: "base" });
    }
    case "valoracion":
      return Number(b.rating || 0) - Number(a.rating || 0);
    default:
      return 0;
  }
}

function renderEstadisticas() {
  const total = libros.length;
  const librosCount = libros.filter((libro) => libro.type !== "comic").length;
  const comicsCount = libros.filter((libro) => libro.type === "comic").length;
  const leidos = libros.filter((libro) => libro.status === "Read").length;
  const leyendo = libros.filter((libro) => libro.status === "Reading").length;
  const pendientes = libros.filter((libro) => libro.status === "Pending").length;
  const ratings = libros.map((libro) => Number(libro.rating || 0)).filter((valor) => valor > 0);
  const promedio = ratings.length > 0 ? (ratings.reduce((acum, valor) => acum + valor, 0) / ratings.length).toFixed(1) : "0.0";
  const paginasLeidas = libros.filter((libro) => libro.status === "Read").reduce((acum, libro) => acum + Number(libro.pages || 0), 0);
  const loansActivos = libros.filter((libro) => libro.loanTo && !libro.returnDate).length;
  const favoritosLibros = libros.filter((libro) => libro.type !== "comic" && libro.favorite).length;
  const favoritosComics = libros.filter((libro) => libro.type === "comic" && libro.favorite).length;
  const wishlist = libros.filter((libro) => libro.wishlist).length;

  estadisticasBiblioteca.innerHTML = `
    <div class="estadistica-card"><span>Libros</span><strong>${librosCount}</strong></div>
    <div class="estadistica-card"><span>Cómics</span><strong>${comicsCount}</strong></div>
    <div class="estadistica-card"><span>Total colección</span><strong>${total}</strong></div>
    <div class="estadistica-card"><span>Páginas leídas</span><strong>${paginasLeidas}</strong></div>
    <div class="estadistica-card"><span>Valoración media</span><strong>${promedio}★</strong></div>
    <div class="estadistica-card"><span>Favoritos libros</span><strong>${favoritosLibros}</strong></div>
    <div class="estadistica-card"><span>Favoritos cómics</span><strong>${favoritosComics}</strong></div>
    <div class="estadistica-card"><span>Préstamos activos</span><strong>${loansActivos}</strong></div>
  `;

  const totals = { Libros: librosCount, Cómics: comicsCount, Leídos: leidos };
  const maxValue = Math.max(...Object.values(totals), 1);
  chartContainer.innerHTML = `
    <svg viewBox="0 0 320 180" role="img" aria-label="Estadísticas de la colección">
      ${Object.entries(totals).map(([label, value], index) => {
        const barHeight = (value / maxValue) * 120;
        const x = 40 + index * 100;
        const y = 140 - barHeight;
        return `<g>
          <rect x="${x}" y="${y}" width="40" height="${barHeight}" rx="6" fill="${index === 0 ? "#2563eb" : index === 1 ? "#f59e0b" : "#10b981"}"></rect>
          <text x="${x + 20}" y="160" text-anchor="middle" fill="currentColor" font-size="12">${label}</text>
          <text x="${x + 20}" y="${y - 8}" text-anchor="middle" fill="currentColor" font-size="12">${value}</text>
        </g>`;
      }).join("")}
    </svg>
  `;
}

function crearElementoItem(libro) {
  const item = document.createElement("article");
  item.className = "libro-card";
  const portada = libro.cover ? `<img class="portada-mini" src="${escapeHtml(libro.cover)}" alt="Portada de ${escapeHtml(libro.titulo)}">` : `<div class="portada-placeholder">Sin portada</div>`;
  const loanInfo = libro.loanTo ? `<p class="detalle-libro">Préstamo a ${escapeHtml(libro.loanTo)}${libro.returnDate ? ` · devolución ${escapeHtml(libro.returnDate)}` : ""}</p>` : "";
  const tipoEtiqueta = libro.type === "comic" ? "Cómic" : "Libro";
  const detalleComic = libro.type === "comic" ? `
    ${libro.serie ? `<p class="detalle-libro">Serie: ${escapeHtml(libro.serie)}</p>` : ""}
    ${libro.issueNumber ? `<p class="detalle-libro">Tomo: ${escapeHtml(libro.issueNumber)}</p>` : ""}
    ${libro.writer ? `<p class="detalle-libro">Guionista: ${escapeHtml(libro.writer)}</p>` : ""}
    ${libro.artist ? `<p class="detalle-libro">Dibujante: ${escapeHtml(libro.artist)}</p>` : ""}
    ${libro.universe ? `<p class="detalle-libro">Universo: ${escapeHtml(libro.universe)}</p>` : ""}
  ` : "";

  item.innerHTML = `
    <div class="libro-info">
      ${portada}
      <div>
        <div class="libro-meta">
          <strong>${escapeHtml(libro.titulo)}</strong>
          <span class="estado-badge">${escapeHtml(obtenerEtiquetaEstado(libro.status))}</span>
        </div>
        <p>${escapeHtml(libro.autor)}</p>
        <p class="categoria">${escapeHtml(tipoEtiqueta)} · ${escapeHtml(libro.categoria || "Sin categoría")}</p>
        <p class="detalle-libro">${Number(libro.rating || 0) > 0 ? `⭐ ${libro.rating}/5` : "Sin valoración"}${libro.pages ? ` · ${libro.pages} págs.` : ""}${libro.finishDate ? ` · Finalizado: ${escapeHtml(libro.finishDate)}` : ""}</p>
        ${detalleComic}
        ${libro.editorial ? `<p class="detalle-libro">Editorial: ${escapeHtml(libro.editorial)}</p>` : ""}
        ${libro.collection ? `<p class="detalle-libro">Colección: ${escapeHtml(libro.collection)}</p>` : ""}
        ${loanInfo}
        ${libro.notes ? `<p class="detalle-libro">Notas: ${escapeHtml(libro.notes)}</p>` : ""}
      </div>
    </div>
    <div class="acciones-libro">
      <button type="button" class="pill-toggle ${libro.favorite ? "active" : ""}" data-action="favorite" data-id="${libro.id}">${libro.favorite ? "★" : "☆"}</button>
      <button type="button" class="pill-toggle ${libro.wishlist ? "active" : ""}" data-action="wishlist" data-id="${libro.id}">${libro.wishlist ? "♥" : "♡"}</button>
      <button type="button" class="editar" data-id="${libro.id}">Editar</button>
      <button type="button" class="eliminar" data-id="${libro.id}">Eliminar</button>
    </div>
  `;
  return item;
}

function renderLibros() {
  actualizarOpcionesCategorias();
  actualizarOpcionesColecciones();
  renderEstadisticas();

  const texto = buscador.value.trim().toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoSeleccionado = filtroEstado.value;
  const coleccionSeleccionada = filtroColeccion.value;
  const tipoSeleccionado = filtroTipo.value;
  const ordenSeleccionado = filtroOrden.value;
  const mostrarPorSeries = btnVistaSeries.classList.contains("active");

  const librosFiltrados = libros.filter((libro) => {
    const textoEnLibro = `${libro.titulo} ${libro.autor} ${libro.categoria} ${libro.collection || ""} ${libro.serie || ""} ${libro.notes || ""}`.toLowerCase();
    const coincideTexto = textoEnLibro.includes(texto);
    const coincideCategoria = categoriaSeleccionada === "todas" || String(libro.categoria || "").toLowerCase() === categoriaSeleccionada.toLowerCase();
    const coincideEstado = estadoSeleccionado === "todos" || libro.status === estadoSeleccionado;
    const coincideColeccion = coleccionSeleccionada === "todas" || String(libro.collection || "") === coleccionSeleccionada;
    const coincideTipo = tipoSeleccionado === "todos" || (tipoSeleccionado === "favorites" && libro.favorite) || (tipoSeleccionado === "wishlist" && libro.wishlist);

    return coincideTexto && coincideCategoria && coincideEstado && coincideColeccion && coincideTipo;
  });

  const ordenados = [...librosFiltrados].sort((a, b) => compararPorCampo(a, b, ordenSeleccionado));

  contadorLibros.textContent = `${ordenados.length} elemento${ordenados.length === 1 ? "" : "s"} en tu colección`;

  if (ordenados.length === 0) {
    estadoVacio.classList.remove("hidden");
    listaLibros.innerHTML = "";
    return;
  }

  estadoVacio.classList.add("hidden");
  listaLibros.innerHTML = "";

  if (mostrarPorSeries && ordenados.some((libro) => libro.type === "comic")) {
    const grupos = new Map();
    ordenados.filter((libro) => libro.type === "comic").forEach((libro) => {
      const clave = (libro.serie || "Sin serie").trim() || "Sin serie";
      if (!grupos.has(clave)) {
        grupos.set(clave, []);
      }
      grupos.get(clave).push(libro);
    });

    const gruposOrdenados = [...grupos.entries()].sort(([serieA], [serieB]) => String(serieA).localeCompare(String(serieB), "es", { sensitivity: "base" }));

    gruposOrdenados.forEach(([serie, itemsSerie]) => {
      const grupo = document.createElement("section");
      grupo.className = "serie-group";
      const header = document.createElement("div");
      header.className = "serie-header";
      header.innerHTML = `<h3>${escapeHtml(serie)}</h3><span>${itemsSerie.length} tomo${itemsSerie.length === 1 ? "" : "s"}</span>`;
      grupo.appendChild(header);

      const contenedor = document.createElement("div");
      contenedor.className = "serie-items";
      itemsSerie.sort((a, b) => compararPorCampo(a, b, "numero")).forEach((libro) => contenedor.appendChild(crearElementoItem(libro)));
      grupo.appendChild(contenedor);
      listaLibros.appendChild(grupo);
    });

    const librosSimples = ordenados.filter((libro) => libro.type !== "comic");
    if (librosSimples.length > 0) {
      const seccionLibros = document.createElement("section");
      seccionLibros.className = "serie-group";
      seccionLibros.innerHTML = `<div class="serie-header"><h3>Libros</h3><span>${librosSimples.length}</span></div>`;
      const contenedor = document.createElement("div");
      contenedor.className = "serie-items";
      librosSimples.forEach((libro) => contenedor.appendChild(crearElementoItem(libro)));
      seccionLibros.appendChild(contenedor);
      listaLibros.appendChild(seccionLibros);
    }
    return;
  }

  ordenados.forEach((libro) => listaLibros.appendChild(crearElementoItem(libro)));
}

function guardarLibro(event) {
  event.preventDefault();

  const titulo = inputTitulo.value.trim();
  const autor = inputAutor.value.trim();
  const categoria = inputCategoria.value.trim();
  const status = selectEstado.value;
  const pages = inputPaginas.value.trim();
  const finishDate = inputFechaFin.value;
  const notes = inputNotas.value.trim();
  const isbn = inputIsbn.value.trim();
  const editorial = inputEditorial.value.trim();
  const year = inputAnio.value.trim();
  const loanTo = inputPersonaPrestamo.value.trim();
  const loanDate = inputFechaPrestamo.value;
  const returnDate = inputFechaDevolucion.value;
  const collection = inputColeccion.value.trim();
  const wishlist = checkboxWishlist.checked;
  const favorite = checkboxFavorite.checked;
  const type = inputTipo.value === "comic" ? "comic" : "book";
  const serie = inputSerie.value.trim();
  const issueNumber = inputNumeroTomo.value.trim();
  const volume = inputVolumen.value.trim();
  const writer = inputGuionista.value.trim();
  const artist = inputDibujante.value.trim();
  const universe = inputUniverso.value.trim();

  if (!titulo || !autor || !categoria) {
    alert("Completa título, autor y categoría para guardar el elemento.");
    return;
  }

  const cover = portadaSeleccionada || (editandoId ? libros.find((libro) => libro.id === editandoId)?.cover || "" : "");
  const libroBase = {
    titulo,
    autor,
    editorial,
    year,
    categoria,
    status,
    rating: valoracionSeleccionada,
    pages,
    finishDate,
    notes,
    isbn,
    loanTo,
    loanDate,
    returnDate,
    wishlist,
    favorite,
    collection,
    cover,
    type,
    serie,
    issueNumber,
    volume,
    writer,
    artist,
    universe,
    title: titulo,
    author: autor,
    category: categoria
  };

  if (editandoId) {
    libros = libros.map((libro) => (libro.id === editandoId ? { ...libro, ...libroBase } : libro));
  } else {
    libros.unshift({ id: Date.now().toString(), ...libroBase });
  }

  guardarLibros();
  resetFormulario();
  renderLibros();
}

function editarLibro(id) {
  const libro = libros.find((item) => item.id === id);
  if (!libro) {
    return;
  }

  inputTipo.value = libro.type === "comic" ? "comic" : "book";
  inputIsbn.value = libro.isbn || "";
  inputTitulo.value = libro.titulo || "";
  inputAutor.value = libro.autor || "";
  inputEditorial.value = libro.editorial || "";
  inputAnio.value = libro.year || "";
  inputCategoria.value = libro.categoria || "";
  inputSerie.value = libro.serie || "";
  inputNumeroTomo.value = libro.issueNumber || "";
  inputVolumen.value = libro.volume || "";
  inputGuionista.value = libro.writer || "";
  inputDibujante.value = libro.artist || "";
  inputUniverso.value = libro.universe || "";
  inputPaginas.value = libro.pages || "";
  inputFechaFin.value = libro.finishDate || "";
  inputPersonaPrestamo.value = libro.loanTo || "";
  inputFechaPrestamo.value = libro.loanDate || "";
  inputFechaDevolucion.value = libro.returnDate || "";
  inputColeccion.value = libro.collection || "";
  inputNotas.value = libro.notes || "";
  checkboxWishlist.checked = Boolean(libro.wishlist);
  checkboxFavorite.checked = Boolean(libro.favorite);
  selectEstado.value = libro.status || "Pending";
  valoracionSeleccionada = Number(libro.rating || 0);
  actualizarEstrellas();
  portadaSeleccionada = libro.cover || "";
  if (libro.cover) {
    previewPortada.src = libro.cover;
    previewPortadaContenedor.classList.remove("hidden");
  } else {
    previewPortada.src = "";
    previewPortadaContenedor.classList.add("hidden");
  }
  inputPortada.value = "";
  editandoId = libro.id;
  toggleCamposComic();
  btnCancelar.classList.remove("hidden");
  btnGuardar.textContent = "Guardar cambios";
  inputTitulo.focus();
}

function eliminarLibro(id) {
  const confirmar = confirm("¿Deseas eliminar este elemento?");
  if (!confirmar) {
    return;
  }
  libros = libros.filter((libro) => libro.id !== id);
  guardarLibros();
  if (editandoId === id) {
    resetFormulario();
  }
  renderLibros();
}

function alternarMarca(id, campo) {
  libros = libros.map((libro) => {
    if (libro.id === id) {
      return { ...libro, [campo]: !libro[campo] };
    }
    return libro;
  });
  guardarLibros();
  renderLibros();
}

function exportarBiblioteca() {
  const contenido = JSON.stringify(libros, null, 2);
  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "biblioteca-facil.json";
  enlace.click();
  URL.revokeObjectURL(url);
}

function importarBiblioteca(event) {
  const archivo = event.target.files[0];
  if (!archivo) {
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    try {
      const datos = JSON.parse(lector.result);
      const librosImportados = Array.isArray(datos) ? datos : datos.books;
      if (!Array.isArray(librosImportados)) {
        throw new Error("Formato inválido");
      }
      const confirmar = confirm("¿Deseas reemplazar tu biblioteca actual con los datos del archivo?");
      if (!confirmar) {
        inputImportar.value = "";
        return;
      }

      libros = librosImportados.map((libro, index) => normalizarLibro(libro, index));
      guardarLibros();
      resetFormulario();
      renderLibros();
      inputImportar.value = "";
    } catch (error) {
      alert("No se pudo importar el archivo JSON.");
      inputImportar.value = "";
    }
  };
  lector.readAsText(archivo);
}

function aplicarTema(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  btnTheme.textContent = theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

function toggleTema() {
  const theme = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem("bibliotecaFacilTheme", theme);
  aplicarTema(theme);
}

form.addEventListener("submit", guardarLibro);
inputPortada.addEventListener("change", manejarSeleccionPortada);
inputTipo.addEventListener("change", toggleCamposComic);
btnCancelar.addEventListener("click", resetFormulario);
btnExportar.addEventListener("click", exportarBiblioteca);
btnImportar.addEventListener("click", () => inputImportar.click());
inputImportar.addEventListener("change", importarBiblioteca);
buscador.addEventListener("input", renderLibros);
filtroCategoria.addEventListener("change", renderLibros);
filtroEstado.addEventListener("change", renderLibros);
filtroColeccion.addEventListener("change", renderLibros);
filtroTipo.addEventListener("change", renderLibros);
filtroOrden.addEventListener("change", renderLibros);
btnVistaSeries.addEventListener("click", () => {
  btnVistaSeries.classList.toggle("active");
  btnVistaSeries.textContent = btnVistaSeries.classList.contains("active") ? "✓ Agrupar por series" : "Agrupar por series";
  renderLibros();
});
btnBuscarIsbn.addEventListener("click", () => buscarLibroPorISBN(inputIsbn.value));
btnEscanear.addEventListener("click", iniciarEscaneoIsbn);
btnDetenerScanner.addEventListener("click", detenerEscaneoIsbn);
inputIsbn.addEventListener("change", () => buscarLibroPorISBN(inputIsbn.value));

estrellas.addEventListener("click", (event) => {
  const boton = event.target.closest(".estrella");
  if (!boton) {
    return;
  }
  valoracionSeleccionada = Number(boton.dataset.value);
  actualizarEstrellas();
});

listaLibros.addEventListener("click", (event) => {
  const boton = event.target.closest("button");
  if (!boton) {
    return;
  }
  const id = boton.dataset.id;
  if (boton.classList.contains("editar")) {
    editarLibro(id);
  } else if (boton.classList.contains("eliminar")) {
    eliminarLibro(id);
  } else if (boton.dataset.action === "favorite") {
    alternarMarca(id, "favorite");
  } else if (boton.dataset.action === "wishlist") {
    alternarMarca(id, "wishlist");
  }
});

btnTheme.addEventListener("click", toggleTema);

cargarLibros();
aplicarTema(localStorage.getItem("bibliotecaFacilTheme") || "light");
resetFormulario();
renderLibros();