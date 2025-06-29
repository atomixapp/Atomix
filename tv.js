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
        contenedorCanales.innerHTML = '<p style="color:white;">No hay canales disponibles.</p>';
        return;
      }

      canales.forEach(canal => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'canal';

        tarjeta.innerHTML = `
          <img src="${canal.logo || 'https://via.placeholder.com/100x60?text=No+Logo'}" alt="${canal.titulo}" data-stream="${canal.url}" style="max-width:100px; cursor:pointer;">
          <h3>${canal.titulo}</h3>
        `;

        contenedorCanales.appendChild(tarjeta);
      });

      // Click en imagen -> abre reproductor
      document.querySelectorAll('#canales img').forEach(img => {
        img.addEventListener('click', e => {
          const streamUrl = e.currentTarget.dataset.stream;
          const modal = document.getElementById('playerModal');
          const video = document.getElementById('tvPlayer');

          if (!streamUrl) {
            alert('URL de stream no disponible.');
            return;
          }

          if (window.Hls && Hls.isSupported()) {
            if (video._hls) video._hls.destroy();
            const hls = new Hls();
            video._hls = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.play();
          } else {
            alert('Este navegador no soporta HLS.');
            return;
          }

          modal.style.display = 'flex';
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

    window.mostrarCanal = function (categoria) {
      db.collection('canales').get().then(snapshot => {
        let canales = snapshot.docs.map(doc => doc.data());
        if (categoria !== 'todos') {
          canales = canales.filter(c => c.categoria === categoria);
        }
        renderCanales(canales);
      });
    };

    cargarCanales();
  }
});

function cerrarPlayer() {
  const modal = document.getElementById('playerModal');
  const video = document.getElementById('tvPlayer');

  modal.style.display = 'none';
  if (video._hls) {
    video._hls.destroy();
    video._hls = null;
  }
  video.pause();
  video.src = '';
}
