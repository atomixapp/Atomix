document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      iniciarApp(user);
    } else {
      window.location.href = 'index.html';
    }
  });
});

function iniciarApp(user) {
  const userId = user.uid;
  const db = firebase.firestore();

  document.getElementById('nombreUsuario').textContent = user.displayName || "Usuario";
  document.getElementById('correoUsuario').textContent = user.email;

  const galeria = document.getElementById('galeria');
  const buscador = document.getElementById('buscadorPeliculas');
  const ordenarSelect = document.getElementById('ordenar');
  const navPeliculas = document.getElementById('navPeliculas');
  const navFavoritos = document.getElementById('navFavoritos');
  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const iconoBuscar = document.getElementById('iconoBuscar');
  const tituloCategoria = document.getElementById('tituloCategoria');

  let peliculasOriginal = [];
  let criterioOrden = 'añadido';

  const respaldoLocal = [ /* tu respaldo local */ ];

  // 🟢 Event Listeners generales
  botonCuenta.addEventListener('click', e => toggleDisplay(menuUsuario, e));
  document.addEventListener('click', e => closeMenus(e, buscador, iconoBuscar, menuUsuario, botonCuenta));
  iconoBuscar.addEventListener('click', e => toggleDisplay(buscador, e, true));
  buscador.addEventListener('input', filtrarBusqueda);
  ordenarSelect.addEventListener('change', () => {
    criterioOrden = ordenarSelect.value;
    filtrarPeliculas('todos');
  });
  navPeliculas.addEventListener('click', () => cambiarVista('todos'));
  navFavoritos.addEventListener('click', () => cambiarVista('favoritos'));

  function toggleDisplay(element, e, focus = false) {
    e.stopPropagation();
    element.style.display = (element.style.display === 'block') ? 'none' : 'block';
    if (focus && element.style.display === 'block') element.focus();
  }

  function closeMenus(e, buscador, iconoBuscar, menuUsuario, botonCuenta) {
    if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
      menuUsuario.style.display = 'none';
    }
    if (!buscador.contains(e.target) && !iconoBuscar.contains(e.target)) {
      buscador.style.display = 'none';
      buscador.value = '';
      filtrarPeliculas('todos');
    }
  }

  function cambiarVista(vista) {
    navPeliculas.classList.toggle('activo', vista === 'todos');
    navFavoritos.classList.toggle('activo', vista === 'favoritos');
    vista === 'favoritos' ? cargarFavoritosFirestore(userId) : filtrarPeliculas('todos');
  }

  function filtrarBusqueda() {
    const texto = buscador.value.toLowerCase();
    document.querySelectorAll(".galeria > div").forEach(tarjeta => {
      const titulo = tarjeta.querySelector('h3')?.textContent.toLowerCase() || '';
      tarjeta.style.display = titulo.includes(texto) ? "block" : "none";
    });
  }

  function ordenarLista(lista) {
    return [...lista].sort((a, b) => {
      if (criterioOrden === 'titulo') return a.titulo.localeCompare(b.titulo);
      if (criterioOrden === 'anio') return parseInt(b.anio) - parseInt(a.anio);
      return 0;
    });
  }

  function filtrarPeliculas(anio = 'todos') {
    let listaFiltrada = anio === 'todos'
      ? peliculasOriginal
      : peliculasOriginal.filter(p => p.anio === anio);
    listaFiltrada = ordenarLista(listaFiltrada);
    mostrarPeliculas(listaFiltrada);
    actualizarCategoria(anio);
  }

  function actualizarCategoria(anio) {
    document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
    const liActivo = Array.from(document.querySelectorAll('aside li'))
      .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
    if (liActivo) liActivo.classList.add('activo');
    tituloCategoria.textContent = anio === 'favoritos' ? 'FAVORITOS' : (anio === 'todos' ? 'TODAS' : anio.toUpperCase());
  }

  async function mostrarPeliculas(lista) {
    galeria.innerHTML = '';  // ✅ LIMPIAR la galería ANTES DE RENDERIZAR

    const favoritos = await obtenerFavoritosFirestore(userId);

    if (!lista.length) {
      galeria.innerHTML = '<p class="vacio">No hay películas para mostrar.</p>';
      return;
    }

    lista.forEach(p => {
      const esFavorito = favoritos.includes(p.titulo);
      galeria.innerHTML += `
        <div class="pelicula">
          <a href="detalles.html?titulo=${encodeURIComponent(p.titulo)}">
            <img src="${p.imagen}" alt="${p.titulo}">
            <div class="banderas">
              ${p.castellano ? '<img src="https://flagcdn.com/w20/es.png">' : ''}
              ${p.latino ? '<img src="https://flagcdn.com/w20/mx.png">' : ''}
            </div>
            <h3>${p.titulo}</h3>
          </a>
          <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
            <i class="fa-solid fa-heart"></i>
          </div>
        </div>`;
    });

    document.querySelectorAll('.corazon').forEach(icon => {
      icon.addEventListener('click', async e => {
        const titulo = e.currentTarget.dataset.titulo;
        e.currentTarget.classList.toggle('activo');
        try {
          await toggleFavoritoFirestore(peliculasOriginal.find(p => p.titulo === titulo), userId);
          if (navFavoritos.classList.contains('activo')) cargarFavoritosFirestore(userId);
        } catch {
          e.currentTarget.classList.toggle('activo');
        }
      });
    });
  }

  function toggleFavoritoFirestore(pelicula, userId) {
    const tituloID = `${pelicula.titulo}-${pelicula.anio}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const docRef = db.collection('usuarios').doc(userId).collection('favoritos').doc(tituloID);
    return docRef.get().then(doc => doc.exists ? docRef.delete() : docRef.set(pelicula));
  }

  function obtenerFavoritosFirestore(userId) {
    return db.collection('usuarios').doc(userId).collection('favoritos').get()
      .then(snap => snap.docs.map(doc => doc.data().titulo));
  }

  function cargarFavoritosFirestore(userId) {
    db.collection('usuarios').doc(userId).collection('favoritos').get().then(snap => {
      mostrarPeliculas(ordenarLista(snap.docs.map(doc => doc.data())));
    });
  }

  db.collection('peliculas').get().then(snap => {
    peliculasOriginal = snap.docs.map(doc => doc.data());
    if (!peliculasOriginal.length) peliculasOriginal = respaldoLocal;
    filtrarPeliculas('todos');
  }).catch(() => {
    peliculasOriginal = respaldoLocal;
    filtrarPeliculas('todos');
  });

  window.cerrarSesion = () => auth.signOut().then(() => window.location.href = "index.html");
}
