/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenarCustom = document.getElementById('ordenarCustom');
  const ordenActual = document.getElementById('ordenActual');
  const opcionesOrden = document.getElementById('opcionesOrden');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const sonidoClick = new Audio('assets/sounds/click.mp3');

  let todasPeliculas = [];
  let peliculaActiva = null;
  let indiceSeleccionado = 0;
  let desplegado = false;

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializarPeliculas();
  });

  function inicializarPeliculas() {
    configurarBuscador();
    configurarOrdenPersonalizado();
    configurarCuenta();
    configurarNavegacion();
    actualizarPeliculasSinFecha();
    cargarPeliculas();
  }

  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase()));
    });
  }

  function configurarOrdenPersonalizado() {
    const opciones = Array.from(opcionesOrden.querySelectorAll('li'));
    ordenarCustom.setAttribute('tabindex', '0');

    ordenarCustom.addEventListener('keydown', e => {
      if (!desplegado && e.key === 'Enter') {
        opcionesOrden.classList.remove('oculto');
        opciones[indiceSeleccionado].classList.add('activo');
        desplegado = true;
      } else if (desplegado && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        opciones[indiceSeleccionado].classList.remove('activo');
        indiceSeleccionado = (e.key === 'ArrowDown')
          ? (indiceSeleccionado + 1) % opciones.length
          : (indiceSeleccionado - 1 + opciones.length) % opciones.length;
        opciones[indiceSeleccionado].classList.add('activo');
      } else if (desplegado && e.key === 'Enter') {
        const valor = opciones[indiceSeleccionado].dataset.valor;
        ordenActual.textContent = opciones[indiceSeleccionado].textContent;
        opcionesOrden.classList.add('oculto');
        desplegado = false;
        aplicarOrden(valor);
        setTimeout(() => document.querySelector('.pelicula')?.focus(), 100);
      } else if (!desplegado && e.key === 'ArrowDown') {
        document.querySelector('.pelicula')?.focus();
      } else if (!desplegado && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        buscador.focus();
      }

      if (e.key.startsWith('Arrow') || e.key === 'Enter') {
        e.preventDefault();
        sonidoClick.play().catch(() => {});
      }
    });
  }

  function aplicarOrden(valor) {
    const criterio = valor || document.querySelector('.ordenar-custom .activo').dataset.valor;
    let filtradas = todasPeliculas.filter(filtroActual);

    filtradas.sort((a, b) => {
      switch (criterio) {
        case 'titulo': return a.titulo?.localeCompare(b.titulo);
        case 'anio': return (b.anio || 0) - (a.anio || 0);
        default: return (b.fechaCreacion?.toDate?.() || 0) - (a.fechaCreacion?.toDate?.() || 0);
      }
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
  }

  let filtroActual = () => true;

  function filtrarYPintar(filtro) {
    filtroActual = filtro;
    renderPeliculas(todasPeliculas.filter(filtro));
  }

  function cargarPeliculas() {
    db.collection('peliculas').orderBy('fechaCreacion', 'desc').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
      establecerFocoInicial();
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
        </div>`).join('')
      : '<p>No hay películas para mostrar.</p>';

    galeria.querySelectorAll('.pelicula').forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
    });
  }

  function configurarNavegacion() {
    buscador.setAttribute('tabindex', '0');
    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') {
        document.querySelector('.pelicula')?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        ordenarCustom.focus();
      }
      sonidoClick.play().catch(() => {});
    });
  }

  function establecerFocoInicial() {
    setTimeout(() => {
      const navLinks = document.querySelectorAll('header .nav-left a');
      const focoInicial = Array.from(navLinks).find(a => a.classList.contains('activo')) || navLinks[0];
      focoInicial?.focus();
    }, 300);
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

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
