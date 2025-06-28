document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarApp(user);
    }
  });

  function inicializarApp(user) {
    const respaldoLocal = [
      {
        titulo: 'Spiderman: De regreso a casa',
        imagen: 'https://image.tmdb.org/t/p/original/81qIJbnS2L0rUAAB55G8CZODpS5.jpg',
        anio: '2025',
        latino: true,
        castellano: true
      },
      {
        titulo: 'La leyenda de Ochi',
        imagen: 'https://image.tmdb.org/t/p/original/h1Iq6WfE4RWc9klGvN8sdi5aR6V.jpg',
        anio: '2025',
        castellano: true
      }
    ];

    let peliculasOriginal = [];
    let peliculas = [];

    const galeria = document.getElementById('galeria');
    const buscador = document.getElementById('buscador');
    const ordenarSelect = document.getElementById('ordenar');

    galeria.innerHTML = '<p class="cargando">Cargando contenido...</p>';

    function mostrarPeliculas(lista) {
      galeria.innerHTML = '';
      const favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');

      lista.forEach(p => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'pelicula';
        const tituloCod = encodeURIComponent(p.titulo);
        const esFavorito = favoritos.includes(p.titulo);

        tarjeta.innerHTML = `
          <a href="detalles.html?titulo=${tituloCod}">
            <img src="${p.imagen}" alt="${p.titulo}">
            <div class="banderas">
              ${p.castellano ? '<img src="https://flagcdn.com/w20/es.png">' : ''}
              ${p.latino ? '<img src="https://flagcdn.com/w20/mx.png">' : ''}
            </div>
            <h3>${p.titulo}</h3>
          </a>
          <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
            <i class="fa-solid fa-heart"></i>
          </div>
        `;
        galeria.appendChild(tarjeta);
      });

      document.querySelectorAll('.corazon').forEach(icon => {
        icon.addEventListener('click', e => {
          const titulo = e.currentTarget.dataset.titulo;
          toggleFavorito(titulo);
          e.currentTarget.classList.toggle('activo');
        });
      });
    }

    function toggleFavorito(titulo) {
      let favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
      if (favoritos.includes(titulo)) {
        favoritos = favoritos.filter(t => t !== titulo);
      } else {
        favoritos.push(titulo);
      }
      localStorage.setItem('favoritos', JSON.stringify(favoritos));
    }

    function filtrar(anio = 'todos') {
      const filtradas = anio === 'todos' ? peliculas : peliculas.filter(p => p.anio === anio);
      mostrarPeliculas(filtradas);
      document.querySelectorAll('aside li').forEach(li => li.classList.remove('activo'));
      const liActivo = Array.from(document.querySelectorAll('aside li'))
        .find(li => li.textContent.includes(anio) || (anio === 'todos' && li.textContent.includes('Todas')));
      if (liActivo) liActivo.classList.add('activo');
    }

    buscador.addEventListener('input', () => {
      const texto = buscador.value.toLowerCase();
      const filtradas = peliculas.filter(p => p.titulo.toLowerCase().includes(texto));
      mostrarPeliculas(filtradas);
    });

    ordenarSelect.addEventListener('change', () => {
      const criterio = ordenarSelect.value;
      if (criterio === 'añadido') {
        peliculas = [...peliculasOriginal];
      } else if (criterio === 'titulo') {
        peliculas.sort((a, b) => a.titulo.localeCompare(b.titulo));
      } else if (criterio === 'anio') {
        peliculas.sort((a, b) => b.anio.localeCompare(a.anio));
      }
      filtrar('todos');
    });

    db.collection('peliculas').get()
      .then(snap => {
        const datos = snap.docs.map(doc => doc.data());
        peliculasOriginal = datos.length > 0 ? datos : respaldoLocal;
        peliculas = [...peliculasOriginal];
        filtrar('todos');
      })
      .catch(err => {
        console.warn("Error Firebase:", err.message);
        peliculasOriginal = [...respaldoLocal];
        peliculas = [...peliculasOriginal];
        filtrar('todos');
      });

    // Avatar y menú usuario
    const avatar = document.querySelector('.avatar');
    const menuUsuario = document.getElementById('menuUsuario');
    const nombreUsuario = document.getElementById('nombreUsuario');
    const correoUsuario = document.getElementById('correoUsuario');

    avatar.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    avatar.title = user.displayName || user.email;

    nombreUsuario.textContent = user.displayName || "Usuario";
    correoUsuario.textContent = user.email;

    function isMenuVisible() {
      return window.getComputedStyle(menuUsuario).display === 'block';
    }

    avatar.addEventListener('click', e => {
      e.stopPropagation();
      if (isMenuVisible()) {
        menuUsuario.style.display = 'none';
      } else {
        menuUsuario.style.display = 'block';
      }
      console.log("Toggle menú, visible:", isMenuVisible());
    });

    document.addEventListener('click', () => {
      if (isMenuVisible()) {
        menuUsuario.style.display = 'none';
        console.log("Click fuera: ocultando menú");
      }
    });
  }

  // Función para cerrar sesión
  window.cerrarSesion = function () {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = "index.html";
      });
  };
});
