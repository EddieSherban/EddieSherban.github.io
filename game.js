const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.fillStyle = "lime";
ctx.fillRect(72, 72, 16, 16); // pixel player

let x = 72, y = 72;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") x -= 2;
  if (e.key === "ArrowRight") x += 2;
  if (e.key === "ArrowUp") y -= 2;
  if (e.key === "ArrowDown") y += 2;
});

function loop() {
  ctx.clearRect(0,0,160,160);
  ctx.fillRect(x, y, 16, 16);
  requestAnimationFrame(loop);
}
loop();
