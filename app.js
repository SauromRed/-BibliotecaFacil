const STORAGE_KEY = "bibliotecaFacilLibros";
const BACKUP_KEY = "bibliotecaFacilBackups";
const THEME_KEY = "bibliotecaFacilTheme";

const state = {
  libros: [],
  editandoId: null,
  portadaSeleccionada: "",
  ratingSeleccionada: 0,
  scannerActivo: false,
  scannerInstancia: null,
  linternaActiva: false,
  scanFailureCount: 0,
  theme: "light"
};

let quaggaScriptPromise = null;

const form = document.getElementById("formLibro");
const formSection = document.getElementById("formSection");
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
const btnExportarJson = document.getElementById("btnExportarJson");
const btnExportarCsv = document.getElementById("btnExportarCsv");
const btnImportar = document.getElementById("btnImportar");
const btnBuscarIsbn = document.getElementById("btnBuscarIsbn");
const btnEscanear = document.getElementById("btnEscanear");
const btnEscanearPrincipal = document.getElementById("btnEscanearPrincipal");
const btnAgregarManual = document.getElementById("btnAgregarManual");
const btnDetenerScanner = document.getElementById("btnDetenerScanner");
const btnLinterna = document.getElementById("btnLinterna");
const btnModoSimple = document.getElementById("btnModoSimple");
const scannerContainer = document.getElementById("scannerContainer");
const estadoBusqueda = document.getElementById("estadoBusqueda");
const inputImportar = document.getElementById("inputImportar");
const contadorLibros = document.getElementById("contadorLibros");
const estadoVacio = document.getElementById("estadoVacio");
const estadisticasBiblioteca = document.getElementById("estadisticasBiblioteca");
const btnTheme = document.getElementById("btnTheme");
const btnResetLibrary = document.getElementById("btnResetLibrary");
const statsTotal = document.getElementById("statsTotal");
const statsPaginas = document.getElementById("statsPaginas");
const statsFavoritos = document.getElementById("statsFavoritos");
const statsAutores = document.getElementById("statsAutores");

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeCsv(value) {
  const texto = String(value ?? "");
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function normalizarIsbn(valor) {
  return String(valor ?? "")
    .trim()
    .replace(/^isbn\s*/i, "")
    .replace(/[^0-9Xx]/g, "")
    .toUpperCase();
}

function convertirIsbn13a10(isbn13) {
  if (!isbn13 || isbn13.length !== 13) {
    return null;
  }

  const core = isbn13.slice(3, 12);
  let suma = 0;
  for (let index = 0; index < core.length; index += 1) {
    suma += Number(core[index]) * (10 - index);
  }

  const check = (11 - (suma % 11)) % 11;
  const checkDigit = check === 10 ? "X" : String(check);
  return `${core}${checkDigit}`;
}

function convertirIsbn10a13(isbn10) {
  if (!isbn10 || isbn10.length !== 10) {
    return null;
  }

  const core = isbn10.slice(0, 9);
  let suma = 0;
  for (let index = 0; index < core.length; index += 1) {
    suma += Number(core[index]) * (index + 1);
  }

  const check = (10 - (suma % 10)) % 10;
  return `978${core}${check}`;
}

function generarVariantesIsbn(valor) {
  const limpio = normalizarIsbn(valor);
  if (!limpio) {
    return [];
  }

  const variantes = [limpio];
  if (limpio.length === 13) {
    const isbn10 = convertirIsbn13a10(limpio);
    if (isbn10) {
      variantes.push(isbn10);
    }
  } else if (limpio.length === 10) {
    const isbn13 = convertirIsbn10a13(limpio);
    if (isbn13) {
      variantes.push(isbn13);
    }
  }

  return [...new Set(variantes.filter(Boolean))];
}

function normalizarLibro(libro, index = 0) {
  const tipo = String(libro?.type || "").toLowerCase() === "comic" ? "comic" : "book";
  return {
    id: String(libro?.id || `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`),
    titulo: libro?.titulo || libro?.title || libro?.name || "",
    autor: libro?.autor || libro?.author || libro?.authors || "",
    editorial: libro?.editorial || libro?.publisher || "",
    anio: libro?.anio || libro?.year || libro?.publicationYear || "",
    categoria: libro?.categoria || libro?.category || libro?.genre || "",
    status: libro?.status || "Pending",
    cover: libro?.cover || libro?.thumbnail || "",
    rating: Number(libro?.rating || 0),
    paginas: libro?.paginas || libro?.pages || "",
    fechaFin: libro?.fechaFin || libro?.finishDate || "",
    notas: libro?.notas || libro?.notes || "",
    isbn: libro?.isbn || libro?.isbn13 || "",
    prestamoA: libro?.prestamoA || libro?.loanTo || "",
    fechaPrestamo: libro?.fechaPrestamo || libro?.loanDate || "",
    fechaDevolucion: libro?.fechaDevolucion || libro?.returnDate || "",
    wishlist: Boolean(libro?.wishlist),
    favorite: Boolean(libro?.favorite),
    collection: libro?.collection || "",
    type: tipo,
    serie: libro?.serie || libro?.series || "",
    issueNumber: libro?.issueNumber || libro?.numeroTomo || "",
    volume: libro?.volume || libro?.volumen || "",
    writer: libro?.writer || libro?.guionista || "",
    artist: libro?.artist || libro?.dibujante || "",
    universe: libro?.universe || libro?.universo || "",
    language: libro?.language || libro?.idioma || "",
    genre: libro?.genre || libro?.genero || "",
    description: libro?.description || libro?.descripcion || "",
    createdAt: libro?.createdAt || new Date().toISOString(),
    updatedAt: libro?.updatedAt || new Date().toISOString()
  };
}

function cargarLibros() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    state.libros = Array.isArray(guardado) ? guardado.map(normalizarLibro) : [];
  } catch (error) {
    state.libros = [];
  }

  if (state.libros.length === 0) {
    try {
      const respaldo = JSON.parse(localStorage.getItem(BACKUP_KEY) || "null");
      if (respaldo && Array.isArray(respaldo.libros)) {
        state.libros = respaldo.libros.map(normalizarLibro);
      }
    } catch (error) {
      state.libros = [];
    }
  }
}

