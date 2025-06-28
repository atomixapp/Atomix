// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmMqUkiT_8zTdJYIfhs2VneW9p_33vow4",
  authDomain: "atomix-54e1a.firebaseapp.com",
  projectId: "atomix-54e1a",
  storageBucket: "atomix-54e1a.appspot.com",
  messagingSenderId: "888904747002",
  appId: "1:888904747002:web:4dcc9501a3ff9dfd2e4643"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Inicializa servicios
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // 🔧 ¡Faltaba esto!

// Hacer accesibles globalmente
window.auth = auth;
window.db = db;
window.storage = storage;
