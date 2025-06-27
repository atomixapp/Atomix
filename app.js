const respaldoLocal = [
  {
    titulo: 'Spiderman: De regreso a casa',
    imagen: 'https://image.tmdb.org/t/p/original/81qIJbnS2L0rUAAB55G8CZODpS5.jpg',
    anio: '2025',
    latino: true,
    castellano: true
  },
  {
    titulo: 'La leyenda de Ochi',
    imagen: 'https://image.tmdb.org/t/p/original/h1Iq6WfE4RWc9klGvN8sdi5aR6V.jpg',
    anio: '2025',
    castellano: true
  }
];

let peliculasOriginal = [];
let peliculas = [];

const galeria = document.getElementById('galeria');
const buscador = document.getElementById('buscador');
const ordenarSelect = document.getElementById('ordenar');

// Mostrar mensaje de carga
galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

// Función para mostrar películas
function mostrarPeliculas(lista) {
  galeria.innerHTML = '';
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');

  lista.forEach(p => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'pelicula';
    const tituloCod = encodeURIComponent(p.titulo);
    const esFavorito = favoritos.includes(p.titulo);

    tarjeta.innerHTML = `
      <a href="https://atomixapp.github.io/Atomix/detalles.html?titulo=${tituloCod}">
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
    `;
    galeria.appendChild(tarjeta);
  });

  document.querySelectorAll('.corazon').forEach(icon => {
    icon.addEventListener('click', e => {
      const titulo = e.currentTarget.dataset.titulo;
      toggleFavorito(titulo);
      e.currentTarget.classList.toggle('activo');
    });
  });
}

function toggleFavorito(titulo) {
  let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  if (favoritos.includes(titulo)) {
    favoritos = favoritos.filter(t => t !== titulo);
  } else {
    favoritos.push(titulo);
  }
  localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function filtrar(anio = 'todos') {
  const filtradas = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
  mostrarPeliculas(filtradas);
  document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
  const liActivo = Array.from(document.querySelectorAll('aside li'))
    .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
  if (liActivo) liActivo.classList.add('activo');
}

function mostrarFavoritos() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
  const favoritas = peliculas.filter(p => favoritos.includes(p.titulo));
  mostrarPeliculas(favoritas);
  document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
  const liFav = Array.from(document.querySelectorAll('aside li')).find(li => li.textContent.includes('❤️'));
  if (liFav) liFav.classList.add('activo');
}

buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const filtradas = peliculas.filter(p => p.titulo.toLowerCase().includes(texto));
  mostrarPeliculas(filtradas);
});

ordenarSelect.addEventListener('change', () => {
  const criterio = ordenarSelect.value;
  if (criterio === 'añadido') {
    peliculas = [...peliculasOriginal];
  } else if (criterio === 'titulo') {
    peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
  } else if (criterio === 'anio') {
    peliculas.sort((a, b) => b.anio.localeCompare(a.anio));
  }
  filtrar('todos');
});

// Cargar desde Firebase primero
db.collection('peliculas').get()
  .then(snap => {
    const datos = snap.docs.map(doc => doc.data());
    peliculasOriginal = datos.length > 0 ? datos : respaldoLocal;
    peliculas = [...peliculasOriginal];
    filtrar('todos');
  })
  .catch(err => {
    console.warn("Error Firebase:", err.message);
    peliculasOriginal = [...respaldoLocal];
    peliculas = [...peliculasOriginal];
    filtrar('todos');

    document.body.innerHTML += `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        padding: 10px;
        background: #cc0000;
        color: white;
        font-weight: bold;
        text-align: center;
        z-index: 9999;
      ">⚠ Error al cargar desde Firebase. Usando respaldo local.</div>
    `;
  });

// Modal de autenticación y sesión con Firebase Auth
const modalAuth = document.getElementById('modalAuth');
const authForm = document.getElementById('authForm');
const infoUsuario = document.getElementById('infoUsuario');
const usuarioEmail = document.getElementById('usuarioEmail');

document.querySelector('.avatar').addEventListener('click', () => {
  modalAuth.style.display = 'flex';
  const user = firebase.auth().currentUser;
  if (user) {
    authForm.style.display = 'none';
    infoUsuario.style.display = 'block';
    usuarioEmail.textContent = "Bienvenido, " + user.email;
  } else {
    authForm.style.display = 'block';
    infoUsuario.style.display = 'none';
  }
});

function cerrarModal() {
  modalAuth.style.display = 'none';
}

function registrar() {
  const email = document.getElementById('correo').value;
  const clave = document.getElementById('clave').value;

  firebase.auth().createUserWithEmailAndPassword(email, clave)
    .then(userCredential => {
      alert("Registro exitoso: " + userCredential.user.email);
      cerrarModal();
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
}

function ingresar() {
  const email = document.getElementById('correo').value;
  const clave = document.getElementById('clave').value;

  firebase.auth().signInWithEmailAndPassword(email, clave)
    .then(userCredential => {
      alert("Bienvenido: " + userCredential.user.email);
      cerrarModal();
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
}

function cerrarSesion() {
  firebase.auth().signOut().then(() => {
    alert("Sesión cerrada.");
    cerrarModal();
  });
}
