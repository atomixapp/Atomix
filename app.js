/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const auth = window.auth;
  const db = window.db;

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      inicializarPeliculas();
    }
  });

  function inicializarPeliculas() {
    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscadorPeliculas');
    const ordenar = document.getElementById('ordenar');
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const tituloCategoria = document.getElementById('tituloCategoria');
    const aside = document.querySelector('aside');

    let todasPeliculas = [];

    // Audio click
    const sonidoClick = new Audio('assets/sounds/click.mp3');

    buscador.addEventListener('input', (e) => {
      const texto = e.target.value.toLowerCase();
      const filtradas = todasPeliculas.filter(p =>
        p.titulo && p.titulo.toLowerCase().includes(texto)
      );
      renderPeliculas(filtradas);
    });

    // Modal elementos
    const modal = document.getElementById('modalPelicula');
    const modalImagen = document.getElementById('modalImagen');
    const modalTitulo = document.getElementById('modalTitulo');
    const modalDescripcion = document.getElementById('modalDescripcion');
    const cerrarModal = document.getElementById('cerrarModal');
    const btnVerAhora = document.getElementById('btnVerAhora');
    const modalExtraInfo = document.getElementById('modalExtraInfo');

    let ocultarCerrarTimeout;
    let peliculaActiva;

    function abrirModal(pelicula) {
      peliculaActiva = pelicula;

      modalImagen.src = pelicula.imagen_detalles || pelicula.imagen || 'img/placeholder.png';
      modalTitulo.textContent = pelicula.titulo || 'Sin título';
      modalDescripcion.textContent = pelicula.sinopsis || pelicula.descripcion || 'Sin descripción disponible.';

      modalExtraInfo.innerHTML = `
        <p><strong>Género:</strong> ${pelicula.genero || 'No disponible'}</p>
        <p><strong>Año:</strong> ${pelicula.anio || 'Desconocido'}</p>
        <p><strong>Puntuación:</strong> ${pelicula.puntuacion || 'N/A'}</p>
      `;

      modal.style.display = 'flex';

      setTimeout(() => {
        document.querySelector('.modal-contenido').focus();
      }, 100);

      const btnMostrarSinopsis = document.getElementById('btnMostrarSinopsis');
      const overlaySinopsis = document.getElementById('overlaySinopsis');
      const cerrarSinopsis = document.getElementById('cerrarSinopsis');

      if (btnMostrarSinopsis && overlaySinopsis && cerrarSinopsis) {
        btnMostrarSinopsis.addEventListener('click', () => {
          overlaySinopsis.style.display = 'flex';
          setTimeout(() => {
            document.querySelector('.sinopsis-contenido').focus();
          }, 100);
        });

        cerrarSinopsis.addEventListener('click', () => {
          overlaySinopsis.style.display = 'none';
        });
      }
    }

    function cerrarModalFunc() {
      modal.style.display = 'none';
      document.activeElement.blur();
      galeria.querySelector('.pelicula:focus')?.focus();
    }

    cerrarModal.addEventListener('click', cerrarModalFunc);
    window.addEventListener('keydown', (e) => {
      if (modal.style.display === 'flex' && e.key === 'Escape') {
        cerrarModalFunc();
      }
    });

    galeria.addEventListener('keydown', (e) => {
      const peliculas = Array.from(galeria.querySelectorAll('.pelicula'));
      const focusedCard = document.activeElement;
      const index = peliculas.indexOf(focusedCard);
      const columnas = 4;

      if (index === -1) return;

      switch (e.key) {
        case 'ArrowRight':
          if (index % columnas !== columnas - 1 && index < peliculas.length - 1) {
            peliculas[index + 1]?.focus();
            sonidoClick.play().catch(() => {});
          }
          break;
        case 'ArrowLeft':
          if (index % columnas !== 0) {
            peliculas[index - 1]?.focus();
            sonidoClick.play().catch(() => {});
          } else {
            document.querySelector('aside li.activo')?.focus();
            sonidoClick.play().catch(() => {});
          }
          break;
        case 'ArrowDown':
          if (index + columnas < peliculas.length) {
            peliculas[index + columnas]?.focus();
            sonidoClick.play().catch(() => {});
          }
          break;
        case 'ArrowUp':
          if (index - columnas >= 0) {
            peliculas[index - columnas]?.focus();
            sonidoClick.play().catch(() => {});
          }
          break;
        case 'Enter':
          focusedCard.click?.();
          break;
      }
    });
    
    const modalVideo = document.getElementById('modalVideo');
    const videoPlayer = document.getElementById('videoPlayer');
    const cerrarVideo = document.getElementById('cerrarVideo');

    btnVerAhora.addEventListener('click', () => {
      if (!peliculaActiva) return;

      const videoUrl = peliculaActiva.videoUrl || "https://ia601607.us.archive.org/17/items/Emdmb/Emdmb.ia.mp4";
      videoPlayer.querySelector('source').src = videoUrl;
      videoPlayer.muted = false;
      videoPlayer.volume = 1;
      videoPlayer.load();
      videoPlayer.play();

      modal.style.display = 'none';
      modalVideo.style.display = 'flex';

      cerrarVideo.style.display = 'block';
      clearTimeout(ocultarCerrarTimeout);
      ocultarCerrarTimeout = setTimeout(() => {
        cerrarVideo.style.display = 'none';
      }, 5000);

      setTimeout(() => {
        document.querySelector('.video-contenido').focus();
      }, 100);
    });

    cerrarVideo.addEventListener('click', cerrarVideoFunc);

    function cerrarVideoFunc() {
      modalVideo.style.display = 'none';
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
      galeria.querySelector('.pelicula:focus')?.focus();
    }

    window.addEventListener('keydown', (e) => {
      if (modalVideo.style.display === 'flex') {
        if (e.key === 'Escape') {
          if (cerrarVideo.style.display === 'none') {
            cerrarVideo.style.display = 'block';
            clearTimeout(ocultarCerrarTimeout);
            ocultarCerrarTimeout = setTimeout(() => {
              cerrarVideo.style.display = 'none';
            }, 5000);
          } else {
            cerrarVideoFunc();
          }
        }
      }

      if (modal.style.display === 'flex' && e.key === 'Escape') {
        cerrarModalFunc();
      }
    });

ordenar.addEventListener('change', () => {
  const texto = buscador.value.toLowerCase();
  let filtradas = todasPeliculas.filter(p =>
    p.titulo && p.titulo.toLowerCase().includes(texto)
  );

  const criterio = ordenar.value;

switch (criterio) {
  case 'titulo':
    filtradas.sort((a, b) => a.titulo?.localeCompare(b.titulo));
    break;
  case 'anio':
    filtradas.sort((a, b) => (b.anio || 0) - (a.anio || 0));
    break;
  case 'añadido':
    filtradas.sort((a, b) => {
      const fechaA = a.fechaCreacion?.toDate?.() || new Date(0);
      const fechaB = b.fechaCreacion?.toDate?.() || new Date(0);
      return fechaB - fechaA;
    });
    break;
}

  renderPeliculas(filtradas);
});

    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });

    function renderPeliculas(lista) {
      galeria.innerHTML = '';

      if (lista.length === 0) {
        galeria.innerHTML = '<p>No hay películas para mostrar.</p>';
        return;
      }

      lista.forEach(pelicula => {
        const card = document.createElement('div');
        card.className = 'pelicula';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <div class="imagen-contenedor">
            <img src="${pelicula.imagen || 'img/placeholder.png'}" alt="${pelicula.titulo}">
          </div>
          <h3>${pelicula.titulo}</h3>
        `;
        card.addEventListener('click', () => {
          abrirModal(pelicula);
        });
        galeria.appendChild(card);
      });
    }

function actualizarPeliculasSinFecha() {
  db.collection("peliculas").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.fechaCreacion) {
        db.collection("peliculas").doc(doc.id).update({
          fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          console.log(`✅ Actualizada: ${doc.id}`);
        }).catch(err => console.error("❌ Error al actualizar:", err));
      }
    });
  });
}

actualizarPeliculasSinFecha();
cargarPeliculas();
    
function cargarPeliculas() {
  db.collection('peliculas')
    .orderBy('fechaCreacion', 'desc')
    .get()
    .then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderPeliculas(todasPeliculas);
    })
    .catch(error => {
      console.error("Error al obtener las películas:", error);
    });
}

    cargarPeliculas();

// Foco inicial en el aside y en el primer ítem de la lista
const aside = document.querySelector('aside');
const navTodos = document.getElementById('navTodos');

if (aside && navTodos) {
  // Establece primero el foco visual al contenedor
  aside.setAttribute('tabindex', '-1'); // Asegura que sea enfocable
  aside.focus();

  // Luego enfoca el primer ítem usable del menú
  setTimeout(() => {
    navTodos.focus();
  }, 150);
}
    
window.filtrar = function (categoria) {
  document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
  const currentLi = document.querySelector(`#nav${capitalizeId(categoria)}`);
  if (currentLi) currentLi.classList.add('activo');

  tituloCategoria.textContent = categoria.toUpperCase();

  const esGenero = [
    'accion', 'aventuras', 'animacion', 'comedia', 'suspense',
    'cienciaficcion', 'terror', 'fantasia', 'romance', 'drama', 'artesmarciales'
  ];

  const matchGenero = (pelicula, generoClave) => {
    if (!pelicula.genero) return false;
    const generoNormalizado = generoClave
      .replace('cienciaficcion', 'ciencia ficción')
      .replace('artesmarciales', 'artes marciales');

    if (Array.isArray(pelicula.genero)) {
      return pelicula.genero.some(g => g.toLowerCase() === generoNormalizado);
    } else {
      return pelicula.genero.toLowerCase() === generoNormalizado;
    }
  };

  switch (categoria) {
    case 'favoritos':
      renderPeliculas(todasPeliculas.filter(p => p.favoritos));
      break;
    case 'estrenos2025':
      renderPeliculas(todasPeliculas.filter(p => String(p.anio) === '2025'));
      break;
    case 'estrenos2024':
      renderPeliculas(todasPeliculas.filter(p => String(p.anio) === '2024'));
      break;
    case 'todos':
      renderPeliculas(todasPeliculas);
      break;
    default:
      if (esGenero.includes(categoria)) {
        renderPeliculas(todasPeliculas.filter(p => matchGenero(p, categoria)));
      } else {
        renderPeliculas(todasPeliculas.filter(p => p.categoria === categoria));
      }
  }
};

function capitalizeId(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

    window.cerrarSesion = function () {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    };

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Navegación lateral con flechas y sonido
    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();

        if (e.key === 'ArrowDown') {
          li.nextElementSibling?.focus();
          sonidoClick.play().catch(() => {});
        }

        if (e.key === 'ArrowUp') {
          li.previousElementSibling?.focus();
          sonidoClick.play().catch(() => {});
        }

        if (e.key === 'ArrowRight') {
          setTimeout(() => {
            galeria.querySelector('.pelicula')?.focus();
            sonidoClick.play().catch(() => {});
          }, 0);
        }
      });
    });
  }
});
