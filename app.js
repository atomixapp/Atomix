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

function mostrarPeliculas(lista) {
  galeria.innerHTML = '';
  const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');

  lista.forEach(p => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'pelicula';
    const tituloCod = encodeURIComponent(p.titulo);
    const esFavorito = favoritos.includes(p.titulo);
    tarjeta.innerHTML = `
      <a href="detalles.html?titulo=${tituloCod}">
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
  if (criterio === 'añadido') peliculas = [...peliculasOriginal];
  else if (criterio === 'titulo') peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
  else if (criterio === 'anio') peliculas.sort((a, b) => b.anio.localeCompare(a.anio));
  filtrar('todos');
});

db.collection('peliculas').get()
  .then(snap => {
    const datos = snap.docs.map(doc => doc.data());
    peliculasOriginal = datos.length > 0 ? datos : respaldoLocal;
    peliculas = [...peliculasOriginal];
    filtrar('todos');
  })
  .catch(() => {
    peliculasOriginal = [...respaldoLocal];
    peliculas = [...peliculasOriginal];
    filtrar('todos');
  });

// Autenticación Firebase moderna con verificación
let esRegistro = false;
const modalTitle = document.getElementById('modalTitle');
const btnSubmit = document.getElementById('btnSubmit');
const toggleAuth = document.getElementById('toggleAuth');
const errorMsg = document.getElementById('errorMsg');

toggleAuth.addEventListener('click', () => {
  esRegistro = !esRegistro;
  modalTitle.textContent = esRegistro ? 'Registro de cuenta' : 'Iniciar sesión';
  btnSubmit.textContent = esRegistro ? 'Registrarse' : 'Iniciar sesión';
  toggleAuth.textContent = esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí';
  errorMsg.textContent = '';
});

document.getElementById('authForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (esRegistro) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        userCredential.user.sendEmailVerification().then(() => {
          alert("Registro exitoso. Verifica tu correo antes de iniciar sesión.");
          cerrarModal();
        });
      })
      .catch(err => errorMsg.textContent = err.message);
  } else {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        if (userCredential.user.emailVerified) {
          alert("Inicio de sesión exitoso.");
          cerrarModal();
        } else {
          errorMsg.textContent = "Debes verificar tu correo antes de iniciar sesión.";
          firebase.auth().signOut();
        }
      })
      .catch(err => errorMsg.textContent = err.message);
  }
});

function cerrarModal() {
  document.getElementById('modalAuth').style.display = 'none';
  document.getElementById('authForm').reset();
  errorMsg.textContent = '';
}

document.querySelector('.avatar').addEventListener('click', () => {
  document.getElementById('modalAuth').style.display = 'flex';
});
