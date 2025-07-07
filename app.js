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

    let todasPeliculas = [];

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

    // Manejar la entrada del buscador y prevenir problemas de foco
    buscador.addEventListener('focus', (e) => {
      e.target.select();  // Selecciona todo el texto cuando se hace clic
    });

    buscador.addEventListener('input', () => {
      if (buscador.value !== "") {
        renderPeliculas(filtrarPeliculas(buscador.value));
      } else {
        renderPeliculas(todasPeliculas);  // Si está vacío, mostramos todas las películas
      }
    });

    function filtrarPeliculas(texto) {
      const filtro = texto.toLowerCase();
      return todasPeliculas
        .filter(p => p.titulo.toLowerCase().includes(filtro))
        .sort((a, b) => {
          const orden = ordenar.value;
          if (orden === 'titulo') return a.titulo.localeCompare(b.titulo);
          if (orden === 'anio') return b.anio - a.anio;
          return b.timestamp?.seconds - a.timestamp?.seconds;
        });
    }

    function renderPeliculas(lista) {
      galeria.innerHTML = '';

      if (lista.length === 0) {
        galeria.innerHTML = '<p style="color:white;">No hay películas para mostrar.</p>';
        return;
      }

      lista.forEach(pelicula => {
        const card = document.createElement('div');
        card.className = 'pelicula';
        card.setAttribute('tabindex', '0');

        // Ajustar el renderizado de las banderas y asegurarnos de que se carguen correctamente
        card.innerHTML = `
          <div class="imagen-contenedor">
            <div class="banderas" style="display: ${(pelicula.banderas && pelicula.banderas.length > 0) ? 'flex' : 'none'};">
              ${(pelicula.banderas ?? []).map(url => `<img src="${url}" alt="Bandera" class="bandera">`).join('')}
            </div>
            <img src="${pelicula.imagen}" alt="${pelicula.titulo}">
          </div>
          <h3>${pelicula.titulo}</h3>
        `;

        // Navegación con teclado
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            alert(`Seleccionada: ${pelicula.titulo}`);
          }

          if (e.key === 'ArrowLeft') {
            const prev = card.previousElementSibling;
            if (prev) prev.focus();
            else document.querySelector('aside li.activo')?.focus();
          }

          if (e.key === 'ArrowRight') {
            // Entrar a la galería al presionar la flecha derecha
            e.preventDefault();
            const nextCard = card.nextElementSibling;
            if (nextCard) {
              nextCard.focus();
            } else {
              // Si es la última tarjeta, que se mueva al siguiente item del aside
              aside.querySelector('li')?.focus();
            }
          }

          if (e.key === 'ArrowUp') {
            e.preventDefault();
            // Mover el foco al aside si estamos en la galería
            const prevSection = aside.querySelector('li.activo');
            if (prevSection) {
              prevSection.focus();
            } else {
              // Si no hay un elemento activo en el aside, ponemos el foco en el primer filtro
              aside.querySelector('li')?.focus();
            }
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            // Volver a la galería
            const firstMovie = galeria.querySelector('.pelicula');
            if (firstMovie) firstMovie.focus();
          }
        });

        galeria.appendChild(card);
      });

      const primera = galeria.querySelector('.pelicula');
      if (primera) primera.focus();
    }

    window.filtrar = function (categoria) {
      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const currentLi = document.querySelector(`#nav${capitalize(categoria)}`);
      if (currentLi) currentLi.classList.add('activo');

      tituloCategoria.textContent = categoria.toUpperCase();

      if (categoria === 'favoritos') {
        db.collection('usuarios').doc(user.uid).get().then(doc => {
          const data = doc.data();
          const favIds = data && Array.isArray(data.favoritos) ? data.favoritos : [];
          const filtradas = todasPeliculas.filter(p => favIds.includes(p.id));
          renderPeliculas(filtradas);
        });
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

    db.collection('peliculas').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
    });

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
