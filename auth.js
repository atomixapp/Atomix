const firebaseConfig = {
  apiKey: "AIzaSyCmMqUkiT_8zTdJYIfhs2VneW9p_33vow4",
  authDomain: "atomix-54e1a.firebaseapp.com",
  projectId: "atomix-54e1a",
  storageBucket: "atomix-54e1a.appspot.com",
  messagingSenderId: "888904747002",
  appId: "1:888904747002:web:4dcc9501a3ff9dfd2e4643"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Referencias a elementos
const form = document.getElementById("authForm");
const btnSubmit = document.getElementById("btnSubmit");
const toggleAuth = document.getElementById("toggleAuth");
const errorMsg = document.getElementById("errorMsg");
let modoRegistro = false;

// Alternar entre login y registro
toggleAuth.addEventListener("click", (e) => {
  e.preventDefault();
  modoRegistro = !modoRegistro;
  btnSubmit.textContent = modoRegistro ? "Registrarse" : "Iniciar sesión";
  toggleAuth.textContent = modoRegistro
    ? "¿Ya tienes cuenta? Inicia sesión aquí"
    : "¿No tienes cuenta? Regístrate aquí";
  errorMsg.textContent = "";
});

// Procesar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    if (modoRegistro) {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection("usuarios").doc(userCredential.user.uid).set({
        email: email,
        tipo: "estándar",
        creado: new Date()
      });
      alert("Registro exitoso. Ya puedes iniciar sesión.");
      modoRegistro = false;
      btnSubmit.textContent = "Iniciar sesión";
      toggleAuth.textContent = "¿No tienes cuenta? Regístrate aquí";
    } else {
      await auth.signInWithEmailAndPassword(email, password);
      location.href = "home.html"; // o la página principal de tu app
    }
  } catch (error) {
    errorMsg.textContent = error.message;
    console.error(error);
  }
});

// Recuperar contraseña
document.getElementById("forgotPassword").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) {
    alert("Introduce tu correo para recuperar contraseña.");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    alert("Correo de recuperación enviado.");
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});
