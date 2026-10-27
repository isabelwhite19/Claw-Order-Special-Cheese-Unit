// PROJECT: Claw & Order: Special Cheese Unit

// GLOBAL VARIABLES & ASSET CONTAINERS  
let mouseImg = null;       
let detectiveMouseImg = null; // Cover screen detective mouse image
let cheeseShopImg = null;  
let cheeseImg = null;      

// Audio & Audio Buffers
let audioCtx = null;
let soundBuffers = {};

// Background music containers
let ambientMusic = null;  // Plays on Cover Screen & Levels 1 & 2
let jazzMusic = null;     // Plays in Levels 3, 4 & 5
let paradiseMusic = null; // Plays at the Cheese Shop finale
let dangerSound = null;   // Plays on the "Uh Oh" Cat Café warning screen

let mouseAgent;     
let cats = [];      
let cheeses = [];   
let coffeeCups = []; 
let exitHole;       
let currentLevel = 1; 
let maxLevels = 5;  
let gameState = "START"; 

//Loads audio files directly into Web Audio API buffers
async function loadSFXBuffer(url) {
  try {
    let response = await fetch(url);
    let arrayBuffer = await response.arrayBuffer();
    return await audioCtx.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error("Failed to load sound buffer: " + url, e);
    return null;
  }
}