function guardarLibros() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.libros));
  const backup = {
    timestamp: new Date().toISOString(),
    libros: state.libros.map((libro) => ({ ...libro }))
  };
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

function mostrarEstado(mensaje) {
  estadoBusqueda.textContent = mensaje;
}

async function obtenerCamaraTrasera() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((device) => device.kind === "videoinput");
    if (!Array.isArray(cams) || cams.length === 0) {
      return null;
    }

    const rearRegex = /rear|back|environment|trasera|trasero|posterior/i;
    const frontRegex = /front|user|delantera|selfie/i;
    const rearCamera = cams.find((cam) => rearRegex.test(cam.label));
    if (rearCamera?.deviceId) {
      return rearCamera;
    }

    const fallbackCamera = cams.find((cam) => !frontRegex.test(cam.label));
    if (fallbackCamera?.deviceId) {
      return fallbackCamera;
    }

    return cams[0];
  } catch (error) {
    return null;
  }
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
  btnGuardar.textContent = state.editandoId
    ? "Guardar cambios"
    : inputTipo.value === "comic"
      ? "Añadir cómic"
      : "Añadir libro";
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
  state.ratingSeleccionada = 0;
  state.portadaSeleccionada = "";
  previewPortada.src = "";
  previewPortadaContenedor.classList.add("hidden");
  inputPortada.value = "";
  state.editandoId = null;
  toggleCamposComic();
  btnCancelar.classList.add("hidden");
  btnLinterna.disabled = true;
  btnDetenerScanner.disabled = true;
  btnEscanear.disabled = false;
  btnEscanearPrincipal.disabled = false;
  actualizarEstrellas();
}

function actualizarOpcionesCategorias() {
  const categorias = [...new Set(state.libros.map((libro) => String(libro.categoria || "").trim()).filter(Boolean))].sort();
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
  const colecciones = [...new Set(state.libros.map((libro) => String(libro.collection || "").trim()).filter(Boolean))].sort();
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
    boton.classList.toggle("activa", value <= state.ratingSeleccionada);
  });
}

function mostrarPreviewPortada(dataUrl) {
  state.portadaSeleccionada = dataUrl;
  previewPortada.src = dataUrl;
  previewPortadaContenedor.classList.remove("hidden");
}

function manejarSeleccionPortada(event) {
  const archivo = event.target.files[0];
  if (!archivo) {
    return;
  }
  if (!archivo.type.startsWith("image/")) {
    alert("Selecciona una imagen válida.");
    inputPortada.value = "";
    return;
  }
  const lector = new FileReader();
  lector.onload = () => mostrarPreviewPortada(lector.result);
  lector.readAsDataURL(archivo);
}

