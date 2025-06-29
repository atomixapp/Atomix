// tv.js (leer canales desde Firestore)
const db = firebase.firestore();
let todosLosCanales = [];

function cargarCanalesDesdeFirestore() {
  db.collection("canales").get()
    .then(snapshot => {
      todosLosCanales = [];

      snapshot.forEach(doc => {
        const canal = doc.data();
        // Asegurar que tenga campos válidos
        if (canal.titulo && canal.url && canal.categoria) {
          todosLosCanales.push(canal);
        }
      });

      mostrarCanal('todos');
    })
    .catch(error => {
      console.error("❌ Error al cargar canales desde Firestore:", error);
    });
}

function mostrarCanal(categoria) {
  const contenedor = document.getElementById('canales');
  contenedor.innerHTML = '';

  const filtrados = categoria === 'todos'
    ? todosLosCanales
    : todosLosCanales.filter(c => c.categoria === categoria);

  if (filtrados.length === 0) {
    contenedor.innerHTML = "<p style='color: white;'>No hay canales en esta categoría.</p>";
    return;
  }

  filtrados.forEach(canal => {
    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <h3>${canal.titulo}</h3>
      <video controls width="100%" src="${canal.url}"></video>
    `;
    contenedor.appendChild(card);
  });
}

// Mostrar al cargar
window.onload = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      cargarCanalesDesdeFirestore();
      mostrarUsuario(user); // Mostrar email/nombre si quieres
    } else {
      window.location.href = "index.html";
    }
  });
};

// Mostrar datos del usuario en menú
function mostrarUsuario(user) {
  document.getElementById("nombreUsuario").textContent = user.displayName || "Usuario";
  document.getElementById("correoUsuario").textContent = user.email;
}

// Cerrar sesión
function cerrarSesion() {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  });
}

// Toggle del menú de cuenta
document.getElementById("botonCuenta").addEventListener("click", () => {
  const menu = document.getElementById("menuUsuario");
  menu.style.display = (menu.style.display === "none") ? "block" : "none";
});
