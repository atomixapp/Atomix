document.addEventListener('DOMContentLoaded', () => {
  const galeria = document.getElementById('galeria');
  const asideItems = [...document.querySelectorAll('aside li')];
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenar = document.getElementById('ordenar');
  const botonCuenta = document.getElementById('botonCuenta');
  const enlacesHeader = [...document.querySelectorAll('header .nav-left a')];
  const sonidoClick = new Audio('assets/sounds/click.mp3');

  // Foco inicial
  setTimeout(() => document.getElementById('navTodos')?.focus(), 300);

  // Función global para reproducción de sonido
  function sonarClick() {
    sonidoClick.play().catch(() => {});
  }

  // Navegación en aside (categorías)
  asideItems.forEach((li, i) => {
    li.setAttribute('tabindex', '0');
    li.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowDown':
          asideItems[i + 1]?.focus();
          break;
        case 'ArrowUp':
          asideItems[i - 1]?.focus();
          break;
        case 'ArrowRight':
          galeria.querySelector('.pelicula')?.focus();
          break;
        case 'Enter':
          li.click();
          break;
      }
      sonarClick();
    });
  });

  // Navegación en galería de películas
  galeria.addEventListener('keydown', e => {
    const cards = [...galeria.querySelectorAll('.pelicula')];
    const columnas = 4;
    const index = cards.indexOf(document.activeElement);
    if (index === -1) return;

    switch (e.key) {
      case 'ArrowRight':
        (cards[index + 1] || cards[index])?.focus();
        break;
      case 'ArrowLeft':
        if (index % columnas === 0) {
          document.querySelector('aside li.activo')?.focus() || asideItems[0]?.focus();
        } else {
          cards[index - 1]?.focus();
        }
        break;
      case 'ArrowDown':
        cards[index + columnas]?.focus() || botonCuenta?.focus();
        break;
      case 'ArrowUp':
        if (index < columnas) buscador.focus();
        else cards[index - columnas]?.focus();
        break;
      case 'Enter':
        document.activeElement.click();
        break;
    }
    sonarClick();
  });

  // Header: navegación lateral y hacia abajo
  enlacesHeader.forEach((a, i) => {
    a.setAttribute('tabindex', '0');
    a.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowRight': enlacesHeader[i + 1]?.focus(); break;
        case 'ArrowLeft': enlacesHeader[i - 1]?.focus(); break;
        case 'ArrowDown': buscador.focus(); break;
      }
      sonarClick();
    });
  });

  // Cuenta
  botonCuenta.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowLeft': ordenar.focus(); break;
      case 'ArrowUp': enlacesHeader[enlacesHeader.length - 1]?.focus(); break;
      case 'ArrowDown': galeria.querySelector('.pelicula')?.focus(); break;
    }
    sonarClick();
  });

  // Buscador
  buscador.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowRight': ordenar.focus(); break;
      case 'ArrowUp': enlacesHeader[0]?.focus(); break;
      case 'ArrowDown': galeria.querySelector('.pelicula')?.focus(); break;
    }
    sonarClick();
  });

  // Ordenar select
  ordenar.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowLeft': buscador.focus(); break;
      case 'ArrowRight': botonCuenta.focus(); break;
      case 'ArrowUp': enlacesHeader[1]?.focus(); break;
      case 'ArrowDown': galeria.querySelector('.pelicula')?.focus(); break;
    }
    sonarClick();
  });

  // Reasigna foco si se pierde
  window.addEventListener('keydown', e => {
    const foco = document.activeElement;
    if (!foco || foco === document.body) {
      document.querySelector('.pelicula:focus')?.focus()
        || galeria.querySelector('.pelicula')?.focus()
        || buscador.focus()
        || document.getElementById('navTodos')?.focus();
    }
  });

  // Aplicar tabindex y eventos tras renderizado
  window.renderPeliculas = function(lista) {
    galeria.innerHTML = lista.map(p => `
      <div class="pelicula" tabindex="0">
        <div class="imagen-contenedor">
          <img src="${p.imagen || 'img/placeholder.png'}" alt="${p.titulo}">
        </div>
        <h3>${p.titulo}</h3>
      </div>
    `).join('');

    const cards = galeria.querySelectorAll('.pelicula');
    cards.forEach((card, i) => {
      card.addEventListener('click', () => abrirModal(lista[i]));
    });
  };
});
