// File: game.js

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

let worldImage = new Image();
worldImage.src = "world.png";

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

// Start animation loop
worldImage.onload = () => {
    resizeCanvas();
    requestAnimationFrame(loop);
};

// Click to change image
canvas.addEventListener("click", () => {
    // Create a new Image object for the new source
    const newImage = new Image();
    if (worldImage.src.includes("world.png")) {
        newImage.src = "girly.png";
    } else {
        newImage.src = "world.png";
    }

    newImage.onload = () => {
        worldImage = newImage; // replace the current image
    };
});

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the current image scaled to the canvas
    ctx.drawImage(worldImage, 0, 0, canvas.width, canvas.height);

    requestAnimationFrame(loop);
}
