document.addEventListener('DOMContentLoaded', () => {

  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnSubmit = document.getElementById('btnSubmit');
  const toggleAuth = document.getElementById('toggleAuth');
  const forgotPassword = document.getElementById('forgotPassword');
  const errorMsg = document.getElementById('errorMsg');

  let modoRegistro = false;

  // 👉 Actualiza los textos según el modo (login o registro)
  function updateForm() {
    if (modoRegistro) {
      btnSubmit.textContent = 'Registrarse';
      toggleAuth.textContent = '¿Ya tienes cuenta? Inicia sesión aquí';
    } else {
      btnSubmit.textContent = 'Iniciar sesión';
      toggleAuth.textContent = '¿No tienes cuenta? Regístrate aquí';
    }
    errorMsg.textContent = '';
  }

  // 👉 Alternar entre login y registro
  toggleAuth.addEventListener('click', (e) => {
    e.preventDefault();
    modoRegistro = !modoRegistro;
    updateForm();
  });

  // 👉 Enviar formulario (login o registro)
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      if (modoRegistro) {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.sendEmailVerification();
        errorMsg.style.color = 'green';
        errorMsg.textContent = 'Registro exitoso. Revisa tu correo para verificar la cuenta.';
      } else {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (userCredential.user.emailVerified) {
          window.location.href = 'home.html';
        } else {
          await auth.signOut();
          errorMsg.style.color = 'red';
          errorMsg.textContent = 'Por favor verifica tu correo antes de iniciar sesión.';
        }
      }
    } catch (error) {
      console.error(error);
      mostrarError(error);
    }
  });

  // 👉 Olvidó la contraseña
  forgotPassword.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    if (!email) {
      errorMsg.style.color = 'red';
      errorMsg.textContent = 'Por favor ingresa tu correo para recuperar la contraseña.';
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      errorMsg.style.color = 'green';
      errorMsg.textContent = 'Se envió un correo para restablecer la contraseña.';
    } catch (error) {
      console.error(error);
      mostrarError(error);
    }
  });

  // 👉 Mostrar errores amigables
  function mostrarError(error) {
    errorMsg.style.color = 'red';
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMsg.textContent = 'El correo ya está registrado.';
        break;
      case 'auth/invalid-email':
        errorMsg.textContent = 'Correo no válido.';
        break;
      case 'auth/weak-password':
        errorMsg.textContent = 'La contraseña debe tener al menos 6 caracteres.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMsg.textContent = 'Correo o contraseña incorrectos.';
        break;
      case 'auth/too-many-requests':
        errorMsg.textContent = 'Demasiados intentos. Inténtalo más tarde.';
        break;
      default:
        errorMsg.textContent = 'Error: ' + error.message;
    }
  }

  updateForm();
});