// Helper function: Plays an uncompressed Web Audio API buffer instantly
function playInstantSFX(buffer, volume = 1.0) {
  if (!buffer || !audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  let source = audioCtx.createBufferSource();
  source.buffer = buffer;

  let gainNode = audioCtx.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start(0);
}

//Loads assets asynchronously
async function setup() {
  createCanvas(600, 600);

  // Initialize Web Audio API context for instant SFX playback
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  // Load external graphic assets asynchronously
  mouseImg = await loadImage('mouse.png');
  detectiveMouseImg = await loadImage('detectivemouse.png');
  cheeseShopImg = await loadImage('cheeseshop.png');
  cheeseImg = await loadImage('cheese.png');

  // Asynchronously load sound buffers into Web Audio API memory
  soundBuffers['chomp'] = await loadSFXBuffer('chomp.wav');
  soundBuffers['pop'] = await loadSFXBuffer('pop.wav');
  soundBuffers['catscream'] = await loadSFXBuffer('catscream.wav');
  soundBuffers['gulp'] = await loadSFXBuffer('gulp.wav');

  // Initialize background music & special sound effects
  ambientMusic = new Audio('ambient.wav');
  ambientMusic.loop = true;
  ambientMusic.volume = 0.35;

  jazzMusic = new Audio('jazz.mp3');
  jazzMusic.loop = true;
  jazzMusic.volume = 0.35; 

  paradiseMusic = new Audio('paradise.wav');
  paradiseMusic.loop = true;
  paradiseMusic.volume = 0.35;

  dangerSound = new Audio('danger.wav');
  dangerSound.volume = 0.45;

  loadLevel(currentLevel);
  gameState = "START";
}

// LEVEL INITIALIZATION & CONFIGURATION 
function loadLevel(lvl) {
  mouseAgent = new MouseAgent(80, 520);
  exitHole = { x: 520, y: 80, size: 50 };
  cats = [];
  cheeses = [];
  coffeeCups = [];

  if (lvl === 1) { 
    cheeses.push({ x: 250, y: 350, size: 28, collected: false });
    cheeses.push({ x: 450, y: 200, size: 28, collected: false });
  } else if (lvl === 2) { 
    cheeses.push({ x: 300, y: 320, size: 28, collected: false });
    cheeses.push({ x: 150, y: 220, size: 28, collected: false });
  } else if (lvl === 3) { 
    cheeses.push({ x: 200, y: 300, size: 28, collected: false });
    cheeses.push({ x: 400, y: 300, size: 28, collected: false });
    coffeeCups.push({ x: 42, y: 172, spilled: false });
    coffeeCups.push({ x: 280, y: 520, spilled: false });
  } else if (lvl === 4) { 
    cheeses.push({ x: 300, y: 250, size: 28, collected: false });
    cheeses.push({ x: 150, y: 380, size: 28, collected: false });
    coffeeCups.push({ x: 268, y: 150, spilled: false });
    coffeeCups.push({ x: 292, y: 150, spilled: false });
    coffeeCups.push({ x: 440, y: 470, spilled: false });
  } else if (lvl === 5) { 
    cheeses.push({ x: 200, y: 300, size: 28, collected: false });
    cheeses.push({ x: 400, y: 300, size: 28, collected: false });
    coffeeCups.push({ x: 290, y: 472, spilled: false });
    coffeeCups.push({ x: 310, y: 472, spilled: false });
  }

  if (lvl === 1) { 
    cats.push(new Cat(100, 200, 500, 200, 0.009, 75, 1));
  } else if (lvl === 2) { 
    cats.push(new Cat(100, 150, 500, 150, 0.01, 85, 1));
    cats.push(new Cat(300, 480, 300, 220, 0.008, 0, 2));
  } else if (lvl === 3) { 
    cats.push(new Cat(100, 140, 500, 140, 0.008, 55, 1));
    cats.push(new Cat(500, 220, 100, 220, 0.008, 55, 2));
    cats.push(new Cat(100, 420, 500, 420, 0.008, 55, 3));
  } else if (lvl === 4) { 
    cats.push(new Cat(120, 150, 480, 420, 0.005, 35, 1));
    cats.push(new Cat(480, 150, 120, 420, 0.005, 35, 2));
    cats.push(new Cat(150, 380, 450, 380, 0.005, 35, 3));
  } else if (lvl === 5) { 
    cats.push(new Cat(120, 140, 480, 140, 0.0045, 30, 1));
    cats.push(new Cat(480, 230, 120, 230, 0.0045, 30, 2));
    cats.push(new Cat(120, 320, 480, 320, 0.0045, 30, 3));
    cats.push(new Cat(480, 410, 120, 410, 0.0045, 30, 1));
  }

  gameState = "PLAYING";
}

function draw() {
  if (!mouseImg || !detectiveMouseImg || !cheeseShopImg || !cheeseImg) {
    background(200);
    textAlign(CENTER, CENTER);
    fill(50);
    text("Loading assets...", width / 2, height / 2);
    return;
  }

  // Manage background music playback based on active level & game state
  if (gameState === "START" || (gameState === "PLAYING" && currentLevel <= 2)) {
    if (paradiseMusic && !paradiseMusic.paused) {
      paradiseMusic.pause();
      paradiseMusic.currentTime = 0;
    }
    if (jazzMusic && !jazzMusic.paused) {
      jazzMusic.pause();
      jazzMusic.currentTime = 0;
    }
    if (ambientMusic && ambientMusic.paused) {
      ambientMusic.play().catch(e => {});
    }
  } else if (gameState === "PLAYING" && currentLevel > 2) {
    if (paradiseMusic && !paradiseMusic.paused) {
      paradiseMusic.pause();
      paradiseMusic.currentTime = 0;
    }
    if (ambientMusic && !ambientMusic.paused) {
      ambientMusic.pause();
      ambientMusic.currentTime = 0;
    }
    if (jazzMusic && jazzMusic.paused) {
      jazzMusic.play().catch(e => {});
    }
  } else if (gameState === "FINALE_SEQUENCE") {
    if (ambientMusic && !ambientMusic.paused) {
      ambientMusic.pause();
      ambientMusic.currentTime = 0;
    }
    if (jazzMusic && !jazzMusic.paused) {
      jazzMusic.pause();
      jazzMusic.currentTime = 0;
    }
    if (paradiseMusic && paradiseMusic.paused) {
      paradiseMusic.play().catch(e => {});
    }
  } else {
    if (ambientMusic && !ambientMusic.paused) {
      ambientMusic.pause();
      ambientMusic.currentTime = 0;
    }
    if (jazzMusic && !jazzMusic.paused) {
      jazzMusic.pause();
      jazzMusic.currentTime = 0;
    }
    if (paradiseMusic && !paradiseMusic.paused) {
      paradiseMusic.pause();
      paradiseMusic.currentTime = 0;
    }
  }

  drawLevelBackground(currentLevel);

  if (gameState === "PLAYING") {
    drawExitHole();
    drawCheeses();
    drawCoffeeCups(); 

    for (let c of cats) {
      c.update();
      c.draw();
    }

    mouseAgent.update();
    mouseAgent.draw();

    checkCollisions();
  } else {
    drawEndScreen();
  }
}

function drawLevelBackground(lvl) {
  if (lvl === 1) {
    background(90, 165, 30);
    drawFlowers();

    noStroke();
    fill(160, 110, 60);
    beginShape();
    vertex(50, height);
    vertex(120, height);
    vertex(560, 100);
    vertex(480, 100);
    endShape(CLOSE);

    fill(140, 80, 40);
    rect(exitHole.x - 50, 0, 100, exitHole.y + 12);
    stroke(100, 50, 20);
    strokeWeight(2);
    line(exitHole.x - 50, exitHole.y + 12, exitHole.x + 50, exitHole.y + 12);

  } else if (lvl === 2) {
    background(110, 170, 60);

    // Parking lot base pavement
    fill(180, 170, 155);
    stroke(130, 120, 110);
    strokeWeight(2);
    rect(60, 80, width - 120, height - 140, 15);

    // Parking stall white lines only (wheel stops removed)
    stroke(255, 255, 255, 220);
    strokeWeight(3);
    for (let px = 120; px <= 480; px += 90) {
      line(px, 80, px, 140);
      line(px, height - 60, px, height - 120);
    }

    noStroke();
    fill(190, 80, 70);
    rect(60, 0, width - 120, 80);

    stroke(160, 60, 50);
    strokeWeight(1.5);
    for (let y = 15; y < 80; y += 15) {
      line(60, y, width - 60, y);
    }
    for (let x = 60; x < width - 60; x += 30) {
      line(x, 0, x, 15);
      line(x + 15, 15, x + 15, 30);
      line(x, 30, x, 45);
      line(x + 15, 45, x + 15, 60);
      line(x, 60, x, 75);
    }

  } else if (lvl === 3) {
    drawCafeRoom1();
  } else if (lvl === 4) {
    drawCafeRoom2();
  } else if (lvl === 5) {
    drawCafeRoom3();
  }

  fill(255);
  stroke(0);
  strokeWeight(3);
  textSize(20);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text("LEVEL " + lvl + " / " + maxLevels, 20, 20);
}

function drawCafeBaseFloor() {
  noStroke();
  fill(225, 175, 130);
  rect(0, 120, width, height - 120);

  stroke(195, 145, 100);
  strokeWeight(2);
  for (let y = 120; y < height; y += 45) {
    line(0, y, width, y);
  }
}

function drawCoffeeCups() {
  for (let cup of coffeeCups) {
    push();
    translate(cup.x, cup.y);

    if (cup.spilled) {
      noStroke();
      fill(90, 50, 20, 180);
      ellipse(0, 4, 30, 16); 

      push();
      rotate(HALF_PI); 
      fill(245, 245, 250);
      rect(-8, -6, 16, 14, 2, 2, 4, 4);
      pop();
    } else {
      stroke(240, 240, 240, 180);
      strokeWeight(1.5);
      noFill();
      let steamOffset = sin(frameCount * 0.1) * 3;
      bezier(-2, -8, -5 + steamOffset, -14, 0 - steamOffset, -18, -2, -22);
      bezier(3, -8, 0 + steamOffset, -14, 5 - steamOffset, -18, 3, -22);

      noFill();
      stroke(220, 220, 230);
      strokeWeight(2.5);
      arc(10, 0, 10, 12, -HALF_PI, HALF_PI);

      noStroke();
      fill(245, 245, 250);
      rect(-8, -6, 16, 14, 2, 2, 4, 4);

      fill(90, 50, 20);
      ellipse(0, -6, 14, 5);
    }

    pop();
  }
}

function drawCafeRoom1() {
  noStroke();
  fill(255, 220, 225); 
  rect(0, 0, width, 120);
  drawCafeBaseFloor();

  stroke(180, 120, 130);
  strokeWeight(4);
  line(0, 120, width, 120);

  noStroke();
  fill(180, 140, 100);
  rect(35, 120, 14, 150);
  fill(210, 180, 140);
  ellipse(42, 180, 70, 20);
  ellipse(42, 270, 80, 25);

  fill(100, 180, 220);
  ellipse(130, 480, 30, 18);
  fill(230);
  ellipse(130, 479, 22, 12);

  fill(255, 90, 120);
  ellipse(380, 280, 22, 22);
  fill(90, 200, 255);
  ellipse(140, 240, 18, 18);
}

function drawCafeRoom2() {
  noStroke();
  fill(220, 235, 220); 
  rect(0, 0, width, 120);
  drawCafeBaseFloor();

  stroke(140, 170, 140);
  strokeWeight(4);
  line(0, 120, width, 120);

  fill(140, 90, 60);
  ellipse(280, 160, 90, 50);
  fill(170, 110, 75);
  ellipse(280, 158, 80, 42);

  fill(140, 90, 60);
  ellipse(440, 480, 90, 50);
  fill(170, 110, 75);
  ellipse(440, 478, 80, 42);

  stroke(130, 80, 90);
  strokeWeight(3);
  fill(255, 245, 235);
  rect(160, 35, 45, 55, 4);
  rect(380, 35, 45, 55, 4);
  noStroke();
  fill(230, 120, 140);
  ellipse(402, 65, 12, 10);
}

function drawCafeRoom3() {
  noStroke();
  fill(210, 190, 230); 
  rect(0, 0, width, 120);
  drawCafeBaseFloor();

  stroke(150, 130, 170);
  strokeWeight(4);
  line(0, 120, width, 120);

  fill(180, 60, 90);
  ellipse(150, 180, 100, 50);
  fill(220, 90, 120);
  ellipse(150, 178, 85, 40);

  fill(60, 100, 180);
  ellipse(450, 420, 110, 55);
  fill(90, 140, 220);
  ellipse(450, 418, 95, 45);

  fill(140, 90, 60);
  ellipse(300, 480, 70, 40);
  fill(170, 110, 75);
  ellipse(300, 478, 62, 32);
}

function drawFlowers() {
  let flowerPos = [
    {x: 100, y: 100}, {x: 200, y: 450}, {x: 400, y: 120},
    {x: 180, y: 280}, {x: 480, y: 400}, {x: 350, y: 480}
  ];

  for (let f of flowerPos) {
    noStroke();
    fill(255, 180, 200);
    ellipse(f.x - 5, f.y, 8, 8);
    ellipse(f.x + 5, f.y, 8, 8);
    ellipse(f.x, f.y - 5, 8, 8);
    ellipse(f.x, f.y + 5, 8, 8);
    fill(255, 220, 0);
    ellipse(f.x, f.y, 6, 6);
  }
}

// Handle start / retry via key press
function keyPressed() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Always stop the danger sound immediately on any key press if it's playing
  if (dangerSound && !dangerSound.paused) {
    dangerSound.pause();
    dangerSound.currentTime = 0;
  }

  if (gameState === "START") {
    gameState = "PLAYING";
  } else if (gameState === "GAME_OVER") {
    loadLevel(currentLevel);
  } else if (gameState === "LEVEL_CLEAR") {
    currentLevel++;
    if (currentLevel === 3) { 
      gameState = "PRE_LEVEL_3";
      if (dangerSound) {
        dangerSound.currentTime = 0;
        dangerSound.play().catch(e => {});
      }
    } else {
      loadLevel(currentLevel);
    }
  } else if (gameState === "PRE_LEVEL_3") {
    loadLevel(3);
  } else if (gameState === "FINALE_SEQUENCE") {
    currentLevel = 1;
    loadLevel(currentLevel);
    gameState = "START";
  }
}

