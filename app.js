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
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
      if (!buscador.contains(e.target) && !iconoBuscar.contains(e.target)) {
        buscador.style.display = 'none';
        buscador.value = '';
        filtrarPeliculas(currentFilter);
      }
    });

    buscador.addEventListener('input', filtrarBusqueda);

    // Activar navegación con teclas en aside
    const asideItems = document.querySelectorAll('aside ul li');
    asideItems.forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          li.click();
        }
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
    try {
      const snap = await db.collection('peliculas').get();
      return snap.empty ? [] : snap.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error cargando películas:', error);
      return [];
    }
  }

  async function cargarFavoritos() {
    try {
      const snap = await db.collection('usuarios').doc(userId).collection('favoritos').get();
      return snap.docs.map(doc => doc.data().titulo);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      return [];
    }
  }

  window.filtrar = (categoria) => {
    currentFilter = categoria;

    document.querySelectorAll('aside ul li').forEach(li => {
      if (!li.classList.contains('favoritos-boton')) {
        li.classList.remove('activo');
      }
    });

    document.querySelectorAll('aside ul li').forEach(item => {
      if (
        item.textContent.toLowerCase().includes(categoria.toLowerCase()) &&
        !item.classList.contains('favoritos-boton')
      ) {
        item.classList.add('activo');
      }
    });

    filtrarPeliculas(categoria);
  };

  function filtrarPeliculas(categoria) {
    let lista = [];

    if (categoria === 'favoritos') {
      lista = peliculasOriginal.filter(p => favoritos.includes(p.titulo));
      tituloCategoria.textContent = 'FAVORITOS';
    } else if (categoria === 'todos') {
      lista = [...peliculasOriginal];
      tituloCategoria.textContent = 'TODAS';
    } else {
      lista = peliculasOriginal.filter(p => p.anio === categoria);
      tituloCategoria.textContent = categoria.toUpperCase();
    }

    lista = ordenar(lista);
    mostrarPeliculas(lista);

    // 👉 Foco al primer elemento de galería
    setTimeout(() => {
      const primeraPelicula = galeria.querySelector('.pelicula');
      if (primeraPelicula) primeraPelicula.focus();
    }, 50);
  }

  function ordenar(lista) {
    const criterio = ordenarSelect.value;
    if (criterio === 'titulo') {
      return lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (criterio === 'anio') {
      return lista.sort((a, b) => parseInt(b.anio) - parseInt(a.anio));
    }
    return lista;
  }

  function mostrarPeliculas(lista) {
    galeria.innerHTML = '';

    if (lista.length === 0) {
      galeria.innerHTML = '<p>No hay películas para mostrar.</p>';
      return;
    }

    lista.forEach(p => {
      const esFavorito = favoritos.includes(p.titulo);
      const tarjeta = document.createElement('a');
      tarjeta.classList.add('pelicula');
      tarjeta.setAttribute('href', `detalles.html?titulo=${encodeURIComponent(p.titulo)}`);
      tarjeta.setAttribute('tabindex', '0');

      tarjeta.innerHTML = `
        <img src="${p.imagen}" alt="${p.titulo}">
        <div class="banderas">
          ${p.castellano ? `<img src="https://flagcdn.com/w20/es.png">` : ''}
          ${p.latino ? `<img src="https://flagcdn.com/w20/mx.png">` : ''}
        </div>
        <h3>${p.titulo}</h3>
        <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
          <i class="fa-solid fa-heart"></i>
        </div>
      `;

      galeria.appendChild(tarjeta);
    });

    document.querySelectorAll('.corazon').forEach(corazon => {
      corazon.onclick = async () => {
        const titulo = corazon.getAttribute('data-titulo');
        const esAhoraFavorito = !corazon.classList.contains('activo');

        if (esAhoraFavorito) {
          await agregarFavorito(titulo);
          corazon.classList.add('activo');
        } else {
          await eliminarFavorito(titulo);
          corazon.classList.remove('activo');
        }

        favoritos = await cargarFavoritos();
        if (currentFilter === 'favoritos') filtrarPeliculas('favoritos');
      };
    });
  }

  async function agregarFavorito(titulo) {
    const pelicula = peliculasOriginal.find(p => p.titulo === titulo);
    if (!pelicula) return;
    const idDoc = titulo.toLowerCase().replace(/\s+/g, '-');
    await db.collection('usuarios').doc(userId).collection('favoritos').doc(idDoc).set(pelicula);
  }

  async function eliminarFavorito(titulo) {
    const idDoc = titulo.toLowerCase().replace(/\s+/g, '-');
    await db.collection('usuarios').doc(userId).collection('favoritos').doc(idDoc).delete();
  }

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    const tarjetas = galeria.querySelectorAll('.pelicula');

    tarjetas.forEach(tarjeta => {
      const titulo = tarjeta.querySelector('h3').textContent.toLowerCase();
      tarjeta.style.display = titulo.includes(texto) ? 'block' : 'none';
    });
  }

  window.cerrarSesion = () => {
    firebase.auth().signOut().then(() => window.location.href = 'index.html');
  };

  // Navegación con flechas + sonido
  const sonidoFoco = new Audio('assets/sounds/click.mp3');

  document.addEventListener('keydown', (e) => {
    const focado = document.activeElement;

    if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      sonidoFoco.currentTime = 0;
      sonidoFoco.play().catch(() => {});
    }

    if (focado.classList.contains('pelicula')) {
      const peliculas = Array.from(document.querySelectorAll('.pelicula'));
      const index = peliculas.indexOf(focado);
      const columnas = Math.floor(galeria.offsetWidth / focado.offsetWidth);

      if (e.key === 'ArrowRight') {
        const siguiente = peliculas[index + 1];
        if (siguiente) siguiente.focus();
      } else if (e.key === 'ArrowLeft') {
        const anterior = peliculas[index - 1];
        if (anterior) anterior.focus();
      } else if (e.key === 'ArrowDown') {
        const abajo = peliculas[index + columnas];
        if (abajo) abajo.focus();
      } else if (e.key === 'ArrowUp') {
        const arriba = peliculas[index - columnas];
        if (arriba) arriba.focus();
      }
    }
  });
});
