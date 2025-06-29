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

    // Abrir/cerrar buscador
    iconoBuscar.addEventListener('click', (e) => {
      e.stopPropagation();
      buscadorInput.style.display =
        buscadorInput.style.display === 'none' || buscadorInput.style.display === '' ? 'inline-block' : 'none';
      if (buscadorInput.style.display === 'inline-block') buscadorInput.focus();
    });

    // Abrir/cerrar menú de cuenta
    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    // Cierre automático al hacer clic fuera
    document.addEventListener('click', function (event) {
      if (!menuUsuario.contains(event.target) && !botonCuenta.contains(event.target)) {
        menuUsuario.style.display = 'none';
      }
      if (!buscadorInput.contains(event.target) && !iconoBuscar.contains(event.target)) {
        buscadorInput.style.display = 'none';
      }
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
        tarjeta.setAttribute('tabindex', '0'); // para permitir navegación con teclas
        tarjeta.innerHTML = `
          <img src="${canal.logo}" alt="${canal.titulo}">
          <h3 style="font-size:14px; margin-top:6px;">${canal.titulo}</h3>
        `;

        // Al presionar Enter sobre un canal
        tarjeta.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            // Aquí puedes abrir el canal o reproductor
            alert(`Canal seleccionado: ${canal.titulo}`);
          }
        });

        contenedorCanales.appendChild(tarjeta);
      });

      // Enfocar el primer canal automáticamente (útil para Android TV)
      const primerCanal = contenedorCanales.querySelector('.canal');
      if (primerCanal) primerCanal.focus();
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

    // Activar navegación con teclas en la barra lateral
    const asideItems = document.querySelectorAll('aside li');
    asideItems.forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          li.click();
        }
      });
    });

    cargarCanales();
  }
});
