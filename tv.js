document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const botonCuenta = document.getElementById('botonCuenta');
  const menuUsuario = document.getElementById('menuUsuario');
  const nombreUsuario = document.getElementById('nombreUsuario');
  const correoUsuario = document.getElementById('correoUsuario');

  botonCuenta.addEventListener('click', () => {
    menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
  });

  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      nombreUsuario.textContent = user.displayName || 'Usuario';
      correoUsuario.textContent = user.email;
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

      canales.forEach(canal => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'canal';

        tarjeta.innerHTML = `
          <img src="${canal.logo}" alt="${canal.titulo}" style="max-width:100px;">
          <h3>${canal.titulo}</h3>
        `;

        contenedorCanales.appendChild(tarjeta);
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

    // Mostrar canales por categoría
    window.mostrarCanal = function (categoria) {
      db.collection('canales').get().then(snapshot => {
        let canales = snapshot.docs.map(doc => doc.data());
        if (categoria !== 'todos') {
          canales = canales.filter(c => c.categoria === categoria);
        }
        renderCanales(canales);
      });
    };

    // Mostrar favoritos — opcional si quieres dejarlo
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

// Cerrar sesión
function cerrarSesion() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'index.html';
  });
}
