// ✅ app.js REPARADO CON NAVEGACIÓN COMO EN TV

document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  let peliculasOriginal = [];
  let favoritos = [];
  let userId = null;
  let currentFilter = 'todos';

  const galeria = document.getElementById('galeria');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const ordenarSelect = document.getElementById('ordenar');
  const buscador = document.getElementById('buscadorPeliculas');
  const iconoBuscar = document.getElementById('iconoBuscar');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');

  auth.onAuthStateChanged(async (user) => {
    if (user && user.emailVerified) {
      userId = user.uid;
      iniciarApp();
    } else {
      window.location.href = 'index.html';
    }
  });

  async function iniciarApp() {
    document.getElementById('nombreUsuario').textContent = firebase.auth().currentUser.displayName || 'Usuario';
    document.getElementById('correoUsuario').textContent = firebase.auth().currentUser.email;

    ordenarSelect.addEventListener('change', () => filtrarPeliculas(currentFilter));

    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
      buscador.style.display = 'none';
    });

    iconoBuscar.addEventListener('click', (e) => {
      e.stopPropagation();
      if (buscador.style.display === 'block') {
        buscador.style.display = 'none';
        buscador.value = '';
        filtrarPeliculas(currentFilter);
      } else {
        buscador.style.display = 'block';
        buscador.focus();
        menuUsuario.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) menuUsuario.style.display = 'none';
      if (!buscador.contains(e.target) && !iconoBuscar.contains(e.target)) {
        buscador.style.display = 'none';
        buscador.value = '';
        filtrarPeliculas(currentFilter);
      }
    });

    buscador.addEventListener('input', filtrarBusqueda);

    document.querySelectorAll('aside ul li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') li.click();
      });
    });

    document.getElementById('navPeliculas')?.focus();
    botonCuenta.setAttribute('tabindex', '0');
    buscador.setAttribute('tabindex', '0');

    peliculasOriginal = await cargarPeliculas();
    favoritos = await cargarFavoritos();
    filtrarPeliculas('todos');
  }

  async function cargarPeliculas() {
    const snap = await db.collection('peliculas').get();
    return snap.empty ? [] : snap.docs.map(doc => doc.data());
  }

  async function cargarFavoritos() {
    const snap = await db.collection('usuarios').doc(userId).collection('favoritos').get();
    return snap.docs.map(doc => doc.data().titulo);
  }

  window.filtrar = (categoria) => {
    currentFilter = categoria;
    document.querySelectorAll('aside ul li').forEach(li => {
      if (!li.classList.contains('favoritos-boton')) li.classList.remove('activo');
    });
    document.querySelectorAll('aside ul li').forEach(item => {
      if (item.textContent.toLowerCase().includes(categoria.toLowerCase()) && !item.classList.contains('favoritos-boton')) {
        item.classList.add('activo');
      }
    });
    filtrarPeliculas(categoria);
  };

  function filtrarPeliculas(categoria) {
    let lista = categoria === 'favoritos' ? peliculasOriginal.filter(p => favoritos.includes(p.titulo)) : categoria === 'todos' ? [...peliculasOriginal] : peliculasOriginal.filter(p => p.anio === categoria);
    tituloCategoria.textContent = categoria === 'favoritos' ? 'FAVORITOS' : categoria === 'todos' ? 'TODAS' : categoria.toUpperCase();
    mostrarPeliculas(ordenar(lista));
  }

  function ordenar(lista) {
    const criterio = ordenarSelect.value;
    return criterio === 'titulo' ? lista.sort((a, b) => a.titulo.localeCompare(b.titulo)) : criterio === 'anio' ? lista.sort((a, b) => parseInt(b.anio) - parseInt(a.anio)) : lista;
  }

  function mostrarPeliculas(lista) {
    galeria.innerHTML = '';
    if (lista.length === 0) {
      galeria.innerHTML = '<p>No hay películas para mostrar.</p>';
      return;
    }
    lista.forEach(p => {
      const tarjeta = document.createElement('a');
      tarjeta.className = 'pelicula';
      tarjeta.href = `detalles.html?titulo=${encodeURIComponent(p.titulo)}`;
      tarjeta.setAttribute('tabindex', '0');
      tarjeta.innerHTML = `<img src="${p.imagen}" alt="${p.titulo}"><div class="banderas">${p.castellano ? '<img src="https://flagcdn.com/w20/es.png">' : ''}${p.latino ? '<img src="https://flagcdn.com/w20/mx.png">' : ''}</div><h3>${p.titulo}</h3><div class="corazon" data-titulo="${p.titulo}"><i class="fa-solid fa-heart"></i></div>`;
      galeria.appendChild(tarjeta);
    });

    const primera = galeria.querySelector('.pelicula');
    if (primera) primera.focus();
  }

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    galeria.querySelectorAll('.pelicula').forEach(tarjeta => {
      const titulo = tarjeta.querySelector('h3').textContent.toLowerCase();
      tarjeta.style.display = titulo.includes(texto) ? 'block' : 'none';
    });
  }

  window.cerrarSesion = () => firebase.auth().signOut().then(() => window.location.href = 'index.html');

  // Navegación con flechas
  const sonidoFoco = new Audio('assets/sounds/click.mp3');
  document.addEventListener('keydown', (e) => {
    const foco = document.activeElement;
    const cards = Array.from(document.querySelectorAll('.pelicula'));
    const index = cards.indexOf(foco);
    const cols = Math.floor(galeria.offsetWidth / (cards[0]?.offsetWidth || 1));
    if (["ArrowRight","ArrowLeft","ArrowUp","ArrowDown"].includes(e.key)) {
      sonidoFoco.currentTime = 0;
      sonidoFoco.play().catch(()=>{});
    }
    if (foco.classList.contains('pelicula')) {
      if (e.key === 'ArrowRight' && cards[index + 1]) cards[index + 1].focus();
      if (e.key === 'ArrowLeft') {
        if (index % cols === 0) document.querySelector('aside li.activo')?.focus();
        else if (cards[index - 1]) cards[index - 1].focus();
      }
      if (e.key === 'ArrowDown' && cards[index + cols]) cards[index + cols].focus();
      if (e.key === 'ArrowUp' && cards[index - cols]) cards[index - cols].focus();
    }
  });
});
