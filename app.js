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

// Mostrar películas
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
}

// Buscador
buscador.addEventListener('input', () => {
  const texto = buscador.value.toLowerCase();
  const filtradas = peliculas.filter(p => p.titulo.toLowerCase().includes(texto));
  mostrarPeliculas(filtradas);
});

// Ordenar
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

// Cargar desde Firebase
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
  });

// Modal de autenticación
const modalAuth = document.getElementById('modalAuth');
const authForm = document.getElementById('authForm');
const modalTitle = document.getElementById('modalTitle');
const toggleAuth = document.getElementById('toggleAuth');
const btnSubmit = document.getElementById('btnSubmit');
const errorMsg = document.getElementById('errorMsg');

document.querySelector('.avatar').addEventListener('click', () => {
  modalAuth.style.display = 'flex';
  updateAuthView();
});

function cerrarModal() {
  modalAuth.style.display = 'none';
}

// Cambiar entre registro y login
let modoRegistro = false;
toggleAuth.addEventListener('click', () => {
  modoRegistro = !modoRegistro;
  updateAuthView();
});

function updateAuthView() {
  modalTitle.textContent = modoRegistro ? 'Crear cuenta nueva' : 'Iniciar sesión';
  btnSubmit.textContent = modoRegistro ? 'Registrarme' : 'Iniciar sesión';
  toggleAuth.textContent = modoRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí';
  errorMsg.textContent = '';
  authForm.reset();
}

// Control de submit
authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const clave = document.getElementById('password').value;
  errorMsg.textContent = '';

  if (modoRegistro) {
    // Registro de cuenta
    auth.createUserWithEmailAndPassword(email, clave)
      .then(userCredential => {
        userCredential.user.sendEmailVerification();
        cerrarModal();
        alert("Registro exitoso. Revisa tu correo para activar tu cuenta.");
      })
      .catch(error => {
        errorMsg.textContent = error.message;
      });
  } else {
    // Inicio de sesión
    auth.signInWithEmailAndPassword(email, clave)
      .then(userCredential => {
        if (!userCredential.user.emailVerified) {
          errorMsg.textContent = "Verifica tu correo antes de continuar.";
          auth.signOut();
        } else {
          cerrarModal();
        }
      })
      .catch(error => {
        errorMsg.textContent = error.message;
      });
  }
});

// Cerrar sesión
function cerrarSesion() {
  auth.signOut().then(() => {
    cerrarModal();
  });
}
