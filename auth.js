const authForm = document.getElementById('authForm');
const toggleAuth = document.getElementById('toggleAuth');
const forgotPassword = document.getElementById('forgotPassword');
const btnSubmit = document.getElementById('btnSubmit');
const errorMsg = document.getElementById('errorMsg');

let isLogin = true;

// Inicializar Firebase Auth y Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// ✅ Establecer persistencia local
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Sesión persistente activada.");
  })
  .catch((error) => {
    console.error("Error al establecer persistencia:", error);
  });

// Actualizar texto del formulario
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
  const email = authForm.email.value.trim();
  const password = authForm.password.value;

  try {
    if (isLogin) {
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
      errorMsg.textContent = "Cuenta creada. Revisa tu correo para verificar.";
      await auth.signOut();
    }
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

forgotPassword.addEventListener('click', (e) => {
  e.preventDefault();
  const email = authForm.email.value.trim();

  if (!email) {
    errorMsg.textContent = 'Ingresa tu correo primero.';
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
