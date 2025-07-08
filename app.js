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

    buscador.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      const filtradas = todasPeliculas.filter(p =>
        p.titulo && p.titulo.toLowerCase().includes(texto)
      );
      renderPeliculas(filtradas);
    });

    ordenar.addEventListener('change', () => {
      const texto = buscador.value.toLowerCase();
      const filtradas = todasPeliculas.filter(p =>
        p.titulo && p.titulo.toLowerCase().includes(texto)
      );
      renderPeliculas(filtradas);
    });

    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });

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
            <img src="${pelicula.imagen || 'img/placeholder.png'}" alt="${pelicula.titulo}">
          </div>
          <h3>${pelicula.titulo}</h3>
        `;
        galeria.appendChild(card);
      });

      // Solo enfocar si el usuario no está escribiendo
      if (document.activeElement !== buscador) {
        galeria.querySelector('.pelicula')?.focus();
      }
    }

    function cargarPeliculas() {
      db.collection('peliculas').get().then(snapshot => {
        todasPeliculas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderPeliculas(todasPeliculas);
      }).catch(error => {
        console.error("Error al obtener las películas:", error);
      });
    }

    cargarPeliculas();

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

    // ⌨️ NAVEGACIÓN lateral con flechas y mando
    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();

        if (e.key === 'ArrowDown') {
          li.nextElementSibling?.focus();
        }

        if (e.key === 'ArrowUp') {
          li.previousElementSibling?.focus();
        }

        if (e.key === 'ArrowRight') {
          setTimeout(() => {
            galeria.querySelector('.pelicula')?.focus();
          }, 0);
        }
      });
    });

    // ⌨️ NAVEGACIÓN entre tarjetas con control remoto
    galeria.addEventListener('keydown', (e) => {
      const peliculas = Array.from(galeria.querySelectorAll('.pelicula'));
      const focusedCard = document.activeElement;
      const index = peliculas.indexOf(focusedCard);
      const columnas = 4;

      if (index === -1) return;

      switch (e.key) {
        case 'ArrowRight':
          if (index % columnas !== columnas - 1 && index < peliculas.length - 1) {
            peliculas[index + 1]?.focus();
          }
          break;
        case 'ArrowLeft':
          if (index % columnas !== 0) {
            peliculas[index - 1]?.focus();
          } else {
            // Volver al menú lateral
            document.querySelector('aside li.activo')?.focus();
          }
          break;
        case 'ArrowDown':
          if (index + columnas < peliculas.length) {
            peliculas[index + columnas]?.focus();
          }
          break;
        case 'ArrowUp':
          if (index - columnas >= 0) {
            peliculas[index - columnas]?.focus();
          }
          break;
        case 'Enter':
          focusedCard.click?.(); // Acción si pulsas OK
          break;
      }
    });
  }
});
