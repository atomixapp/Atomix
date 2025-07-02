const auth = firebase.auth();
const db = firebase.firestore();

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

  // Mostrar datos usuario
  document.getElementById('nombreUsuario').textContent = user.displayName || "Usuario";
  document.getElementById('correoUsuario').textContent = user.email;

  // Variables para películas
  let peliculasOriginal = [];
  let peliculas = [];

  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenarSelect = document.getElementById('ordenar');
  const navPeliculas = document.getElementById('navPeliculas');
  const navFavoritos = document.getElementById('navFavoritos');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const iconoBuscar = document.getElementById('iconoBuscar');
  const tituloCategoria = document.getElementById('tituloCategoria');

  const respaldoLocal = [
    {
      titulo: 'Spiderman: De regreso a casa',
      imagen: 'https://image.tmdb.org/t/p/original/81qIJbnS2L0rUAAB55G8CZODpS5.jpg',
      anio: '2025',
      latino: true,
      castellano: true
    },
    {
      titulo: 'La leyenda de Ochi',
      imagen: 'https://image.tmdb.org/t/p/original/h1Iq6WfE4RWc9klGvN8sdi5aR6V.jpg',
      anio: '2025',
      castellano: true
    }
  ];

  galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

  // Evento menú usuario
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

  buscador.addEventListener('input', () => {
    filtrarBusqueda();
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

  ordenarSelect.addEventListener('change', () => {
    const criterio = ordenarSelect.value;
    if (criterio === 'añadido') {
      peliculas = [...peliculasOriginal];
    } else if (criterio === 'titulo') {
      peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (criterio === 'anio') {
      peliculas.sort((a, b) => parseInt(b.anio) - parseInt(a.anio));
    }

    if (navFavoritos.classList.contains('activo')) {
      cargarFavoritosFirestore(userId);
    } else {
      filtrarPeliculas('todos');
    }
  });

  // Funciones:

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    const tarjetas = document.querySelectorAll(".galeria > div");

    tarjetas.forEach(tarjeta => {
      const titulo = tarjeta.querySelector('h3')?.textContent.toLowerCase() || '';
      tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
    });
  }

  function filtrarPeliculas(anio = 'todos') {
    let listaFiltrada = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
    mostrarPeliculas(listaFiltrada);

    // Marcar activo en categorías
    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    const liActivo = Array.from(document.querySelectorAll('aside li'))
      .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
    if (liActivo) liActivo.classList.add('activo');

    // Cambiar título categoría
    if (anio === 'favoritos') {
      tituloCategoria.textContent = 'FAVORITOS';
    } else if (anio === 'todos') {
      tituloCategoria.textContent = 'TODAS';
    } else {
      tituloCategoria.textContent = anio.toUpperCase();
    }
  }

  async function mostrarPeliculas(lista) {
    galeria.innerHTML = '';

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
              ${p.castellano ? '<img src="https://flagcdn.com/w20/es.png">' : ''}
              ${p.latino ? '<img src="https://flagcdn.com/w20/mx.png">' : ''}
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
          castellano: typeof pelicula.castellano === 'boolean' ? pelicula.castellano : true,
          latino: typeof pelicula.latino === 'boolean' ? pelicula.latino : false
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
        const favoritas = snap.docs.map(doc => doc.data());
        mostrarPeliculas(favoritas);
      });
  }

  // Cargar películas Firestore o fallback local
  db.collection('peliculas').get()
    .then(snap => {
      const datos = snap.docs.map(doc => doc.data());
      peliculasOriginal = datos.length > 0 ? datos : respaldoLocal;
      peliculas = [...peliculasOriginal];
      filtrarPeliculas('todos');
    })
    .catch(() => {
      peliculasOriginal = respaldoLocal;
      peliculas = [...peliculasOriginal];
      filtrarPeliculas('todos');
    });

  // Función global para cerrar sesión
  window.cerrarSesion = function () {
    auth.signOut().then(() => {
      window.location.href = "index.html";
    });
  };
}
