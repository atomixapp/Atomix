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

    // Modal elementos
const modal = document.getElementById('modalPelicula');
const modalImagen = document.getElementById('modalImagen');
const modalTitulo = document.getElementById('modalTitulo');
const modalDescripcion = document.getElementById('modalDescripcion');
const cerrarModal = document.getElementById('cerrarModal');
const btnVerAhora = document.getElementById('btnVerAhora');
const modalExtraInfo = document.getElementById('modalExtraInfo');

let ocultarCerrarTimeout;

function abrirModal(pelicula) {
  peliculaActiva = pelicula;

  modalImagen.src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
  modalTitulo.textContent = pelicula.titulo || 'Sin título';
  modalDescripcion.textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';

  // Agrega info adicional
  modalExtraInfo.innerHTML = `
    <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
    <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
    <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>
  `;

  modal.style.display = 'flex';

  setTimeout(() => {
    document.querySelector('.modal-contenido').focus();
  }, 100);

  // 🔁 Estos elementos solo existen después de abrir el modal
  const btnMostrarSinopsis = document.getElementById('btnMostrarSinopsis');
  const overlaySinopsis = document.getElementById('overlaySinopsis');
  const cerrarSinopsis = document.getElementById('cerrarSinopsis');

  if (btnMostrarSinopsis && overlaySinopsis && cerrarSinopsis) {
    btnMostrarSinopsis.addEventListener('click', () => {
      overlaySinopsis.style.display = 'flex';
      setTimeout(() => {
        document.querySelector('.sinopsis-contenido').focus();
      }, 100);
    });

    cerrarSinopsis.addEventListener('click', () => {
      overlaySinopsis.style.display = 'none';
    });
  }
}


function cerrarModalFunc() {
  modal.style.display = 'none';
  // Devuelve el foco a la tarjeta activa
  document.activeElement.blur();
  galeria.querySelector('.pelicula:focus')?.focus();
}

cerrarModal.addEventListener('click', cerrarModalFunc);
window.addEventListener('keydown', (e) => {
  if (modal.style.display === 'flex' && e.key === 'Escape') {
    cerrarModalFunc();
  }
});

// Abrir modal al pulsar Enter en tarjeta
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
      const pelicula = todasPeliculas[index];
      if (pelicula) abrirModal(pelicula);
      break;
  }
});

   // Reproductor de video
const modalVideo = document.getElementById('modalVideo');
const videoPlayer = document.getElementById('videoPlayer');
const cerrarVideo = document.getElementById('cerrarVideo');

btnVerAhora.addEventListener('click', () => {
  if (!peliculaActiva) return;

  const videoUrl = peliculaActiva.videoUrl || "https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4";
  videoPlayer.querySelector('source').src = videoUrl;
  videoPlayer.muted = false;
  videoPlayer.volume = 1;
  videoPlayer.load();
  videoPlayer.play();

  modal.style.display = 'none';
  modalVideo.style.display = 'flex';

  // Ocultar el botón de cerrar tras 5 segundos
  cerrarVideo.style.display = 'block'; // mostrar al inicio
  clearTimeout(ocultarCerrarTimeout);
  ocultarCerrarTimeout = setTimeout(() => {
    cerrarVideo.style.display = 'none';
  }, 5000);

  setTimeout(() => {
    document.querySelector('.video-contenido').focus();
  }, 100);
});

cerrarVideo.addEventListener('click', cerrarVideoFunc);

function cerrarVideoFunc() {
  modalVideo.style.display = 'none';
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  galeria.querySelector('.pelicula:focus')?.focus();
}

window.addEventListener('keydown', (e) => {
  if (modalVideo.style.display === 'flex') {
    if (e.key === 'Escape') {
      if (cerrarVideo.style.display === 'none') {
        cerrarVideo.style.display = 'block';
        clearTimeout(ocultarCerrarTimeout);
        ocultarCerrarTimeout = setTimeout(() => {
          cerrarVideo.style.display = 'none';
        }, 5000);
      } else {
        cerrarVideoFunc(); // cerrar si ya estaba visible
      }
    }
  }

  if (modal.style.display === 'flex' && e.key === 'Escape') {
    cerrarModalFunc();
  }
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
  // Abrir modal al hacer click en la card
  card.addEventListener('click', () => {
    abrirModal(pelicula);
  });
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
