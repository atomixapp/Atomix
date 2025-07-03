document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      iniciarApp(user);
    } else {
      window.location.href = 'index.html';
    }
  });
});

function iniciarApp(user) {
  const userId = user.uid;

  document.getElementById('nombreUsuario').textContent = user.displayName || "Usuario";
  document.getElementById('correoUsuario').textContent = user.email;

  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenarSelect = document.getElementById('ordenar');
  const navPeliculas = document.getElementById('navPeliculas');
  const navFavoritos = document.getElementById('navFavoritos');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const iconoBuscar = document.getElementById('iconoBuscar');
  const tituloCategoria = document.getElementById('tituloCategoria');

  let peliculasOriginal = [];
  let criterioOrden = 'añadido';

  const respaldoLocal = [
    {
      titulo: 'Spiderman: De regreso a casa',
      imagen: 'https://image.tmdb.org/t/p/original/81qIJbnS2L0rUAAB55G8CZODpS5.jpg',
      anio: '2025',
      latino: '',
      castellano: ''
    },
    {
      titulo: 'La leyenda de Ochi',
      imagen: 'https://image.tmdb.org/t/p/original/h1Iq6WfE4RWc9klGvN8sdi5aR6V.jpg',
      anio: '2025',
      castellano: ''
    }
  ];

  galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

  botonCuenta.addEventListener('click', e => {
    e.stopPropagation();
    menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', e => {
    if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
      menuUsuario.style.display = 'none';
    }
    if (!buscador.contains(e.target) && !iconoBuscar.contains(e.target)) {
      buscador.style.display = 'none';
      buscador.value = '';
      filtrarPeliculas('todos');
    }
  });

  iconoBuscar.addEventListener('click', e => {
    e.stopPropagation();
    buscador.style.display = buscador.style.display === 'block' ? 'none' : 'block';
    if (buscador.style.display === 'block') buscador.focus();
  });

  buscador.addEventListener('input', filtrarBusqueda);

  ordenarSelect.addEventListener('change', () => {
    criterioOrden = ordenarSelect.value;
    filtrarPeliculas(tituloCategoria.textContent.toLowerCase() === 'todas' ? 'todos' : tituloCategoria.textContent.toLowerCase());
  });

  navPeliculas.addEventListener('click', () => {
    navFavoritos.classList.remove('activo');
    navPeliculas.classList.add('activo');
    filtrarPeliculas('todos');
  });

  navFavoritos.addEventListener('click', () => {
    navPeliculas.classList.remove('activo');
    navFavoritos.classList.add('activo');
    cargarFavoritosFirestore(userId);
  });

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    const tarjetas = document.querySelectorAll(".galeria > div");

    tarjetas.forEach(tarjeta => {
      const titulo = tarjeta.querySelector('h3')?.textContent.toLowerCase() || '';
      tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
    });
  }

  function ordenarLista(lista) {
    let resultado = [...lista];

    if (criterioOrden === 'titulo') {
      resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (criterioOrden === 'anio') {
      resultado.sort((a, b) => parseInt(b.anio) - parseInt(a.anio));
    }

    return resultado;
  }

  function filtrarPeliculas(anio = 'todos') {
    let listaFiltrada = anio === 'todos'
      ? peliculasOriginal
      : peliculasOriginal.filter(p => p.anio === anio);

    listaFiltrada = ordenarLista(listaFiltrada);
    mostrarPeliculas(listaFiltrada);

    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    const liActivo = Array.from(document.querySelectorAll('aside li'))
      .find(li => li.textContent.toLowerCase().includes(anio) || (anio === 'todos' && li.textContent.toLowerCase().includes('todas')));
    if (liActivo) liActivo.classList.add('activo');

    tituloCategoria.textContent =
      anio === 'favoritos' ? 'FAVORITOS' :
      anio === 'todos' ? 'TODAS' :
      anio.toUpperCase();
  }

  async function mostrarPeliculas(lista) {
    galeria.innerHTML = ''; // <----- Aseguramos limpiar galería antes de mostrar

    try {
      const favoritos = await obtenerFavoritosFirestore(userId);

      if (lista.length === 0) {
        galeria.innerHTML = '<p class="vacio">No hay películas para mostrar.</p>';
        return;
      }

      lista.forEach(p => {
        const tituloID = encodeURIComponent(p.titulo);
        const esFavorito = favoritos.includes(p.titulo);

        const tarjeta = document.createElement('div');
        tarjeta.className = 'pelicula';

        tarjeta.innerHTML = `
          <a href="detalles.html?titulo=${tituloID}">
            <img src="${p.imagen}" alt="${p.titulo}">
            <div class="banderas">
              ${p.castellano ? `<a href="${p.castellano}" target="_blank"><img src="https://flagcdn.com/w20/es.png" alt="Castellano"></a>` : ''}
              ${p.latino ? `<a href="${p.latino}" target="_blank"><img src="https://flagcdn.com/w20/mx.png" alt="Latino"></a>` : ''}
            </div>
            <h3>${p.titulo}</h3>
          </a>
          <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
            <i class="fa-solid fa-heart"></i>
          </div>
        `;

        galeria.appendChild(tarjeta);
      });

      document.querySelectorAll('.corazon').forEach(icon => {
        icon.addEventListener('click', async e => {
          const titulo = e.currentTarget.dataset.titulo;
          const pelicula = peliculasOriginal.find(p => p.titulo === titulo);
          if (!pelicula) return;

          e.currentTarget.classList.toggle('activo');
          try {
            await toggleFavoritoFirestore(pelicula, userId);
            if (navFavoritos.classList.contains('activo')) {
              cargarFavoritosFirestore(userId);
            }
          } catch (err) {
            console.error("Error al actualizar favorito:", err);
            e.currentTarget.classList.toggle('activo');
          }
        });
      });
    } catch (err) {
      console.error("Error al obtener favoritos:", err);
    }
  }

  function toggleFavoritoFirestore(pelicula, userId) {
    const tituloID = `${pelicula.titulo}-${pelicula.anio}`.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    const docRef = db.collection('usuarios').doc(userId).collection('favoritos').doc(tituloID);

    return docRef.get().then(doc => {
      if (doc.exists) {
        return docRef.delete();
      } else {
        return docRef.set({
          titulo: pelicula.titulo,
          imagen: pelicula.imagen,
          anio: pelicula.anio,
          castellano: typeof pelicula.castellano === 'string' ? pelicula.castellano : '',
          latino: typeof pelicula.latino === 'string' ? pelicula.latino : ''
        });
      }
    });
  }

  function obtenerFavoritosFirestore(userId) {
    return db.collection('usuarios').doc(userId).collection('favoritos').get()
      .then(snap => snap.docs.map(doc => doc.data().titulo));
  }

  function cargarFavoritosFirestore(userId) {
    db.collection('usuarios').doc(userId).collection('favoritos').get()
      .then(snap => {
        let favoritas = snap.docs.map(doc => doc.data());
        favoritas = ordenarLista(favoritas);
        mostrarPeliculas(favoritas);
      });
  }

  // SOLO CARGAMOS PELICULAS UNA VEZ
  db.collection('peliculas').get()
    .then(snap => {
      peliculasOriginal = snap.docs.map(doc => doc.data());
      if (peliculasOriginal.length === 0) peliculasOriginal = respaldoLocal;
      filtrarPeliculas('todos');
    })
    .catch(() => {
      peliculasOriginal = respaldoLocal;
      filtrarPeliculas('todos');
    });

  window.cerrarSesion = function () {
    auth.signOut().then(() => {
      window.location.href = "index.html";
    });
  };
}
