const STORAGE_KEY = "bibliotecaFacilLibros";
let libros = [];
let editandoId = null;
let portadaSeleccionada = "";
let valoracionSeleccionada = 0;

const form = document.getElementById("formLibro");
const inputTitulo = document.getElementById("titulo");
const inputAutor = document.getElementById("autor");
const inputCategoria = document.getElementById("categoria");
const inputPortada = document.getElementById("portada");
const inputPaginas = document.getElementById("paginas");
const inputFechaFin = document.getElementById("fechaFin");
const inputNotas = document.getElementById("notas");
const selectEstado = document.getElementById("estado");
const previewPortadaContenedor = document.getElementById("previewPortadaContenedor");
const previewPortada = document.getElementById("previewPortada");
const estrellas = document.getElementById("valoracionEstrellas");
const listaLibros = document.getElementById("listaLibros");
const buscador = document.getElementById("buscar");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroEstado = document.getElementById("filtroEstado");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const btnExportar = document.getElementById("btnExportar");
const btnImportar = document.getElementById("btnImportar");
const inputImportar = document.getElementById("inputImportar");
const contadorLibros = document.getElementById("contadorLibros");
const estadoVacio = document.getElementById("estadoVacio");
const estadisticasBiblioteca = document.getElementById("estadisticasBiblioteca");

function cargarLibros() {
  try {
    const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY));
    libros = Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    libros = [];
  }
}

function guardarLibros() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libros));
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

function resetFormulario() {
  form.reset();
  selectEstado.value = "Read";
  valoracionSeleccionada = 0;
  actualizarEstrellas();
  portadaSeleccionada = "";
  previewPortada.src = "";
  previewPortadaContenedor.classList.add("hidden");
  inputPortada.value = "";
  editandoId = null;
  btnGuardar.textContent = "Añadir libro";
  btnCancelar.classList.add("hidden");
}

