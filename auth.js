const auth = window.auth;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('authForm');
  const toggleAuth = document.getElementById('toggleAuth');
  const forgotPassword = document.getElementById('forgotPassword');
  const btnSubmit = document.getElementById('btnSubmit');
  const errorMsg = document.getElementById('errorMsg');

  let isLogin = true;

  // Control sesión activa y redirección
  auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
      window.location.href = 'home.html';
    }
  });

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      if (isLogin) {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        const result = await auth.signInWithEmailAndPassword(email, password);

        if (!result.user.emailVerified) {
          errorMsg.textContent = "Verifica tu correo antes de continuar.";
          await auth.signOut();
          return;
        }

        window.location.href = 'home.html';
      } else {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        await result.user.sendEmailVerification();
        errorMsg.textContent = "Cuenta creada. Revisa tu correo.";
        await auth.signOut();
      }
    } catch (error) {
      errorMsg.textContent = error.message;
    }
  });

  forgotPassword.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!email) {
      errorMsg.textContent = 'Ingresa tu correo primero.';
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      errorMsg.textContent = 'Correo de recuperación enviado.';
    } catch (err) {
      errorMsg.textContent = err.message;
    }
  });

  updateForm();
});
