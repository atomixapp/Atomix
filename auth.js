const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const forgotPassword = document.getElementById('forgotPassword');
const btnSubmit = document.getElementById('btnSubmit');
const errorMsg = document.getElementById('errorMsg');

let isLogin = true;

function updateForm() {
  btnSubmit.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
  toggleAuth.textContent = isLogin
    ? '¿No tienes cuenta? Regístrate aquí'
    : '¿Ya tienes cuenta? Inicia sesión';
}

toggleAuth.addEventListener('click', (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  updateForm();
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = authForm.email.value;
  const password = authForm.password.value;

  try {
    if (isLogin) {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = 'home.html';
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
      window.location.href = 'home.html';
    }
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

forgotPassword.addEventListener('click', (e) => {
  e.preventDefault();
  const email = authForm.email.value;
  if (!email) {
    errorMsg.textContent = 'Por favor ingresa tu correo para recuperar la contraseña.';
    return;
  }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      errorMsg.textContent = 'Correo de recuperación enviado.';
    })
    .catch((error) => {
      errorMsg.textContent = error.message;
    });
});

updateForm();
