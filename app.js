const STORAGE_KEY = "bibliotecaFacilLibros";
let libros = [];
let editandoId = null;
let portadaSeleccionada = "";

const form = document.getElementById("formLibro");
const inputTitulo = document.getElementById("titulo");
const inputAutor = document.getElementById("autor");
const inputCategoria = document.getElementById("categoria");
const inputPortada = document.getElementById("portada");
const selectEstado = document.getElementById("estado");
const previewPortadaContenedor = document.getElementById("previewPortadaContenedor");
const previewPortada = document.getElementById("previewPortada");
const listaLibros = document.getElementById("listaLibros");
const buscador = document.getElementById("buscar");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroEstado = document.getElementById("filtroEstado");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const contadorLibros = document.getElementById("contadorLibros");
const estadoVacio = document.getElementById("estadoVacio");

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

function renderLibros() {
  actualizarOpcionesCategorias();

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

  if (!titulo || !autor || !categoria) {
    alert("Completa todos los campos para guardar el libro.");
    return;
  }

  const cover = portadaSeleccionada || (editandoId ? libros.find((libro) => libro.id === editandoId)?.cover || "" : "");

  if (editandoId) {
    libros = libros.map((libro) =>
      libro.id === editandoId ? { ...libro, titulo, autor, categoria, status, cover } : libro
    );
  } else {
    libros.unshift({ id: Date.now().toString(), titulo, autor, categoria, status, cover });
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
  selectEstado.value = libro.status;
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

form.addEventListener("submit", guardarLibro);
inputPortada.addEventListener("change", manejarSeleccionPortada);
btnCancelar.addEventListener("click", resetFormulario);
buscador.addEventListener("input", renderLibros);
filtroCategoria.addEventListener("change", renderLibros);
filtroEstado.addEventListener("change", renderLibros);

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