import { doc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {

  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarApp(user);
    }
  });

  function inicializarApp(user) {
    const respaldoLocal = [
      {
        id: 'spiderman-2025',
        titulo: 'Spiderman: De regreso a casa',
        imagen: 'https://image.tmdb.org/t/p/original/81qIJbnS2L0rUAAB55G8CZODpS5.jpg',
        anio: '2025',
        latino: true,
        castellano: true
      },
      {
        id: 'la-leyenda-de-ochi-2025',
        titulo: 'La leyenda de Ochi',
        imagen: 'https://image.tmdb.org/t/p/original/h1Iq6WfE4RWc9klGvN8sdi5aR6V.jpg',
        anio: '2025',
        castellano: true
      }
    ];

    let peliculasOriginal = [];
    let peliculas = [];
    let favoritosIds = [];

    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscador');
    const ordenarSelect = document.getElementById('ordenar');
    const navPeliculas = document.getElementById('navPeliculas');
    const navFavoritos = document.getElementById('navFavoritos');

    galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

    async function cargarFavoritosUsuario() {
      try {
        const favoritosRef = collection(db, 'usuarios', user.uid, 'favoritos');
        const snapshot = await getDocs(favoritosRef);
        favoritosIds = snapshot.docs.map(doc => doc.id);
      } catch (error) {
        console.error('Error cargando favoritos:', error);
        favoritosIds = [];
      }
    }

    async function toggleFavorito(pelicula) {
      const docRef = doc(db, 'usuarios', user.uid, 'favoritos', pelicula.id);

      if (favoritosIds.includes(pelicula.id)) {
        // Eliminar de favoritos
        try {
          await deleteDoc(docRef);
          favoritosIds = favoritosIds.filter(id => id !== pelicula.id);
        } catch (error) {
          console.error('Error eliminando favorito:', error);
        }
      } else {
        // Agregar a favoritos
        try {
          await setDoc(docRef, {
            titulo: pelicula.titulo,
            imagen: pelicula.imagen,
            anio: pelicula.anio
          });
          favoritosIds.push(pelicula.id);
        } catch (error) {
          console.error('Error agregando favorito:', error);
        }
      }
    }

    function mostrarPeliculas(lista) {
      galeria.innerHTML = '';

      lista.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'pelicula';
        const tituloCod = encodeURIComponent(p.titulo);
        const esFavorito = favoritosIds.includes(p.id);

        tarjeta.innerHTML = `
          <a href="detalles.html?titulo=${tituloCod}">
            <img src="${p.imagen}" alt="${p.titulo}">
            <div class="banderas">
              ${p.castellano ? '<img src="https://flagcdn.com/w20/es.png">' : ''}
              ${p.latino ? '<img src="https://flagcdn.com/w20/mx.png">' : ''}
            </div>
            <h3>${p.titulo}</h3>
          </a>
          <div class="corazon ${esFavorito ? 'activo' : ''}" data-id="${p.id}">
            <i class="fa-solid fa-heart"></i>
          </div>
        `;
        galeria.appendChild(tarjeta);
      });

      document.querySelectorAll('.corazon').forEach(icon => {
        icon.addEventListener('click', async e => {
          const id = e.currentTarget.dataset.id;
          const pelicula = peliculas.find(p => p.id === id);

          await toggleFavorito(pelicula);

          e.currentTarget.classList.toggle('activo');

          if (navFavoritos.classList.contains('activo')) {
            cargarFavoritos();
          }
        });
      });
    }

    function filtrar(anio = 'todos') {
      const filtradas = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
      mostrarPeliculas(filtradas);

      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const liActivo = Array.from(document.querySelectorAll('aside li'))
        .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
      if (liActivo) liActivo.classList.add('activo');
    }

    function cargarFavoritos() {
      const favoritas = peliculas.filter(p => favoritosIds.includes(p.id));
      mostrarPeliculas(favoritas);
    }

    buscador.addEventListener('input', () => {
      const texto = buscador.value.toLowerCase();
      const filtradas = peliculas.filter(p => p.titulo.toLowerCase().includes(texto));
      mostrarPeliculas(filtradas);
    });

    ordenarSelect.addEventListener('change', () => {
      const criterio = ordenarSelect.value;
      if (criterio === 'añadido') {
        peliculas = [...peliculasOriginal];
      } else if (criterio === 'titulo') {
        peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
      } else if (criterio === 'anio') {
        peliculas.sort((a, b) => b.anio.localeCompare(a.anio));
      }

      if (navFavoritos.classList.contains('activo')) {
        cargarFavoritos();
      } else {
        filtrar('todos');
      }
    });

    db.collection('peliculas').get()
      .then(async snap => {
        const datos = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        peliculasOriginal = datos.length > 0 ? datos : respaldoLocal;
        peliculas = [...peliculasOriginal];

        await cargarFavoritosUsuario();
        filtrar('todos');
      })
      .catch(async err => {
        console.warn('Error Firebase:', err.message);
        peliculasOriginal = [...respaldoLocal];
        peliculas = [...peliculasOriginal];

        await cargarFavoritosUsuario();
        filtrar('todos');
      });

    // Navbar eventos
    navPeliculas.addEventListener('click', () => {
      navFavoritos.classList.remove('activo');
      navPeliculas.classList.add('activo');
      filtrar('todos');
    });

    navFavoritos.addEventListener('click', () => {
      navPeliculas.classList.remove('activo');
      navFavoritos.classList.add('activo');
      cargarFavoritos();
    });

    // Menú usuario
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const nombreUsuario = document.getElementById('nombreUsuario');
    const correoUsuario = document.getElementById('correoUsuario');

    nombreUsuario.textContent = user.displayName || 'Usuario';
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

  window.cerrarSesion = function () {
    auth.signOut()
      .then(() => {
        window.location.href = 'index.html';
      });
  };
});
