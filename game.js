const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "lime";
ctx.fillRect(72, 72, 16, 16); // pixel player
