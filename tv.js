// tv.js

// Asume que firebase.js ya inicializó Firebase y declaró `db`, `firebase`, `auth`

document.addEventListener("DOMContentLoaded", () => {
  const user = firebase.auth().currentUser;

  firebase.auth().onAuthStateChanged(user => {
    if (!user || !user.emailVerified) {
      window.location.href = "index.html";
    } else {
      inicializarTV(user);
    }
  });

  function inicializarTV(user) {
    const contenedor = document.getElementById("canales");
    const buscador = document.getElementById("buscador");
    const navFavoritos = document.getElementById("navFavoritos");
    const botonCuenta = document.getElementById("botonCuenta");
    const menuUsuario = document.getElementById("menuUsuario");
    const nombreUsuario = document.getElementById("nombreUsuario");
    const correoUsuario = document.getElementById("correoUsuario");

    let canalesOriginal = [];
    let canales = [];

    nombreUsuario.textContent = user.displayName || "Usuario";
    correoUsuario.textContent = user.email;

    botonCuenta.addEventListener("click", e => {
      e.stopPropagation();
      menuUsuario.style.display = menuUsuario.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
      if (menuUsuario.style.display === "block") {
        menuUsuario.style.display = "none";
      }
    });

    buscador.addEventListener("input", () => {
      const texto = buscador.value.toLowerCase();
      const filtrados = canales.filter(c => c.titulo.toLowerCase().includes(texto));
      renderizarCanales(filtrados);
    });

    function renderizarCanales(lista) {
      contenedor.innerHTML = "";

      if (lista.length === 0) {
        contenedor.innerHTML = "<p style='color: white;'>No hay canales disponibles.</p>";
        return;
      }

      lista.forEach(canal => {
        const card = document.createElement("div");
        card.className = "card";

        const corazonActivo = canal.favorito ? "activo" : "";

        card.innerHTML = `
          <h3>${canal.titulo}</h3>
          <video controls width="100%" src="${canal.url}"></video>
          <div class="corazon ${corazonActivo}" data-titulo="${canal.titulo}">
            <i class="fa-solid fa-heart"></i>
          </div>
        `;

        contenedor.appendChild(card);
      });

      document.querySelectorAll('.corazon').forEach(icon => {
        icon.addEventListener('click', async e => {
          const titulo = e.currentTarget.dataset.titulo;
          const canal = canalesOriginal.find(c => c.titulo === titulo);

          if (!canal) return;

          e.currentTarget.classList.toggle('activo');

          try {
            await toggleFavoritoFirestore(canal, user.uid);
            console.log("Canal favorito actualizado:", canal.titulo);

            if (navFavoritos.classList.contains("activo")) {
              setTimeout(() => cargarFavoritos(), 300);
            }

          } catch (err) {
            console.error("Error al actualizar favorito:", err);
            e.currentTarget.classList.toggle('activo');
          }
        });
      });
    }

    function toggleFavoritoFirestore(canal, userId) {
      const id = canal.titulo.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      const docRef = db.collection('usuarios').doc(userId).collection('favoritos').doc(id);

      return docRef.get().then(doc => {
        if (doc.exists) {
          return docRef.delete();
        } else {
          return docRef.set({
            titulo: canal.titulo,
            imagen: canal.imagen || '',
            url: canal.url || '',
            categoria: canal.categoria || 'otros'
          });
        }
      });
    }

    function obtenerFavoritosFirestore(userId) {
      return db.collection('usuarios').doc(userId).collection('favoritos').get()
        .then(snap => snap.docs.map(doc => doc.data().titulo));
    }

    function cargarFavoritos() {
      db.collection('usuarios').doc(user.uid).collection('favoritos').get()
        .then(snap => {
          const favoritos = snap.docs.map(doc => doc.data());
          renderizarCanales(favoritos);
        });
    }

    window.seleccionarCategoria = function (elemento, categoria) {
      document.querySelectorAll("aside ul li").forEach(li => li.classList.remove("activo"));
      elemento.classList.add("activo");
      mostrarCanal(categoria);
    };

    function mostrarCanal(categoria) {
      contenedor.innerHTML = "<p class='cargando'>Cargando...</p>";

      db.collection("canales").get()
        .then(snapshot => snapshot.docs.map(doc => doc.data()))
        .then(async data => {
          const favoritos = await obtenerFavoritosFirestore(user.uid);

          canalesOriginal = data.map(c => ({
            ...c,
            favorito: favoritos.includes(c.titulo)
          }));

          canales = categoria === 'todos'
            ? canalesOriginal
            : canalesOriginal.filter(c => c.categoria === categoria);

          renderizarCanales(canales);
        })
        .catch(err => {
          console.error("Error al cargar canales:", err);
          contenedor.innerHTML = "<p style='color: white;'>Error al cargar canales.</p>";
        });
    }

    mostrarCanal('todos');
  }

  window.cerrarSesion = function () {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    });
  };
});
