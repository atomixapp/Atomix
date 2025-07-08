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

    // ✅ Corrección del buscador para que no pierda el foco al escribir
    buscador.addEventListener("keydown", function(e) {
      const teclasPermitidas = [
        "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
        "Enter", "Escape", "Backspace", "Delete", "Tab"
      ];
      if (!teclasPermitidas.includes(e.key)) {
        e.stopPropagation();
      }
    });

    buscador.addEventListener("focus", () => {
      buscador.setAttribute("data-focused", "true");
    });

    buscador.addEventListener("blur", () => {
      buscador.removeAttribute("data-focused");
    });

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
      renderPeliculas(filtrarPeliculas(buscador.value));
    });

buscador.addEventListener('input', (e) => {
  const texto = e.target.value.toLowerCase();
  const filtradas = todasPeliculas.filter(p => p.titulo.toLowerCase().includes(texto));
  renderPeliculas(filtradas);
});

    function filtrarPeliculas(texto) {
      const filtro = texto.toLowerCase();
      return todasPeliculas.filter(p => p.titulo.toLowerCase().includes(filtro));
    }

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

    function cargarPeliculas() {
      const peliculasRef = db.collection('peliculas');
      
      peliculasRef.get().then(snapshot => {
        todasPeliculas = snapshot.docs.map(doc => {
          return { id: doc.id, ...doc.data() };
        });

        renderPeliculas(todasPeliculas);
      }).catch((error) => {
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
        const filtradas = todasPeliculas.filter(p => p.categoria === categoria);
        renderPeliculas(filtradas);
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

    // Enfoque lateral (categorías)
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
            galeria.querySelector('.pelicula')?.focus();
          }
        }

        if (e.key === 'ArrowUp') {
          const prevSection = li.previousElementSibling;
          if (prevSection) {
            prevSection.focus();
          } else {
            aside.querySelector('li')?.focus();
          }
        }

        if (e.key === 'ArrowRight') {
          const firstMovie = galeria.querySelector('.pelicula');
          if (firstMovie) firstMovie.focus();
        }
      });
    });

// ✅ Arreglar que el buscador pierda el foco al escribir
galeria.addEventListener('keydown', (e) => {
  if (document.activeElement === buscador || buscador.contains(document.activeElement)) {
    // Si estás escribiendo en el buscador, no hacer nada
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
