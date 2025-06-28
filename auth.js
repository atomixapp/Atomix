const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const btnSubmit = document.getElementById('btnSubmit');
const modalTitle = document.getElementById('modalTitle');
const errorMsg = document.getElementById('errorMsg');
const forgotPassword = document.getElementById('forgotPassword');

let modoRegistro = false;

toggleAuth.addEventListener('click', () => {
  modoRegistro = !modoRegistro;
  updateForm();
});

function updateForm() {
  modalTitle.textContent = modoRegistro ? 'Crear cuenta nueva' : 'Iniciar sesión';
  btnSubmit.textContent = modoRegistro ? 'Registrarme' : 'Iniciar sesión';
  toggleAuth.textContent = modoRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí';
  errorMsg.textContent = '';

  const existing = document.getElementById('nombreUsuario');
  if (modoRegistro && !existing) {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'nombreUsuario';
    input.placeholder = 'Tu nombre';
    input.className = 'input-modern';
    authForm.insertBefore(input, authForm.firstChild);
  } else if (!modoRegistro && existing) {
    existing.remove();
  }
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const clave = document.getElementById('password').value;
  const nombre = document.getElementById('nombreUsuario')?.value || "";

  if (modoRegistro) {
    auth.createUserWithEmailAndPassword(email, clave)
      .then(userCredential => {
        return userCredential.user.updateProfile({
          displayName: nombre,
          photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        }).then(() => {
          userCredential.user.sendEmailVerification();
          alert("Registro exitoso. Revisa tu correo antes de iniciar sesión.");
        });
      })
      .catch(err => errorMsg.textContent = err.message);
  } else {
    auth.signInWithEmailAndPassword(email, clave)
      .then(userCredential => {
        if (!userCredential.user.emailVerified) {
          errorMsg.textContent = "Verifica tu correo antes de ingresar.";
          auth.signOut();
        } else {
          window.location.href = "home.html";
        }
      })
      .catch(err => errorMsg.textContent = err.message);
  }
});

auth.onAuthStateChanged(user => {
  if (user && user.emailVerified) {
    window.location.href = "home.html";
  }
});

// Recuperar contraseña
forgotPassword.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  if (!email) {
    errorMsg.textContent = "Por favor escribe tu correo primero.";
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("Te hemos enviado un correo para restablecer tu contraseña.");
    })
    .catch(err => {
      errorMsg.textContent = err.message;
    });
});

updateForm();
