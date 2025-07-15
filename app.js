document.addEventListener('DOMContentLoaded', () => { 
  const galeria = document.getElementById('galeria');
  const galeriaPlataformas = document.getElementById('galeriaPlataformas');
  const buscador = document.getElementById('buscadorPeliculas');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');
  
  let todasPeliculas = [];
  let peliculaActiva = null;

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializarPeliculas();
  });

  function inicializarPeliculas() {
    configurarBuscador();
    configurarCuenta();
    configurarNavegacionLateral();
    actualizarPeliculasSinFecha();
    cargarPeliculas();
  }

  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase()));
    });
  }

  let filtroActual = () => true;

  function filtrarYPintar(filtro, categoriaNombre = '') {
    filtroActual = filtro;
    galeria.style.display = 'none';
    galeriaPlataformas.style.display = 'none';

    if (categoriaNombre === 'plataformas') {
      tituloCategoria.textContent = 'PLATAFORMAS';
      galeriaPlataformas.style.display = 'flex';

      const items = galeriaPlataformas.querySelectorAll('.plataforma-item');
      if (items.length > 0) {
        setTimeout(() => items[0].focus(), 100);
      }
    } else {
      tituloCategoria.textContent = categoriaNombre.toUpperCase();
      galeria.style.display = 'flex';
      renderPeliculas(todasPeliculas.filter(filtro));
    }
  }

  window.filtrar = function (categoria) {
    if (categoria === 'plataformas') {
      filtrarYPintar(() => true, 'plataformas');
      return;
    }

    const filtros = {
      todos: () => true,
      estrenos2025: p => p.anio === 2025,
      estrenos2024: p => p.anio === 2024,
    };

    const filtro = filtros[categoria] || (() => true);
    filtrarYPintar(filtro, categoria);
  };

  function configurarCuenta() {
    botonCuenta.addEventListener('click', e => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', e => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });
  }

  document.addEventListener('keydown', e => {
    const actual = document.activeElement;

    if (
      actual.tagName === 'INPUT' ||
      actual.tagName === 'TEXTAREA' ||
      actual.isContentEditable
    ) {
      return;
    }

    if (actual.classList.contains('plataforma-item')) {
      const items = Array.from(document.querySelectorAll('.plataforma-item'));
      const i = items.indexOf(actual);

      switch (e.key) {
        case 'ArrowRight':
          items[i + 1]?.focus();
          break;
        case 'ArrowLeft':
          items[i - 1]?.focus();
          break;
        case 'ArrowDown':
          document.querySelector('.pelicula')?.focus();
          break;
        case 'ArrowUp':
          buscador?.focus();
          break;
        case 'Enter':
          const plataforma = actual.getAttribute('aria-label');
          if (plataforma && typeof filtrar === 'function') {
            filtrar(plataforma.toLowerCase());
          }
          break;
      }

      sonidoClick.play();
    }

    if (actual === buscador) {
      switch (e.key) {
        case 'ArrowDown':
          document.querySelector('.pelicula')?.focus();
          break;
        case 'ArrowUp':
          document.querySelector('.plataforma-item')?.focus();
          break;
      }
      sonidoClick.play();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const primeraPlataforma = document.querySelector('.plataforma-item');
    if (primeraPlataforma) {
      setTimeout(() => primeraPlataforma.focus(), 100);
    }
  });

  function configurarNavegacionLateral() {
    const asideItems = Array.from(document.querySelectorAll('aside li'));
    asideItems.forEach((li, idx) => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter') li.click();
        else if (e.key === 'ArrowDown') {
          if (idx < asideItems.length - 1) asideItems[idx + 1].focus();
        } else if (e.key === 'ArrowUp') {
          if (idx > 0) asideItems[idx - 1].focus();
        }
      });
    });
  }

  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
    });
  }

  function actualizarPeliculasSinFecha() {
    db.collection("peliculas").get().then(snapshot => {
      snapshot.forEach(doc => {
        if (!doc.data().fechaCreacion) {
          db.collection("peliculas").doc(doc.id).update({
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    });
  }

  function establecerFocoInicial() {
    setTimeout(() => {
      const navLinks = document.querySelectorAll('header .nav-left a');
      const focoInicial = Array.from(navLinks).find(a => a.classList.contains('activo')) || navLinks[0];
      focoInicial?.focus();
    }, 300);
  }

  function renderPeliculas(lista) {
    galeria.innerHTML = lista.length
      ? lista.map(p => `
          <div class="pelicula" tabindex="0">
            <div class="imagen-contenedor">
              <img src="${p.imagen || 'img/placeholder.png'}" alt="${p.titulo}">
            </div>
            <h3>${p.titulo}</h3>
          </div>
        `).join('')
      : '<p>No hay películas para mostrar.</p>';

    galeria.querySelectorAll('.pelicula').forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
    });
  }

  let ultimaTarjetaActiva = null;

  function abrirModal(pelicula) {
    peliculaActiva = pelicula;
    const modal = document.getElementById('modalPelicula');

    ultimaTarjetaActiva = document.activeElement;

    document.getElementById('modalImagen').src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
    document.getElementById('modalTitulo').textContent = pelicula.titulo || 'Sin título';
    document.getElementById('modalDescripcion').textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';
    document.getElementById('modalExtraInfo').innerHTML = `
      <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
      <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
      <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>
    `;

    const btnTrailer = document.getElementById('btnVerTrailer');
    if (pelicula.trailerUrl) {
      btnTrailer.style.display = 'flex';
      btnTrailer.onclick = verTrailer;
    } else {
      btnTrailer.style.display = 'none';
    }

    modal.style.display = 'flex';

    setTimeout(() => {
      document.getElementById('btnVerAhora')?.focus();
    }, 100);

    document.getElementById('cerrarModal').onclick = cerrarModal;
    document.getElementById('btnVerAhora').onclick = verVideo;
    document.getElementById('btnMostrarSinopsis').onclick = mostrarSinopsis;

    const modalContenido = modal.querySelector('.modal-contenido');
    modalContenido.removeEventListener('keydown', manejarNavegacionModal);
    modalContenido.addEventListener('keydown', manejarNavegacionModal);
  }

  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
  }

  function verTrailer() {
    if (!peliculaActiva?.trailerUrl) return;

    const modalVideo = document.getElementById('modalVideo');
    const contenedorVideo = document.getElementById('contenedorVideo');
    const cerrarVideo = document.getElementById('cerrarVideo');

    contenedorVideo.innerHTML = '';

    const video = document.createElement('video');
    video.src = peliculaActiva.trailerUrl;
    video.controls = true;
    video.autoplay = true;
    video.id = 'trailerVideo';
    video.style.width = '100%';
    video.style.height = '100%';

    contenedorVideo.appendChild(video);

    document.getElementById('modalPelicula').style.display = 'none';
    modalVideo.style.display = 'flex';
    cerrarVideo.style.display = 'block';

    video.requestFullscreen?.().catch(() => {});

    cerrarVideo.onclick = cerrarVideoManual;
    document.addEventListener('keydown', manejarEscape);
    document.addEventListener('fullscreenchange', manejarSalidaFullscreen);
  }

  function manejarEscape(e) {
    if (e.key === 'Escape' && !document.fullscreenElement) {
      cerrarVideoTrailer();
    }
  }

  function manejarSalidaFullscreen() {
    if (!document.fullscreenElement) {
      cerrarVideoTrailer();
    }
  }

  function cerrarVideoManual() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      cerrarVideoTrailer();
    }
  }

  function cerrarVideoTrailer() {
    const modal = document.getElementById('modalVideo');
    const contenedor = document.getElementById('contenedorVideo');

    try {
      const videoRef = document.getElementById('trailerVideo');
      if (videoRef instanceof HTMLVideoElement) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
    } catch (err) {
      console.warn('Error al cerrar el video:', err);
    }

    contenedor.innerHTML = '';
    modal.style.display = 'none';
    document.getElementById('modalPelicula').style.display = 'flex';
    document.getElementById('btnVerTrailer')?.focus();

    document.removeEventListener('keydown', manejarEscape);
    document.removeEventListener('fullscreenchange', manejarSalidaFullscreen);
  }

  function manejarNavegacionModal(e) {
    const btnVerAhora = document.getElementById('btnVerAhora');
    const btnVerTrailer = document.getElementById('btnVerTrailer');
    const btnSinopsis = document.getElementById('btnMostrarSinopsis');
    const btnCerrar = document.getElementById('cerrarModal');

    const actual = document.activeElement;

    if (![btnVerAhora, btnVerTrailer, btnSinopsis, btnCerrar].includes(actual)) return;

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      e.preventDefault();
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }

    if (actual === btnVerAhora && e.key === 'ArrowRight') {
      btnVerTrailer.focus();
    } else if (actual === btnVerTrailer && e.key === 'ArrowLeft') {
      btnVerAhora.focus();
    }

    else if ((actual === btnVerTrailer || actual === btnVerAhora) && e.key === 'ArrowDown') {
      btnSinopsis.focus();
    }

    else if (actual === btnSinopsis && e.key === 'ArrowUp') {
      btnVerTrailer.focus();
    }

    else if ((actual === btnVerAhora || actual === btnVerTrailer) && e.key === 'ArrowUp') {
      btnCerrar.focus();
    }

    else if (actual === btnCerrar && e.key === 'ArrowDown') {
      btnVerAhora.focus();
    }

    else if (e.key === 'Enter') {
      actual.click();
    }
  }
});

  
  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
  }