function checkCollisions() {
  for (let ch of cheeses) {
    if (!ch.collected) {
      let dCheese = dist(mouseAgent.x, mouseAgent.y, ch.x, ch.y);
      if (dCheese < 30) {
        ch.collected = true;
        playInstantSFX(soundBuffers['chomp'], 0.8);
      }
    }
  }

  for (let cup of coffeeCups) {
    if (!cup.spilled) {
      let dCup = dist(mouseAgent.x, mouseAgent.y, cup.x, cup.y);
      if (dCup < 28) {
        cup.spilled = true; 
        mouseAgent.boostTimer = 240; 
        playInstantSFX(soundBuffers['gulp'], 0.8);
      }
    }
  }

  let allCollected = cheeses.every(ch => ch.collected);

  let dExit = dist(mouseAgent.x, mouseAgent.y, exitHole.x, exitHole.y);
  if (dExit < 35 && allCollected) {
    playInstantSFX(soundBuffers['pop'], 0.8);

    if (currentLevel < maxLevels) {
      gameState = "LEVEL_CLEAR";
    } else {
      gameState = "FINALE_SEQUENCE";
    }
  }

  for (let c of cats) {
    let dCat = dist(mouseAgent.x, mouseAgent.y, c.x, c.y);
    if (dCat < 48 || c.canSeeMouse(mouseAgent)) {
      if (gameState !== "GAME_OVER") {
        playInstantSFX(soundBuffers['catscream'], 0.8);
      }
      gameState = "GAME_OVER";
    }
  }
}

