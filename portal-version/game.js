/* =========================================================
   DUO ARENA
   Solo game logic, visuals, sound and ten levels
   ========================================================= */

"use strict";

// ---------------------------------------------------------
// 1. HTML ELEMENTS
// ---------------------------------------------------------

const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const arenaScoreDisplay = document.getElementById("arenaScore");
const arenaCoinsDisplay = document.getElementById("arenaCoins");
const levelDisplay = document.getElementById("levelDisplay");
const timerDisplay = document.getElementById("timerDisplay");

const messageOverlay = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const startScreen = document.getElementById("startScreen");
const startPracticeBtn = document.getElementById("startPracticeBtn");

const gameStatus = document.getElementById("gameStatus");
const restartBtn = document.getElementById("restart");
const playAgainBtn = document.getElementById("play-again");
const homeBtn = document.getElementById("homeBtn");

const musicToggleButton = document.getElementById("musicToggle");

// ---------------------------------------------------------
// 2. GAME SETTINGS
// ---------------------------------------------------------

const TARGET_SCORE = 10;
const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 3.5;
const COIN_COUNT = 6;
const levelDetails = window.DuoArenaLevels;
const buildLevelObstacles = level => levelDetails.createLevelObstacles(level);
const getLevelDetails = level => levelDetails.getLevelConfig(level);

const keys = {};

let player = {
  x: 400,
  y: 250,
  radius: PLAYER_RADIUS,
  speed: 3.2
};

let coins = [];
let coinBursts = [];
let floatingTexts = [];
let stars = [];
let shootingStars = [];
let playerTrail = [];

let score = 0;
let collected = 0;
let currentLevel = 1;
let remainingTime = getLevelDetails(currentLevel).duration;
let practiceTimer = null;
let gameOver = false;
let gameRunning = false;
let practiceMode = false;
let practiceLevelWon = false;


let musicEnabled = true;
let audioContext = null;
let musicTimer = null;

let playerWalkPhase = 0;
let previousPlayerPosition = { x: 100, y: 200 };

// ---------------------------------------------------------
// 3. OBSTACLES
// ---------------------------------------------------------

let obstacles = buildLevelObstacles(currentLevel);

// ---------------------------------------------------------
// 4. GENERAL HELPERS
// ---------------------------------------------------------

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showMessage(title, text) {
  if (messageTitle) {
    messageTitle.textContent = title;
  }

  if (messageText) {
    messageText.textContent = text;
  }

  if (messageOverlay) {
    messageOverlay.classList.remove(
      "hidden",
      "victory-effect",
      "defeat-effect"
    );

    if (
      title.toUpperCase().includes("WIN") ||
      title.toUpperCase().includes("LEVEL COMPLETE") ||
      title.toUpperCase().includes("BEAT THE GAME")
    ) {
      messageOverlay.classList.add("victory-effect");
    } else if (
      title.toUpperCase().includes("LOSE") ||
      title.toUpperCase().includes("GAME OVER") ||
      title.toUpperCase().includes("FAILED")
    ) {
      messageOverlay.classList.add("defeat-effect");
    }
  }

  if (playAgainBtn) {
    playAgainBtn.classList.remove("hidden");
  }
}
function hideMessage() {
  if (messageOverlay) {
    messageOverlay.classList.add("hidden");
  }

  if (playAgainBtn) {
    playAgainBtn.classList.add("hidden");
  }
}

// ---------------------------------------------------------
// 5. COIN CREATION
// ---------------------------------------------------------

function randomPosition(radius = 10) {
  return {
    x: randomBetween(radius + 5, canvas.width - radius - 5),
    y: randomBetween(radius + 5, canvas.height - radius - 5)
  };
}

function spawnCoin() {
  let position;
  let attempts = 0;

  do {
    position = randomPosition(12);
    attempts++;
  } while (
    attempts < 100 &&
    player &&
    Math.hypot(
      position.x - player.x,
      position.y - player.y
    ) < 65
  );

  return {
    ...position,
    radius: 9,
    phase: Math.random() * Math.PI * 2,
    sparklePhase: Math.random() * Math.PI * 2
  };
}

