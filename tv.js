// tv.js

// Asume que firebase.js ya inicializó Firebase y declaró `db`

function mostrarCanal(categoria) {
  const contenedor = document.getElementById('canales');
  contenedor.innerHTML = '';

  db.collection("canales").get()
    .then(snapshot => {
      const canales = [];
      snapshot.forEach(doc => canales.push(doc.data()));

      const filtrados = categoria === 'todos'
        ? canales
        : canales.filter(c => c.categoria === categoria);

      if (filtrados.length === 0) {
        contenedor.innerHTML = "<p style='color: white;'>No hay canales disponibles en esta categoría.</p>";
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
    })
    .catch(error => {
      console.error("❌ Error al cargar canales:", error);
    });
}

// Mostrar todos los canales al cargar la página
window.onload = () => mostrarCanal('todos');

// Lógica para cambiar categoría desde el sidebar
function seleccionarCategoria(elemento, categoria) {
  document.querySelectorAll("aside ul li").forEach(li => li.classList.remove("activo"));
  elemento.classList.add("activo");
  mostrarCanal(categoria);
}
