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
    else inicializarPeliculas();
  });

  function inicializarPeliculas() {
    configurarBuscador();
    configurarOrdenado();
    configurarCuenta();
    configurarNavegacionLateral();
    configurarHeader();
    actualizarPeliculasSinFecha();
    cargarPeliculas();
  }

  function configurarBuscador() {
    buscador.addEventListener('input', e => {
      filtrarYPintar(p => p.titulo?.toLowerCase().includes(e.target.value.toLowerCase()));
    });

    buscador.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowUp') document.querySelector('aside li.activo')?.focus();
      if (e.key === 'ArrowRight') ordenar.focus();
    });
  }

  function configurarOrdenado() {
    ordenar.addEventListener('change', () => {
      const criterio = ordenar.value;
      let filtradas = todasPeliculas.filter(p =>
        p.titulo?.toLowerCase().includes(buscador.value.toLowerCase())
      );

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

    ordenar.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') buscador.focus();
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowUp') document.querySelector('aside li.activo')?.focus();
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

  function configurarNavegacionLateral() {
    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter') li.click();
        if (e.key === 'ArrowDown') li.nextElementSibling?.focus();
        if (e.key === 'ArrowUp') li.previousElementSibling?.focus();
        if (e.key === 'ArrowRight') buscador.focus();
        sonidoClick.play().catch(() => {});
      });
    });
  }

  function configurarHeader() {
    const headerLinks = document.querySelectorAll('header .nav-left a');
    headerLinks.forEach((link, i) => {
      link.setAttribute('tabindex', '0');
      link.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') {
          if (headerLinks[i + 1]) headerLinks[i + 1].focus();
          else buscador.focus();
        }
        if (e.key === 'ArrowLeft') headerLinks[i - 1]?.focus();
        if (e.key === 'ArrowDown') buscador.focus();
        if (e.key === 'ArrowUp') document.querySelector('aside li.activo')?.focus();
        if (e.key === 'Enter') link.click();
        sonidoClick.play().catch(() => {});
      });
    });

    botonCuenta.setAttribute('tabindex', '0');
    botonCuenta.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') headerLinks[headerLinks.length - 1]?.focus();
      if (e.key === 'ArrowDown') galeria.querySelector('.pelicula')?.focus();
      if (e.key === 'ArrowUp') document.querySelector('aside li.activo')?.focus();
      sonidoClick.play().catch(() => {});
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
    setTimeout(() => document.getElementById('navTodos')?.focus(), 300);
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

  galeria.addEventListener('keydown', e => {
    const peliculas = Array.from(galeria.querySelectorAll('.pelicula'));
    const columnas = 4;
    const i = peliculas.indexOf(document.activeElement);
    if (i === -1) return;

    switch (e.key) {
      case 'ArrowRight': (peliculas[i + 1] || ordenar).focus(); break;
      case 'ArrowLeft': (peliculas[i - 1] || buscador).focus(); break;
      case 'ArrowDown': (peliculas[i + columnas] || botonCuenta).focus(); break;
      case 'ArrowUp': (peliculas[i - columnas] || buscador).focus(); break;
      case 'Enter': peliculas[i].click(); break;
    }

    sonidoClick.play().catch(() => {});
  });

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

  // Evita que se pierda el foco
  window.addEventListener('keydown', e => {
    if (document.activeElement === document.body) {
      galeria.querySelector('.pelicula')?.focus()
      || buscador.focus()
      || document.getElementById('navTodos')?.focus();
    }
  });
});