// ---------------------------------------------------------
// 6. ARENA BACKGROUND
// ---------------------------------------------------------

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.76)";
  ctx.beginPath();
  ctx.ellipse(0, 8, 38, 13, 0, 0, Math.PI * 2);
  ctx.ellipse(-16, 3, 18, 17, 0, 0, Math.PI * 2);
  ctx.ellipse(4, -4, 22, 23, 0, 0, Math.PI * 2);
  ctx.ellipse(24, 4, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawArena() {
  const w = canvas.width;
  const h = canvas.height;
  const time = performance.now() * 0.001;
  const theme = getLevelDetails(currentLevel);

  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(0.72, theme.sky[1]);
  sky.addColorStop(1, theme.sky[2]);

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunGlow = ctx.createRadialGradient(w * 0.78, h * 0.2, 4, w * 0.78, h * 0.2, w * 0.2);
  sunGlow.addColorStop(0, "rgba(255, 250, 205, 0.72)");
  sunGlow.addColorStop(1, "rgba(255, 250, 205, 0)");
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h * 0.62);

  ctx.fillStyle = theme.sun;
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.2, Math.min(w, h) * 0.055, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(w * (0.2 + Math.sin(time * 0.035) * 0.035), h * 0.22, 0.8);
  drawCloud(w * (0.56 + Math.sin(time * 0.025 + 1) * 0.04), h * 0.34, 0.55);
  drawCloud(w * (0.91 + Math.sin(time * 0.03 + 2) * 0.04), h * 0.17, 0.7);

  ctx.fillStyle = theme.hills[0];
  ctx.beginPath();
  ctx.moveTo(0, h * 0.63);
  ctx.bezierCurveTo(w * 0.18, h * 0.48, w * 0.3, h * 0.58, w * 0.46, h * 0.62);
  ctx.bezierCurveTo(w * 0.66, h * 0.66, w * 0.82, h * 0.48, w, h * 0.57);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.hills[1];
  ctx.beginPath();
  ctx.moveTo(0, h * 0.72);
  ctx.bezierCurveTo(w * 0.2, h * 0.62, w * 0.39, h * 0.71, w * 0.55, h * 0.68);
  ctx.bezierCurveTo(w * 0.76, h * 0.63, w * 0.86, h * 0.71, w, h * 0.65);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  const ground = ctx.createLinearGradient(0, h * 0.72, 0, h);
  ground.addColorStop(0, theme.ground[0]);
  ground.addColorStop(1, theme.ground[1]);
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
  ctx.fillRect(0, h * 0.72, w, 2);
}
// ---------------------------------------------------------
// 7. OBSTACLES
// ---------------------------------------------------------

