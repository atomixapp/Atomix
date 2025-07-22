document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
  const galeriaPlataformas = document.getElementById('galeriaPlataformas');
  const buscador = document.getElementById('buscadorPeliculas');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');
  const asideItems = Array.from(document.querySelectorAll('aside li'));
  
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
    const texto = e.target.value.toLowerCase();
    filtrarYPintar(p => p.titulo?.toLowerCase().includes(texto), '', false); // <- moverFoco = false
  });
}

  let filtroActual = () => true;

function filtrarYPintar(filtro, categoriaNombre = '', moverFoco = true) {
  filtroActual = filtro;

  galeria.style.display = 'none';
  galeriaPlataformas.style.display = 'none';

  if (categoriaNombre === 'plataformas') {
    tituloCategoria.textContent = 'PLATAFORMAS';
    galeriaPlataformas.style.display = 'flex';

    const items = galeriaPlataformas.querySelectorAll('.plataforma-item');
    if (items.length > 0 && moverFoco) {
      setTimeout(() => {
        items[0].focus();
        console.log('✅ Foco en plataforma:', document.activeElement);
      }, 100);
    }
  } else {
    tituloCategoria.textContent = categoriaNombre.toUpperCase();
    galeria.style.display = 'flex';

    renderPeliculas(todasPeliculas.filter(filtro), () => {
      if (!moverFoco) return;
      const primera = galeria.querySelector('.pelicula');
      if (primera) primera.focus();
    });
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

  accion: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('acción'),
  animacion: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('animación'),
  artesmarciales: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('artes marciales'),
  aventuras: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('aventura'),
  cienciaficcion: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('ciencia ficción'),
  comedia: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('comedia'),
  drama: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('drama'),
  fantasia: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('fantasía'),
  romance: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('romance'),
  suspense: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('suspense'),
  terror: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('terror'),
  netflix: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('netflix'),
  amazon: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('amazon'),
  disney: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('disney'),
  2025: p => Array.isArray(p.genero) && p.genero.map(g => g.toLowerCase()).includes('2025'),
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

  // Si el foco está en una plataforma (card de galería)
  if (actual.classList.contains('plataforma-item')) {
    const items = Array.from(document.querySelectorAll('.plataforma-item'));
    const i = items.indexOf(actual);

    switch (e.key) {
      case 'ArrowRight':
        // Mover el foco a la siguiente plataforma, si existe
        if (i + 1 < items.length) items[i + 1].focus();
        break;

      case 'ArrowLeft':
        // Mover el foco a la plataforma anterior, si existe
        if (i - 1 >= 0) items[i - 1].focus();
        else {
          // Si estamos en la primera plataforma, ir al aside
          document.querySelector('aside li.activo')?.focus() || asideItems[0]?.focus();
        }
        break;

      case 'ArrowUp':
        // Mover el foco al buscador
        if (buscador) buscador.focus();
        break;

      case 'ArrowDown':
        // Mover el foco al primer ítem de la galería
        document.querySelector('.plataforma-item')?.focus();
        break;

case 'Enter':
  const plataforma = actual.getAttribute('aria-label');
  if (plataforma && typeof filtrar === 'function') {
    filtrar(plataforma.toLowerCase());

    // Espera un poco y enfoca la primera tarjeta de película
    setTimeout(() => {
      const primeraCard = document.querySelector('.pelicula');
      if (primeraCard) {
        primeraCard.focus();
        console.log('🎯 Foco en película:', document.activeElement);
      }
    }, 300); // Da tiempo a que se rendericen
  }
  break;
    }

    // Reproducir sonido de clic para las teclas
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }
  }

  // Foco en el buscador
  if (actual === buscador) {
    switch (e.key) {
      case 'ArrowUp':
        document.querySelector('.plataforma-item')?.focus();
        break;
      case 'ArrowDown':
        const items = Array.from(document.querySelectorAll('.plataforma-item'));
        items[0]?.focus(); // Mover al primer item de la galería
        break;
    }
  }
});

// Escuchar clic en las cards (asegurarnos de que las cards abran correctamente al hacer clic)
document.querySelectorAll('.plataforma-item').forEach(card => {
  card.addEventListener('click', e => {
    const plataforma = card.getAttribute('aria-label');
    if (plataforma && typeof filtrar === 'function') {
      filtrar(plataforma.toLowerCase()); // Aquí se abriría o filtra la plataforma según el nombre
    }
  });
});

let bloquearPrimerEnterEnGaleria = false;
  
  function configurarNavegacionLateral() {
    const asideItems = Array.from(document.querySelectorAll('aside li'));
    const navLinks = Array.from(document.querySelectorAll('header .nav-left a'));
    const peliculas = () => Array.from(document.querySelectorAll('.pelicula'));

asideItems.forEach((li, idx) => {
  li.setAttribute('tabindex', '0');
  li.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      li.click();
      bloquearPrimerEnterEnGaleria = true; // 🛑 activa el bloqueo

      setTimeout(() => {
        peliculas()[0]?.focus();
      }, 100);

      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    } else if (e.key === 'ArrowDown') {
      if (idx < asideItems.length - 1) {
        asideItems[idx + 1].focus();
      }
    } else if (e.key === 'ArrowUp') {
      if (idx > 0) {
        asideItems[idx - 1].focus();
      } else {
        navLinks[0]?.focus();
      }
    } else if (e.key === 'ArrowRight') {
      peliculas()[0]?.focus();
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }
  });
});

