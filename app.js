document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  let peliculasOriginal = [];
  let favoritos = [];
  let userId = null;

  const galeria = document.getElementById('galeria');
  const tituloCategoria = document.getElementById('tituloCategoria');
  const ordenarSelect = document.getElementById('ordenar');
  const buscador = document.getElementById('buscadorPeliculas');

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
    buscador.addEventListener('input', filtrarBusqueda);

    // Cargar películas y favoritos de una vez
    peliculasOriginal = await cargarPeliculas();
    favoritos = await cargarFavoritos();

    filtrarPeliculas('todos');
  }

  async function cargarPeliculas() {
    try {
      const snap = await db.collection('peliculas').get();
      if (!snap.empty) {
        return snap.docs.map(doc => doc.data());
      }
      // Si no hay, puedes retornar un array vacío o respaldo local
      return [];
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

  let currentFilter = 'todos';

  window.filtrar = (categoria) => {
    currentFilter = categoria;
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
  }

  function ordenar(lista) {
    const criterio = ordenarSelect.value;
    if (criterio === 'titulo') {
      return lista.sort((a, b) => a.titulo.localeCompare(b.titulo));
    } else if (criterio === 'anio') {
      return lista.sort((a, b) => parseInt(b.anio) - parseInt(a.anio));
    }
    return lista; // por defecto por añadido, que es el orden original
  }

  function mostrarPeliculas(lista) {
    galeria.innerHTML = ''; // LIMPIAR siempre antes de mostrar

    if (lista.length === 0) {
      galeria.innerHTML = '<p>No hay películas para mostrar.</p>';
      return;
    }

    lista.forEach(p => {
      const esFavorito = favoritos.includes(p.titulo);
      const tarjeta = document.createElement('div');
      tarjeta.classList.add('pelicula');

      tarjeta.innerHTML = `
        <a href="detalles.html?titulo=${encodeURIComponent(p.titulo)}">
          <img src="${p.imagen}" alt="${p.titulo}">
          <div class="banderas">
            ${p.castellano ? `<img src="https://flagcdn.com/w20/es.png">` : ''}
            ${p.latino ? `<img src="https://flagcdn.com/w20/mx.png">` : ''}
          </div>
          <h3>${p.titulo}</h3>
        </a>
        <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
          <i class="fa-solid fa-heart"></i>
        </div>
      `;

      galeria.appendChild(tarjeta);
    });

    // Asignar eventos a los corazones para favoritos
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

        // Si estamos en favoritos, refrescar la lista para eliminar los que ya no están
        if (currentFilter === 'favoritos') filtrarPeliculas('favoritos');
      };
    });
  }

  async function agregarFavorito(titulo) {
    try {
      const pelicula = peliculasOriginal.find(p => p.titulo === titulo);
      if (!pelicula) return;
      const idDoc = titulo.toLowerCase().replace(/\s+/g, '-');
      await db.collection('usuarios').doc(userId).collection('favoritos').doc(idDoc).set(pelicula);
    } catch (error) {
      console.error('Error agregando favorito:', error);
    }
  }

  async function eliminarFavorito(titulo) {
    try {
      const idDoc = titulo.toLowerCase().replace(/\s+/g, '-');
      await db.collection('usuarios').doc(userId).collection('favoritos').doc(idDoc).delete();
    } catch (error) {
      console.error('Error eliminando favorito:', error);
    }
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
});
