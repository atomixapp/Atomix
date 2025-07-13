document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');
  
  let peliculaActiva = null;
  let ultimaTarjetaActiva = null;

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializarPeliculas();
  });

  function inicializarPeliculas() {
    cargarPeliculas();
    configurarNavegacion();
  }

  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      const todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
    });
  }

  function renderPeliculas(lista) {
    galeria.innerHTML = lista.map(p => `
      <div class="pelicula" tabindex="0">
        <div class="imagen-contenedor">
          <img src="${p.imagen || 'img/placeholder.png'}" alt="${p.titulo}">
        </div>
        <h3>${p.titulo}</h3>
      </div>
    `).join('');
    galeria.querySelectorAll('.pelicula').forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
    });
  }

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
    setTimeout(() => document.getElementById('btnVerAhora')?.focus(), 100);

    document.getElementById('cerrarModal').onclick = cerrarModal;
    document.getElementById('btnVerAhora').onclick = verVideo;
  }

  // Función para ver el trailer
  function verTrailer() {
    if (!peliculaActiva || !peliculaActiva.trailerUrl) return;

    const modalVideo = document.getElementById('modalVideo');
    const contenedorVideo = document.getElementById('contenedorVideo');

    // Limpiar el contenedor de video
    contenedorVideo.innerHTML = '';

    let url = peliculaActiva.trailerUrl;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&fs=1&rel=0&showinfo=0&modestbranding=1&controls=0`;
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

    // Ocultar el modal de película y mostrar el de video
    document.getElementById('modalPelicula').style.display = 'none';
    modalVideo.style.display = 'flex';

    // Cerrar el video cuando el usuario presione "Escape"
    modalVideo.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        iframe.src = '';  // Detener el video
        cerrarVideoFunc(modalVideo);
      }
    });
  }

  // Función para cerrar el modal de video
  function cerrarVideoFunc(modalVideo) {
    modalVideo.style.display = 'none';
    document.getElementById('modalPelicula').style.display = 'flex';
    if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
  }

  // Función para cerrar el modal de la película
  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    if (ultimaTarjetaActiva) ultimaTarjetaActiva.focus();
  }

  // Agregar un evento global para detectar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalPelicula = document.getElementById('modalPelicula');
      const modalVideo = document.getElementById('modalVideo');

      // Cerrar los modales cuando presionamos Escape
      if (modalVideo.style.display === 'flex') {
        cerrarVideoFunc(modalVideo);
      } else if (modalPelicula.style.display === 'flex') {
        cerrarModal();
      }
    }
  });
});