// =================== NAVLINKS ===================
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

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      sonidoClick.currentTime = 0;
      sonidoClick.play().catch(() => {});
    }
  });
});

// =================== CUENTA ===================
botonCuenta.setAttribute('tabindex', '0');
botonCuenta.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') navLinks[navLinks.length - 1]?.focus();

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    sonidoClick.currentTime = 0;
    sonidoClick.play().catch(() => {});
  }
});

// =================== GALERÍA ===================
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
      if (bloquearPrimerEnterEnGaleria) {
        bloquearPrimerEnterEnGaleria = false; // 🔓 desactiva para futuros ENTER
        return; // 🚫 NO abrir modal en este primer ENTER
      }
      cards[i].click();
      break;
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
    sonidoClick.currentTime = 0;
    sonidoClick.play().catch(() => {});
  }
});

// =================== BUSCADOR ===================
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

function renderPeliculas(lista, callback) {
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

  // Asigna evento click a cada tarjeta
  galeria.querySelectorAll('.pelicula').forEach((card, i) => {
    card.addEventListener('click', () => abrirModal(lista[i]));
  });

  // ✅ Llamar callback si se pasó
  if (typeof callback === 'function') {
    setTimeout(callback, 0); // Espera a que el DOM se pinte completamente
  }
}

  // Después de pintar y asignar eventos
  setTimeout(() => {
    const primeraCard = galeria.querySelector('.pelicula');
    if (primeraCard) {
      primeraCard.focus();
      console.log('🎯 Foco inicial en película:', document.activeElement);
    }
  }, 100); // Da tiempo a que el DOM se actualice
  
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

  // Mostrar u ocultar el botón "Ver trailer"
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

  let videoRef = null;

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
video.muted = false;
video.play().catch(err => {
  // Si falla, prueba desmutear después de una interacción
  console.warn('Autoplay con sonido bloqueado:', err);
  video.muted = true; // fallback
  video.play().catch(() => {});
});
    video.id = 'trailerVideo';
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
    videoRef = null;
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

  // Navegación horizontal entre "Ver ahora" y "Ver trailer"
  if (actual === btnVerAhora && e.key === 'ArrowRight') {
    btnVerTrailer.focus();
  } else if (actual === btnVerTrailer && e.key === 'ArrowLeft') {
    btnVerAhora.focus();
  }

  // Vertical hacia sinopsis desde "Ver ahora" o "Ver trailer"
  else if ((actual === btnVerTrailer || actual === btnVerAhora) && e.key === 'ArrowDown') {
    btnSinopsis.focus();
  }

else if (actual === btnSinopsis && e.key === 'ArrowUp') {
  if (btnVerTrailer.style.display !== 'none') {
    btnVerTrailer.focus();
  } else {
    btnVerAhora.focus();
  }
}

  // Subir desde ver ahora/trailer hacia la X
  else if ((actual === btnVerAhora || actual === btnVerTrailer) && e.key === 'ArrowUp') {
    btnCerrar.focus();
  }

  // Bajar desde la X hacia ver ahora
  else if (actual === btnCerrar && e.key === 'ArrowDown') {
    btnVerAhora.focus();
  }

  // Enter ejecuta acción
  else if (e.key === 'Enter') {
    actual.click();
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
  if (!peliculaActiva?.videoUrl) return;

  const modalVideo = document.getElementById('modalVideo');
  const contenedorVideo = document.getElementById('contenedorVideo');
  const cerrarVideo = document.getElementById('cerrarVideo');

  contenedorVideo.innerHTML = '';

  const video = document.createElement('video');
  video.src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
  video.controls = true;
  video.autoplay = true;
  video.muted = false;
  video.play().catch(err => {
    console.warn('Autoplay con sonido bloqueado:', err);
    video.muted = true;
    video.play().catch(() => {});
  });

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

  // ========================
  // Ocultar "X" tras 5 segundos
  // ========================
  let temporizadorOcultar = null;

  function ocultarCerrarVideo() {
    cerrarVideo.style.opacity = '0';
    cerrarVideo.style.pointerEvents = 'none';
  }

  function mostrarCerrarVideo() {
    cerrarVideo.style.opacity = '1';
    cerrarVideo.style.pointerEvents = 'auto';

    clearTimeout(temporizadorOcultar);
    temporizadorOcultar = setTimeout(ocultarCerrarVideo, 5000);
  }

  // Mostrar primero, luego ocultar tras 5 seg
  mostrarCerrarVideo();

  document.addEventListener('mousemove', mostrarCerrarVideo);
  document.addEventListener('keydown', mostrarCerrarVideo);

  // Guardamos referencia para poder eliminar los listeners luego
  window.__videoMostrarCerrar__ = mostrarCerrarVideo;
}
});
