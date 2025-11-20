/* global auth, db, firebase */
document.addEventListener('DOMContentLoaded', () => {
  const auth = window.auth; // necesario para evitar la ❌ roja de GitHub web
  const form = document.getElementById('authForm');
  const toggleAuth = document.getElementById('toggleAuth');
  const forgotPassword = document.getElementById('forgotPassword');
  const btnSubmit = document.getElementById('btnSubmit');
  const errorMsg = document.getElementById('errorMsg');

  let isLogin = true;

  // Si hay usuario lo llevamos a home (ahora no exigimos emailVerified)
  auth.onAuthStateChanged(user => {
    if (user) {
      window.location.href = 'home.html';  // <-- FIX
    }
  });

  function updateForm() {
    if (isLogin) {
      btnSubmit.textContent = 'Iniciar sesión';
      toggleAuth.textContent = '¿No tienes cuenta? Regístrate aquí';
    } else {
      btnSubmit.textContent = 'Crear cuenta';
      toggleAuth.textContent = '¿Ya tienes cuenta? Inicia sesión';
    }
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
        await auth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged redirigirá
      } else {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        await auth.createUserWithEmailAndPassword(email, password);
        errorMsg.style.color = 'green';
        errorMsg.textContent = "Cuenta creada. Redirigiendo...";
      }
    } catch (error) {
      errorMsg.style.color = 'red';
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
      errorMsg.style.color = 'green';
      errorMsg.textContent = 'Correo de recuperación enviado.';
    } catch (err) {
      errorMsg.style.color = 'red';
      errorMsg.textContent = err.message;
    }
  });

  updateForm();
});
