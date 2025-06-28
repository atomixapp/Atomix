document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarApp(user);
    }
  });

  function inicializarApp(user) {
    let peliculasOriginal = [];
    let peliculas = [];

    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscador');
    const ordenarSelect = document.getElementById('ordenar');
    const navPeliculas = document.getElementById('navPeliculas');
    const navFavoritos = document.getElementById('navFavoritos');

    galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

    // Función para generar un ID limpio a partir del título
    function generarID(titulo) {
      return titulo
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
    }

    // Mostrar las películas en pantalla, con estado de favorito
    function mostrarPeliculas(lista) {
      galeria.innerHTML = '';

      obtenerFavoritosFirestore(user.uid).then(favoritos => {
        lista.forEach(p => {
          const tarjeta = document.createElement('div');
          tarjeta.className = 'pelicula';

          const tituloID = encodeURIComponent(p.titulo);
          const esFavorito = favoritos.includes(p.titulo);

          tarjeta.innerHTML = `
            <a href="detalles.html?titulo=${tituloID}">
              <img src="${p.imagen}" alt="${p.titulo}">
              <div class="banderas">
                ${p.castellano ? '<img src="https://flagcdn.com/w20/es.png" alt="Castellano">' : ''}
                ${p.latino ? '<img src="https://flagcdn.com/w20/mx.png" alt="Latino">' : ''}
              </div>
              <h3>${p.titulo}</h3>
            </a>
            <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
              <i class="fa-solid fa-heart"></i>
            </div>
          `;

          galeria.appendChild(tarjeta);
        });

        // Añadir evento para activar/desactivar favorito
        document.querySelectorAll('.corazon').forEach(icon => {
          icon.addEventListener('click', e => {
            const titulo = e.currentTarget.dataset.titulo;
            const pelicula = peliculas.find(p => p.titulo === titulo);
            if (!pelicula) return;

            e.currentTarget.classList.toggle('activo');
            toggleFavoritoFirestore(pelicula, user.uid);

            // Si estamos viendo favoritos, recargamos la lista para refrescarla
            if (navFavoritos.classList.contains('activo')) {
              cargarFavoritosFirestore(user.uid);
            }
          });
        });
      });
    }

    // Alternar favorito en Firestore
    function toggleFavoritoFirestore(pelicula, userId) {
      const tituloID = generarID(pelicula.titulo);

      const docRef = db.collection('usuarios')
        .doc(userId)
        .collection('favoritos')
        .doc(tituloID);

      docRef.get().then(docSnapshot => {
        if (docSnapshot.exists) {
          docRef.delete();
        } else {
          docRef.set({
            titulo: pelicula.titulo,
            imagen: pelicula.imagen,
            anio: pelicula.anio,
            castellano: pelicula.castellano || false,
            latino: pelicula.latino || false
          });
        }
      }).catch(err => {
        console.error("Error toggling favorito:", err);
      });
    }

    // Obtener lista de títulos favoritos para el usuario actual
    function obtenerFavoritosFirestore(userId) {
      return db.collection('usuarios')
        .doc(userId)
        .collection('favoritos')
        .get()
        .then(snap => snap.docs.map(doc => doc.data().titulo));
    }

    // Cargar y mostrar las películas favoritas del usuario
    function cargarFavoritosFirestore(userId) {
      db.collection('usuarios')
        .doc(userId)
        .collection('favoritos')
        .get()
        .then(snap => {
          const favoritas = snap.docs.map(doc => doc.data());
          mostrarPeliculas(favoritas);
        })
        .catch(err => {
          console.error("Error cargando favoritos:", err);
        });
    }

    // Buscador de películas
    buscador.addEventListener('input', () => {
      const texto = buscador.value.toLowerCase();
      const filtradas = peliculas.filter(p => p.titulo.toLowerCase().includes(texto));
      mostrarPeliculas(filtradas);
    });

    // Ordenar películas
    ordenarSelect.addEventListener('change', () => {
      const criterio = ordenarSelect.value;
      if (criterio === 'titulo') {
        peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
      } else if (criterio === 'anio') {
        peliculas.sort((a, b) => b.anio.localeCompare(a.anio));
      } else {
        peliculas = [...peliculasOriginal]; // Orden por defecto
      }

      if (navFavoritos.classList.contains('activo')) {
        cargarFavoritosFirestore(user.uid);
      } else {
        mostrarPeliculas(peliculas);
      }
    });

    // Filtros por año, opcional
    function filtrar(anio = 'todos') {
      const filtradas = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
      mostrarPeliculas(filtradas);

      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const liActivo = Array.from(document.querySelectorAll('aside li'))
        .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
      if (liActivo) liActivo.classList.add('activo');
    }

    // Cargar películas desde Firestore
    db.collection('peliculas').get()
      .then(snap => {
        peliculasOriginal = snap.docs.map(doc => doc.data());
        peliculas = [...peliculasOriginal];
        filtrar('todos');
      })
      .catch(err => {
        console.error("Error cargando peliculas:", err);
        galeria.innerHTML = '<p>Error al cargar películas.</p>';
      });

    // Navbar para cambiar entre películas y favoritos
    navPeliculas.addEventListener('click', () => {
      navFavoritos.classList.remove('activo');
      navPeliculas.classList.add('activo');
      filtrar('todos');
    });

    navFavoritos.addEventListener('click', () => {
      navPeliculas.classList.remove('activo');
      navFavoritos.classList.add('activo');
      cargarFavoritosFirestore(user.uid);
    });

    // Menú usuario
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const nombreUsuario = document.getElementById('nombreUsuario');
    const correoUsuario = document.getElementById('correoUsuario');

    nombreUsuario.textContent = user.displayName || "Usuario";
    correoUsuario.textContent = user.email;

    function isMenuVisible() {
      return window.getComputedStyle(menuUsuario).display === 'block';
    }

    botonCuenta.addEventListener('click', e => {
      e.stopPropagation();
      menuUsuario.style.display = isMenuVisible() ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      if (isMenuVisible()) {
        menuUsuario.style.display = 'none';
      }
    });
  }

  // Cerrar sesión
  window.cerrarSesion = function () {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = "index.html";
      });
  };
});