class MouseAgent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseSpeed = 3.5;
    this.speed = 3.5;
    this.boostTimer = 0;
    this.heading = 0; 
  }

  update() {
    if (this.boostTimer > 0) {
      this.speed = 6.5; 
      this.boostTimer--;
    } else {
      this.speed = this.baseSpeed;
    }

    let dx = 0;
    let dy = 0;

    if (keyIsDown(LEFT_ARROW)) dx -= 1;
    if (keyIsDown(RIGHT_ARROW)) dx += 1;
    if (keyIsDown(UP_ARROW)) dy -= 1;
    if (keyIsDown(DOWN_ARROW)) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    if (dx !== 0 || dy !== 0) {
      this.heading = atan2(dy, dx) - HALF_PI;
    }

    this.x += dx * this.speed;
    this.y += dy * this.speed;

    let margin = 25;
    this.x = constrain(this.x, margin, width - margin);
    this.y = constrain(this.y, margin, height - margin);
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.heading); 
    imageMode(CENTER);
    image(mouseImg, 0, 0, 50, 50);
    pop();
  }
}

class Cat {
  constructor(x1, y1, x2, y2, baseSpeed, fovRadius, catType = 1) {
    this.p1 = createVector(x1, y1);
    this.p2 = createVector(x2, y2);
    this.t = 0;
    this.baseSpeed = baseSpeed;
    this.speed = baseSpeed;
    this.x = x1;
    this.y = y1;
    this.fovRadius = fovRadius;
    this.catType = catType;
  }

