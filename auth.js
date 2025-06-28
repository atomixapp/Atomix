const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const btnSubmit = document.getElementById('btnSubmit');
const modalTitle = document.getElementById('modalTitle');
const errorMsg = document.getElementById('errorMsg');

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
  document.getElementById('nombreUsuario').style.display = modoRegistro ? 'block' : 'none';
}

authForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const clave = document.getElementById('password').value;
  const nombre = document.getElementById('nombreUsuario').value;

  if (modoRegistro) {
    auth.createUserWithEmailAndPassword(email, clave)
      .then(userCredential => {
        return userCredential.user.updateProfile({
          displayName: nombre,
          photoURL: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        }).then(() => {
          userCredential.user.sendEmailVerification();
          alert("Registro exitoso. Revisa tu correo.");
        });
      })
      .catch(err => errorMsg.textContent = err.message);
  } else {
    auth.signInWithEmailAndPassword(email, clave)
      .then(userCredential => {
        if (!userCredential.user.emailVerified) {
          errorMsg.textContent = "Verifica tu correo antes.";
          auth.signOut();
        } else {
          window.location.href = "index.html";
        }
      })
      .catch(err => errorMsg.textContent = err.message);
  }
});

updateForm();
