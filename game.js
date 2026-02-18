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
