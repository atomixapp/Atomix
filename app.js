document.addEventListener('DOMContentLoaded', () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  auth.onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = 'index.html';
    } else {
      inicializarApp(user);
    }
  });

  function inicializarApp(user) {
    let peliculasOriginal = [];
    let peliculas = [];

    const galeria = document.getElementById('galeria');
    const navPeliculas = document.getElementById('navPeliculas');
    const navFavoritos = document.getElementById('navFavoritos');

    function generarID(titulo) {
      return titulo
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '');
    }

    function mostrarPeliculas(lista) {
      galeria.innerHTML = '';
      obtenerFavoritosFirestore(user.uid)
        .then(favoritos => {
          console.log("Favoritos obtenidos:", favoritos);
          lista.forEach(p => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'pelicula';
            const esFavorito = favoritos.includes(p.titulo);

            tarjeta.innerHTML = `
              <h3>${p.titulo}</h3>
              <div class="corazon ${esFavorito ? 'activo' : ''}" data-titulo="${p.titulo}">
                ❤️
              </div>
            `;
            galeria.appendChild(tarjeta);
          });

          document.querySelectorAll('.corazon').forEach(icon => {
            icon.addEventListener('click', e => {
              const titulo = e.currentTarget.dataset.titulo;
              const pelicula = peliculas.find(p => p.titulo === titulo);
              if (!pelicula) {
                console.warn("Película no encontrada para título:", titulo);
                return;
              }
              e.currentTarget.classList.toggle('activo');
              toggleFavoritoFirestore(pelicula, user.uid)
                .then(() => {
                  console.log("Toggle favorito completado para", pelicula.titulo);
                })
                .catch(err => {
                  console.error("Error toggle favorito:", err);
                  e.currentTarget.classList.toggle('activo'); // revertir toggle si falla
                });
            });
          });
        });
    }

    function toggleFavoritoFirestore(pelicula, userId) {
      const tituloID = generarID(pelicula.titulo);
      const docRef = db.collection('usuarios').doc(userId).collection('favoritos').doc(tituloID);

      return docRef.get().then(docSnapshot => {
        if (docSnapshot.exists) {
          console.log("Eliminando favorito:", pelicula.titulo);
          return docRef.delete();
        } else {
          console.log("Agregando favorito:", pelicula.titulo);
          return docRef.set({
            titulo: pelicula.titulo,
            imagen: pelicula.imagen || '',
            anio: pelicula.anio || '',
            castellano: pelicula.castellano || false,
            latino: pelicula.latino || false
          });
        }
      });
    }

    function obtenerFavoritosFirestore(userId) {
      return db.collection('usuarios').doc(userId).collection('favoritos').get()
        .then(snap => {
          return snap.docs.map(doc => doc.data().titulo);
        });
    }

    // Cargar las películas desde Firestore
    db.collection('peliculas').get()
      .then(snap => {
        peliculasOriginal = snap.docs.map(doc => doc.data());
        peliculas = [...peliculasOriginal];
        mostrarPeliculas(peliculas);
      })
      .catch(err => {
        console.error("Error al cargar películas:", err);
        galeria.innerHTML = "<p>Error cargando películas.</p>";
      });

    navPeliculas.addEventListener('click', () => {
      navFavoritos.classList.remove('activo');
      navPeliculas.classList.add('activo');
      mostrarPeliculas(peliculas);
    });

    navFavoritos.addEventListener('click', () => {
      navPeliculas.classList.remove('activo');
      navFavoritos.classList.add('activo');
      db.collection('usuarios').doc(user.uid).collection('favoritos').get()
        .then(snap => {
          const favoritas = snap.docs.map(doc => doc.data());
          mostrarPeliculas(favoritas);
        });
    });
  }

  window.cerrarSesion = function () {
    firebase.auth().signOut()
      .then(() => {
        window.location.href = "index.html";
      });
  };
});