  update() {
    let isNearCoffee = false;
    for (let cup of coffeeCups) {
      if (!cup.spilled && dist(this.x, this.y, cup.x, cup.y) < 35) {
        isNearCoffee = true;
        break;
      }
    }

    let currentSpeed = isNearCoffee ? this.baseSpeed * 2.5 : this.baseSpeed;

    this.t += currentSpeed;
    if (this.t > 1 || this.t < 0) {
      this.baseSpeed *= -1; 
      currentSpeed *= -1;
    }

    this.x = lerp(this.p1.x, this.p2.x, this.t);
    this.y = lerp(this.p1.y, this.p2.y, this.t);
  }

  canSeeMouse(m) {
    if (this.fovRadius === 0) return false;
    let d = dist(this.x, this.y, m.x, m.y);
    return d < this.fovRadius;
  }

  draw() {
    if (this.fovRadius > 0) {
      noStroke();
      fill(255, 50, 50, 35);
      ellipse(this.x, this.y, this.fovRadius * 2);
    }
    drawCatGraphic(this.x, this.y, this.catType);
  }
}

function drawCatGraphic(cx, cy, catType) {
  push();
  translate(cx, cy);

  let bodyColor, earInnerColor, eyeColor, markingColor;

  if (catType === 1) {
    bodyColor = color(245, 140, 40);
    earInnerColor = color(255, 180, 190);
    eyeColor = color(255, 230, 80);
    markingColor = color(200, 100, 20);
  } else if (catType === 2) {
    bodyColor = color(40, 40, 45);
    earInnerColor = color(220, 140, 160);
    eyeColor = color(100, 255, 120);
    markingColor = color(250);
  } else {
    bodyColor = color(245, 230, 210);
    earInnerColor = color(255, 170, 180);
    eyeColor = color(255, 180, 50);
    markingColor = color(190, 100, 40);
  }

  stroke(bodyColor);
  strokeWeight(10);
  noFill();
  let tailWiggle = sin(frameCount * 0.1) * 15;
  bezier(0, 15, -20, 25, -30 + tailWiggle, -5, -25 + tailWiggle, -20);

  noStroke();
  fill(bodyColor);
  ellipse(0, 8, 54, 46);

  if (catType !== 1) {
    fill(250);
    ellipse(0, 12, 28, 28);
  }

  push();
  translate(-16, -16);
  rotate(-QUARTER_PI * 0.7);
  fill(bodyColor);
  triangle(-10, 7, 0, -16, 10, 7);
  fill(earInnerColor);
  triangle(-6, 5, 0, -12, 6, 5);
  pop();

  push();
  translate(16, -16);
  rotate(QUARTER_PI * 0.7);
  fill(bodyColor);
  triangle(-10, 7, 0, -16, 10, 7);
  fill(earInnerColor);
  triangle(-6, 5, 0, -12, 6, 5);
  pop();

  fill(bodyColor);
  ellipse(0, -6, 46, 40);

  if (catType === 1) {
    stroke(markingColor);
    strokeWeight(2);
    line(0, -22, 0, -15);
    line(-5, -20, -3, -14);
    line(5, -20, 3, -14);
  } else if (catType === 3) {
    noStroke();
    fill(markingColor);
    ellipse(-12, -14, 16, 12);
  }

  stroke(markingColor);
  strokeWeight(3);
  line(-16, -18, -6, -14);
  line(16, -18, 6, -14);

  noStroke();
  fill(eyeColor);
  ellipse(-11, -8, 12, 14);
  ellipse(11, -8, 12, 14);

  fill(20);
  ellipse(-11, -8, 4, 10);
  ellipse(11, -8, 4, 10);

  fill(255);
  ellipse(-13, -11, 3, 3);
  ellipse(9, -11, 3, 3);

  fill(255, 140, 160);
  triangle(-3, -2, 3, -2, 0, 2);

  stroke(220);
  strokeWeight(1.5);
  line(-8, 1, -22, -2);
  line(-8, 3, -24, 4);
  line(8, 1, 22, -2);
  line(8, 3, 24, 4);

  pop();
}

