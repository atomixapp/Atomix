document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Control de sesión y email verificado
  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarApp(user);
    }
  });

  function inicializarApp(user) {
    const userId = user.uid;

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
    const nombreUsuario = document.getElementById('nombreUsuario');
    const correoUsuario = document.getElementById('correoUsuario');

    if (!galeria || !buscador || !ordenarSelect) {
      console.error('Error: Elementos clave del DOM no encontrados.');
      return;
    }

    galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';
    nombreUsuario.textContent = user.displayName || "Usuario";
    correoUsuario.textContent = user.email;

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
        filtrarBusqueda();
      }
    });

    iconoBuscar.addEventListener('click', e => {
      e.stopPropagation();
      buscador.style.display = buscador.style.display === 'block' ? 'none' : 'block';
      if (buscador.style.display === 'block') buscador.focus();
    });

    buscador.addEventListener('input', filtrarBusqueda);

    function filtrarBusqueda() {
      const texto = buscador.value.toLowerCase();
      const tarjetas = document.querySelectorAll(".galeria > div");

      tarjetas.forEach(tarjeta => {
        const titulo = tarjeta.querySelector('h3')?.textContent.toLowerCase() || '';
        tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
      });
    }

    function mostrarPeliculas(lista, actualizarLista = true) {
      galeria.innerHTML = '';

      obtenerFavoritosFirestore(userId)
        .then(favoritos => {
          if (actualizarLista) {
            peliculasOriginal = [...lista];
            peliculas = lista;
          }

          if (lista.length === 0) {
            galeria.innerHTML = '<p class="vacio">No hay películas para mostrar.</p>';
            return;
          }

          lista.forEach(p => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'pelicula';

            const tituloID = encodeURIComponent(p.titulo);
            const esFavorito = favoritos.includes(p.titulo);

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
                  setTimeout(() => {
                    cargarFavoritosFirestore(userId);
                  }, 300);
                }
              } catch (err) {
                console.error("Error al actualizar favorito:", err);
                e.currentTarget.classList.toggle('activo');
              }
            });
          });
        });
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
          mostrarPeliculas(favoritas, false);
        });
    }

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
        filtrar('todos');
      }
    });

    function filtrar(anio = 'todos') {
      const filtradas = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
      mostrarPeliculas(filtradas);

      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const liActivo = Array.from(document.querySelectorAll('aside li'))
        .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
      if (liActivo) liActivo.classList.add('activo');

      const tituloCategoria = document.getElementById('tituloCategoria');
      if (tituloCategoria) {
        if (anio === 'favoritos') {
          tituloCategoria.textContent = 'FAVORITOS';
        } else if (anio === 'todos') {
          tituloCategoria.textContent = 'TODAS';
        } else {
          tituloCategoria.textContent = anio.toUpperCase();
        }
      }
    }

    db.collection('peliculas').get()
      .then(snap => {
        const datos = snap.docs.map(doc => doc.data());
        peliculasOriginal = [...(datos.length > 0 ? datos : respaldoLocal)];
        peliculas = [...peliculasOriginal];
        filtrar('todos');
      })
      .catch(err => {
        console.warn("Error Firebase:", err.message);
        peliculasOriginal = [...respaldoLocal];
        peliculas = [...peliculasOriginal];
        filtrar('todos');
      });

    navPeliculas.addEventListener('click', () => {
      navFavoritos.classList.remove('activo');
      navPeliculas.classList.add('activo');
      filtrar('todos');
    });

    navFavoritos.addEventListener('click', () => {
      navPeliculas.classList.remove('activo');
      navFavoritos.classList.add('activo');
      cargarFavoritosFirestore(userId);
    });
  }

  window.cerrarSesion = function () {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = "index.html";
      });
  };
});
