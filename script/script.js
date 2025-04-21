const apiKey = '45e07914e1bc52e56da3d6d8c4baa591'; // ← tu API key de OpenWeatherMap

function agregarTarea() {
  const titulo = document.getElementById('titulo').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();
  const fecha = document.getElementById('fecha').value;
  const estado = document.getElementById('estado').value;
  const ciudad = document.getElementById('ciudad').value.trim();

  if (!titulo || !descripcion || !fecha || !estado || !ciudad) {
    alert("Por favor completa todos los campos.");
    return;
  }
  

  const lista = document.getElementById('lista-tareas');
  const nuevaTarea = document.createElement('li');
  nuevaTarea.className = 'tarea';

  nuevaTarea.innerHTML = `
    <div><strong>Título:</strong> <span class="dato">${titulo}</span></div>
    <div><strong>Descripción:</strong> <span class="dato">${descripcion}</span></div>
    <div><strong>Fecha de vencimiento:</strong> <span class="dato">${fecha}</span></div>
    <div><strong>Estado:</strong> <span class="dato">${estado}</span></div>
    <div><strong>Ciudad:</strong> <span class="dato">${ciudad}</span></div>
    <div class="clima">Cargando clima...</div>
  `;

  const btnEliminar = document.createElement('button');
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.onclick = () => lista.removeChild(nuevaTarea);

  const btnEditar = document.createElement('button');
  btnEditar.textContent = 'Editar';
  btnEditar.onclick = () => editarTarea(nuevaTarea);

  nuevaTarea.appendChild(btnEditar);
  nuevaTarea.appendChild(btnEliminar);
  lista.appendChild(nuevaTarea);

  const contenedorClima = nuevaTarea.querySelector('.clima');
  obtenerClima(ciudad, fecha, contenedorClima);

  guardarTareasEnLocalStorage();

  // Limpiar campos
  document.getElementById('titulo').value = "";
  document.getElementById('descripcion').value = "";
  document.getElementById('fecha').value = "";
  document.getElementById('estado').value = "pendiente";
  document.getElementById('ciudad').value = "";
}

function editarTarea(tareaElemento) {
  const spans = tareaElemento.querySelectorAll('.dato');

  const nuevoTitulo = prompt("Editar título:", spans[0].textContent);
  const nuevaDescripcion = prompt("Editar descripción:", spans[1].textContent);
  const nuevaFecha = prompt("Editar fecha (YYYY-MM-DD):", spans[2].textContent);
  const nuevoEstado = prompt("Editar estado (pendiente, en progreso, completada):", spans[3].textContent);
  const nuevaCiudad = prompt("Editar ciudad:", spans[4].textContent);

  if (nuevoTitulo && nuevaDescripcion && nuevaFecha && nuevoEstado && nuevaCiudad) {
    spans[0].textContent = nuevoTitulo;
    spans[1].textContent = nuevaDescripcion;
    spans[2].textContent = nuevaFecha;
    spans[3].textContent = nuevoEstado;
    spans[4].textContent = nuevaCiudad;

    const contenedorClima = tareaElemento.querySelector('.clima');
    obtenerClima(nuevaCiudad, nuevaFecha, contenedorClima);
  } else {
    alert("Todos los campos son obligatorios para editar.");
  }
}

function obtenerClima(ciudad, fecha, elementoClima) {
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${ciudad}&appid=${apiKey}&units=metric&lang=es`)
    .then(response => response.json())
    .then(data => {
      const climaCercano = data.list.find(item => item.dt_txt.startsWith(fecha));
      if (climaCercano) {
        const desc = climaCercano.weather[0].description;
        const temp = climaCercano.main.temp;
        const icono = climaCercano.weather[0].icon;
        elementoClima.innerHTML = `🌦️ <strong>Clima:</strong> ${desc}, ${temp}°C <img src="https://openweathermap.org/img/wn/${icono}@2x.png" style="vertical-align: middle;" />`;
      } else {
        elementoClima.textContent = "No hay clima disponible para esa fecha.";
      }
    })
    .catch(error => {
      console.error("Error al obtener clima:", error);
      elementoClima.textContent = "No se pudo cargar el clima.";
    });
}



/*Guardar Tareas*/
function guardarTareasEnLocalStorage() {
  const tareas = [];
  document.querySelectorAll('#lista-tareas li').forEach(li => {
    const datos = li.querySelectorAll('.dato');
    tareas.push({
      titulo: datos[0].textContent,
      descripcion: datos[1].textContent,
      fecha: datos[2].textContent,
      estado: datos[3].textContent,
      ciudad: datos[4].textContent
    });
  });
  localStorage.setItem('tareas', JSON.stringify(tareas));
}
/*Cargar tareas*/
function cargarTareasDesdeLocalStorage() {
  const tareas = JSON.parse(localStorage.getItem('tareas')) || [];
  tareas.forEach(tarea => {
    const lista = document.getElementById('lista-tareas');
    const nuevaTarea = document.createElement('li');
    nuevaTarea.className = 'tarea';

    nuevaTarea.innerHTML = `
      <div><strong>Título:</strong> <span class="dato">${tarea.titulo}</span></div>
      <div><strong>Descripción:</strong> <span class="dato">${tarea.descripcion}</span></div>
      <div><strong>Fecha de vencimiento:</strong> <span class="dato">${tarea.fecha}</span></div>
      <div><strong>Estado:</strong> <span class="dato">${tarea.estado}</span></div>
      <div><strong>Ciudad:</strong> <span class="dato">${tarea.ciudad}</span></div>
      <div class="clima">Cargando clima...</div>
    `;

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => {
      lista.removeChild(nuevaTarea);
      guardarTareasEnLocalStorage();
    };


    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.onclick = () => {
      editarTarea(nuevaTarea);
      guardarTareasEnLocalStorage();
    };

    nuevaTarea.appendChild(btnEditar);
    nuevaTarea.appendChild(btnEliminar);
    lista.appendChild(nuevaTarea);

    const contenedorClima = nuevaTarea.querySelector('.clima');
    obtenerClima(tarea.ciudad, tarea.fecha, contenedorClima);
  });
}


window.onload = cargarTareasDesdeLocalStorage;

