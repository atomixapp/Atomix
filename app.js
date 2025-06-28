const linkSeries = document.getElementById('link-series');
const linkFavoritos = document.getElementById('link-favoritos');
const galeria = document.getElementById('galeria');
const favoritos = document.getElementById('favoritos');
const botonCuenta = document.getElementById('botonCuenta');
const menuUsuario = document.getElementById('menuUsuario');

// Toggle menú cuenta
botonCuenta.addEventListener('click', (e) => {
  e.stopPropagation();
  menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
});

// Cerrar menú si haces click fuera
window.addEventListener('click', (e) => {
  if (!menuUsuario.contains(e.target) && e.target !== botonCuenta) {
    menuUsuario.style.display = 'none';
  }
});

// Navegación Series/Favoritos
linkSeries.addEventListener('click', () => {
  linkSeries.classList.add('activo');
  linkFavoritos.classList.remove('activo');
  galeria.style.display = 'grid';
  favoritos.style.display = 'none';
});

linkFavoritos.addEventListener('click', () => {
  linkSeries.classList.remove('activo');
  linkFavoritos.classList.add('activo');
  galeria.style.display = 'none';
  favoritos.style.display = 'grid';
});

// Corazones favoritos
document.querySelectorAll('.corazon').forEach(corazon => {
  corazon.addEventListener('click', (e) => {
    const card = e.target.closest('.pelicula');
    const activo = corazon.classList.toggle('activo');

    if (activo) {
      favoritos.appendChild(card);
    } else {
      galeria.appendChild(card);
    }
  });
});
