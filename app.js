// Declaración global de la variable para almacenar el reproductor de YouTube
let player = null;  

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

  // Resto del código...
});


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

// Función para cerrar el modal de película
function cerrarModal() {
  document.getElementById('modalPelicula').style.display = 'none';  // Cierra el modal principal
  if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();  // Vuelve al último elemento activo
}

// Función para abrir el modal de la película
function abrirModal(pelicula) {
  peliculaActiva = pelicula;
  const modal = document.getElementById('modalPelicula');
  ultimaTarjetaActiva = document.activeElement;

  // Configurar los detalles del modal
  document.getElementById('modalImagen').src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
  document.getElementById('modalTitulo').textContent = pelicula.titulo || 'Sin título';
  document.getElementById('modalDescripcion').textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';
  document.getElementById('modalExtraInfo').innerHTML = `
    <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
    <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
    <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>
  `;

  // Mostrar el botón "Ver trailer"
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

  // Configurar el cierre del modal principal
  document.getElementById('cerrarModal').onclick = cerrarModal;
  document.getElementById('btnVerAhora').onclick = verVideo;
  document.getElementById('btnMostrarSinopsis').onclick = mostrarSinopsis;

  const modalContenido = modal.querySelector('.modal-contenido');
  modalContenido.removeEventListener('keydown', manejarNavegacionModal);
  modalContenido.addEventListener('keydown', manejarNavegacionModal);
}

let player = null; // Declaración global para el reproductor de YouTube

// Función para abrir el modal de la película
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

  // Configurar el cierre del modal principal
  document.getElementById('cerrarModal').onclick = cerrarModal;
  document.getElementById('btnVerAhora').onclick = verVideo;
  document.getElementById('btnMostrarSinopsis').onclick = mostrarSinopsis;

  const modalContenido = modal.querySelector('.modal-contenido');
  modalContenido.removeEventListener('keydown', manejarNavegacionModal);
  modalContenido.addEventListener('keydown', manejarNavegacionModal);
}

// Función para cerrar el modal de película
function cerrarModal() {
  const modal = document.getElementById('modalPelicula');
  modal.style.display = 'none'; // Cierra el modal de la película
  if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus(); // Vuelve al último elemento activo
}

// Función para ver el trailer
function verTrailer() {
  if (!peliculaActiva || !peliculaActiva.trailerUrl) return;

  const modalVideo = document.getElementById('modalVideo');
  const contenedorVideo = document.getElementById('contenedorVideo');

  // Limpiar el contenedor de video
  contenedorVideo.innerHTML = '';

  let url = peliculaActiva.trailerUrl;

  // Si el trailer es de YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) {
      url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&fs=1&rel=0&showinfo=0&modestbranding=1&controls=0&enablejsapi=1`;
    }
  }

  // Crear iframe de YouTube
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.setAttribute('allowfullscreen', '');
  iframe.frameBorder = 0;
  contenedorVideo.appendChild(iframe);

  // Almacenar el iframe de YouTube en la variable `player`
  player = new YT.Player(iframe);

  // Ocultar el modal de película y mostrar el de video
  document.getElementById('modalPelicula').style.display = 'none';
  modalVideo.style.display = 'flex';

  // Cerrar el video cuando el usuario presione "Escape"
  document.addEventListener('keydown', function cerrarConEscape(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      detenerVideoYouTube();
      cerrarVideoFunc(modalVideo);
      document.removeEventListener('keydown', cerrarConEscape); // Eliminar el listener después de usarlo
    }
  });

  // Cerrar el video cuando el usuario presione la "X"
  const cerrarBoton = document.getElementById('cerrarVideo');
  cerrarBoton.addEventListener('click', function () {
    detenerVideoYouTube();
    cerrarVideoFunc(modalVideo);
  });
}

// Función para detener el video de YouTube
function detenerVideoYouTube() {
  if (player) {
    player.stopVideo();  // Usamos la API de YouTube para detener el video
    console.log('Video de YouTube detenido.');
  }
}

// Función para cerrar el modal de video y volver al de película
function cerrarVideoFunc(modalVideo) {
  const iframe = modalVideo.querySelector('iframe');
  if (iframe) {
    iframe.src = '';  // Detenemos el video de YouTube
  }
  modalVideo.style.display = 'none';
  document.getElementById('modalPelicula').style.display = 'flex';  // Asegura que el modal de película se muestre de nuevo
  if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
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
  if (!peliculaActiva || !peliculaActiva.videoUrl) return;

  const videoPlayer = document.getElementById('videoPlayer');
  const contenedorVideo = document.getElementById('contenedorVideo');
  const cerrarVideo = document.getElementById('cerrarVideo');

  // Limpia cualquier contenido previo en el contenedor
  contenedorVideo.innerHTML = '';

  // Crear un nuevo video nativo (MP4) y asignar su URL
  const video = document.createElement('video');
  video.controls = true;
  video.autoplay = true;
  const source = document.createElement('source');
  source.src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
  source.type = 'video/mp4';  // Asegúrate de que el tipo sea correcto
  video.appendChild(source);
  contenedorVideo.appendChild(video);

  // Mostrar el modal del video
  document.getElementById('modalPelicula').style.display = 'none';
  const modalVideo = document.getElementById('modalVideo');
  modalVideo.style.display = 'flex';

  // Mostrar el botón de cerrar
  cerrarVideo.style.display = 'block';

  let ocultarCerrar = setTimeout(() => cerrarVideo.style.display = 'none', 5000);
  cerrarVideo.onclick = () => cerrarVideoFunc(video, modalVideo, ocultarCerrar);

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