function actualizarOpcionesCategorias() {
  const categorias = [...new Set(libros.map((libro) => libro.categoria.trim()).filter(Boolean))].sort();
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

function renderEstadisticas() {
  const total = libros.length;
  const leidos = libros.filter((libro) => libro.status === "Read").length;
  const leyendo = libros.filter((libro) => libro.status === "Reading").length;
  const pendientes = libros.filter((libro) => libro.status === "Pending").length;
  const ratings = libros.map((libro) => Number(libro.rating || 0)).filter((valor) => valor > 0);
  const promedio = ratings.length > 0 ? (ratings.reduce((acum, valor) => acum + valor, 0) / ratings.length).toFixed(1) : "0.0";
  const paginas = libros.reduce((acum, libro) => acum + (Number(libro.pages) || 0), 0);

  estadisticasBiblioteca.innerHTML = `
    <div class="estadistica-card">
      <span>Total</span>
      <strong>${total}</strong>
    </div>
    <div class="estadistica-card">
      <span>Leídos</span>
      <strong>${leidos}</strong>
    </div>
    <div class="estadistica-card">
      <span>En progreso</span>
      <strong>${leyendo}</strong>
    </div>
    <div class="estadistica-card">
      <span>Promedio / Páginas</span>
      <strong>${promedio}★ · ${paginas}</strong>
    </div>
    <div class="estadistica-card">
      <span>Pendientes</span>
      <strong>${pendientes}</strong>
    </div>
  `;
}

function renderLibros() {
  actualizarOpcionesCategorias();
  renderEstadisticas();

  const texto = buscador.value.trim().toLowerCase();
  const categoriaSeleccionada = filtroCategoria.value;
  const estadoSeleccionado = filtroEstado.value;

  const librosFiltrados = libros.filter((libro) => {
    const textoEnLibro = `${libro.titulo} ${libro.autor} ${libro.categoria}`.toLowerCase();
    const coincideTexto = textoEnLibro.includes(texto);
    const coincideCategoria = categoriaSeleccionada === "todas" || libro.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase();
    const coincideEstado = estadoSeleccionado === "todos" || libro.status === estadoSeleccionado;

    return coincideTexto && coincideCategoria && coincideEstado;
  });

  contadorLibros.textContent = `${librosFiltrados.length} libro${librosFiltrados.length === 1 ? "" : "s"} en tu lista`;

  if (librosFiltrados.length === 0) {
    estadoVacio.classList.remove("hidden");
    listaLibros.innerHTML = "";
    return;
  }

  estadoVacio.classList.add("hidden");
  listaLibros.innerHTML = "";

  librosFiltrados.forEach((libro) => {
    const item = document.createElement("li");
    const portada = libro.cover ? `<img class="portada-mini" src="${escapeHtml(libro.cover)}" alt="Portada de ${escapeHtml(libro.titulo)}">` : `<div class="portada-placeholder">Sin portada</div>`;

    item.innerHTML = `
      <div class="libro-info">
        ${portada}
        <div>
          <div class="libro-meta">
            <strong>${escapeHtml(libro.titulo)}</strong>
            <span class="estado-badge">${escapeHtml(obtenerEtiquetaEstado(libro.status))}</span>
          </div>
          <p>${escapeHtml(libro.autor)}</p>
          <p class="categoria">Categoría: ${escapeHtml(libro.categoria)}</p>
          <p class="detalle-libro">${Number(libro.rating || 0) > 0 ? `⭐ ${libro.rating}/5` : "Sin valoración"}${libro.pages ? ` · ${libro.pages} págs.` : ""}${libro.finishDate ? ` · Finalizado: ${escapeHtml(libro.finishDate)}` : ""}</p>
          ${libro.notes ? `<p class="detalle-libro">Notas: ${escapeHtml(libro.notes)}</p>` : ""}
        </div>
      </div>
      <div class="acciones-libro">
        <button type="button" class="editar" data-id="${libro.id}">Editar</button>
        <button type="button" class="eliminar" data-id="${libro.id}">Eliminar</button>
      </div>
    `;
    listaLibros.appendChild(item);
  });
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

  if (!titulo || !autor || !categoria) {
    alert("Completa todos los campos para guardar el libro.");
    return;
  }

  const cover = portadaSeleccionada || (editandoId ? libros.find((libro) => libro.id === editandoId)?.cover || "" : "");
  const bookData = {
    title: titulo,
    author: autor,
    category: categoria,
    status,
    rating: valoracionSeleccionada,
    pages,
    finishDate,
    notes,
    cover
  };

  if (editandoId) {
    libros = libros.map((libro) =>
      libro.id === editandoId ? { ...libro, ...bookData, titulo, autor, categoria, status, rating: valoracionSeleccionada, pages, finishDate, notes, cover } : libro
    );
  } else {
    libros.unshift({ id: Date.now().toString(), titulo, autor, categoria, status, rating: valoracionSeleccionada, pages, finishDate, notes, cover });
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

  inputTitulo.value = libro.titulo;
  inputAutor.value = libro.autor;
  inputCategoria.value = libro.categoria;
  inputPaginas.value = libro.pages || "";
  inputFechaFin.value = libro.finishDate || "";
  inputNotas.value = libro.notes || "";
  selectEstado.value = libro.status;
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
  btnGuardar.textContent = "Guardar cambios";
  btnCancelar.classList.remove("hidden");
  inputTitulo.focus();
}

function eliminarLibro(id) {
  const confirmar = confirm("¿Deseas eliminar este libro?");

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

      libros = librosImportados.map((libro) => ({
        id: libro.id || String(Date.now() + Math.random()),
        titulo: libro.titulo || libro.title || "",
        autor: libro.autor || libro.author || "",
        categoria: libro.categoria || libro.category || "Sin categoría",
        status: libro.status || "Pending",
        rating: Number(libro.rating || 0),
        pages: libro.pages || "",
        finishDate: libro.finishDate || "",
        notes: libro.notes || "",
        cover: libro.cover || ""
      }));

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

form.addEventListener("submit", guardarLibro);
inputPortada.addEventListener("change", manejarSeleccionPortada);
btnCancelar.addEventListener("click", resetFormulario);
btnExportar.addEventListener("click", exportarBiblioteca);
btnImportar.addEventListener("click", () => inputImportar.click());
inputImportar.addEventListener("change", importarBiblioteca);
buscador.addEventListener("input", renderLibros);
filtroCategoria.addEventListener("change", renderLibros);
filtroEstado.addEventListener("change", renderLibros);

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
  }
});

cargarLibros();
resetFormulario();
renderLibros();