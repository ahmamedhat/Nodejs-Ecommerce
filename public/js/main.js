const toggle = () => {
    const nav = document.getElementById("topnav");
    nav.className === "header__navbar topnav" ? nav.className += " responsive" : nav.className = "header__navbar topnav";
};