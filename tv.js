// tv.js

const canales = [
  { titulo: "Canal Noticias 24h", categoria: "noticias", url: "https://ejemplo.com/stream1.m3u8" },
  { titulo: "Deportes Max", categoria: "deportes", url: "https://ejemplo.com/stream2.m3u8" },
  { titulo: "Cine TV", categoria: "entretenimiento", url: "https://ejemplo.com/stream3.m3u8" }
];

function mostrarCanal(categoria) {
  const contenedor = document.getElementById('canales');
  contenedor.innerHTML = '';

  const filtrados = categoria === 'todos'
    ? canales
    : canales.filter(c => c.categoria === categoria);

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

// Mostrar todos al cargar
window.onload = () => mostrarCanal('todos');
