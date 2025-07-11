/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const headerLinks = Array.from(document.querySelectorAll('header .nav-left a'));
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const asideItems = Array.from(document.querySelectorAll('aside li'));
  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenar = document.getElementById('ordenar');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');

  let todasPeliculas = [];
  let peliculaActiva = null;

  // --- Autenticación ---
  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializarPeliculas();
  });

  // --- Inicialización ---
  function inicializarPeliculas() {
    configurarBuscador();
    configurarOrdenado();
    configurarCuenta();
    configurarNavegacionFoco();
    actualizarPeliculasSinFecha();
    cargarPeliculas();
  }

  // --- Buscador ---
  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase()));
    });
  }

  // --- Ordenar ---
  function configurarOrdenado() {
    ordenar.addEventListener('change', () => {
      const criterio = ordenar.value;
      let filtradas = todasPeliculas.filter(p => p.titulo?.toLowerCase().includes(buscador.value.toLowerCase()));

      filtradas.sort((a, b) => {
        switch (criterio) {
          case 'titulo': return a.titulo?.localeCompare(b.titulo);
          case 'anio': return (b.anio || 0) - (a.anio || 0);
          case 'añadido':
            return (b.fechaCreacion?.toDate?.() || 0) - (a.fechaCreacion?.toDate?.() || 0);
          default: return 0;
        }
      });
      renderPeliculas(filtradas);
    });
  }

  // --- Cuenta usuario ---
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

  // --- Actualizar películas sin fecha ---
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

  // --- Cargar películas ---
  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
      establecerFocoInicial();
    });
  }

  // --- Renderizar películas ---
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

  // --- Establecer foco inicial ---
  function establecerFocoInicial() {
    setTimeout(() => headerLinks[0]?.focus(), 200);
  }

  // --- Abrir modal ---
  function abrirModal(pelicula) {
    peliculaActiva = pelicula;
    const modal = document.getElementById('modalPelicula');
    document.getElementById('modalImagen').src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
    document.getElementById('modalTitulo').textContent = pelicula.titulo || 'Sin título';
    document.getElementById('modalDescripcion').textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';
    document.getElementById('modalExtraInfo').innerHTML = `
      <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
      <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
      <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>
    `;

    modal.style.display = 'flex';
    setTimeout(() => document.querySelector('.modal-contenido').focus(), 100);

    document.getElementById('cerrarModal').onclick = cerrarModal;
    document.getElementById('btnVerAhora').onclick = verVideo;
  }

  // --- Cerrar modal ---
  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    // Volver foco a la película que estaba activa (o primera)
    const focusEnPelicula = galeria.querySelector('.pelicula[tabindex="0"]');
    if (focusEnPelicula) focusEnPelicula.focus();
  }

  // --- Ver video ---
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

    window.addEventListener('keydown', e => {
      if (modalVideo.style.display === 'flex' && e.key === 'Escape') {
        cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);
      }
    });

    setTimeout(() => document.querySelector('.video-contenido').focus(), 100);
  }

  function cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar) {
    clearTimeout(ocultarCerrar);
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    modalVideo.style.display = 'none';
    // Volver foco a la película activa si existe
    const focusEnPelicula = galeria.querySelector('.pelicula[tabindex="0"]');
    if (focusEnPelicula) focusEnPelicula.focus();
  }

  // --- FILTRAR Y PINTAR ---
  window.filtrar = categoria => {
    asideItems.forEach(li => li.classList.remove('activo'));
    const itemActivo = document.getElementById(`nav${capitalize(categoria)}`);
    if(itemActivo) itemActivo.classList.add('activo');
    tituloCategoria.textContent = categoria.toUpperCase();

    const generos = ['accion', 'aventuras', 'animacion', 'comedia', 'suspense', 'cienciaficcion', 'terror', 'fantasia', 'romance', 'drama', 'artesmarciales'];
    const normalizaGenero = g => g.replace('cienciaficcion', 'ciencia ficción').replace('artesmarciales', 'artes marciales');

    let filtro;
    if (categoria === 'favoritos') filtro = p => p.favoritos;
    else if (categoria.startsWith('estrenos')) filtro = p => String(p.anio) === categoria.replace('estrenos', '');
    else if (categoria === 'todos') filtro = () => true;
    else if (generos.includes(categoria)) filtro = p => [].concat(p.genero || []).map(g => g.toLowerCase()).includes(normalizaGenero(categoria));
    else filtro = p => p.categoria === categoria;

    filtrarYPintar(filtro);
  };

  function filtrarYPintar(filtro) {
    renderPeliculas(todasPeliculas.filter(filtro));
  }

  // --- CERRAR SESIÓN ---
  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');

  // --- FUNCIONES DE NAVEGACIÓN POR TECLADO ---
  function configurarNavegacionFoco() {
    // Foco inicial en header
    setTimeout(() => headerLinks[0]?.focus(), 200);

    // Navegación header
    headerLinks.forEach((link, i) => {
      link.setAttribute('tabindex', '0');
      link.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') headerLinks[i + 1]?.focus();
        if (e.key === 'ArrowLeft') headerLinks[i - 1]?.focus();
        if (e.key === 'ArrowDown') asideItems[0]?.focus();
      });
    });

    // Navegación botón cuenta
    botonCuenta.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') ordenar.focus();
      if (e.key === 'ArrowUp') {
        // foco en última película con foco o primera
        const lastFocus = galeria.querySelector('.pelicula:focus') || galeria.querySelector('.pelicula');
        lastFocus?.focus();
      }
    });

    // Navegación aside
    asideItems.forEach((item, i) => {
      item.setAttribute('tabindex', '0');
      item.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') asideItems[i + 1]?.focus();
        if (e.key === 'ArrowUp') {
          if (i === 0) headerLinks[0]?.focus();
          else asideItems[i - 1]?.focus();
        }
        if (e.key === 'ArrowRight') galeria.querySelector('.pelicula')?.focus();
        if (e.key === 'Enter') item.click();
      });
    });

    // Navegación galería
    galeria.addEventListener('keydown', e => {
      const cards = Array.from(galeria.querySelectorAll('.pelicula'));
      const index = cards.indexOf(document.activeElement);
      const columnas = 4;

      if (index === -1) return;

      switch (e.key) {
        case 'ArrowRight':
          if (cards[index + 1]) cards[index + 1].focus();
          else buscador.focus();
          break;
        case 'ArrowLeft':
          if (index === 0) asideItems.find(li => li.classList.contains('activo'))?.focus() || asideItems[0]?.focus();
          else cards[index - 1]?.focus();
          break;
        case 'ArrowDown':
          if (cards[index + columnas]) cards[index + columnas].focus();
          else buscador.focus();
          break;
        case 'ArrowUp':
          if (cards[index - columnas]) cards[index - columnas].focus();
          else asideItems[0]?.focus();
          break;
        case 'Enter':
          cards[index].click();
          break;
      }
    });

    // Navegación buscador
    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') ordenar.focus();
      if (e.key === 'ArrowLeft') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowDown') ordenar.focus();
      if (e.key === 'ArrowUp') galeria.querySelector('.pelicula')?.focus();
    });

    // Navegación ordenar select
    ordenar.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') buscador.focus();
      if (e.key === 'ArrowRight') botonCuenta.focus();
      if (e.key === 'ArrowUp') galeria.querySelector('.pelicula')?.focus();
    });
  }
});
