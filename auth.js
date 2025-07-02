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
      const result = await auth.signInWithEmailAndPassword(email, password);

      if (!result.user.emailVerified) {
        await auth.signOut();
        errorMsg.textContent = 'Verifica tu correo electrónico antes de ingresar.';
        return;
      }

      window.location.href = 'home.html';
    } else {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await userCredential.user.sendEmailVerification();
      errorMsg.textContent = 'Cuenta creada. Revisa tu correo para verificar tu cuenta.';
      authForm.reset();
      isLogin = true;
      updateForm();
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

auth.onAuthStateChanged(user => {
  if (!user || !user.emailVerified) {
    window.location.href = 'index.html';
  } else {
    inicializarApp(user);
  }
});

updateForm();
