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
            <img src="${canal.logo || 'https://via.placeholder.com/100x60?text=No+Logo'}" alt="${canal.titulo}" data-stream="${canal.url}" style="max-width:100px; cursor:pointer;">
            <h3>${canal.titulo}</h3>
            <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${canal.titulo}">
              <i class="fa-solid fa-heart"></i>
            </div>
          `;

          contenedorCanales.appendChild(tarjeta);
        });

        // Eventos de corazón para favoritos
        document.querySelectorAll('.corazon').forEach(icon => {
          icon.addEventListener('click', async e => {
            const titulo = e.currentTarget.dataset.titulo;
            const canal = canales.find(c => c.titulo === titulo);

            e.currentTarget.classList.toggle('activo');

            try {
              await toggleFavoritoFirestore(canal, user.uid);
            } catch (err) {
              console.error("Error al actualizar favorito:", err);
              e.currentTarget.classList.toggle('activo');
            }
          });
        });

        // Eventos para abrir reproductor al hacer click en imagen
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
              if (video._hls) {
                video._hls.destroy();
              }
              const hls = new Hls();
              video._hls = hls;
              hls.loadSource(streamUrl);
              hls.attachMedia(video);
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
              });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = streamUrl;
              video.play();
            } else {
              alert('Este navegador no soporta reproducción HLS.');
              return;
            }

            modal.style.display = 'flex';
          });
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
      }).catch(err => {
        console.error('Error cargando canales:', err);
        contenedorCanales.innerHTML = '<p style="color:red;">Error cargando canales.</p>';
      });
    }

    function toggleFavoritoFirestore(canal, userId) {
      const tituloID = canal.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      const docRef = db.collection('usuarios').doc(userId).collection('favoritos').doc(tituloID);

      return docRef.get().then(doc => {
        if (doc.exists) {
          return docRef.delete();
        } else {
          return docRef.set({
            titulo: canal.titulo,
            logo: canal.logo,
            tipo: 'canal'
          });
        }
      });
    }

    function obtenerFavoritosFirestore(userId) {
      return db.collection('usuarios').doc(userId).collection('favoritos').get()
        .then(snap => snap.docs.map(doc => doc.data()));
    }

    // Mostrar favoritos
    window.mostrarFavoritos = function () {
      db.collection('usuarios').doc(user.uid).collection('favoritos')
        .where('tipo', '==', 'canal')
        .get()
        .then(snapshot => {
          const favoritos = snapshot.docs.map(doc => doc.data());
          renderCanales(favoritos);
        });
    };

    // Mostrar canales según categoría o todos
    window.mostrarCanal = function(categoria) {
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

// Función para cerrar el reproductor modal
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
