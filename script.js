const button = document.querySelector(".download");

button.addEventListener("click", () => {

button.innerHTML = "Descargando...";

setTimeout(() => {

button.innerHTML = "Descargar APK";

},3000);

});