function drawCheeses() {
  imageMode(CENTER);
  for (let ch of cheeses) {
    if (!ch.collected) {
      image(cheeseImg, ch.x, ch.y, ch.size, ch.size);
    }
  }
}

function drawExitHole() {
  push();
  translate(exitHole.x, exitHole.y);

  fill(90, 50, 20);
  noStroke();
  arc(0, 0, 54, 54, PI, 0);
  rect(-27, 0, 54, 15);

  fill(20, 15, 10);
  arc(0, 0, 42, 42, PI, 0);
  rect(-21, 0, 42, 12);

  stroke(60, 35, 15);
  strokeWeight(3);
  line(-32, 12, 32, 12);

  pop();
}

function drawEndScreen() {
  textAlign(CENTER, CENTER);
  textStyle(BOLD);

  if (gameState === "START") {
    background(25, 20, 40);

    imageMode(CENTER);
    let cheeseData = [
      { speedX: 0.3, speedY: 0.2, baseX: 50, baseY: 80, size: 28 },
      { speedX: -0.4, speedY: 0.3, baseX: 450, baseY: 130, size: 40 },
      { speedX: 0.5, speedY: -0.2, baseX: 200, baseY: 220, size: 34 },
      { speedX: -0.2, speedY: -0.4, baseX: 520, baseY: 380, size: 24 },
      { speedX: 0.4, speedY: 0.4, baseX: 120, baseY: 480, size: 45 },
      { speedX: -0.5, speedY: 0.2, baseX: 340, baseY: 520, size: 30 },
      { speedX: 0.3, speedY: -0.3, baseX: 500, baseY: 50, size: 36 },
      { speedX: -0.3, speedY: -0.5, baseX: 90, baseY: 300, size: 26 },
      { speedX: 0.6, speedY: 0.1, baseX: 280, baseY: 90, size: 38 },
      { speedX: -0.2, speedY: 0.5, baseX: 400, baseY: 420, size: 32 }
    ];

    for (let i = 0; i < cheeseData.length; i++) {
      let c = cheeseData[i];
      let x = (c.baseX + frameCount * c.speedX) % (width + 60) - 30;
      if (x < -30) x += width + 60;
      let y = (c.baseY + sin(frameCount * 0.03 + i) * 20 + frameCount * c.speedY) % (height + 60) - 30;
      if (y < -30) y += height + 60;

      tint(255, 255, 255, 120); 
      image(cheeseImg, x, y, c.size, c.size);
    }
    noTint(); 

    for (let j = 0; j < 15; j++) {
      let px = (j * 43 + 20) % width;
      let py = (j * 71 + 10) % height;
      let pSize = 3 + sin(frameCount * 0.05 + j) * 2;
      fill(255, 255, 200, 100 + sin(frameCount * 0.1 + j) * 80);
      noStroke();
      ellipse(px, py, pSize, pSize);
    }

    rectMode(CORNER);
    fill(15, 15, 25, 180);
    rect(40, 40, width - 80, height - 80, 20);
    stroke(255, 215, 0, 100);
    strokeWeight(2);
    noFill();
    rect(40, 40, width - 80, height - 80, 20);

    imageMode(CENTER);
    image(detectiveMouseImg, width / 2, height / 2 - 110, 120, 120);

    fill(255, 215, 0);
    textSize(26);
    textStyle(BOLD);
    text("Can you help Agent Cheddar", width / 2, height / 2 + 10);
    text("find the Cheese Shop", width / 2, height / 2 + 50);
    text("without being caught by the cats?", width / 2, height / 2 + 90);

    fill(255);
    textSize(18);
    textStyle(NORMAL);
    text("Use ARROW KEYS to move! Press any key to start.", width / 2, height / 2 + 160);

  } else {
    rectMode(CORNER);
    fill(0, 0, 0, 210);
    rect(0, 0, width, height);

    if (gameState === "PRE_LEVEL_3") {
      fill(255, 100, 100);
      textSize(28);
      text("UH OH!", width / 2, height / 2 - 50);
      fill(255);
      textSize(22);
      text("This isn't the Cheese Shop...", width / 2, height / 2);
      fill(255, 215, 0);
      text("YOU ARE ENTERING THE CAT CAFÉ! 🐱☕", width / 2, height / 2 + 40);
      textSize(16);
      fill(200);
      textStyle(NORMAL);
      text("Press any key to enter!", width / 2, height / 2 + 100);

    } else if (gameState === "LEVEL_CLEAR") {
      fill(100, 255, 100);
      textSize(36);
      text("LEVEL " + currentLevel + " CLEARED!", width / 2, height / 2 - 20);
      textSize(20);
      fill(255);
      textStyle(NORMAL);
      text("Press any key for Level " + (currentLevel + 1), width / 2, height / 2 + 30);

    } else if (gameState === "FINALE_SEQUENCE") {
      background(15, 20, 35);
      
      push();
      translate(width / 2, 210);
      let numRays = 12;
      for (let i = 0; i < numRays; i++) {
        let angle = (TWO_PI / numRays) * i + frameCount * 0.01;
        fill(255, 235, 120, 30);
        noStroke();
        arc(0, 0, 340, 340, angle, angle + 0.25);
      }
      pop();

      imageMode(CENTER);
      image(cheeseShopImg, width / 2, 210, 200, 150);

      fill(100, 255, 100);
      textSize(26);
      text("YOU ESCAPED THE CAT CAFÉ!", width / 2, 350);
      fill(255);
      textSize(20);
      textStyle(NORMAL);
      text("And there in the distance... The Cheese Shop!", width / 2, 400);
      fill(255, 215, 0);
      textSize(18);
      text("Press any key to restart", width / 2, 470);

    } else if (gameState === "GAME_OVER") {
      fill(255, 80, 80);
      textSize(34);
      text("AGENT CHEDDAR WAS CAUGHT!", width / 2, height / 2 - 20);
      textSize(20);
      fill(255);
      textStyle(NORMAL);
      text("Press any key to retry Level " + currentLevel, width / 2, height / 2 + 30);
    }
  }
}