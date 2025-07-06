document.addEventListener('DOMContentLoaded', () => {
  const auth = window.auth;
  const db = window.db;

  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = 'index.html';
    } else {
      inicializarPeliculas(user);
    }
  });

  function inicializarPeliculas(user) {
    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscadorPeliculas');
    const ordenar = document.getElementById('ordenar');
    const botonCuenta = document.getElementById('botonCuenta');
    const menuUsuario = document.getElementById('menuUsuario');
    const tituloCategoria = document.getElementById('tituloCategoria');

    let todasPeliculas = [];

    // Mostrar/ocultar menú usuario
    botonCuenta.addEventListener('click', (e) => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menuUsuario.contains(e.target) && !botonCuenta.contains(e.target)) {
        menuUsuario.style.display = 'none';
      }
    });

    ordenar.addEventListener('change', () => {
      renderPeliculas(filtrarPeliculas(buscador.value));
    });

    buscador.addEventListener('input', () => {
      renderPeliculas(filtrarPeliculas(buscador.value));
    });

    function filtrarPeliculas(texto) {
      const filtro = texto.toLowerCase();
      return todasPeliculas
        .filter(p => p.titulo.toLowerCase().includes(filtro))
        .sort((a, b) => {
          const orden = ordenar.value;
          if (orden === 'titulo') return a.titulo.localeCompare(b.titulo);
          if (orden === 'anio') return b.anio - a.anio;
          return b.timestamp?.seconds - a.timestamp?.seconds;
        });
    }

    function renderPeliculas(lista) {
      galeria.innerHTML = '';

      if (lista.length === 0) {
        galeria.innerHTML = '<p style="color:white;">No hay películas para mostrar.</p>';
        return;
      }

      lista.forEach(pelicula => {
        const card = document.createElement('div');
        card.className = 'pelicula';
        card.setAttribute('tabindex', '0');
        card.innerHTML = `
          <img src="${pelicula.portada}" alt="${pelicula.titulo}">
          <h3>${pelicula.titulo}</h3>
        `;

        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            alert(`Seleccionada: ${pelicula.titulo}`);
          }

          if (e.key === 'ArrowLeft') {
            const prev = card.previousElementSibling;
            if (prev) prev.focus();
            else document.querySelector('aside li.activo')?.focus();
          }

          if (e.key === 'ArrowRight') {
            const next = card.nextElementSibling;
            if (next) next.focus();
          }

          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const cards = Array.from(galeria.querySelectorAll('.pelicula'));
            const index = cards.indexOf(card);
            const columns = Math.floor(galeria.offsetWidth / card.offsetWidth);
            const newIndex = e.key === 'ArrowUp' ? index - columns : index + columns;
            if (cards[newIndex]) cards[newIndex].focus();
          }
        });

        galeria.appendChild(card);
      });

      const primera = galeria.querySelector('.pelicula');
      if (primera) primera.focus();
    }

    window.filtrar = function (categoria) {
      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const currentLi = document.querySelector(`#nav${capitalize(categoria)}`);
      if (currentLi) currentLi.classList.add('activo');

      tituloCategoria.textContent = categoria.toUpperCase();

      if (categoria === 'favoritos') {
        db.collection('usuarios').doc(user.uid).get().then(doc => {
          const favIds = doc.data().favoritos || [];
          const filtradas = todasPeliculas.filter(p => favIds.includes(p.id));
          renderPeliculas(filtradas);
        });
      } else if (categoria === 'todos') {
        renderPeliculas(todasPeliculas);
      } else {
        const filtradas = todasPeliculas.filter(p => p.categoria === categoria);
        renderPeliculas(filtradas);
      }
    };

    window.cerrarSesion = function () {
      auth.signOut().then(() => {
        window.location.href = 'index.html';
      });
    };

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    db.collection('peliculas').get().then(snapshot => {
      todasPeliculas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPeliculas(todasPeliculas);
    });

    document.querySelectorAll('aside li').forEach(li => {
      li.setAttribute('tabindex', '0');
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          li.click();
        }
      });
    });
  }
});
