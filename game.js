/* =========================================================
   DUO ARENA
   Clean game logic, visuals, sound and multiplayer support
   ========================================================= */

"use strict";

const MULTIPLAYER_SERVER_URL = "";

// ---------------------------------------------------------
// 1. HTML ELEMENTS
// ---------------------------------------------------------

const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const arenaScoreDisplay = document.getElementById("arenaScore");
const arenaCoinsDisplay = document.getElementById("arenaCoins");
const arenaTotalScoreDisplay = document.getElementById("arenaTotalScore");
const arenaTotalCoinsDisplay = document.getElementById("arenaTotalCoins");
const opponentScoreDisplay = document.getElementById("opponentScore");
const opponentCoinsDisplay = document.getElementById("opponentCoins");
const coinDisplay = document.getElementById("coins");
const levelDisplay = document.getElementById("levelDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const levelsWonDisplay = document.getElementById("levelsWonDisplay");

const messageOverlay = document.getElementById("message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const startScreen = document.getElementById("startScreen");
const startPracticeBtn = document.getElementById("startPracticeBtn");
const startMultiplayerBtn = document.getElementById("startMultiplayerBtn");
const startFootnote = document.querySelector(".start-footnote");
const defaultStartFootnoteText = startFootnote
  ? startFootnote.textContent
  : "";

const createPublicRoomBtn = document.getElementById("createPublicRoomBtn");
const refreshPublicRoomsBtn = document.getElementById("refreshPublicRoomsBtn");
const publicRoomsPanel = document.getElementById("publicRoomsPanel");
const publicRoomsList = document.getElementById("publicRoomsList");
const roomCodeInput = document.getElementById("roomCodeInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const playerRole = document.getElementById("playerRole");
const roomStatus = document.getElementById("roomStatus");
const connectionStatus = document.getElementById("connectionStatus");

const gameStatus = document.getElementById("gameStatus");
const restartBtn = document.getElementById("restart");
const playAgainBtn = document.getElementById("play-again");

const countdownDisplay = document.getElementById("countdown");
const musicToggleButton = document.getElementById("musicToggle");

// ---------------------------------------------------------
// 2. GAME SETTINGS
// ---------------------------------------------------------

const TARGET_SCORE = 10;
const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 3.5;
const COIN_COUNT = 6;
const levelDetails = window.DuoArenaLevels || {
  getLevelConfig(level) {
    const configs = [
      { name: "Space", duration: 60, sky: ["#65bff2", "#bceaff", "#effbdc"], sun: "#fff0a3", hills: ["#91c96c", "#71b950"], ground: ["#70bd43", "#3f963b"], player: ["#4e9a43", "#34713b", "#347b3e", "#477cad"], opponent: ["#d66f42", "#a84d35", "#b54c38", "#8a6546"] },
      { name: "Ice", duration: 60, sky: ["#9de9ff", "#e8fbff", "#f4ffff"], sun: "#ffffff", hills: ["#b6e5e8", "#8dcbd7"], ground: ["#9bd7e2", "#5ca9c0"], player: ["#2798b8", "#176b91", "#337eae", "#426c91"], opponent: ["#a64d9a", "#74376e", "#844b9e", "#634f82"] },
      { name: "Lava", duration: 60, sky: ["#451f33", "#a44731", "#e86b36"], sun: "#ffb13b", hills: ["#6d3932", "#4b292d"], ground: ["#74372c", "#3c2229"], player: ["#ff9d35", "#bc532b", "#d47d33", "#80523e"], opponent: ["#62c9d3", "#278b96", "#397caa", "#535078"] },
      { name: "Jungle", duration: 60, sky: ["#5da98a", "#b8dd9b", "#e2efb1"], sun: "#ffe18a", hills: ["#477d39", "#315c35"], ground: ["#4c943e", "#28663a"], player: ["#d4bf43", "#8f7b2e", "#a9863e", "#665a38"], opponent: ["#db7554", "#9e4838", "#b75c4b", "#76543b"] },
      { name: "Golden Temple", duration: 60, sky: ["#72513a", "#d49a4c", "#f4d47a"], sun: "#fff1a8", hills: ["#b4823e", "#8b5b31"], ground: ["#be913b", "#76502c"], player: ["#d5a92f", "#927124", "#ad8030", "#765b34"], opponent: ["#52b4a4", "#347a70", "#417c87", "#594e66"] }
    ];
    return configs[Math.max(1, Math.min(5, Math.floor(Number(level) || 1))) - 1];
  },
  createLevelObstacles(level) {
    const currentLevel = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
    const speedMultiplier = 1 + Math.min(currentLevel - 1, 10) * 0.12;
    const obstacles = [
      { x: 200, y: 130, width: 100, height: 22, speedX: 1.5, speedY: 0 },
      { x: 350, y: 300, width: 22, height: 100, speedX: 0, speedY: 1.2 },
      { x: 530, y: 170, width: 100, height: 22, speedX: -1.3, speedY: 0 }
    ];
    const additionalObstacles = [
      { x: 90, y: 390, width: 110, height: 18, speedX: 1.1, speedY: 0 },
      { x: 660, y: 280, width: 18, height: 90, speedX: 0, speedY: -1.1 },
      { x: 390, y: 75, width: 120, height: 18, speedX: -1.2, speedY: 0 },
      { x: 120, y: 255, width: 18, height: 90, speedX: 0, speedY: 1.1 },
      { x: 650, y: 410, width: 100, height: 18, speedX: -1.1, speedY: 0 }
    ];
    obstacles.push(...additionalObstacles.slice(0, currentLevel - 1));
    return obstacles.map(obstacle => ({
      ...obstacle,
      speedX: obstacle.speedX * speedMultiplier,
      speedY: obstacle.speedY * speedMultiplier
    }));
  }
};
const buildLevelObstacles = level => levelDetails.createLevelObstacles(level);
const getLevelDetails = level => levelDetails.getLevelConfig(level);

const keys = {};

let player = {
  x: 400,
  y: 250,
  radius: PLAYER_RADIUS,
  speed: 3.2
};
let opponent = {
  x: 500,
  y: 200,
  radius: PLAYER_RADIUS
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

let myPlayerNumber = null;
let currentRoomCode = null;
let multiplayerReady = false;
let multiplayerGameState = null;

let musicEnabled = true;
let audioContext = null;
let musicTimer = null;

let playerWalkPhase = 0;
let opponentWalkPhase = 0;
let previousPlayerPosition = { x: 100, y: 200 };
let previousOpponentPosition = { x: 500, y: 200 };

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

function drawRobot(x, y, team, walkPhase, moving, number) {
  const [shirtColor, shirtShade, capColor, overallColor] =
    getLevelDetails(currentLevel)[team === "blue" ? "player" : "opponent"];

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
  ctx.fillText(String(number), 0, -16);

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

  drawRobot(
    player.x,
    player.y,
    "blue",
    playerWalkPhase,
    moving,
    myPlayerNumber || 1
  );
}

function drawOpponent() {
  if (!multiplayerReady || !currentRoomCode) {
    return;
  }

  const moving = Math.hypot(
    opponent.x - previousOpponentPosition.x,
    opponent.y - previousOpponentPosition.y
  ) > 0.1;

  if (moving) {
    opponentWalkPhase += 0.22;
  }

  previousOpponentPosition = {
    x: opponent.x,
    y: opponent.y
  };

  drawRobot(
    opponent.x,
    opponent.y,
    "violet",
    opponentWalkPhase,
    moving,
    myPlayerNumber === 1 ? 2 : 1
  );
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
  if (scoreDisplay) {
    scoreDisplay.textContent = `${score}/10`;
  }

  if (arenaScoreDisplay) {
    arenaScoreDisplay.textContent = `${score}/10`;
  }

  if (coinDisplay) {
    coinDisplay.textContent = String(collected);
  }

  if (arenaTotalScoreDisplay) {
    arenaTotalScoreDisplay.textContent = `${score}/10`;
  }

  if (arenaTotalCoinsDisplay) {
    arenaTotalCoinsDisplay.textContent = String(collected);
  }

  if (arenaCoinsDisplay) {
    arenaCoinsDisplay.textContent = String(collected);
  }
}

function updateLevelDisplay() {
  if (levelDisplay) {
    levelDisplay.textContent = String(currentLevel);
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
  currentLevel = Math.max(1, Math.min(5, Math.floor(Number(level) || 1)));
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

  for (let i = 0; i < 10; i++) {
    coins.push(spawnCoin());
  }

  updateScoreDisplays();
  updateLevelDisplay();
  updateTimerDisplay();
  startPracticeTimer();
  if (levelsWonDisplay) {
    levelsWonDisplay.textContent = "0-0";
  }

  if (gameStatus) {
    gameStatus.textContent =
      `Level ${currentLevel}: ${getLevelDetails(currentLevel).name} — collect 10 coins!`;
  }

  hideMessage();
}

// ---------------------------------------------------------
// 17. PRACTICE MOVEMENT
// ---------------------------------------------------------

function movePracticePlayer() {
  if (!gameRunning || gameOver || !practiceMode) return;

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

      if (score >= 10) {
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
    if (currentLevel === 5) {
      showMessage("YOU BEAT THE GAME", "You cleared all five arenas!");
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
      "Good try! Play again to collect 10 coins."
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
// 22. MULTIPLAYER CONNECTION
// ---------------------------------------------------------

let socket = null;
let countdownTimer = null;
let reconnecting = false;
let multiplayerRequested = false;
let multiplayerConnectionTimer = null;
const pendingMessages = [];

function connectToServer() {
  if (typeof window.WebSocket !== "function") {
    return false;
  }

  if (
    socket &&
    (socket.readyState === window.WebSocket.OPEN ||
     socket.readyState === window.WebSocket.CONNECTING)
  ) {
    return true;
  }

  let serverUrl = MULTIPLAYER_SERVER_URL.trim();
  if (!serverUrl) {
    if (location.protocol === "file:" || !location.host) {
      return false;
    }

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    serverUrl = `${protocol}//${location.host}`;
  }

  let connection;
  try {
    connection = new window.WebSocket(serverUrl);
  } catch (error) {
    console.error("Could not connect to the multiplayer server:", error);
    return false;
  }
  socket = connection;

  connection.addEventListener("open", () => {
    reconnecting = false;
    if (multiplayerConnectionTimer) {
      clearTimeout(multiplayerConnectionTimer);
      multiplayerConnectionTimer = null;
    }

    if (connectionStatus) {
      connectionStatus.textContent = "Connected to server";
    }

    requestPublicRooms();
    sendToServer({ type: "ping" });
    while (pendingMessages.length) {
      connection.send(JSON.stringify(pendingMessages.shift()));
    }

    if (multiplayerRequested) {
      enterMultiplayerLobby();
    }
  });

  connection.addEventListener("message", event => {
    let message;

    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    handleServerMessage(message);
  });

  connection.addEventListener("close", () => {
    if (socket === connection) {
      socket = null;
    }

    multiplayerReady = false;

    if (connectionStatus) {
      connectionStatus.textContent = "Disconnected from server";
    }

    if (currentRoomCode) {
      if (gameStatus) {
        gameStatus.textContent =
          "Connection lost. Return to the menu and reconnect.";
      }
    }

    if (multiplayerRequested) {
      showMultiplayerUnavailable();
    }
  });

  connection.addEventListener("error", () => {
    if (connectionStatus) {
      connectionStatus.textContent = "Connection error";
    }

    if (multiplayerRequested) {
      showMultiplayerUnavailable();
    }
  });

  return true;
}

function sendToServer(message) {
  if (socket && socket.readyState === window.WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else if (socket && socket.readyState === window.WebSocket.CONNECTING) {
    pendingMessages.push(message);
  }
}

function showMultiplayerUnavailable() {
  multiplayerRequested = false;
  if (multiplayerConnectionTimer) {
    clearTimeout(multiplayerConnectionTimer);
    multiplayerConnectionTimer = null;
  }

  document.body.classList.remove("multiplayer-lobby", "practice-mode");
  if (startScreen) {
    startScreen.style.display = "";
  }
  if (startFootnote) {
    startFootnote.textContent = "Multiplayer needs the online server";
  }
  if (gameStatus) {
    gameStatus.textContent = "Multiplayer needs the online server";
  }
}

function enterMultiplayerLobby() {
  multiplayerRequested = false;
  if (multiplayerConnectionTimer) {
    clearTimeout(multiplayerConnectionTimer);
    multiplayerConnectionTimer = null;
  }

  if (startScreen) {
    startScreen.style.display = "none";
  }
  document.body.classList.remove("practice-mode");
  document.body.classList.add("multiplayer-lobby");
  practiceMode = false;
  startBackgroundMusic();

  if (gameStatus) {
    gameStatus.textContent =
      "Create a room or enter your friend's room code.";
  }
}

// ---------------------------------------------------------
// 23. ROOM UI HELPERS
// ---------------------------------------------------------

function updateRoomDisplay() {
  if (roomCodeDisplay) {
    roomCodeDisplay.textContent = currentRoomCode || "------";
  }

  if (playerRole) {
    playerRole.textContent = myPlayerNumber
      ? `Player ${myPlayerNumber}`
      : "Not in a room";
  }

  if (roomStatus) {
    roomStatus.textContent = currentRoomCode
      ? `Room ${currentRoomCode}`
      : "Not in a room";
  }
}

function renderPublicRooms(rooms) {
  if (!publicRoomsList) return;

  if (!rooms || rooms.length === 0) {
    publicRoomsList.innerHTML = '<p class="empty-room-list">No public rooms available yet.</p>';
    return;
  }

  publicRoomsList.innerHTML = rooms.map(room => `
    <div class="public-room-item">
      <div>
        <strong>${room.code}</strong>
        <div class="public-room-meta">${room.playerCount || 1}/2 players · ${room.status || "Open"}</div>
      </div>
      <button type="button" data-room-code="${room.code}">Join</button>
    </div>
  `).join("");

  publicRoomsList.querySelectorAll("button[data-room-code]").forEach(button => {
    button.addEventListener("click", () => {
      const code = button.dataset.roomCode;

      if (roomCodeInput) {
        roomCodeInput.value = code;
      }

      connectToServer();
      sendToServer({ type: "join_room", roomCode: code, code });
    });
  });
}

function requestPublicRooms() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    sendToServer({ type: "request_public_rooms" });
  }
}

function leaveCurrentRoomBeforeAction() {
  if (!currentRoomCode) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendToServer({ type: "leave_room" });
    }

    resetMultiplayerState();
    setTimeout(resolve, 150);
  });
}

function resetMultiplayerState() {
  currentRoomCode = null;
  myPlayerNumber = null;
  multiplayerReady = false;
  multiplayerGameState = null;
  gameRunning = false;
  gameOver = false;
  currentLevel = 1;
  updateLevelDisplay();

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  if (countdownDisplay) {
    countdownDisplay.classList.add("hidden");
    countdownDisplay.textContent = "";
  }

  if (roomCodeInput) {
    roomCodeInput.value = "";
  }

  document.body.classList.add("multiplayer-lobby");
  updateRoomDisplay();
}

// ---------------------------------------------------------
// 24. SERVER MESSAGES
// ---------------------------------------------------------

function handleServerMessage(message) {
  switch (message.type) {
    case "server_ready": {
      if (connectionStatus) {
        connectionStatus.textContent = "Connected to server";
      }
      break;
    }

    case "pong": {
      break;
    }

    case "public_room_list": {
      renderPublicRooms(message.rooms || []);
      break;
    }

    case "room_created": {
      currentRoomCode = message.roomCode || message.code;
      myPlayerNumber = 1;
      currentLevel = 1;
      updateLevelDisplay();
document.body.classList.remove("multiplayer-lobby");
      practiceMode = false;
      gameRunning = false;
      gameOver = false;
      multiplayerReady = false;
      if (levelsWonDisplay) levelsWonDisplay.textContent = "0-0";

      updateRoomDisplay();

      if (gameStatus) {
        gameStatus.textContent =
          "Room created! Share the code with your friend.";
      }

      requestPublicRooms();
      break;
    }

    case "room_joined": {
      currentRoomCode = message.roomCode || message.code;
      myPlayerNumber = message.playerNumber || message.player;
      currentLevel = 1;
      updateLevelDisplay();
document.body.classList.remove("multiplayer-lobby");
      practiceMode = false;
      gameRunning = false;
      gameOver = false;
      multiplayerReady = false;
      if (levelsWonDisplay) levelsWonDisplay.textContent = "0-0";

      updateRoomDisplay();

      if (gameStatus) {
        gameStatus.textContent =
          `Joined room ${currentRoomCode}. Waiting for the game...`;
      }

      requestPublicRooms();
      break;
    }

    case "room_update": {
      if (message.roomCode) {
        currentRoomCode = message.roomCode;
      }

      if (message.playerCount < 2) {
        gameRunning = false;
        multiplayerReady = false;
        if (gameStatus) {
          gameStatus.textContent = "Waiting for another player...";
        }
      }

      updateRoomDisplay();
      break;
    }

    case "countdown": {
      if (countdownDisplay) {
        countdownDisplay.textContent = message.value;
        countdownDisplay.classList.remove("hidden");

        if (message.value === "GO!") {
          setTimeout(() => {
            countdownDisplay.classList.add("hidden");
          }, 700);
        }
      }
      break;
    }

    case "game_state": {
      if (!message.game) break;

      multiplayerGameState = message.game;
      updateMultiplayerGame(message.game);
      break;
    }

    case "room_left": {
      resetMultiplayerState();
      requestPublicRooms();

      if (gameStatus) {
        gameStatus.textContent = "You left the room.";
      }

      break;
    }

    case "error": {
      const errorText = message.message || "Something went wrong.";

      if (gameStatus) {
        gameStatus.textContent = errorText;
      }

      showMessage("ROOM ERROR", errorText);
      break;
    }
  }
}

// ---------------------------------------------------------
// 25. MULTIPLAYER COUNTDOWN
// ---------------------------------------------------------

function startMultiplayerCountdown(seconds) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  let remaining = Number(seconds) || 3;

  if (countdownDisplay) {
    countdownDisplay.textContent = String(remaining);
    countdownDisplay.classList.remove("hidden");
  }

  gameRunning = false;
  gameOver = false;

  countdownTimer = setInterval(() => {
    remaining--;

    if (countdownDisplay) {
      countdownDisplay.textContent =
        remaining > 0 ? String(remaining) : "GO!";
    }

    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;

      setTimeout(() => {
        if (countdownDisplay) {
          countdownDisplay.classList.add("hidden");
        }

        gameRunning = true;
        multiplayerReady = true;

        if (gameStatus) {
          gameStatus.textContent = "Collect coins to win!";
        }
      }, 500);
    }
  }, 1000);
}

// ---------------------------------------------------------
// 26. UPDATE MULTIPLAYER GAME STATE
// ---------------------------------------------------------

function updateMultiplayerGame(game) {
  if (!game) return;

  const players = game.players || {};

  if (Number.isFinite(game.level)) {
    currentLevel = Math.max(1, game.level);
    updateLevelDisplay();
  }

  if (Number.isFinite(game.timeRemaining)) {
    remainingTime = game.timeRemaining;
    updateTimerDisplay();
  }

  const ownPlayer = players[myPlayerNumber];
  const opponentNumber = myPlayerNumber === 1 ? 2 : 1;
  const otherPlayer = players[opponentNumber];

  if (ownPlayer) {
    player.x = ownPlayer.x;
    player.y = ownPlayer.y;

    if (typeof ownPlayer.score === "number") {
      score = ownPlayer.score;
    }
  }

if (otherPlayer) {
  opponent.x = otherPlayer.x;
  opponent.y = otherPlayer.y;
  opponent.score = otherPlayer.score || 0;
}

if (opponentScoreDisplay) {
  opponentScoreDisplay.textContent =
    `${opponent.score}/10`;
}

if (opponentCoinsDisplay) {
  opponentCoinsDisplay.textContent =
    String(opponent.score);
}

if (levelsWonDisplay && game.levelsWon) {
  levelsWonDisplay.textContent =
    `${game.levelsWon[1] || 0}-${game.levelsWon[2] || 0}`;
}

  if (Array.isArray(game.coins)) {
    coins = game.coins.map(coin => ({
      ...coin,
      radius: coin.radius || 9,
      phase: coin.phase || 0,
      sparklePhase: coin.sparklePhase || 0
    }));
  }

  if (Array.isArray(game.obstacles)) {
    obstacles = game.obstacles;
  }

  collected = score;
  updateScoreDisplays();

  if (game.gameOver) {
    gameOver = true;
    gameRunning = false;
    multiplayerReady = false;

    const winner = game.matchOver ? game.matchWinner : game.winner;
    const isDraw = winner === null || winner === undefined;
    const iWon = !isDraw && Number(winner) === Number(myPlayerNumber);

    stopBackgroundMusic();

    if (game.matchOver && isDraw) {
      showMessage("MATCH DRAW", "The five levels ended in a draw.");
    } else if (game.matchOver && iWon) {
      showMessage("YOU BEAT THE GAME", "You won the five-level match!");
      playWinSound();
    } else if (game.matchOver) {
      showMessage("MATCH LOST", "Your opponent won the five-level match.");
      playLoseSound();
    } else if (isDraw) {
      showMessage(
        "LEVEL DRAW",
        `Level ${currentLevel} ended in a draw. Advance to the next level?`
      );
    } else if (iWon) {
      showMessage(
        "LEVEL COMPLETE!",
        `You won Level ${currentLevel}! Advance to the next level?`
      );
      playWinSound();
    } else {
      showMessage(
        "LEVEL FAILED",
        `Your opponent won Level ${currentLevel}. Try this level again or advance.`
      );
      playLoseSound();
    }

    if (playAgainBtn) {
      playAgainBtn.textContent = game.matchOver ? "Play Again" : "Next Level";
    }

    if (gameStatus) {
      gameStatus.textContent = game.matchOver
        ? "Five-level match complete."
        : `Level ${currentLevel} ended.`;
    }

    return;
  }

  gameOver = false;
  gameRunning = Boolean(game.started);
  multiplayerReady = Boolean(game.started);

  if (game.started) {
    if (gameStatus) {
      gameStatus.textContent =
        `Level ${currentLevel}: ${getLevelDetails(currentLevel).name} — collect coins!`;
    }
    startBackgroundMusic();
    hideMessage();
  }
}

// ---------------------------------------------------------
// 27. SEND PLAYER MOVEMENT TO SERVER
// ---------------------------------------------------------

function sendMultiplayerMovement() {
  if (
    practiceMode ||
    !currentRoomCode ||
    !multiplayerReady ||
    !gameRunning ||
    gameOver
  ) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (keys.ArrowLeft || keys.a || keys.A) dx--;
  if (keys.ArrowRight || keys.d || keys.D) dx++;
  if (keys.ArrowUp || keys.w || keys.W) dy--;
  if (keys.ArrowDown || keys.s || keys.S) dy++;

  if (dx === 0 && dy === 0) return;

  const length = Math.hypot(dx, dy) || 1;

  const nextX = clamp(
    player.x + (dx / length) * player.speed,
    player.radius,
    canvas.width - player.radius
  );

  const nextY = clamp(
    player.y + (dy / length) * player.speed,
    player.radius,
    canvas.height - player.radius
  );

  player.x = nextX;
  player.y = nextY;

sendToServer({
  type: "player_move",
  position: {
    x: player.x,
    y: player.y
  }
});
}

// ---------------------------------------------------------
// 28. ROOM BUTTONS
// ---------------------------------------------------------

if (createRoomBtn) {
  createRoomBtn.addEventListener("click", async () => {
    await leaveCurrentRoomBeforeAction();
    connectToServer();
    sendToServer({ type: "create_room", isPublic: false });
  });
}

if (createPublicRoomBtn) {
  createPublicRoomBtn.addEventListener("click", async () => {
    await leaveCurrentRoomBeforeAction();
    connectToServer();
    sendToServer({ type: "create_room", isPublic: true });
  });
}

if (refreshPublicRoomsBtn) {
  refreshPublicRoomsBtn.addEventListener("click", () => {
    requestPublicRooms();
  });
}

if (joinRoomBtn) {
  joinRoomBtn.addEventListener("click", async () => {
    const code = roomCodeInput
      ? roomCodeInput.value.trim().toUpperCase()
      : "";

    if (!code) {
      if (gameStatus) {
        gameStatus.textContent = "Enter a room code first.";
      }
      return;
    }

    await leaveCurrentRoomBeforeAction();
    connectToServer();
    sendToServer({
      type: "join_room",
      roomCode: code,
      code
    });
  });
}

if (leaveRoomBtn) {
  leaveRoomBtn.addEventListener("click", () => {
    if (currentRoomCode) {
      sendToServer({ type: "leave_room" });
    }

    resetMultiplayerState();
  });
}

// ---------------------------------------------------------
// 29. PLAY NOW AND MULTIPLAYER START BUTTONS
// ---------------------------------------------------------

if (startPracticeBtn) {
  startPracticeBtn.addEventListener("click", () => {
    multiplayerRequested = false;
    if (multiplayerConnectionTimer) {
      clearTimeout(multiplayerConnectionTimer);
      multiplayerConnectionTimer = null;
    }
    if (startFootnote) {
      startFootnote.textContent = defaultStartFootnoteText;
    }

    if (startScreen) {
      startScreen.style.display = "none";
    }

    document.body.classList.add("practice-mode");

    practiceMode = true;
    currentRoomCode = null;
    myPlayerNumber = null;
    multiplayerReady = false;

    resetGame();
    startBackgroundMusic();
  });
}

if (startMultiplayerBtn) {
  startMultiplayerBtn.addEventListener("click", () => {
    if (startFootnote) {
      startFootnote.textContent = defaultStartFootnoteText;
    }

    multiplayerRequested = true;
    if (!connectToServer()) {
      showMultiplayerUnavailable();
      return;
    }

    if (socket && socket.readyState === window.WebSocket.OPEN) {
      enterMultiplayerLobby();
      return;
    }

    multiplayerConnectionTimer = setTimeout(() => {
      if (!multiplayerRequested) return;

      const pendingConnection = socket;
      showMultiplayerUnavailable();
      if (pendingConnection && pendingConnection.readyState === window.WebSocket.CONNECTING) {
        socket = null;
        pendingConnection.close();
      }
    }, 5000);
  });
}

// ---------------------------------------------------------
// 30. RESTART AND PLAY AGAIN
// ---------------------------------------------------------

function restartCurrentGame() {
  if (currentRoomCode) {
    sendToServer({ type: "restart_game" });
    return;
  }

  resetGame(1);
  startBackgroundMusic();
}

if (restartBtn) {
  restartBtn.addEventListener("click", restartCurrentGame);
}

if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    hideMessage();

    if (currentRoomCode) {
      sendToServer({
        type: multiplayerGameState && multiplayerGameState.matchOver
          ? "restart_game"
          : "next_level"
      });
    } else {
      resetGame(
        practiceLevelWon
          ? (currentLevel === 5 ? 1 : currentLevel + 1)
          : currentLevel
      );
      startBackgroundMusic();
    }
  });
}

// ---------------------------------------------------------
// 31. MAIN GAME LOOP
// ---------------------------------------------------------

function gameLoop() {
  requestAnimationFrame(gameLoop);

  if (!ctx || !canvas) return;

  // Draw the arena background.
  drawArena();

  // Grass and flowers are decorative and do not affect movement.
  drawGrassDetails();

  if (practiceMode && gameRunning && !gameOver) {
    movePracticePlayer();
    collectPracticeCoins();
  }

  if (!practiceMode && gameRunning && !gameOver) {
    sendMultiplayerMovement();
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
  drawOpponent();
}

// ---------------------------------------------------------
// 32. INITIALISE GAME
// ---------------------------------------------------------

connectToServer();
updateScoreDisplays();
updateLevelDisplay();
updateRoomDisplay();
gameLoop();

// ---------------------------------------------------------
// END OF PART 4 — GAME.JS COMPLETE
// ---------------------------------------------------------