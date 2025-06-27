// Datos locales de respaldo
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

// Cargar películas desde Firebase
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

// --- Modal Autenticación ---

const modalAuth = document.getElementById('modalAuth');
const authForm = document.getElementById('authForm');
const modalTitle = document.getElementById('modalTitle');
const btnSubmit = document.getElementById('btnSubmit');
const toggleAuth = document.getElementById('toggleAuth');
const errorMsg = document.getElementById('errorMsg');

let isLoginMode = true; // true = login, false = registro

function abrirModalAuth() {
  errorMsg.textContent = '';
  authForm.reset();
  isLoginMode = true;
  modalTitle.textContent = 'Iniciar sesión';
  btnSubmit.textContent = 'Iniciar sesión';
  toggleAuth.textContent = '¿No tienes cuenta? Regístrate aquí';
  modalAuth.style.display = 'flex';
}

document.querySelector('.avatar').addEventListener('click', abrirModalAuth);

toggleAuth.addEventListener('click', () => {
  errorMsg.textContent = '';
  authForm.reset();
  if (isLoginMode) {
    isLoginMode = false;
    modalTitle.textContent = 'Registrarse';
    btnSubmit.textContent = 'Registrarse';
    toggleAuth.textContent = '¿Ya tienes cuenta? Inicia sesión aquí';
  } else {
    isLoginMode = true;
    modalTitle.textContent = 'Iniciar sesión';
    btnSubmit.textContent = 'Iniciar sesión';
    toggleAuth.textContent = '¿No tienes cuenta? Regístrate aquí';
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';

  const email = authForm.email.value.trim();
  const password = authForm.password.value.trim();

  if (!email || !password) {
    errorMsg.textContent = 'Por favor, completa todos los campos.';
    return;
  }
  if (password.length < 6) {
    errorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }

  try {
    if (isLoginMode) {
      // Iniciar sesión
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      if (!userCredential.user.emailVerified) {
        errorMsg.textContent = 'Por favor, verifica tu correo antes de iniciar sesión.';
        await firebase.auth().signOut();
        return;
      }
      cerrarModal();
      mostrarUsuario(userCredential.user);
    } else {
      // Registro
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await userCredential.user.sendEmailVerification();
      alert('Cuenta creada con éxito. Revisa tu correo para activar la cuenta.');
      cerrarModal();
    }
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMsg.textContent = 'El correo ya está en uso.';
        break;
      case 'auth/invalid-email':
        errorMsg.textContent = 'Correo inválido.';
        break;
      case 'auth/wrong-password':
        errorMsg.textContent = 'Contraseña incorrecta.';
        break;
      case 'auth/user-not-found':
        errorMsg.textContent = 'No existe una cuenta con ese correo.';
        break;
      default:
        errorMsg.textContent = error.message;
    }
  }
});

function mostrarUsuario(user) {
  document.querySelector('.avatar').style.border = '2px solid #4CAF50';
}

function cerrarModal() {
  modalAuth.style.display = 'none';
}

async function cerrarSesion() {
  await firebase.auth().signOut();
  document.querySelector('.avatar').style.border = 'none';
  alert('Sesión cerrada.');
}

firebase.auth().onAuthStateChanged(user => {
  if (user && user.emailVerified) {
    mostrarUsuario(user);
  } else {
    document.querySelector('.avatar').style.border = 'none';
  }
});
