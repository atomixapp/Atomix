// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_ID",
  storageBucket: "TU_ID.appspot.com",
  messagingSenderId: "ID_MENSAJES",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Detectar usuario logueado
onAuthStateChanged(auth, async (user) => {
  const loginContainer = document.getElementById("login-container");
  const contenidoApp = document.getElementById("contenido-app");

  if (user) {
    // Mostrar contenido, ocultar login
    if (loginContainer) loginContainer.style.display = "none";
    if (contenidoApp) contenidoApp.style.display = "block";

    const userRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        tipo: "estándar",
        creado: new Date()
      });
    }
  } else {
    // Mostrar login, ocultar contenido
    if (loginContainer) loginContainer.style.display = "block";
    if (contenidoApp) contenidoApp.style.display = "none";
  }
});

// Función de login
window.iniciarSesion = () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      console.log("Sesión iniciada");
    })
    .catch((error) => {
      alert("Error: " + error.message);
      console.error(error);
    });
};

// Función de registro
window.registrarUsuario = () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const userRef = doc(db, "usuarios", user.uid);
      await setDoc(userRef, {
        email: user.email,
        tipo: "estándar",
        creado: new Date()
      });
      console.log("Usuario registrado");
    })
    .catch((error) => {
      alert("Error: " + error.message);
      console.error(error);
    });
};

// Función para cerrar sesión
window.cerrarSesion = () => {
  signOut(auth)
    .then(() => {
      console.log("Sesión cerrada");
    })
    .catch((error) => {
      alert("Error al cerrar sesión: " + error.message);
    });
};
