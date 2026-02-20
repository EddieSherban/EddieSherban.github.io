// File: game.js

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// IMAGES AND PATHS
const IMAGE_PATH = "assets/images/";
let currentImage = new Image();
let girlySprite = new Image();
currentImage.src = IMAGE_PATH + "world.png";
girlySprite.src = IMAGE_PATH + "girly.png";

// VARIABLES
const spriteWidth = 128;
const spriteHeight = 128;
let showOverlay = false;

// FUNCTIONS
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function cycleImages() {
    // Create a new Image object for the new source
    const newImage = new Image();

    if (currentImage.src.includes(IMAGE_PATH + "world.png")) {
        newImage.src = IMAGE_PATH + "girly.png";
    } else {
        newImage.src = IMAGE_PATH + "world.png";
    }

    newImage.onload = () => {
        currentImage = newImage; // replace the current image
    };  
}

function drawCycledImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the current image scaled to the canvas
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
}

function spriteOverlay() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the current image scaled to the canvas
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    if (showOverlay) {
        const x = canvas.width / 2 - spriteWidth / 2;
        const y = canvas.height / 2 - spriteHeight / 2;
        ctx.drawImage(girlySprite, x, y, spriteWidth, spriteHeight);
    }    
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function drawText(str) {
    // Draw text on top
    ctx.fillStyle = "white";
    ctx.font = "24px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(str, 120, 20);
}

function getSpriteBounds() {
    return {
        x: canvas.width / 2 - spriteWidth / 2,
        y: canvas.height / 2 - spriteHeight / 2,
        width: spriteWidth,
        height: spriteHeight
    };
}

function pointInRect(px, py, rect) {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

function clickedHitbox(evt) {
    const mouse = getMousePos(canvas, evt);
    const spriteRect = getSpriteBounds();

    if (pointInRect(mouse.x, mouse.y, spriteRect)){

        showOverlay = !showOverlay;
        console.log(`button pressed!
            mouse.x: ${mouse.x}
            mouse.y: ${mouse.y}`);
    }
}

// EVENT LISTENERS
window.addEventListener("resize", resizeCanvas);

// Start animation loop
currentImage.onload = () => {
    resizeCanvas();
    requestAnimationFrame(loop);
};

// Click to change image
canvas.addEventListener("click", (evt) => {
    clickedHitbox(evt);
    //cycleImages();
});


// MAIN FUNCTION
function loop() {
    spriteOverlay();
    //drawCycledImage();
    drawText("AYOOO");

    requestAnimationFrame(loop);
}
