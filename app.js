/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const auth = window.auth;
  const db = window.db;

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      inicializarPeliculas(user);
    }
  });

  function inicializarPeliculas(user) {
    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscadorPeliculas');
    const ordenar = document.getElementById('ordenar');
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const tituloCategoria = document.getElementById('tituloCategoria');
    const aside = document.querySelector('aside');

    let todasPeliculas = [];  // Aquí almacenamos las películas de Firebase

    // Mostrar/ocultar menú usuario
    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });

    ordenar.addEventListener('change', () => {
      renderPeliculas(filtrarPeliculas(buscador.value));  // Actualiza la búsqueda cuando se cambia el orden
    });

    // Manejo del evento de entrada para el campo de búsqueda
    buscador.addEventListener('input', (e) => {
      renderPeliculas(filtrarPeliculas(e.target.value));  // Actualiza la búsqueda
    });

    // Filtra las películas según el valor del buscador
    function filtrarPeliculas(texto) {
      const filtro = texto.toLowerCase();
      return todasPeliculas.filter(p => p.titulo.toLowerCase().includes(filtro));
    }

    // Función para renderizar las películas filtradas
    function renderPeliculas(lista) {
      galeria.innerHTML = '';  // Limpiar la galería antes de renderizar
      if (lista.length === 0) {
        galeria.innerHTML = '<p>No hay películas para mostrar.</p>';
        return;
      }

      lista.forEach(pelicula => {
        const card = document.createElement('div');
        card.className = 'pelicula';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="imagen-contenedor">
            <img src="${pelicula.imagen}" alt="${pelicula.titulo}">
          </div>
          <h3>${pelicula.titulo}</h3>
        `;
        galeria.appendChild(card);
      });
    }

    // Cargar las películas desde Firebase Firestore
    function cargarPeliculas() {
      const peliculasRef = db.collection('peliculas');  // Reemplaza 'peliculas' con tu colección en Firestore.
      
      peliculasRef.get().then(snapshot => {
        todasPeliculas = snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };  // Recuperamos las películas
        });

        renderPeliculas(todasPeliculas);  // Muestra todas las películas inicialmente
      }).catch((error) => {
        console.error("Error al obtener las películas:", error);
      });
    }

    // Llamamos a cargarPeliculas cuando la página cargue
    cargarPeliculas();

    // Asignación de filtros de categorías
    window.filtrar = function (categoria) {
      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const currentLi = document.querySelector(`#nav${capitalize(categoria)}`);
      if (currentLi) currentLi.classList.add('activo');

      tituloCategoria.textContent = categoria.toUpperCase();

      if (categoria === 'favoritos') {
        renderPeliculas(todasPeliculas.filter(p => p.favoritos));  // Si tienes filtro de favoritos, lo agregas aquí
      } else if (categoria === 'todos') {
        renderPeliculas(todasPeliculas);
      } else {
        const filtradas = todasPeliculas.filter(p => p.categoria === categoria);
        renderPeliculas(filtradas);
      }
    };

    window.cerrarSesion = function () {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    };

    // Utilidad para capitalizar las primeras letras de los filtros
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Manejando el enfoque de las categorías
    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          li.click();
        }

        if (e.key === 'ArrowDown') {
          const nextSection = li.nextElementSibling;
          if (nextSection) {
            nextSection.focus();
          } else {
            galeria.querySelector('.pelicula')?.focus(); // Mueve al primer elemento de la galería
          }
        }

        if (e.key === 'ArrowUp') {
          const prevSection = li.previousElementSibling;
          if (prevSection) {
            prevSection.focus();
          } else {
            aside.querySelector('li')?.focus(); // Regresa al primer filtro del aside
          }
        }

        if (e.key === 'ArrowRight') {
          const firstMovie = galeria.querySelector('.pelicula');
          if (firstMovie) firstMovie.focus(); // Mueve al primer elemento de la galería
        }
      });
    });
  }
});
