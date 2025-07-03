// Referencias DOM
const galeria = document.getElementById('galeria');
const buscadorInput = document.getElementById('buscadorPeliculas');
const iconoBuscar = document.getElementById('iconoBuscar');
const selectOrden = document.getElementById('ordenar');
const tituloCategoria = document.getElementById('tituloCategoria');
const botonCuenta = document.getElementById('botonCuenta');
const menuUsuario = document.getElementById('menuUsuario');

// Estado
let todasPeliculas = [];
let favoritas = [];
let categoriaActual = 'todos';
let usuarioActual = null;

// Mostrar/Ocultar menú de cuenta
botonCuenta.addEventListener('click', () => {
  menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
});

// Cerrar sesión
function cerrarSesion() {
  firebase.auth().signOut().then(() => {
    location.href = 'index.html';
  });
}

// Obtener usuario
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    usuarioActual = user;
    document.getElementById('nombreUsuario').textContent = user.displayName || 'Usuario';
    document.getElementById('correoUsuario').textContent = user.email;
    cargarPeliculas();
    cargarFavoritos();
  } else {
    location.href = 'index.html';
  }
});

// Cargar películas desde Firestore
function cargarPeliculas() {
  firebase.firestore().collection('peliculas')
    .orderBy('añadido', 'desc')
    .onSnapshot(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      mostrarPeliculas();
    });
}

// Cargar favoritos del usuario
function cargarFavoritos() {
  firebase.firestore().collection('usuarios')
    .doc(usuarioActual.uid)
    .onSnapshot(doc => {
      favoritas = doc.data()?.favoritos || [];
      mostrarPeliculas();
    });
}

// Mostrar películas según categoría, búsqueda u orden
function mostrarPeliculas() {
  let filtradas = todasPeliculas;

  if (categoriaActual === 'favoritos') {
    filtradas = todasPeliculas.filter(p => favoritas.includes(p.id));
  } else if (categoriaActual !== 'todos') {
    filtradas = todasPeliculas.filter(p => p.categoria === categoriaActual || p.anio == categoriaActual);
  }

  const textoBuscar = buscadorInput.value.toLowerCase();
  if (textoBuscar) {
    filtradas = filtradas.filter(p => p.titulo.toLowerCase().includes(textoBuscar));
  }

  switch (selectOrden.value) {
    case 'titulo':
      filtradas.sort((a, b) => a.titulo.localeCompare(b.titulo));
      break;
    case 'anio':
      filtradas.sort((a, b) => b.anio - a.anio);
      break;
    default:
      filtradas.sort((a, b) => b.añadido?.toDate() - a.añadido?.toDate());
  }

  renderizarPeliculas(filtradas);
}

// Renderizar películas
function renderizarPeliculas(lista) {
  galeria.innerHTML = '';

  if (lista.length === 0) {
    galeria.innerHTML = `<div class="vacio">No hay resultados.</div>`;
    return;
  }

  lista.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pelicula';
    div.tabIndex = 0;

    div.innerHTML = `
      <div class="banderas">
        ${p.bandera1 ? `<img src="${p.bandera1}" alt="Idioma">` : ''}
        ${p.bandera2 ? `<img src="${p.bandera2}" alt="Idioma">` : ''}
      </div>
      <i class="fa-solid fa-heart corazon ${favoritas.includes(p.id) ? 'activo' : ''}" onclick="toggleFavorito(event, '${p.id}')"></i>
      <img src="${p.portada}" alt="${p.titulo}">
      <h3>${p.titulo}</h3>
    `;

    galeria.appendChild(div);
  });
}

// Alternar favorito
function toggleFavorito(e, id) {
  e.stopPropagation();
  const ref = firebase.firestore().collection('usuarios').doc(usuarioActual.uid);
  const esFavorito = favoritas.includes(id);
  const nuevas = esFavorito ? favoritas.filter(f => f !== id) : [...favoritas, id];
  ref.set({ favoritos: nuevas }, { merge: true });
}

// Buscar
iconoBuscar.addEventListener('click', () => {
  buscadorInput.style.display = buscadorInput.style.display === 'block' ? 'none' : 'block';
  buscadorInput.focus();
});

buscadorInput.addEventListener('input', mostrarPeliculas);

// Ordenar
selectOrden.addEventListener('change', mostrarPeliculas);

// Filtrar por categoría
function filtrar(cat) {
  categoriaActual = cat;
  document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
  const activo = document.querySelector(`aside li[onclick*="${cat}"]`);
  if (activo) activo.classList.add('activo');

  tituloCategoria.textContent = cat === 'todos' ? 'TODAS' :
                                cat === 'favoritos' ? 'FAVORITOS' :
                                cat.toUpperCase();
  mostrarPeliculas();
}