function mostrarSinopsis() {
  const overlay = document.getElementById('overlaySinopsis');
  const btnCerrarSinopsis = document.getElementById('cerrarSinopsis');

  overlay.style.display = 'flex';
  setTimeout(() => btnCerrarSinopsis.focus(), 100);

  // Click en la X
  btnCerrarSinopsis.onclick = cerrarOverlaySinopsis;

  // Enter en la X
  btnCerrarSinopsis.onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      cerrarOverlaySinopsis();
    }
  };

  // Escape para cerrar
  window.addEventListener('keydown', cerrarConEscape);
}

function cerrarOverlaySinopsis() {
  const overlay = document.getElementById('overlaySinopsis');
  overlay.style.display = 'none';
  document.getElementById('btnMostrarSinopsis').focus();

  const btnCerrarSinopsis = document.getElementById('cerrarSinopsis');
  btnCerrarSinopsis.onclick = null;
  btnCerrarSinopsis.onkeydown = null;

  window.removeEventListener('keydown', cerrarConEscape);
}

function cerrarConEscape(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    cerrarOverlaySinopsis();
  }
}
  
function verVideo() {
  if (!peliculaActiva?.videoUrl) return;

  const modalVideo = document.getElementById('modalVideo');
  const contenedorVideo = document.getElementById('contenedorVideo');
  const cerrarVideo = document.getElementById('cerrarVideo');

  contenedorVideo.innerHTML = '';

  const video = document.createElement('video');
  video.src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
  video.controls = true;
  video.autoplay = true;
  video.id = 'videoPrincipal';
  video.style.width = '100%';
  video.style.height = '100%';

  contenedorVideo.appendChild(video);
  videoRef = video;

  document.getElementById('modalPelicula').style.display = 'none';
  modalVideo.style.display = 'flex';
  cerrarVideo.style.display = 'block';

  video.requestFullscreen?.().catch(() => {});

  cerrarVideo.onclick = cerrarVideoManual;
  document.addEventListener('keydown', manejarEscape);
  document.addEventListener('fullscreenchange', manejarSalidaFullscreen);

  setTimeout(() => cerrarVideo.focus(), 100);
}
});
