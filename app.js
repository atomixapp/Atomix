document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenar = document.getElementById('ordenar');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');

  let todasPeliculas = [];
  let peliculaActiva = null;

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializar();
  });

  function inicializar() {
    configurarBuscador();
    configurarOrden();
    configurarCuenta();
    configurarNavegacionAside();
    configurarNavegacionHeader();
    cargarPeliculas();
  }

  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase()));
    });

    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') ordenar.focus();
      else if (e.key === 'ArrowLeft') document.querySelector('aside li.activo')?.focus();
      else if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      sonidoClick.play().catch(() => {});
    });
  }

  function configurarOrden() {
    ordenar.addEventListener('change', ordenarPeliculas);
    ordenar.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') buscador.focus();
      else if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      sonidoClick.play().catch(() => {});
    });
  }

  function ordenarPeliculas() {
    const criterio = ordenar.value;
    let filtradas = todasPeliculas.filter(p => p.titulo?.toLowerCase().includes(buscador.value.toLowerCase()));
    filtradas.sort((a, b) => {
      if (criterio === 'titulo') return a.titulo.localeCompare(b.titulo);
      if (criterio === 'anio') return (b.anio || 0) - (a.anio || 0);
      return (b.fechaCreacion?.toDate?.() || 0) - (a.fechaCreacion?.toDate?.() || 0);
    });
    renderPeliculas(filtradas);
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

    botonCuenta.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') document.querySelector('header .nav-left a.activo')?.focus();
      else if (e.key === 'ArrowDown') buscador.focus();
      sonidoClick.play().catch(() => {});
    });
  }

  function configurarNavegacionHeader() {
    const headerLinks = document.querySelectorAll('header .nav-left a');
    headerLinks.forEach((link, i) => {
      link.setAttribute('tabindex', '0');
      link.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') {
          if (i < headerLinks.length - 1) headerLinks[i + 1].focus();
          else botonCuenta.focus();
        } else if (e.key === 'ArrowDown') buscador.focus();
        sonidoClick.play().catch(() => {});
      });
    });
  }

  function configurarNavegacionAside() {
    const items = document.querySelectorAll('aside li');
    items.forEach((li, i) => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') items[i + 1]?.focus();
        else if (e.key === 'ArrowUp') items[i - 1]?.focus();
        else if (e.key === 'ArrowRight') buscador.focus();
        else if (e.key === 'Enter') li.click();
        sonidoClick.play().catch(() => {});
      });
    });
  }

  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
      setTimeout(() => document.getElementById('navTodos')?.focus(), 300);
    });
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

    const peliculas = Array.from(galeria.querySelectorAll('.pelicula'));
    const columnas = Math.floor(galeria.offsetWidth / 180);

    peliculas.forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
      card.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') peliculas[i + 1]?.focus();
        else if (e.key === 'ArrowLeft') peliculas[i - 1]?.focus() || ordenar.focus();
        else if (e.key === 'ArrowDown') peliculas[i + columnas]?.focus() || botonCuenta.focus();
        else if (e.key === 'ArrowUp') peliculas[i - columnas]?.focus() || buscador.focus();
        else if (e.key === 'Enter') card.click();
        sonidoClick.play().catch(() => {});
      });
    });
  }

  function abrirModal(pelicula) {
    peliculaActiva = pelicula;
    const modal = document.getElementById('modalPelicula');
    document.getElementById('modalImagen').src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
    document.getElementById('modalTitulo').textContent = pelicula.titulo || 'Sin título';
    document.getElementById('modalDescripcion').textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';
    document.getElementById('modalExtraInfo').innerHTML = `
      <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
      <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
      <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>`;

    modal.style.display = 'flex';
    setTimeout(() => document.querySelector('.modal-contenido')?.focus(), 100);
    document.getElementById('cerrarModal').onclick = cerrarModal;
    document.getElementById('btnVerAhora').onclick = verVideo;
  }

  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    galeria.querySelector('.pelicula:focus')?.focus();
  }

  function verVideo() {
    if (!peliculaActiva) return;

    const videoPlayer = document.getElementById('videoPlayer');
    const cerrarVideo = document.getElementById('cerrarVideo');
    const modalVideo = document.getElementById('modalVideo');

    videoPlayer.querySelector('source').src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
    videoPlayer.load();
    videoPlayer.play();

    document.getElementById('modalPelicula').style.display = 'none';
    modalVideo.style.display = 'flex';
    cerrarVideo.style.display = 'block';

    let ocultarCerrar = setTimeout(() => cerrarVideo.style.display = 'none', 5000);

    cerrarVideo.onclick = () => cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);

    window.addEventListener('keydown', e => {
      if (modalVideo.style.display === 'flex' && e.key === 'Escape') {
        cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);
      }
    });

    setTimeout(() => document.querySelector('.video-contenido')?.focus(), 100);
  }

  function cerrarVideoFunc(player, modal, timeout) {
    clearTimeout(timeout);
    player.pause();
    player.currentTime = 0;
    modal.style.display = 'none';
    galeria.querySelector('.pelicula:focus')?.focus();
  }

  window.filtrar = categoria => {
    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    document.getElementById(`nav${capitalize(categoria)}`)?.classList.add('activo');
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

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
