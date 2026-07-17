let biblioteca = JSON.parse(
    localStorage.getItem("biblioteca")
) || [];


function guardarDatos(){
    localStorage.setItem(
        "biblioteca",
        JSON.stringify(biblioteca)
    );
}


function nuevoElemento(){

    let tipo = prompt(
        "Escribe: Libro o Cómic"
    );

    if(tipo !== "Libro" && tipo !== "Cómic"){
        alert("Tipo no válido");
        return;
    }


    let titulo = prompt(
        "Título:"
    );


    let autor = prompt(
        "Autor:"
    );


    let isbn = prompt(
        "ISBN:"
    );


    let elemento = {

        id: Date.now(),

        tipo: tipo,

        titulo: titulo,

        autor: autor,

        isbn: isbn

    };


    biblioteca.push(elemento);

    guardarDatos();

    mostrarTodo();

}



function mostrarTodo(){

    let zona = document.getElementById(
        "lista"
    );


    zona.innerHTML = "";


    biblioteca.forEach(libro => {


        zona.innerHTML += `

        <div class="tarjeta">

        <h3>
        ${libro.tipo}:
        ${libro.titulo}
        </h3>

        <p>
        Autor: ${libro.autor || ""}
        </p>

        <p>
        ISBN: ${libro.isbn || ""}
        </p>

        </div>

        `;


    });

}



function mostrarLibros(){

    mostrarFiltrado("Libro");

}



function mostrarComics(){

    mostrarFiltrado("Cómic");

}



function mostrarFiltrado(tipo){

    let zona = document.getElementById(
        "lista"
    );


    zona.innerHTML = "";


    biblioteca
    .filter(x => x.tipo === tipo)
    .forEach(libro => {


        zona.innerHTML += `

        <div class="tarjeta">

        <h3>
        ${libro.titulo}
        </h3>

        <p>
        ${libro.autor || ""}
        </p>

        </div>

        `;


    });

}



mostrarTodo();