async function buscarDatosLibro(isbn) {
  const valor = normalizarIsbn(isbn);
  if (!valor) {
    return;
  }

  const variantes = generarVariantesIsbn(valor);
  mostrarEstado("Buscando datos del ISBN...");

  const servicios = [
    async () => {
      for (const variante of variantes) {
        const respuesta = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(variante)}`);
        if (!respuesta.ok) {
          continue;
        }
        const data = await respuesta.json();
        const item = data.items?.find((entry) => {
          const ids = entry?.volumeInfo?.industryIdentifiers || [];
          return ids.some((identifier) => normalizarIsbn(identifier.identifier) === variante);
        }) || data.items?.[0];

        if (!item) {
          continue;
        }

        const volumen = item.volumeInfo || {};
        return {
          titulo: volumen.title || "",
          autor: (volumen.authors || []).join(", "),
          editorial: volumen.publisher || "",
          anio: volumen.publishedDate ? String(volumen.publishedDate).slice(0, 4) : "",
          categoria: (volumen.categories || [])[0] || "",
          cover: volumen.imageLinks?.extraLarge || volumen.imageLinks?.large || volumen.imageLinks?.medium || volumen.imageLinks?.thumbnail || "",
          paginas: volumen.pageCount || "",
          language: volumen.language || "",
          description: volumen.description || "",
          genre: (volumen.categories || [])[0] || ""
        };
      }
      throw new Error("Google Books sin resultados");
    },
    async () => {
      for (const variante of variantes) {
        const respuesta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(`isbn:${variante}`)}&limit=5`);
        if (!respuesta.ok) {
          continue;
        }
        const data = await respuesta.json();
        const doc = data.docs?.find((entry) => {
          const identifiers = [entry.isbn?.[0], entry.isbn_13?.[0], entry.isbn_10?.[0]].filter(Boolean);
          return identifiers.some((identifier) => normalizarIsbn(identifier) === variante);
        }) || data.docs?.[0];

        if (!doc) {
          continue;
        }

        return {
          titulo: doc.title || "",
          autor: (doc.author_name || []).join(", "),
          editorial: doc.publisher?.[0] || "",
          anio: doc.first_publish_year ? String(doc.first_publish_year) : "",
          cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : "",
          paginas: doc.number_of_pages_median || "",
          description: doc.subtitle || ""
        };
      }
      throw new Error("Open Library sin resultados");
    },
    async () => {
      for (const variante of variantes) {
        const respuesta = await fetch(`https://openlibrary.org/isbn/${encodeURIComponent(variante)}.json`);
        if (!respuesta.ok) {
          continue;
        }
        const libro = await respuesta.json();
        return {
          titulo: libro.title || "",
          autor: (libro.authors || []).map((autor) => autor.name || autor).join(", "),
          editorial: libro.publishers?.[0]?.name || "",
          anio: libro.publish_date ? String(libro.publish_date).slice(0, 4) : "",
          cover: libro.covers?.[0] ? `https://covers.openlibrary.org/b/id/${libro.covers[0]}-L.jpg` : "",
          paginas: libro.number_of_pages || "",
          description: libro.excerpts?.[0]?.excerpt || ""
        };
      }
      throw new Error("Open Library no responde");
    },
    async () => {
      for (const variante of variantes) {
        const respuesta = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(variante)}&jscmd=data&format=json`);
        if (!respuesta.ok) {
          continue;
        }
        const data = await respuesta.json();
        const libro = data[`ISBN:${variante}`];
        if (!libro) {
          continue;
        }
        return {
          titulo: libro.title || "",
          autor: (libro.authors || []).map((autor) => autor.name || autor).join(", "),
          editorial: (libro.publishers || []).map((editorial) => editorial.name || editorial).join(", "),
          anio: libro.publish_date ? String(libro.publish_date).slice(0, 4) : "",
          cover: libro.cover?.large || libro.cover?.medium || libro.cover?.small || "",
          paginas: libro.number_of_pages || "",
          description: libro.subtitle || ""
        };
      }
      throw new Error("ISBN no encontrado");
    }
  ];

  for (const servicio of servicios) {
    try {
      const datos = await servicio();
      llenarFormularioConDatos(datos);
      mostrarEstado("Datos cargados automáticamente desde una fuente externa.");
      return;
    } catch (error) {
      // Se prueba el siguiente servicio automáticamente.
    }
  }

  mostrarEstado("No se pudieron recuperar los datos automáticamente. Puedes completarlos manualmente.");
}

function llenarFormularioConDatos(datos) {
  if (datos.titulo) inputTitulo.value = datos.titulo;
  if (datos.autor) inputAutor.value = datos.autor;
  if (datos.editorial) inputEditorial.value = datos.editorial;
  if (datos.anio) inputAnio.value = datos.anio;
  if (datos.categoria) inputCategoria.value = datos.categoria;
  if (datos.paginas) inputPaginas.value = datos.paginas;
  if (datos.language) inputNotas.value = `${inputNotas.value}\nIdioma: ${datos.language}`.trim();
  if (datos.genre) inputCategoria.value = datos.genre;
  if (datos.description) inputNotas.value = `${inputNotas.value}\n${datos.description}`.trim();
  if (datos.cover) {
    state.portadaSeleccionada = datos.cover;
    previewPortada.src = datos.cover;
    previewPortadaContenedor.classList.remove("hidden");
  }
}

function prepararVideoScanner() {
  const contenedor = document.getElementById("videoScanner");
  if (!contenedor) {
    return null;
  }

  contenedor.innerHTML = "";
  const video = document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("x-webkit-airplay", "deny");
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.maxHeight = "100%";
  video.style.objectFit = "contain";
  video.style.background = "#000";
  contenedor.appendChild(video);
  return video;
}

function detenerStreamScanner(instancia) {
  if (instancia?.stream) {
    instancia.stream.getTracks().forEach((track) => track.stop());
  }

  if (instancia?.video) {
    instancia.video.pause();
    instancia.video.srcObject = null;
  }

  if (instancia?.animationFrameId) {
    cancelAnimationFrame(instancia.animationFrameId);
  }
}

async function prepararStreamCamara(preferRear = true, videoInicial = null) {
  const video = videoInicial || prepararVideoScanner();
  if (!video) {
    throw new Error("No se pudo preparar la vista previa del escáner.");
  }

  const intentos = [
    {
      video: {
        facingMode: { ideal: preferRear ? "environment" : "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    },
    {
      video: {
        facingMode: { ideal: preferRear ? "user" : "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    },
    {
      video: true,
      audio: false
    }
  ];

  let ultimoError = null;
  for (const constraints of intentos) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await video.play().catch(() => {});
      return { stream, video };
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError || new Error("No se pudo acceder a la cámara.");
}

async function iniciarEscaneoNativo(streamInicial = null, videoInicial = null) {
  if (!window.BarcodeDetector) {
    throw new Error("BarcodeDetector no disponible.");
  }

  const formatosSoportados = await window.BarcodeDetector.getSupportedFormats();
  const formatosValidos = ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"].filter((formato) => formatosSoportados.includes(formato));
  if (formatosValidos.length === 0) {
    throw new Error("El detector nativo no soporta los formatos necesarios.");
  }

  const { stream, video } = streamInicial && videoInicial
    ? { stream: streamInicial, video: videoInicial }
    : await prepararStreamCamara(true);

  const detector = new window.BarcodeDetector({ formats: formatosValidos });
  let detectedCode = null;
  let frameId = null;
  let activo = true;

  const scanFrame = async () => {
    if (!activo) {
      return;
    }

    try {
      const barcodes = await detector.detect(video);
      if (Array.isArray(barcodes) && barcodes.length > 0) {
        const code = String(barcodes[0].rawValue || "").replace(/[^0-9Xx]/g, "");
        if (code && detectedCode !== code) {
          detectedCode = code;
          if (navigator.vibrate) {
            navigator.vibrate(120);
          }
          inputIsbn.value = code;
          mostrarEstado("ISBN detectado. Cargando datos...");
          state.scannerActivo = false;
          await detenerEscaneoIsbn();
          await buscarDatosLibro(code);
          return;
        }
      }
    } catch (error) {
      console.warn("BarcodeDetector error:", error);
    }

    frameId = requestAnimationFrame(scanFrame);
  };

  frameId = requestAnimationFrame(scanFrame);

  state.scannerInstancia = {
    type: "native",
    stream,
    video,
    detector,
    animationFrameId: frameId,
    async stop() {
      activo = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
      }
      if (this.video) {
        this.video.pause();
        this.video.srcObject = null;
      }
    },
    async clear() {
      if (this.video) {
        this.video.srcObject = null;
      }
    },
    async toggleFlash() {
      const track = this.stream?.getVideoTracks?.()[0];
      if (!track?.applyConstraints) {
        throw new Error("No compatible");
      }
      const capabilities = track.getCapabilities?.() || {};
      if (!capabilities.torch) {
        throw new Error("No compatible");
      }
      await track.applyConstraints({ advanced: [{ torch: !state.linternaActiva }] });
    }
  };

  btnLinterna.disabled = true;
  btnDetenerScanner.disabled = false;
  state.scanFailureCount = 0;
}

async function cargarQuagga() {
  if (window.Quagga) {
    return window.Quagga;
  }

  if (!quaggaScriptPromise) {
    quaggaScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/quagga/dist/quagga.min.js";
      script.onload = () => resolve(window.Quagga);
      script.onerror = () => reject(new Error("No se pudo cargar Quagga"));
      document.head.appendChild(script);
    });
  }

  return quaggaScriptPromise;
}

async function iniciarEscaneoQuagga(streamInicial = null, videoInicial = null) {
  const Quagga = await cargarQuagga();
  if (!Quagga) {
    throw new Error("Quagga no disponible");
  }

  const contenedor = document.getElementById("videoScanner");
  if (!contenedor) {
    throw new Error("Contenedor del escáner no encontrado");
  }

  const { stream, video } = streamInicial && videoInicial
    ? { stream: streamInicial, video: videoInicial }
    : await prepararStreamCamara(true);

  let detectedCode = null;
  const onDetected = (result) => {
    const code = String(result?.codeResult?.code || "").replace(/[^0-9Xx]/g, "");
    if (!code || detectedCode === code) {
      return;
    }

    detectedCode = code;
    if (navigator.vibrate) {
      navigator.vibrate(120);
    }

    inputIsbn.value = code;
    state.scannerActivo = false;
    mostrarEstado("ISBN detectado. Cargando datos...");
    Quagga.offDetected(onDetected);
    detenerEscaneoIsbn();
    buscarDatosLibro(code);
  };

  await new Promise((resolve, reject) => {
    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: contenedor,
          constraints: {
            facingMode: "environment",
            width: { min: 640 },
            height: { min: 480 }
          }
        },
        locate: true,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader"]
        }
      },
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          Quagga.start();
          Quagga.onDetected(onDetected);
          resolve();
        } catch (startError) {
          reject(startError);
        }
      }
    );
  });

  state.scannerInstancia = {
    type: "quagga",
    stream,
    video,
    target: contenedor,
    onDetected,
    async stop() {
      Quagga.offDetected(this.onDetected);
      Quagga.stop();
      detenerStreamScanner(this);
    },
    async clear() {
      if (this.target) {
        this.target.innerHTML = "";
      }
      if (this.video) {
        this.video.srcObject = null;
      }
    },
    async toggleFlash() {
      const track = this.stream?.getVideoTracks?.()[0];
      if (!track?.applyConstraints) {
        throw new Error("No compatible");
      }
      const capabilities = track.getCapabilities?.() || {};
      if (!capabilities.torch) {
        throw new Error("No compatible");
      }
      await track.applyConstraints({ advanced: [{ torch: !state.linternaActiva }] });
    }
  };

  btnLinterna.disabled = false;
  btnLinterna.textContent = "Encender linterna";
  btnDetenerScanner.disabled = false;
  state.scanFailureCount = 0;
}

async function iniciarEscaneoLegacy(streamInicial = null, videoInicial = null) {
  if (typeof window.Html5Qrcode !== "function") {
    mostrarEstado("El motor de escaneo no está disponible. Recarga la página.");
    state.scannerActivo = false;
    btnEscanear.disabled = false;
    btnEscanearPrincipal.disabled = false;
    return;
  }

  const cameraConfig = { facingMode: { ideal: "environment" } };
  mostrarEstado("Iniciando cámara...");

  const scanner = new window.Html5Qrcode("videoScanner");
  state.scannerInstancia = scanner;

  await scanner.start(
    cameraConfig,
    {
      fps: 10,
      qrbox: { width: 280, height: 180 },
      formatsToSupport: [
        window.Html5QrcodeSupportedFormats?.EAN_13,
        window.Html5QrcodeSupportedFormats?.EAN_8,
        window.Html5QrcodeSupportedFormats?.CODE_128,
        window.Html5QrcodeSupportedFormats?.CODE_39
      ].filter(Boolean),
      videoConstraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: { ideal: "environment" }
      },
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    },
    async (decodedText) => {
      if (!state.scannerActivo) {
        return;
      }

      const isbn = String(decodedText || "").replace(/[^0-9Xx]/g, "");
      if (!isbn) {
        state.scanFailureCount += 1;
        if (state.scanFailureCount >= 10) {
          mostrarEstado("Aún no se detecta un ISBN válido. Asegúrate de enfocar bien el código y usar buena iluminación.");
          state.scanFailureCount = 0;
        }
        return;
      }

      state.scanFailureCount = 0;
      if (navigator.vibrate) {
        navigator.vibrate(120);
      }

      inputIsbn.value = isbn;
      state.scannerActivo = false;
      mostrarEstado("ISBN detectado. Cargando datos...");
      await detenerEscaneoIsbn();
      await buscarDatosLibro(isbn);
    },
    () => {}
  );

  if (typeof scanner.toggleFlash === "function") {
    btnLinterna.disabled = false;
    btnLinterna.textContent = "Encender linterna";
  } else {
    btnLinterna.disabled = true;
  }
  btnDetenerScanner.disabled = false;
  state.scanFailureCount = 0;
}

async function iniciarEscaneoIsbn() {
  if (!navigator.mediaDevices?.getUserMedia) {
    mostrarEstado("La cámara no está disponible en este navegador.");
    return;
  }

  if (state.scannerActivo) {
    await detenerEscaneoIsbn();
  }

  scannerContainer.classList.remove("hidden");
  mostrarEstado("Abriendo cámara...");
  state.scannerActivo = true;
  btnEscanear.disabled = true;
  btnEscanearPrincipal.disabled = true;

  try {
    const video = prepararVideoScanner();
    if (!video) {
      throw new Error("No se pudo preparar la vista previa del escáner.");
    }

    const { stream } = await prepararStreamCamara(true, video);

    state.scannerInstancia = {
      type: "preview",
      stream,
      video,
      async stop() {
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
        }
        if (this.video) {
          this.video.pause();
          this.video.srcObject = null;
        }
      },
      async clear() {
        if (this.video) {
          this.video.srcObject = null;
        }
      },
      async toggleFlash() {
        const track = this.stream?.getVideoTracks?.()[0];
        if (!track?.applyConstraints) {
          throw new Error("No compatible");
        }
        const capabilities = track.getCapabilities?.() || {};
        if (!capabilities.torch) {
          throw new Error("No compatible");
        }
        await track.applyConstraints({ advanced: [{ torch: !state.linternaActiva }] });
      }
    };

    btnLinterna.disabled = false;
    btnLinterna.textContent = "Encender linterna";
    btnDetenerScanner.disabled = false;

    if (window.BarcodeDetector) {
      try {
        await iniciarEscaneoNativo(stream, video);
      } catch (error) {
        console.warn("Escáner nativo no disponible:", error);
      }
    }

    mostrarEstado("Cámara lista. Si el escáner automático no detecta, puedes escribir el ISBN manualmente.");
  } catch (error) {
    console.error(error);
    mostrarEstado("No se pudo abrir la cámara. Comprueba los permisos de cámara en Safari o Chrome e intenta de nuevo.");
    state.scannerActivo = false;
    btnLinterna.disabled = true;
    btnDetenerScanner.disabled = true;
    btnEscanear.disabled = false;
    btnEscanearPrincipal.disabled = false;
  }
}

async function abrirModoSimple() {
  await iniciarEscaneoIsbn();
}

async function detenerEscaneoIsbn() {
  state.scannerActivo = false;
  scannerContainer.classList.add("hidden");
  btnLinterna.textContent = "Encender linterna";
  btnLinterna.disabled = true;
  btnDetenerScanner.disabled = true;
  btnEscanear.disabled = false;
  btnEscanearPrincipal.disabled = false;
  state.linternaActiva = false;

  if (state.scannerInstancia) {
    try {
      await state.scannerInstancia.stop();
      await state.scannerInstancia.clear();
    } catch (error) {
      // Ignorar si ya estaba cerrada.
    }
    state.scannerInstancia = null;
  }
}

async function alternarLinterna() {
  if (!state.scannerInstancia) {
    mostrarEstado("La linterna no está disponible en este dispositivo.");
    return;
  }

  try {
    if (typeof state.scannerInstancia.toggleFlash === "function") {
      await state.scannerInstancia.toggleFlash();
      state.linternaActiva = !state.linternaActiva;
      btnLinterna.textContent = state.linternaActiva ? "Apagar linterna" : "Encender linterna";
      return;
    }

    const track = state.scannerInstancia.stream?.getVideoTracks?.()[0];
    if (!track?.applyConstraints) {
      throw new Error("No compatible");
    }

    const capabilities = track.getCapabilities?.() || {};
    if (!capabilities.torch) {
      throw new Error("No compatible");
    }

    await track.applyConstraints({ advanced: [{ torch: !state.linternaActiva }] });
    state.linternaActiva = !state.linternaActiva;
    btnLinterna.textContent = state.linternaActiva ? "Apagar linterna" : "Encender linterna";
  } catch (error) {
    mostrarEstado("No se pudo controlar la linterna.");
  }
}

function compararPorCampo(a, b, orden) {
  switch (orden) {
    case "titulo":
      return String(a.titulo || "").localeCompare(String(b.titulo || ""), "es", { sensitivity: "base" });
    case "autor":
      return String(a.autor || "").localeCompare(String(b.autor || ""), "es", { sensitivity: "base" });
    case "fecha":
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""), "es", { sensitivity: "base" });
    case "anio":
      return Number(String(b.anio || "0")) - Number(String(a.anio || "0"));
    default:
      return 0;
  }
}

function renderResumen() {
  const total = state.libros.length;
  const paginas = state.libros.reduce((sum, libro) => sum + Number(libro.paginas || 0), 0);
  const favoritos = state.libros.filter((libro) => libro.favorite).length;
  const autores = [...new Set(state.libros.map((libro) => String(libro.autor || "").trim()).filter(Boolean))];

  statsTotal.textContent = total;
  statsPaginas.textContent = paginas;
  statsFavoritos.textContent = favoritos;
  statsAutores.textContent = autores.length;
}

function renderEstadisticas() {
  const totalLibros = state.libros.length;
  const paginasTotales = state.libros.reduce((sum, libro) => sum + Number(libro.paginas || 0), 0);
  const autores = [...new Set(state.libros.map((libro) => String(libro.autor || "").trim()).filter(Boolean))].slice(0, 4);
  const editoriales = [...new Set(state.libros.map((libro) => String(libro.editorial || "").trim()).filter(Boolean))].slice(0, 4);
  const generos = [...new Set(state.libros.map((libro) => String(libro.genre || libro.categoria || "").trim()).filter(Boolean))].slice(0, 4);
  const idiomas = [...new Set(state.libros.map((libro) => String(libro.language || "").trim()).filter(Boolean))].slice(0, 4);

  estadisticasBiblioteca.innerHTML = `
    <div class="estadistica-card"><span>Total de libros</span><strong>${totalLibros}</strong></div>
    <div class="estadistica-card"><span>Total de páginas</span><strong>${paginasTotales}</strong></div>
    <div class="estadistica-card"><span>Autores frecuentes</span><strong>${autores.join(", ") || "—"}</strong></div>
    <div class="estadistica-card"><span>Editoriales</span><strong>${editoriales.join(", ") || "—"}</strong></div>
    <div class="estadistica-card"><span>Géneros</span><strong>${generos.join(", ") || "—"}</strong></div>
    <div class="estadistica-card"><span>Idiomas</span><strong>${idiomas.join(", ") || "—"}</strong></div>
  `;
}

function crearElementoItem(libro) {
  const item = document.createElement("article");
  item.className = "libro-card";
  const portada = libro.cover
    ? `<img class="portada-mini" src="${escapeHtml(libro.cover)}" alt="Portada de ${escapeHtml(libro.titulo)}">`
    : `<div class="portada-placeholder">Sin portada</div>`;
  const loanInfo = libro.prestamoA
    ? `<p class="detalle-libro">Prestado a ${escapeHtml(libro.prestamoA)}${libro.fechaDevolucion ? ` · devolución ${escapeHtml(libro.fechaDevolucion)}` : ""}</p>`
    : "";
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
        <p>${escapeHtml(libro.autor || "Autor desconocido")}</p>
        <p class="categoria">${escapeHtml(libro.type === "comic" ? "Cómic" : "Libro")} · ${escapeHtml(libro.categoria || "Sin categoría")}</p>
        <p class="detalle-libro">${Number(libro.rating || 0) > 0 ? `⭐ ${libro.rating}/5` : "Sin valoración"}${libro.paginas ? ` · ${libro.paginas} págs.` : ""}${libro.anio ? ` · ${libro.anio}` : ""}</p>
        ${detalleComic}
        ${libro.editorial ? `<p class="detalle-libro">Editorial: ${escapeHtml(libro.editorial)}</p>` : ""}
        ${libro.collection ? `<p class="detalle-libro">Colección: ${escapeHtml(libro.collection)}</p>` : ""}
        ${loanInfo}
        ${libro.notas ? `<p class="detalle-libro">Notas: ${escapeHtml(libro.notas)}</p>` : ""}
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
  renderResumen();
  renderEstadisticas();

  const texto = buscador.value.trim().toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoSeleccionado = filtroEstado.value;
  const coleccionSeleccionada = filtroColeccion.value;
  const tipoSeleccionado = filtroTipo.value;
  const ordenSeleccionado = filtroOrden.value;
  const mostrarPorSeries = btnVistaSeries.classList.contains("active");

  const librosFiltrados = state.libros.filter((libro) => {
    const textoEnLibro = `${libro.titulo} ${libro.autor} ${libro.editorial} ${libro.isbn} ${libro.categoria} ${libro.collection || ""} ${libro.serie || ""} ${libro.genre || ""} ${libro.language || ""}`.toLowerCase();
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

  const fragmento = document.createDocumentFragment();

  if (mostrarPorSeries && ordenados.some((libro) => libro.type === "comic")) {
    const grupos = new Map();
    ordenados.filter((libro) => libro.type === "comic").forEach((libro) => {
      const clave = (libro.serie || "Sin serie").trim() || "Sin serie";
      if (!grupos.has(clave)) {
        grupos.set(clave, []);
      }
      grupos.get(clave).push(libro);
    });

    [...grupos.entries()].sort(([serieA], [serieB]) => String(serieA).localeCompare(String(serieB), "es", { sensitivity: "base" })).forEach(([serie, itemsSerie]) => {
      const grupo = document.createElement("section");
      grupo.className = "serie-group";
      const header = document.createElement("div");
      header.className = "serie-header";
      header.innerHTML = `<h3>${escapeHtml(serie)}</h3><span>${itemsSerie.length} tomo${itemsSerie.length === 1 ? "" : "s"}</span>`;
      grupo.appendChild(header);
      const contenedor = document.createElement("div");
      contenedor.className = "serie-items";
      itemsSerie.sort((a, b) => Number(a.issueNumber || 0) - Number(b.issueNumber || 0)).forEach((libro) => contenedor.appendChild(crearElementoItem(libro)));
      grupo.appendChild(contenedor);
      fragmento.appendChild(grupo);
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
      fragmento.appendChild(seccionLibros);
    }
  } else {
    ordenados.forEach((libro) => fragmento.appendChild(crearElementoItem(libro)));
  }

  listaLibros.appendChild(fragmento);
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
  const anio = inputAnio.value.trim();
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

  const cover = state.portadaSeleccionada || (state.editandoId ? state.libros.find((libro) => libro.id === state.editandoId)?.cover || "" : "");
  const libroBase = {
    titulo,
    autor,
    editorial,
    anio,
    categoria,
    status,
    rating: state.ratingSeleccionada,
    paginas: pages,
    fechaFin: finishDate,
    notas: notes,
    isbn,
    prestamoA: loanTo,
    fechaPrestamo: loanDate,
    fechaDevolucion: returnDate,
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
    category: categoria,
    createdAt: state.editandoId ? state.libros.find((libro) => libro.id === state.editandoId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (state.editandoId) {
    state.libros = state.libros.map((libro) => (libro.id === state.editandoId ? { ...libro, ...libroBase } : libro));
  } else {
    state.libros.unshift({ id: Date.now().toString(), ...libroBase });
  }

  guardarLibros();
  resetFormulario();
  renderLibros();
}

function editarLibro(id) {
  const libro = state.libros.find((item) => item.id === id);
  if (!libro) {
    return;
  }

  inputTipo.value = libro.type === "comic" ? "comic" : "book";
  inputIsbn.value = libro.isbn || "";
  inputTitulo.value = libro.titulo || "";
  inputAutor.value = libro.autor || "";
  inputEditorial.value = libro.editorial || "";
  inputAnio.value = libro.anio || "";
  inputCategoria.value = libro.categoria || "";
  inputSerie.value = libro.serie || "";
  inputNumeroTomo.value = libro.issueNumber || "";
  inputVolumen.value = libro.volume || "";
  inputGuionista.value = libro.writer || "";
  inputDibujante.value = libro.artist || "";
  inputUniverso.value = libro.universe || "";
  inputPaginas.value = libro.paginas || "";
  inputFechaFin.value = libro.fechaFin || "";
  inputPersonaPrestamo.value = libro.prestamoA || "";
  inputFechaPrestamo.value = libro.fechaPrestamo || "";
  inputFechaDevolucion.value = libro.fechaDevolucion || "";
  inputColeccion.value = libro.collection || "";
  inputNotas.value = libro.notas || "";
  checkboxWishlist.checked = Boolean(libro.wishlist);
  checkboxFavorite.checked = Boolean(libro.favorite);
  selectEstado.value = libro.status || "Pending";
  state.ratingSeleccionada = Number(libro.rating || 0);
  actualizarEstrellas();
  state.portadaSeleccionada = libro.cover || "";
  if (libro.cover) {
    previewPortada.src = libro.cover;
    previewPortadaContenedor.classList.remove("hidden");
  } else {
    previewPortada.src = "";
    previewPortadaContenedor.classList.add("hidden");
  }
  inputPortada.value = "";
  state.editandoId = libro.id;
  toggleCamposComic();
  btnCancelar.classList.remove("hidden");
  btnGuardar.textContent = "Guardar cambios";
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  inputTitulo.focus();
}

function eliminarLibro(id) {
  const confirmar = confirm("¿Deseas eliminar este elemento?");
  if (!confirmar) {
    return;
  }
  state.libros = state.libros.filter((libro) => libro.id !== id);
  guardarLibros();
  if (state.editandoId === id) {
    resetFormulario();
  }
  renderLibros();
}

function alternarMarca(id, campo) {
  state.libros = state.libros.map((libro) => (libro.id === id ? { ...libro, [campo]: !libro[campo] } : libro));
  guardarLibros();
  renderLibros();
}

function descargarArchivo(contenido, nombre, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

function exportarBiblioteca(formato) {
  if (formato === "csv") {
    const cabeceras = ["titulo", "autor", "editorial", "anio", "categoria", "isbn", "status", "favorite", "wishlist", "paginas", "collection", "genre", "language", "createdAt", "description"];
    const filas = state.libros.map((libro) => [
      libro.titulo,
      libro.autor,
      libro.editorial,
      libro.anio,
      libro.categoria,
      libro.isbn,
      libro.status,
      libro.favorite ? "true" : "false",
      libro.wishlist ? "true" : "false",
      libro.paginas,
      libro.collection,
      libro.genre || libro.categoria,
      libro.language,
      libro.createdAt,
      libro.description || libro.notas
    ].map(escapeCsv).join(","));
    const contenido = [cabeceras.join(","), ...filas].join("\n");
    descargarArchivo(contenido, "biblioteca-facil.csv", "text/csv;charset=utf-8;");
    return;
  }

  const contenido = JSON.stringify(state.libros, null, 2);
  descargarArchivo(contenido, "biblioteca-facil.json", "application/json");
}

function parsearCsv(texto) {
  const lineas = texto.trim().split(/\r?\n/);
  if (lineas.length < 2) {
    return [];
  }

  const encabezados = lineas[0].split(",").map((columna) => columna.trim());
  return lineas.slice(1).filter(Boolean).map((linea) => {
    const valores = linea.match(/("(?:[^"]|"")*"|[^,]+)/g) || [];
    return encabezados.reduce((obj, encabezado, index) => {
      obj[encabezado] = (valores[index] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
      return obj;
    }, {});
  });
}

function importarBiblioteca(event) {
  const archivo = event.target.files[0];
  if (!archivo) {
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    try {
      const texto = lector.result;
      let datosImportados = [];
      if (archivo.name.toLowerCase().endsWith(".csv")) {
        datosImportados = parsearCsv(texto).map((fila) => ({
          titulo: fila.titulo || fila.title || "",
          autor: fila.autor || fila.author || "",
          editorial: fila.editorial || fila.publisher || "",
          anio: fila.anio || fila.year || "",
          categoria: fila.categoria || fila.category || "",
          isbn: fila.isbn || "",
          status: fila.status || "Pending",
          favorite: fila.favorite === "true",
          wishlist: fila.wishlist === "true",
          paginas: fila.paginas || fila.pages || "",
          collection: fila.collection || "",
          genre: fila.genre || "",
          language: fila.language || "",
          description: fila.description || fila.notas || "",
          createdAt: fila.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      } else {
        const datos = JSON.parse(texto);
        datosImportados = Array.isArray(datos) ? datos : datos.libros || datos.books || [];
      }

      if (!Array.isArray(datosImportados)) {
        throw new Error("Formato inválido");
      }
      const confirmar = confirm("¿Deseas reemplazar la biblioteca actual con los datos importados?");
      if (!confirmar) {
        inputImportar.value = "";
        return;
      }

      state.libros = datosImportados.map((libro, index) => normalizarLibro(libro, index));
      guardarLibros();
      resetFormulario();
      renderLibros();
      inputImportar.value = "";
      mostrarEstado("Biblioteca importada correctamente.");
    } catch (error) {
      alert("No se pudo importar el archivo. Asegúrate de usar JSON o CSV válido.");
      inputImportar.value = "";
    }
  };
  lector.readAsText(archivo);
}

function aplicarTema(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark", theme === "dark");
  btnTheme.textContent = theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro";
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTema() {
  const nuevoTema = document.body.classList.contains("dark") ? "light" : "dark";
  aplicarTema(nuevoTema);
}

function abrirFormulario() {
  formSection.scrollIntoView({ behavior: "smooth", block: "start" });
  inputTitulo.focus();
}

function limpiarBiblioteca() {
  const confirmar = confirm("¿Seguro que quieres borrar toda la biblioteca? Esta acción no se puede deshacer.");
  if (!confirmar) {
    return;
  }
  state.libros = [];
  guardarLibros();
  resetFormulario();
  renderLibros();
  mostrarEstado("Biblioteca vaciada.");
}

function registrarServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

form.addEventListener("submit", guardarLibro);
inputPortada.addEventListener("change", manejarSeleccionPortada);
inputTipo.addEventListener("change", toggleCamposComic);
btnCancelar.addEventListener("click", resetFormulario);
btnExportarJson.addEventListener("click", () => exportarBiblioteca("json"));
btnExportarCsv.addEventListener("click", () => exportarBiblioteca("csv"));
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
btnBuscarIsbn.addEventListener("click", () => buscarDatosLibro(inputIsbn.value));
btnEscanear.addEventListener("click", iniciarEscaneoIsbn);
btnEscanearPrincipal.addEventListener("click", iniciarEscaneoIsbn);
btnAgregarManual.addEventListener("click", abrirFormulario);
btnDetenerScanner.addEventListener("click", detenerEscaneoIsbn);
btnLinterna.addEventListener("click", alternarLinterna);
btnModoSimple.addEventListener("click", abrirModoSimple);
inputIsbn.addEventListener("change", () => buscarDatosLibro(inputIsbn.value));
btnTheme.addEventListener("click", toggleTema);
btnResetLibrary.addEventListener("click", limpiarBiblioteca);

estrellas.addEventListener("click", (event) => {
  const boton = event.target.closest(".estrella");
  if (!boton) {
    return;
  }
  state.ratingSeleccionada = Number(boton.dataset.value);
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

cargarLibros();
aplicarTema(localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
resetFormulario();
renderLibros();
registrarServiceWorker();
