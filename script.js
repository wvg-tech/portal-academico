const URL_ALUMNOS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2ea_LmqCe-3bhLGu_A4RS6fJEkWIvAj4ztCx76-uRsqlDkdhVTa7Dm3uah632ZphTFfDUu2DJx1wy/pub?gid=0&single=true&output=csv";
const URL_EVALUACIONES = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR2ea_LmqCe-3bhLGu_A4RS6fJEkWIvAj4ztCx76-uRsqlDkdhVTa7Dm3uah632ZphTFfDUu2DJx1wy/pub?gid=713653590&single=true&output=csv";

let alumnoActual = null;
let evaluacionesCursoActual = [];

document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const dni = document.getElementById("dni").value.trim();
    const fecha = document.getElementById("fecha").value;

    const alumnos = await cargarCSV(URL_ALUMNOS);

    alumnoActual = alumnos.find(alumno =>
        alumno.DNI === dni &&
        alumno.FechaNacimiento === fecha
    );

    if (alumnoActual) {
        mostrarCursos();
    } else {
        alert("Datos incorrectos");
    }
});

async function cargarCSV(url) {
    const respuesta = await fetch(url);
    const texto = await respuesta.text();

    const filas = texto.trim().split("\n");
    const encabezados = filas[0].split(",");

    return filas.slice(1).map(fila => {
        const valores = fila.split(",");
        let objeto = {};

        encabezados.forEach((encabezado, i) => {
            objeto[encabezado.trim()] = valores[i]?.trim();
        });

        return objeto;
    });
}

function mostrarCursos() {
    document.body.innerHTML = `
        <div class="container">
            <div class="card-datos">
                <h1>Confirmar datos</h1>

                <p><strong>Alumno:</strong> ${alumnoActual.Nombre}</p>
                <p><strong>Nivel:</strong> ${alumnoActual.NIVEL}</p>
                <p><strong>Grado y Sección:</strong> ${alumnoActual.GRADO}° - ${alumnoActual.SECCIÓN}</p>

                <button onclick="continuar()">Continuar</button>
            </div>
        </div>
    `;
}

function continuar() {
    if (alumnoActual.NIVEL === "PRIMARIA") {
        verCurso("COMPUTACIÓN");
    }

    if (alumnoActual.NIVEL === "SECUNDARIA") {
       document.body.innerHTML = `
            <div class="container">
            <h1>Cursos disponibles</h1>
             <p class="nombre-alumno">${alumnoActual.Nombre}</p>

            <div class="cards">

            <div class="card" onclick="verCurso('COMPUTACIÓN')">
                <div class="icono">🖥️</div>
                <h2>Computación</h2>
            </div>

            <div class="card" onclick="verCurso('ROBÓTICA')">
                <div class="icono">🤖</div>
                <h2>Robótica</h2>
            </div>

        </div>
    </div>
        `;
        agregarFooter();
    }
}

async function verCurso(curso) {
   const evaluaciones = await cargarCSV(URL_EVALUACIONES);

const evaluacionesAlumno = evaluaciones.filter(e =>
    e.DNI === alumnoActual.DNI &&
    e.CURSO === curso
);

evaluacionesCursoActual = evaluacionesAlumno;

const unidades = [...new Set(evaluacionesAlumno.map(e => e.UNIDAD))];
const resumenUnidades = unidades.map(unidad => {

    const registros = evaluacionesAlumno.filter(e => e.UNIDAD === unidad);

    let promedio = 0;

    registros.forEach(r => {
        promedio += (Number(r.NOTA) * Number(r.PESO)) / 100;
    });

    return {
        unidad,
        promedio: Math.round(promedio)
    };

});



let contenido = `
    <h1>${curso}</h1>
    <p><strong>Alumno:</strong> ${alumnoActual.Nombre}</p>
    <p><strong>Grado y Sección:</strong> ${alumnoActual.GRADO}° - ${alumnoActual.SECCIÓN}</p>
    <p><strong>Nivel:</strong> ${alumnoActual.NIVEL}</p>

<br>
    <h2>Resumen de notas por unidad</h2>

    <table>
        <tr>
            <th>UNIDAD</th>
            <th>PROMEDIO</th>
        </tr>

        ${resumenUnidades.map(r => `
            <tr>
                <td><strong>UNIDAD ${r.unidad}</strong></td>
                <td>${r.promedio}</td>
            </tr>
        `).join("")}
    </table>
    <br>

    <h2>Detalle de evaluaciones</h2>

    <label>Seleccione la unidad:</label>

    <select id="unidadSeleccionada" onchange="mostrarDetalleUnidad('${curso}', this.value)">
        ${unidades.map(u => `<option value="${u}">Unidad ${u}</option>`).join("")}
    </select>

<div id="detalleUnidad"></div>

`;

let textoBotonVolver = alumnoActual.NIVEL === "SECUNDARIA"
    ? "⬅ Volver a cursos"
    : "⬅ Volver";

contenido += `
    <br>
    <button onclick="volver()">${textoBotonVolver}</button>
`;

document.body.innerHTML = contenido;
if (unidades.length > 0) {
    mostrarDetalleUnidad(curso, unidades[0]);
}

}

function mostrarDetalleUnidad(curso, unidad) {

    const registrosUnidad = evaluacionesCursoActual.filter(e =>
        e.UNIDAD === unidad
    );

    let promedio = 0;

        registrosUnidad.forEach(ev => {
        promedio += (Number(ev.NOTA) * Number(ev.PESO)) / 100;
    });

promedio = Math.round(promedio);
    let detalleHTML = `
        <br>
            <div class="table-container">
                <table border="1" cellpadding="8">
            <tr>
                <th>DETALLE</th>
                <th>PESO</th>
                <th>NOTA</th>
                <th>OBSERVACIONES</th>
                <th>PDF</th>
            </tr>
    `;

    registrosUnidad.forEach(ev => {
        detalleHTML += `
            <tr>
                <td>${ev.DETALLE}</td>
                <td>${ev.PESO}%</td>
                <td>${ev.NOTA}</td>
                <td class="${ev.OBSERVACIONES ? 'observacion' : ''}">${ev.OBSERVACIONES || ""}</td>
                <td>
                    ${ev.PDF ? `<a href="${ev.PDF}" target="_blank">📄 Ver PDF</a>` : ""}
                </td>
            </tr>
        `;
    });

    detalleHTML += `
        <tr>
        <td colspan="2"><strong>PROMEDIO</strong></td>
        <td><strong>${promedio}</strong></td>
        <td></td>
        <td></td>
    </tr>
    </table>
    </div>
    `;

    document.getElementById("detalleUnidad").innerHTML = detalleHTML;
}

function volver() {
    if (alumnoActual.NIVEL === "SECUNDARIA") {
        continuar();
    } else {
        location.reload();
    }
}
function agregarFooter() {
    document.body.innerHTML += `
        <footer>
            © 2026 KFG Tech Portal | Computación y Robótica
            <br>
            Desarrollado por WVG-Tech
        </footer>
    `;
}
