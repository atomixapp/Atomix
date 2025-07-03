document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  let peliculasOriginal = [];
  let favoritos = [];
  let userId = null;
  let currentFilter = 'todos';

  const galeria = document.getElementById('galeria');
  const ordenarSelect = document.getElementById('ordenar');
  const buscador = document.getElementById('buscadorPeliculas');
  const iconoBuscar = document.getElementById('iconoBuscar');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      userId = user.uid;
      iniciarApp();
    }
  });

  async function iniciarApp() {
    ordenarSelect.addEventListener('change', () => filtrarPeliculas(currentFilter));

    // Abrir/cerrar buscador
    iconoBuscar.addEventListener('click', (e) => {
      e.stopPropagation();
      buscador.style.display = buscador.style.display === 'block' ? 'none' : 'block';
      if (buscador.style.display === 'block') buscador.focus();
    });

    // Cerrar menús al clicar fuera
    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
      if (!buscador.contains(e.target) && !iconoBuscar.contains(e.target)) {
        buscador.style.display = 'none';
      }
    });

    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    buscador.addEventListener('input', filtrarBusqueda);

    document.querySelectorAll('aside ul li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();
      });
    });

    peliculasOriginal = await cargarPeliculas();
    favoritos = await cargarFavoritos();
    filtrarPeliculas('todos');
  }

  async function cargarPeliculas() {
    const snap = await db.collection('peliculas').get();
    return snap.docs.map(doc => doc.data());
  }

  async function cargarFavoritos() {
    const snap = await db.collection('usuarios').doc(userId).collection('favoritos').get();
    return snap.docs.map(doc => doc.data().titulo);
  }

  window.filtrar = (categoria) => {
    currentFilter = categoria;
    document.querySelectorAll('aside ul li').forEach(li => li.classList.remove('activo'));
    document.querySelectorAll('aside ul li').forEach(item => {
      if (item.textContent.toLowerCase().includes(categoria.toLowerCase())) {
        item.classList.add('activo');
      }
    });
    filtrarPeliculas(categoria);
  };

  function filtrarPeliculas(categoria) {
    let lista = categoria === 'todos' ? [...peliculasOriginal] : peliculasOriginal.filter(p => p.anio === categoria);
    mostrarPeliculas(lista);
    setTimeout(() => {
      const primera = galeria.querySelector('.pelicula');
      if (primera) primera.focus();
    }, 50);
  }

  function mostrarPeliculas(lista) {
    galeria.innerHTML = '';
    lista.forEach(p => {
      const tarjeta = document.createElement('a');
      tarjeta.className = 'pelicula';
      tarjeta.setAttribute('tabindex', '0');
      tarjeta.innerHTML = `<img src="${p.imagen}" alt="${p.titulo}"><h3>${p.titulo}</h3>`;
      galeria.appendChild(tarjeta);
    });
  }

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    document.querySelectorAll('.pelicula').forEach(t => {
      const titulo = t.querySelector('h3').textContent.toLowerCase();
      t.style.display = titulo.includes(texto) ? 'block' : 'none';
    });
  }

  document.addEventListener('keydown', (e) => {
    const focado = document.activeElement;
    const items = Array.from(document.querySelectorAll('.pelicula'));
    const index = items.indexOf(focado);
    const cols = Math.floor(galeria.offsetWidth / (items[0]?.offsetWidth || 200));

    if (focado.classList.contains('pelicula')) {
      if (e.key === 'ArrowRight') items[index + 1]?.focus();
      if (e.key === 'ArrowLeft') index === 0 ? document.querySelector('aside li.activo')?.focus() : items[index - 1]?.focus();
      if (e.key === 'ArrowDown') items[index + cols]?.focus();
      if (e.key === 'ArrowUp') items[index - cols]?.focus();
    }
  });

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = 'index.html');
});
