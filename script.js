const button = document.querySelector(".download");

button.addEventListener("click", () => {

button.innerHTML = "Descargando...";

setTimeout(() => {

button.innerHTML = "Descargar APK";

},3000);

});

window.addEventListener("scroll",()=>{

    const header=document.querySelector(".topbar");

    if(window.scrollY>40){

        header.classList.add("scrolled");

    }else{

        header.classList.remove("scrolled");

    }

});
