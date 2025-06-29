document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarTV(user);
    }
  });

  function inicializarTV(user) {
    const contenedorCanales = document.getElementById('canales');
    const buscador = document.getElementById('buscador');

    function renderCanales(canales) {
      contenedorCanales.innerHTML = '';

      if (canales.length === 0) {
        contenedorCanales.innerHTML = '<p style="color:white;">No hay canales para mostrar.</p>';
        return;
      }

      obtenerFavoritosFirestore(user.uid).then(favoritos => {
        canales.forEach(canal => {
          const tarjeta = document.createElement('div');
          tarjeta.className = 'canal';

          const esFavorito = favoritos.some(f => f.titulo === canal.titulo && f.tipo === 'canal');

tarjeta.innerHTML = `
  <img src="${canal.logo}" alt="${canal.titulo}" style="max-width:160px; border-radius:8px; cursor:pointer;" data-stream="${canal.url}">
  <h3>${canal.titulo}</h3>
`;

const img = tarjeta.querySelector('img');
img.addEventListener('click', () => abrirPlayer(canal.url));

          contenedorCanales.appendChild(tarjeta);
        });
      });
    }

    function cargarCanales() {
      db.collection('canales').get().then(snapshot => {
        const canales = snapshot.docs.map(doc => doc.data());
        renderCanales(canales);

        buscador.addEventListener('input', () => {
          const texto = buscador.value.toLowerCase();
          const filtrados = canales.filter(c => c.titulo.toLowerCase().includes(texto));
          renderCanales(filtrados);
        });
      });
    }

    function obtenerFavoritosFirestore(userId) {
      return db.collection('usuarios').doc(userId).collection('favoritos').get()
        .then(snap => snap.docs.map(doc => doc.data()));
    }

    window.mostrarCanal = function (categoria) {
      db.collection('canales').get().then(snapshot => {
        let canales = snapshot.docs.map(doc => doc.data());
        if (categoria !== 'todos') {
          canales = canales.filter(c => c.categoria === categoria);
        }
        renderCanales(canales);
      });
    };

    window.mostrarFavoritos = function () {
      db.collection('usuarios').doc(user.uid).collection('favoritos')
        .where('tipo', '==', 'canal')
        .get()
        .then(snapshot => {
          const favoritos = snapshot.docs.map(doc => doc.data());
          renderCanales(favoritos);
        });
    };

    cargarCanales();
  }
});

// Reproductor pantalla completa
function abrirPlayer(streamUrl) {
  document.getElementById('playerVideo').src = streamUrl;
  document.getElementById('playerModal').style.display = 'flex';
}

function cerrarPlayer() {
  const player = document.getElementById('playerVideo');
  player.pause();
  player.src = '';
  document.getElementById('playerModal').style.display = 'none';
}
