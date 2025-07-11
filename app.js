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

  auth.onAuthStateChanged(user => {
    if (!user) window.location.href = 'index.html';
    else inicializar();
  });

  function inicializar() {
    configurarBusqueda();
    configurarOrden();
    configurarCuenta();
    configurarHeader();
    configurarAside();
    cargarPeliculas();
    actualizarFechas();
  }

  function configurarBusqueda() {
    buscador.addEventListener('input', () => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(buscador.value.toLowerCase()));
    });

    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowRight') ordenar.focus();
      if (e.key === 'ArrowUp') document.querySelector('header a')?.focus();
      sonidoClick.play().catch(() => {});
    });
  }

  function configurarOrden() {
    ordenar.addEventListener('change', () => ordenarPeliculas());

    ordenar.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') buscador.focus();
      if (e.key === 'ArrowRight') botonCuenta.focus();
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowUp') document.querySelector('header a.activo')?.focus();
      sonidoClick.play().catch(() => {});
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

    botonCuenta.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') ordenar.focus();
      if (e.key === 'ArrowUp') document.querySelector('header a:last-of-type')?.focus();
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      sonidoClick.play().catch(() => {});
    });
  }

  function configurarAside() {
    const items = document.querySelectorAll('aside li');
    items.forEach((li, i) => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') items[i + 1]?.focus();
        if (e.key === 'ArrowUp') items[i - 1]?.focus();
        if (e.key === 'ArrowRight') galeria.querySelector('.pelicula')?.focus();
        if (e.key === 'Enter') li.click();
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

  function actualizarFechas() {
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

  function ordenarPeliculas() {
    const criterio = ordenar.value;
    let filtradas = todasPeliculas.filter(p => p.titulo?.toLowerCase().includes(buscador.value.toLowerCase()));

    filtradas.sort((a, b) => {
      if (criterio === 'titulo') return a.titulo?.localeCompare(b.titulo);
      if (criterio === 'anio') return (b.anio || 0) - (a.anio || 0);
      if (criterio === 'añadido') return (b.fechaCreacion?.toDate?.() || 0) - (a.fechaCreacion?.toDate?.() || 0);
      return 0;
    });

    renderPeliculas(filtradas);
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
      : '<p>No hay películas disponibles.</p>';

    galeria.querySelectorAll('.pelicula').forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
    });
  }

  galeria.addEventListener('keydown', e => {
    const cards = Array.from(galeria.querySelectorAll('.pelicula'));
    const columnas = 4;
    const index = cards.indexOf(document.activeElement);
    if (index === -1) return;

    switch (e.key) {
      case 'ArrowRight': cards[index + 1]?.focus(); break;
      case 'ArrowLeft': (index % columnas === 0 ? document.querySelector('aside li.activo') : cards[index - 1])?.focus(); break;
      case 'ArrowDown': cards[index + columnas]?.focus() || botonCuenta.focus(); break;
      case 'ArrowUp': (index < columnas ? buscador : cards[index - columnas])?.focus(); break;
      case 'Enter': cards[index].click(); break;
    }

    sonidoClick.play().catch(() => {});
  });

  // Foco global si se pierde
  window.addEventListener('keydown', e => {
    if (document.activeElement === document.body) {
      galeria.querySelector('.pelicula')?.focus()
      || buscador.focus()
      || document.getElementById('navTodos')?.focus();
    }
  });

  window.filtrar = categoria => {
    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    document.getElementById(`nav${capitalize(categoria)}`)?.classList.add('activo');
    tituloCategoria.textContent = categoria.toUpperCase();

    const generos = ['accion', 'aventuras', 'animacion', 'comedia', 'suspense', 'cienciaficcion', 'terror', 'fantasia', 'romance', 'drama', 'artesmarciales'];
    const normaliza = g => g.replace('cienciaficcion', 'ciencia ficción').replace('artesmarciales', 'artes marciales');

    let filtro;
    if (categoria === 'favoritos') filtro = p => p.favoritos;
    else if (categoria.startsWith('estrenos')) filtro = p => String(p.anio) === categoria.replace('estrenos', '');
    else if (categoria === 'todos') filtro = () => true;
    else if (generos.includes(categoria)) filtro = p => [].concat(p.genero || []).map(g => g.toLowerCase()).includes(normaliza(categoria));
    else filtro = p => p.categoria === categoria;

    filtrarYPintar(filtro);
  };

  function filtrarYPintar(filtro) {
    renderPeliculas(todasPeliculas.filter(filtro));
  }

  function abrirModal(pelicula) {
    peliculaActiva = pelicula;
    const modal = document.getElementById('modalPelicula');
    document.getElementById('modalImagen').src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
    document.getElementById('modalTitulo').textContent = pelicula.titulo || 'Sin título';
    document.getElementById('modalDescripcion').textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción.';
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
    galeria.querySelector('.pelicula')?.focus();
  }

  function verVideo() {
    if (!peliculaActiva) return;
    const videoPlayer = document.getElementById('videoPlayer');
    const modalVideo = document.getElementById('modalVideo');
    const cerrarVideo = document.getElementById('cerrarVideo');

    videoPlayer.querySelector('source').src = peliculaActiva.videoUrl || 'https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4';
    videoPlayer.load();
    videoPlayer.play();
    document.getElementById('modalPelicula').style.display = 'none';
    modalVideo.style.display = 'flex';

    let timeout = setTimeout(() => cerrarVideo.style.display = 'none', 5000);
    cerrarVideo.onclick = () => cerrarVideoFunc(videoPlayer, modalVideo, timeout);

    window.addEventListener('keydown', e => {
      if (modalVideo.style.display === 'flex' && e.key === 'Escape') cerrarVideoFunc(videoPlayer, modalVideo, timeout);
    });

    setTimeout(() => document.querySelector('.video-contenido').focus(), 100);
  }

  function cerrarVideoFunc(player, modal, timeout) {
    clearTimeout(timeout);
    player.pause();
    player.currentTime = 0;
    modal.style.display = 'none';
    galeria.querySelector('.pelicula')?.focus();
  }

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
});
