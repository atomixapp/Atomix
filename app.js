/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const auth = window.auth;
  const db = window.db;

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      inicializarPeliculas();
    }
  });

  function inicializarPeliculas() {
    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscadorPeliculas');
    const ordenar = document.getElementById('ordenar');
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const tituloCategoria = document.getElementById('tituloCategoria');
    const aside = document.querySelector('aside');

    let todasPeliculas = [];

    // 🔒 Evita que se pierda el foco al escribir en el buscador
    buscador.addEventListener("keydown", function(e) {
      const teclasPermitidas = [
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Enter", "Escape", "Backspace", "Delete", "Tab"
      ];
      if (!teclasPermitidas.includes(e.key)) {
        e.stopPropagation();
      }
    });

    // 📌 Evento para buscar dinámicamente mientras se escribe
    buscador.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      const filtradas = todasPeliculas.filter(p =>
        p.titulo && p.titulo.toLowerCase().includes(texto)
      );
      renderPeliculas(filtradas);
    });

    // 🎯 Cambiar orden
    ordenar.addEventListener('change', () => {
      const texto = buscador.value.toLowerCase();
      const filtradas = todasPeliculas.filter(p =>
        p.titulo && p.titulo.toLowerCase().includes(texto)
      );
      renderPeliculas(filtradas); // Por ahora solo re-renderiza, puedes añadir orden si quieres
    });

    // 👤 Menú de usuario
    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });

    // 🧠 Render de películas
    function renderPeliculas(lista) {
      galeria.innerHTML = '';

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

      const primera = galeria.querySelector('.pelicula');
      if (primera) primera.focus();
    }

    // 🔄 Cargar desde Firebase
    function cargarPeliculas() {
      db.collection('peliculas').get().then(snapshot => {
        todasPeliculas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderPeliculas(todasPeliculas);
      }).catch((error) => {
        console.error("Error al obtener las películas:", error);
      });
    }

    cargarPeliculas();

    // 🔘 Filtros por categoría
    window.filtrar = function (categoria) {
      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const currentLi = document.querySelector(`#nav${capitalize(categoria)}`);
      if (currentLi) currentLi.classList.add('activo');

      tituloCategoria.textContent = categoria.toUpperCase();

      if (categoria === 'favoritos') {
        renderPeliculas(todasPeliculas.filter(p => p.favoritos));
      } else if (categoria === 'todos') {
        renderPeliculas(todasPeliculas);
      } else {
        renderPeliculas(todasPeliculas.filter(p => p.categoria === categoria));
      }
    };

    window.cerrarSesion = function () {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    };

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ⌨️ Navegación con el mando
    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();

        if (e.key === 'ArrowDown') {
          const next = li.nextElementSibling;
          if (next) next.focus();
          else galeria.querySelector('.pelicula')?.focus();
        }

        if (e.key === 'ArrowUp') {
          const prev = li.previousElementSibling;
          if (prev) prev.focus();
          else aside.querySelector('li')?.focus();
        }

        if (e.key === 'ArrowRight') {
          const firstMovie = galeria.querySelector('.pelicula');
          if (firstMovie) firstMovie.focus();
        }
      });
    });

    galeria.addEventListener('keydown', (e) => {
      if (document.activeElement === buscador || buscador.contains(document.activeElement)) {
        return;
      }

      const peliculas = Array.from(galeria.querySelectorAll('.pelicula'));
      const focusedCard = document.activeElement;
      const currentIndex = peliculas.indexOf(focusedCard);

      if (e.key === 'ArrowRight' && currentIndex < peliculas.length - 1) {
        peliculas[currentIndex + 1].focus();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        peliculas[currentIndex - 1].focus();
      } else if (e.key === 'ArrowDown' && currentIndex + 4 < peliculas.length) {
        peliculas[currentIndex + 4].focus();
      } else if (e.key === 'ArrowUp' && currentIndex - 4 >= 0) {
        peliculas[currentIndex - 4].focus();
      }
    });
  }
});