function drawObstacle(obstacle) {
  ctx.save();

  const { x, y, width, height } = obstacle;
  const cornerX = Math.min(width * 0.24, 10);
  const cornerY = Math.min(height * 0.24, 10);
  const points = [
    [x + cornerX, y + height * 0.12],
    [x + width * 0.38, y],
    [x + width * 0.78, y + height * 0.06],
    [x + width, y + cornerY],
    [x + width - cornerX * 0.55, y + height * 0.76],
    [x + width * 0.62, y + height],
    [x + width * 0.2, y + height * 0.9],
    [x, y + height * 0.54]
  ];

  const stone = ctx.createLinearGradient(x, y, x + width * 0.8, y + height);
  stone.addColorStop(0, "#b8a17a");
  stone.addColorStop(0.42, "#827253");
  stone.addColorStop(1, "#514936");

  ctx.shadowColor = "rgba(45, 60, 28, 0.42)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = stone;
  ctx.beginPath();
  points.forEach(([pointX, pointY], index) => {
    if (index === 0) ctx.moveTo(pointX, pointY);
    else ctx.lineTo(pointX, pointY);
  });
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "#685b3f";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "rgba(229, 210, 166, 0.55)";
  ctx.beginPath();
  ctx.moveTo(x + width * 0.18, y + height * 0.28);
  ctx.lineTo(x + width * 0.39, y + height * 0.12);
  ctx.lineTo(x + width * 0.54, y + height * 0.24);
  ctx.lineTo(x + width * 0.36, y + height * 0.38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#558d3c";
  ctx.beginPath();
  ctx.ellipse(x + width * 0.75, y + height * 0.18, Math.max(3, width * 0.1), Math.max(1.5, height * 0.12), -0.18, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.83, y + height * 0.14, Math.max(2, width * 0.07), Math.max(1, height * 0.08), 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function updateObstacles() {
  obstacles.forEach(obstacle => {
    obstacle.x += obstacle.speedX;
    obstacle.y += obstacle.speedY;

    if (
      obstacle.x <= 10 ||
      obstacle.x + obstacle.width >= canvas.width - 10
    ) {
      obstacle.speedX *= -1;
    }

    if (
      obstacle.y <= 10 ||
      obstacle.y + obstacle.height >= canvas.height - 10
    ) {
      obstacle.speedY *= -1;
    }
  });
}

function circleTouchesObstacle(x, y, radius, obstacle) {
  const closestX = clamp(
    x,
    obstacle.x,
    obstacle.x + obstacle.width
  );

  const closestY = clamp(
    y,
    obstacle.y,
    obstacle.y + obstacle.height
  );

  return Math.hypot(x - closestX, y - closestY) < radius;
}

// ---------------------------------------------------------
// 8. SPINNING GOLD COINS
// ---------------------------------------------------------

function drawCoin(coin) {
  const time = performance.now() * 0.001;
  const spin = Math.abs(Math.cos(time * 3 + coin.phase));
  const coinWidth = Math.max(2, coin.radius * spin);

  ctx.save();
  ctx.translate(coin.x, coin.y);
  ctx.scale(1, 1);

  // Soft shadow beneath the coin
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(
    2,
    coin.radius + 4,
    coin.radius * 0.85,
    3,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Metallic gold body
  const gold = ctx.createLinearGradient(
    -coinWidth,
    -coin.radius,
    coinWidth,
    coin.radius
  );

  gold.addColorStop(0, "#b97808");
  gold.addColorStop(0.25, "#fff1a3");
  gold.addColorStop(0.5, "#ffcf33");
  gold.addColorStop(0.8, "#f5a900");
  gold.addColorStop(1, "#b97808");

  ctx.fillStyle = gold;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    coinWidth,
    coin.radius,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Gold rim
  ctx.strokeStyle = "#fff0a3";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner detail when the coin faces forward
  if (spin > 0.45) {
    ctx.strokeStyle = "rgba(160, 99, 0, 0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      coinWidth * 0.62,
      coin.radius * 0.62,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // Small blinking sparkle
  const sparkle = (
    Math.sin(time * 5 + coin.sparklePhase) + 1
  ) / 2;

  if (sparkle > 0.72) {
    ctx.globalAlpha = sparkle;
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
      -coinWidth * 0.35,
      -coin.radius * 0.45,
      1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

// ---------------------------------------------------------
// 9. COIN COLLECTION EFFECTS
// ---------------------------------------------------------

function createCoinBurst(x, y) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomBetween(1, 3);

    coinBursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1
    });
  }

  floatingTexts.push({
    x,
    y,
    text: "+1",
    life: 1
  });

  playCoinDing();
}

function updateCoinBursts() {
  coinBursts = coinBursts.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= 0.035;

    return particle.life > 0;
  });

  floatingTexts = floatingTexts.filter(item => {
    item.y -= 0.8;
    item.life -= 0.025;

    return item.life > 0;
  });
}

function drawCoinBursts() {
  coinBursts.forEach(particle => {
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = "#ffd54a";

    ctx.beginPath();
    ctx.arc(
      particle.x,
      particle.y,
      3 * particle.life,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  });

  floatingTexts.forEach(item => {
    ctx.save();
    ctx.globalAlpha = item.life;
    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y);

    ctx.restore();
  });
}

// ---------------------------------------------------------
// 10. PLAYER ROBOT
// ---------------------------------------------------------

function drawRobot(x, y, walkPhase, moving) {
  const [shirtColor, shirtShade, capColor, overallColor] =
    getLevelDetails(currentLevel).player;

  const time = performance.now() * 0.001;
  const walkSwing = moving ? Math.sin(walkPhase) * 3 : 0;
  const bob = moving
    ? Math.abs(Math.sin(walkPhase)) * 1.5
    : Math.sin(time * 2) * 0.5;

  const scale = 1.3;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(scale, scale);

  ctx.fillStyle = "rgba(47, 72, 34, 0.26)";
  ctx.beginPath();
  ctx.ellipse(0, 15, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const leftLegY = Math.max(0, walkSwing) * 0.65;
  const rightLegY = Math.max(0, -walkSwing) * 0.65;

  ctx.fillStyle = overallColor;
  ctx.beginPath();
  ctx.roundRect(-6, 5 + leftLegY, 5, 9, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(1, 5 + rightLegY, 5, 9, 2);
  ctx.fill();

  ctx.fillStyle = "#65432e";
  ctx.beginPath();
  ctx.roundRect(-9, 12 + leftLegY, 9, 4, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(0, 12 + rightLegY, 9, 4, 2);
  ctx.fill();

  const leftArmX = -11 - walkSwing * 0.5;
  const rightArmX = 11 + walkSwing * 0.5;
  const leftArmY = 1 + walkSwing * 0.25;
  const rightArmY = 1 - walkSwing * 0.25;

  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = shirtColor;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(leftArmX, leftArmY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(6, -4);
  ctx.lineTo(rightArmX, rightArmY);
  ctx.stroke();

  ctx.fillStyle = "#e9b27c";
  ctx.beginPath();
  ctx.arc(leftArmX, leftArmY, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightArmX, rightArmY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.roundRect(-8, -7, 16, 14, 4);
  ctx.fill();

  ctx.fillStyle = shirtShade;
  ctx.beginPath();
  ctx.roundRect(-7, 2, 14, 7, 2);
  ctx.fill();

  ctx.fillStyle = "#e7c174";
  ctx.beginPath();
  ctx.arc(0, 4, 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e9b27c";
  ctx.beginPath();
  ctx.ellipse(0, -11, 7.5, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#553b2b";
  ctx.beginPath();
  ctx.arc(0, -13, 7.5, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.ellipse(-1, -16, 8, 4.2, -0.12, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -14, 6, 2, 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.arc(-2.4, -10, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2.4, -10, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff4d2";
  ctx.font = "bold 5px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("1", 0, -16);

  ctx.restore();
}

// ---------------------------------------------------------
// 11. DRAW BOTH PLAYERS
// ---------------------------------------------------------

function drawPlayer() {
  const moving = Math.hypot(
    player.x - previousPlayerPosition.x,
    player.y - previousPlayerPosition.y
  ) > 0.1;

  if (moving) {
    playerWalkPhase += 0.22;
  }

  previousPlayerPosition = {
    x: player.x,
    y: player.y
  };

  drawRobot(player.x, player.y, playerWalkPhase, moving);
}

// ---------------------------------------------------------
// 12. GRASS DETAILS
// ---------------------------------------------------------

function drawGrassDetails() {
  const w = canvas.width;
  const h = canvas.height;

  for (let i = 0; i < 48; i++) {
    const x = (i * 137.5) % w;
    const y = h * 0.74 + ((i * 79.3) % (h * 0.24));
    const height = 4 + (i % 4) * 1.5;

    ctx.strokeStyle = i % 2 === 0
      ? "rgba(231, 255, 166, 0.55)"
      : "rgba(38, 126, 48, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y - height);
    ctx.moveTo(x, y);
    ctx.lineTo(x + 2, y - height * 1.2);
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x + 5, y - height * 0.75);
    ctx.stroke();

    if (i % 12 === 0) {
      ctx.fillStyle = "#fff3a3";
      ctx.beginPath();
      ctx.arc(x + 8, y - height, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------------------------------------------------------
// 13. PLAYER TRAIL
// ---------------------------------------------------------

function updatePlayerTrail() {
  playerTrail.push({
    x: player.x,
    y: player.y,
    life: 0.35
  });

  if (playerTrail.length > 12) {
    playerTrail.shift();
  }

  playerTrail = playerTrail.filter(item => {
    item.life -= 0.012;
    return item.life > 0;
  });
}

function drawPlayerTrail() {
  playerTrail.forEach(item => {
    ctx.save();
    ctx.globalAlpha = item.life;
    ctx.fillStyle = "#39dfff";

    ctx.beginPath();
    ctx.arc(
      item.x,
      item.y,
      3 * item.life + 1,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  });
}

// ---------------------------------------------------------
// 14. SOUND EFFECTS AND BACKGROUND MUSIC
// ---------------------------------------------------------

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(error => {
      console.error("Could not resume audio playback:", error);

      if (gameStatus) {
        gameStatus.textContent =
          "Audio playback is blocked. Check your browser sound permissions.";
      }
    });
  }

  return audioContext;
}

function playTone(frequency, duration, volume, type = "sine") {
  if (!musicEnabled) return;

  const audio = getAudioContext();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(
    frequency,
    audio.currentTime
  );

  gain.gain.setValueAtTime(
    Math.max(0.0001, volume),
    audio.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audio.currentTime + duration
  );

  oscillator.connect(gain);
  gain.connect(audio.destination);

  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

function playCoinDing() {
  if (!musicEnabled) return;

  playTone(880, 0.12, 0.07, "sine");

  if (musicEnabled) {
    playTone(1175, 0.18, 0.045, "sine");
  }
}

function playWinSound() {
  if (!musicEnabled) return;

  playTone(523, 0.18, 0.08);
  playTone(659, 0.18, 0.08);
  playTone(784, 0.3, 0.08);
}

function playLoseSound() {
  if (!musicEnabled) return;

  playTone(330, 0.2, 0.06, "triangle");
  playTone(247, 0.35, 0.06, "triangle");
}


function startBackgroundMusic() {
  if (!musicEnabled || musicTimer) return;
  if (!getAudioContext()) return;

  // Cheerful, original arcade-style melody
  const notes = [
    523, 659, 784, 1047,
    784, 659, 523, 587,
    698, 880, 1047, 880,
    784, 698, 659, 523,
    659, 784, 880, 784,
    659, 587, 523, 0
  ];

  let noteIndex = 0;

  musicTimer = setInterval(() => {
    if (!musicEnabled) return;

    const audio = getAudioContext();
    if (!audio) return;

    const frequency = notes[noteIndex % notes.length];
    noteIndex++;

    // A short rest creates a playful rhythm
    if (frequency === 0) return;

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(
      frequency,
      audio.currentTime
    );

    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.linearRampToValueAtTime(
      0.07,
      audio.currentTime + 0.025
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + 0.19
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.2);
  }, 210);
}

function stopBackgroundMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

function toggleMusic() {
  musicEnabled = !musicEnabled;

  const button = document.getElementById("musicToggle");

  if (button) {
    button.textContent = musicEnabled ? "Music: ON" : "Music: OFF";
    button.setAttribute("aria-pressed", String(musicEnabled));
  }

  if (musicEnabled) {
    getAudioContext();
    startBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }
}

if (musicToggleButton) {
  musicToggleButton.addEventListener("click", toggleMusic);
}

// ---------------------------------------------------------
// 15. SCORE DISPLAY
// ---------------------------------------------------------

function updateScoreDisplays() {
  const targetScore = getLevelDetails(currentLevel).coinCount || TARGET_SCORE;

  if (arenaScoreDisplay) {
    arenaScoreDisplay.textContent = `${score}/${targetScore}`;
  }

  if (arenaCoinsDisplay) {
    arenaCoinsDisplay.textContent = String(collected);
  }
}

function updateLevelDisplay() {
  if (levelDisplay) {
    levelDisplay.textContent = `${currentLevel} / 10`;
  }
}

function updateTimerDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = String(Math.max(0, Math.ceil(remainingTime)));
  }
}

function startPracticeTimer() {
  if (practiceTimer) {
    clearInterval(practiceTimer);
  }

  practiceTimer = setInterval(() => {
    if (!gameRunning || gameOver || !practiceMode) return;

    remainingTime--;
    updateTimerDisplay();
    if (remainingTime <= 0) {
      finishPracticeGame(false);
    }
  }, 1000);
}

// ---------------------------------------------------------
// 16. RESET PRACTICE GAME
// ---------------------------------------------------------

function resetGame(level = currentLevel) {
  currentLevel = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
  score = 0;
  collected = 0;
  remainingTime = getLevelDetails(currentLevel).duration;
  gameOver = false;
  gameRunning = true;
  practiceMode = true;
  practiceLevelWon = false;

  if (playAgainBtn) {
    playAgainBtn.textContent = "Play Again";
  }

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.radius = 15;
  player.speed = 3.2;

  coins = [];
  coinBursts = [];
  floatingTexts = [];
  playerTrail = [];

  obstacles = buildLevelObstacles(currentLevel);

  const coinCount = getLevelDetails(currentLevel).coinCount || TARGET_SCORE;
  for (let i = 0; i < coinCount; i++) {
    coins.push(spawnCoin());
  }

  updateScoreDisplays();
  updateLevelDisplay();
  updateTimerDisplay();
  startPracticeTimer();
  if (gameStatus) {
    gameStatus.textContent =
      `Level ${currentLevel}: ${getLevelDetails(currentLevel).name} — collect ${coinCount} coins!`;
  }

  hideMessage();
}

// ---------------------------------------------------------
// 17. PRACTICE MOVEMENT
// ---------------------------------------------------------

function movePlayer() {
  if (!gameRunning || gameOver) return;

  let dx = 0;
  let dy = 0;

  if (keys.ArrowLeft || keys.a || keys.A) dx -= 1;
  if (keys.ArrowRight || keys.d || keys.D) dx += 1;
  if (keys.ArrowUp || keys.w || keys.W) dy -= 1;
  if (keys.ArrowDown || keys.s || keys.S) dy += 1;

  if (dx === 0 && dy === 0) return;

  const length = Math.hypot(dx, dy) || 1;
  dx = (dx / length) * player.speed;
  dy = (dy / length) * player.speed;

  const nextX = clamp(
    player.x + dx,
    player.radius + 12,
    canvas.width - player.radius - 12
  );

  const nextY = clamp(
    player.y + dy,
    player.radius + 12,
    canvas.height - player.radius - 12
  );

  const blockedX = obstacles.some(obstacle =>
    circleTouchesObstacle(
      nextX,
      player.y,
      player.radius,
      obstacle
    )
  );

  const blockedY = obstacles.some(obstacle =>
    circleTouchesObstacle(
      player.x,
      nextY,
      player.radius,
      obstacle
    )
  );

  if (!blockedX) player.x = nextX;
  if (!blockedY) player.y = nextY;

  updatePlayerTrail();
}

// ---------------------------------------------------------
// 18. PRACTICE COIN COLLECTION
// ---------------------------------------------------------


function collectPracticeCoins() {
  if (!practiceMode || gameOver) return;

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    const distance = Math.hypot(
      player.x - coin.x,
      player.y - coin.y
    );

    if (distance < player.radius + coin.radius) {
      createCoinBurst(coin.x, coin.y);
      coins.splice(i, 1);

      score++;
      collected++;

      // Immediately replace the collected coin
      coins.push(spawnCoin());

      updateScoreDisplays();

      if (score >= (getLevelDetails(currentLevel).coinCount || TARGET_SCORE)) {
        finishPracticeGame(true);
        return;
      }
    }
  }
}

// ---------------------------------------------------------
// 19. PRACTICE WIN SCREEN
// ---------------------------------------------------------

function finishPracticeGame(won) {
  gameOver = true;
  gameRunning = false;
  if (practiceTimer) {
    clearInterval(practiceTimer);
    practiceTimer = null;
  }

  stopBackgroundMusic();

  if (won) {
    playWinSound();
    practiceLevelWon = true;
    if (currentLevel === 10) {
      showMessage("YOU BEAT THE GAME", "You cleared all ten arenas!");
      if (playAgainBtn) playAgainBtn.textContent = "Play Again";
    } else {
      showMessage(
        "LEVEL COMPLETE!",
        `Great job! You cleared Level ${currentLevel}. Advance to the next level?`
      );
      if (playAgainBtn) playAgainBtn.textContent = "Next Level";
    }
  } else {
    playLoseSound();
    showMessage(
      "GAME OVER",
      `Good try! Play again to collect ${getLevelDetails(currentLevel).coinCount || TARGET_SCORE} coins.`
    );
  }

  if (gameStatus) {
    gameStatus.textContent = won
      ? `Level ${currentLevel} complete!`
      : "Practice ended.";
  }
}

// ---------------------------------------------------------
// 20. KEYBOARD CONTROLS
// ---------------------------------------------------------

document.addEventListener("keydown", event => {
  const movementKeys = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "w",
    "a",
    "s",
    "d",
    "W",
    "A",
    "S",
    "D"
  ];

  if (movementKeys.includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (
    (event.key === "m" || event.key === "M") &&
    !event.repeat
  ) {
    toggleMusic();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

window.addEventListener("blur", () => {
  Object.keys(keys).forEach(key => {
    keys[key] = false;
  });
});

// ---------------------------------------------------------
// 21. CANVAS SIZE HANDLING
// ---------------------------------------------------------

function fitArenaToScreen() {
  // Keep the internal game coordinates at 800 × 500.
  // CSS can resize the visible canvas without changing gameplay.
  if (!canvas) return;

  canvas.width = 800;
  canvas.height = 500;
}

window.addEventListener("resize", fitArenaToScreen);
fitArenaToScreen();

// ---------------------------------------------------------
// END OF PART 3
// ---------------------------------------------------------
// ---------------------------------------------------------
// 22. PLAY NOW AND HOME BUTTONS
// ---------------------------------------------------------

if (startPracticeBtn) {
  startPracticeBtn.addEventListener("click", () => {
    if (startScreen) {
      startScreen.style.display = "none";
    }
    if (homeBtn) {
      homeBtn.hidden = false;
    }

    document.body.classList.add("practice-mode");
    practiceMode = true;

    resetGame();
    startBackgroundMusic();
  });
}

function returnToHome() {
  if (practiceTimer) {
    clearInterval(practiceTimer);
    practiceTimer = null;
  }

  gameRunning = false;
  gameOver = false;
  practiceMode = false;
  currentLevel = 1;
  remainingTime = getLevelDetails(currentLevel).duration;
  updateLevelDisplay();
  updateTimerDisplay();
  document.body.classList.remove("practice-mode");
  if (startScreen) {
    startScreen.style.display = "";
  }
  if (homeBtn) {
    homeBtn.hidden = true;
  }
  if (gameStatus) {
    gameStatus.textContent = "Press PLAY NOW to begin.";
  }
  hideMessage();
}

if (homeBtn) {
  homeBtn.addEventListener("click", returnToHome);
}

// ---------------------------------------------------------
// 23. RESTART AND PLAY AGAIN
// ---------------------------------------------------------

function restartCurrentGame() {
  resetGame(1);
  startBackgroundMusic();
}

if (restartBtn) {
  restartBtn.addEventListener("click", restartCurrentGame);
}

if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    hideMessage();
    resetGame(
      practiceLevelWon
        ? (currentLevel === 10 ? 1 : currentLevel + 1)
        : currentLevel
    );
    startBackgroundMusic();
  });
}

// ---------------------------------------------------------
// 24. MAIN GAME LOOP
// ---------------------------------------------------------

function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (!ctx || !canvas) return;

  drawArena();
  drawGrassDetails();

  if (practiceMode && gameRunning && !gameOver) {
    movePlayer();
    collectPracticeCoins();
  }

  if (practiceMode) {
    updateObstacles();
  }

  obstacles.forEach(drawObstacle);
  coins.forEach(drawCoin);
  updateCoinBursts();
  drawCoinBursts();
  drawPlayerTrail();
  drawPlayer();
}

// ---------------------------------------------------------
// 25. INITIALISE GAME
// ---------------------------------------------------------

updateScoreDisplays();
updateLevelDisplay();
gameLoop();

// ---------------------------------------------------------
// END OF PORTAL GAME.JS
// END OF PART 4 — GAME.JS COMPLETE
// ---------------------------------------------------------