/* global auth, db, firebase */
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
  let filtroActual = () => true;

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializarPeliculas();
  });

  function inicializarPeliculas() {
    configurarBuscador();
    configurarCuenta();
    configurarNavegacion();
    actualizarPeliculasSinFecha();
    cargarPeliculas();
  }

  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtroActual = p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase());
      renderPeliculas(todasPeliculas.filter(filtroActual));
    });
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

  function configurarNavegacion() {
    const asideItems = Array.from(document.querySelectorAll('aside li'));
    const navLinks = Array.from(document.querySelectorAll('header .nav-left a'));
    const peliculas = () => Array.from(document.querySelectorAll('.pelicula'));

    asideItems.forEach((li, idx) => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter') li.click();
        else if (e.key === 'ArrowDown') asideItems[idx + 1]?.focus() || peliculas()[0]?.focus();
        else if (e.key === 'ArrowUp') asideItems[idx - 1]?.focus() || navLinks[0]?.focus();
        else if (e.key === 'ArrowRight') peliculas()[0]?.focus();
        if (e.key.startsWith('Arrow')) sonidoClick.play().catch(() => {});
      });
    });

    navLinks.forEach((link, i) => {
      link.setAttribute('tabindex', '0');
      link.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') navLinks[i + 1]?.focus() || botonCuenta.focus();
        else if (e.key === 'ArrowLeft') navLinks[i - 1]?.focus();
        else if (e.key === 'ArrowDown') asideItems[0]?.focus();
        sonidoClick.play().catch(() => {});
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
        case 'ArrowRight': cards[i + 1]?.focus(); break;
        case 'ArrowLeft': i % columnas === 0 ? (document.querySelector('aside li.activo') || asideItems[0])?.focus() : cards[i - 1]?.focus(); break;
        case 'ArrowDown': cards[i + columnas]?.focus(); break;
        case 'ArrowUp': i < columnas ? buscador.focus() : cards[i - columnas]?.focus(); break;
        case 'Enter': cards[i].click(); break;
      }

      if (e.key.startsWith('Arrow')) sonidoClick.play().catch(() => {});
    });

    buscador.setAttribute('tabindex', '0');
    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') peliculas()[0]?.focus();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ordenar.focus();
      sonidoClick.play().catch(() => {});
    });

    ordenar.setAttribute('tabindex', '0');
    ordenar.addEventListener('keydown', e => {
      const cards = peliculas();
      switch (e.key) {
        case 'Enter': aplicarOrden(); break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'ArrowUp': buscador.focus(); break;
        case 'ArrowDown': cards[0]?.focus(); break;
      }
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        sonidoClick.play().catch(() => {});
      }
    });

    ordenar.addEventListener('change', () => {
      aplicarOrden();
      setTimeout(() => peliculas()[0]?.focus(), 100);
    });
  }

  function aplicarOrden() {
    const criterio = ordenar.value;
    let filtradas = todasPeliculas.filter(filtroActual);
    filtradas.sort((a, b) => {
      switch (criterio) {
        case 'titulo': return a.titulo?.localeCompare(b.titulo);
        case 'anio': return (b.anio || 0) - (a.anio || 0);
        case 'añadido':
        default: return (b.fechaCreacion?.toDate?.() || 0) - (a.fechaCreacion?.toDate?.() || 0);
      }
    });
    renderPeliculas(filtradas);
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

  function cerrarModal() {
    document.getElementById('modalPelicula').style.display = 'none';
    galeria.querySelector('.pelicula:focus')?.focus();
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

    window.addEventListener('keydown', e => {
      if (modalVideo.style.display === 'flex' && e.key === 'Escape') cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar);
    });

    setTimeout(() => document.querySelector('.video-contenido').focus(), 100);
  }

  function cerrarVideoFunc(videoPlayer, modalVideo, ocultarCerrar) {
    clearTimeout(ocultarCerrar);
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    modalVideo.style.display = 'none';
    galeria.querySelector('.pelicula:focus')?.focus();
  }

  window.filtrar = categoria => {
    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    document.getElementById(`nav${capitalize(categoria)}`)?.classList.add('activo');
    tituloCategoria.textContent = categoria.toUpperCase();

    const generos = ['accion', 'aventuras', 'animacion', 'comedia', 'suspense', 'cienciaficcion', 'terror', 'fantasia', 'romance', 'drama', 'artesmarciales'];
    const normalizaGenero = g => g.replace('cienciaficcion', 'ciencia ficción').replace('artesmarciales', 'artes marciales');

    if (categoria === 'favoritos') filtroActual = p => p.favoritos;
    else if (categoria.startsWith('estrenos')) filtroActual = p => String(p.anio) === categoria.replace('estrenos', '');
    else if (categoria === 'todos') filtroActual = () => true;
    else if (generos.includes(categoria)) filtroActual = p => [].concat(p.genero || []).map(g => g.toLowerCase()).includes(normalizaGenero(categoria));
    else filtroActual = p => p.categoria === categoria;

    renderPeliculas(todasPeliculas.filter(filtroActual));
  };

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
