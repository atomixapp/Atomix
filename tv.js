document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      inicializarTV(user);
    }
  });

  function inicializarTV(user) {
    const contenedorCanales = document.getElementById('canales');
    const buscadorInput = document.getElementById('buscadorCanales');
    const iconoBuscar = document.getElementById('iconoBuscar');
    const tituloGaleria = document.getElementById('tituloGaleria');
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');

    iconoBuscar.addEventListener('click', () => {
      if (buscadorInput.style.display === 'none' || buscadorInput.style.display === '') {
        buscadorInput.style.display = 'inline-block';
        buscadorInput.focus();
      } else {
        buscadorInput.style.display = 'none';
      }
    });

    botonCuenta.addEventListener('click', () => {
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

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

    let todosCanales = [];

    function cargarCanales() {
      db.collection('canales').get().then(snapshot => {
        todosCanales = snapshot.docs.map(doc => doc.data());
        renderCanales(todosCanales);
      });
    }

    buscadorInput.addEventListener('input', () => {
      const texto = buscadorInput.value.toLowerCase();
      const filtrados = todosCanales.filter(c => c.titulo.toLowerCase().includes(texto));
      renderCanales(filtrados);
    });

    window.seleccionarCategoria = function (categoria) {
      tituloGaleria.textContent = categoria;
      if (categoria === 'Todos') {
        renderCanales(todosCanales);
      } else {
        const filtrados = todosCanales.filter(c => c.categoria === categoria);
        renderCanales(filtrados);
      }
    };

    window.cerrarSesion = function () {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    };

    cargarCanales();
  }
});
