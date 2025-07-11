document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
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

  function filtrarYPintar(filtro) {
    filtroActual = filtro;
    renderPeliculas(todasPeliculas.filter(filtro));
  }

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

  function configurarNavegacionLateral() {
    const asideItems = Array.from(document.querySelectorAll('aside li'));
    const navLinks = Array.from(document.querySelectorAll('header .nav-left a'));
    const peliculas = () => Array.from(document.querySelectorAll('.pelicula'));

asideItems.forEach((li, idx) => {
  li.setAttribute('tabindex', '0');
  li.addEventListener('keydown', e => {
    if (e.key === 'Enter') li.click();
    else if (e.key === 'ArrowDown') {
      if (idx < asideItems.length - 1) {
        asideItems[idx + 1].focus();
      }
      // Si está en el último, no hace nada
    } else if (e.key === 'ArrowUp') {
      if (idx > 0) asideItems[idx - 1].focus();
      else navLinks[0]?.focus();
    } else if (e.key === 'ArrowRight') {
      peliculas()[0]?.focus();
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }
  });
});

    navLinks.forEach((link, i) => {
      link.setAttribute('tabindex', '0');
      link.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') {
          if (i < navLinks.length - 1) navLinks[i + 1].focus();
          else botonCuenta.focus();
        } else if (e.key === 'ArrowLeft') {
          if (i > 0) navLinks[i - 1].focus();
        } else if (e.key === 'ArrowDown') {
          asideItems[0]?.focus();
        }
      });
    });

    botonCuenta.setAttribute('tabindex', '0');
    botonCuenta.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') navLinks[navLinks.length - 1]?.focus();
    });

galeria.addEventListener('keydown', e => {
  const cards = peliculas();
  const columnas = 4;
  const i = cards.indexOf(document.activeElement);
  if (i === -1) return;

  switch (e.key) {
    case 'ArrowRight':
      cards[i + 1]?.focus();
      break;

    case 'ArrowLeft':
      if (i === 0) {
        // Solo desde la primera card se vuelve al aside
        document.querySelector('aside li.activo')?.focus() || asideItems[0]?.focus();
      } else {
        cards[i - 1]?.focus();
      }
      break;

    case 'ArrowDown':
      cards[i + columnas]?.focus();
      break;

    case 'ArrowUp':
      if (i < columnas) buscador.focus();
      else cards[i - columnas]?.focus();
      break;

    case 'Enter':
      cards[i].click();
      break;
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    sonidoClick.currentTime = 0;
    sonidoClick.play().catch(() => {});
  }
});

    buscador.setAttribute('tabindex', '0');
    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        peliculas()[0]?.focus();
      }
    });
  }

  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
      establecerFocoInicial();
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

  function verTrailer() {
  if (!peliculaActiva || !peliculaActiva.trailerUrl) return;

  const videoPlayer = document.getElementById('videoPlayer');
  const cerrarVideo = document.getElementById('cerrarVideo');
  const btnTrailer = document.getElementById('btnVerTrailer');
if (pelicula.trailerUrl) {
  btnTrailer.style.display = 'flex';
  btnTrailer.onclick = verTrailer;
} else {
  btnTrailer.style.display = 'none';
}

  videoPlayer.querySelector('source').src = peliculaActiva.trailerUrl;
  videoPlayer.load();
  videoPlayer.play();

  document.getElementById('modalPelicula').style.display = 'none';
  const modalVideo = document.getElementById('modalVideo');
  modalVideo.style.display = 'flex';
  cerrarVideo.style.display = 'block';

  let ocultarCerrar = setTimeout(() => cerrarVideo.style.display = 'none', 5000);
  cerrarVideo.onclick = () => cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);

  setTimeout(() => cerrarVideo.focus(), 100);
}

  function manejarNavegacionModal(e) {
    const botones = [
      document.getElementById('cerrarModal'),
      document.getElementById('btnVerAhora'),
      document.getElementById('btnMostrarSinopsis')
    ].filter(btn => btn && btn.offsetParent !== null);

    const i = botones.indexOf(document.activeElement);
    if (i === -1) return;

    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      e.preventDefault();
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const next = i + 1 < botones.length ? i + 1 : 0;
      botones[next].focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const prev = i - 1 >= 0 ? i - 1 : botones.length - 1;
      botones[prev].focus();
    } else if (e.key === 'Enter') {
      botones[i].click();
    }
  }

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
    if (!peliculaActiva) return;

    const videoPlayer = document.getElementById('videoPlayer');
    const cerrarVideo = document.getElementById('cerrarVideo');
    videoPlayer.querySelector('source').src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
    videoPlayer.load();
    videoPlayer.play();

    document.getElementById('modalPelicula').style.display = 'none';
    const modalVideo = document.getElementById('modalVideo');
    modalVideo.style.display = 'flex';
    cerrarVideo.style.display = 'block';

    let ocultarCerrar = setTimeout(() => cerrarVideo.style.display = 'none', 5000);
    cerrarVideo.onclick = () => cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);

    setTimeout(() => cerrarVideo.focus(), 100);
  }

  function cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar) {
    clearTimeout(ocultarCerrar);
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    modalVideo.style.display = 'none';
    if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
  }

  window.filtrar = categoria => { /* ... */ }
  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');

  document.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }
  });
});
