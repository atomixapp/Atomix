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
    const buscador = document.getElementById('buscador');
    const btnBuscar = document.getElementById('btnBuscar');
    const buscadorBox = document.getElementById('buscadorBox');

    btnBuscar.addEventListener('click', () => {
      buscadorBox.style.display = buscadorBox.style.display === 'none' ? 'block' : 'none';
      buscador.focus();
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
          <img src="${canal.logo}" alt="${canal.titulo}">
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
