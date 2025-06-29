<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Atomix TV - Canales</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="firebase.js"></script>
</head>
<body>

<header class="navbar">
  <nav class="nav-left">
    <a class="activo" href="tv.html">TV</a>
    <a href="home.html">Películas</a>
    <a href="#">Series</a>
  </nav>
  <div class="nav-right">
    <button id="botonCuenta">Mi cuenta</button>
    <div id="menuUsuario" class="menu-usuario">
      <p id="nombreUsuario">Usuario</p>
      <p id="correoUsuario">correo@correo.com</p>
      <button onclick="cerrarSesion()">Cerrar sesión</button>
    </div>
  </div>
</header>

<div class="app-container">
  <aside>
    <h2>Categorías</h2>
    <ul>
      <li class="activo" onclick="mostrarCanal('todos')">Todos</li>
      <li onclick="mostrarCanal('noticias')">Noticias</li>
      <li onclick="mostrarCanal('deportes')">Deportes</li>
      <li onclick="mostrarCanal('entretenimiento')">Entretenimiento</li>
      <li onclick="mostrarFavoritos()">Favoritos</li>
    </ul>
  </aside>

  <main>
    <div class="top-bar">
      <h1 id="tituloGaleria">Todos</h1>
      <button id="lupaBtn"><i class="fa-solid fa-magnifying-glass"></i></button>
    </div>

    <div id="busquedaBar" class="busqueda-bar">
      <input type="text" id="buscador" placeholder="Buscar canal...">
    </div>

    <div id="canales" class="galeria"></div>
  </main>
</div>

<script src="tv.js"></script>
</body>
</html>
