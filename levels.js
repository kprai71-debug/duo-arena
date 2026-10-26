"use strict";

const LEVELS = [
  {
    name: "Space",
    duration: 60,
    sky: ["#65bff2", "#bceaff", "#effbdc"],
    sun: "#fff0a3",
    hills: ["#91c96c", "#71b950"],
    ground: ["#70bd43", "#3f963b"],
    player: ["#4e9a43", "#34713b", "#347b3e", "#477cad"],
    opponent: ["#d66f42", "#a84d35", "#b54c38", "#8a6546"]
  },
  {
    name: "Ice",
    duration: 60,
    sky: ["#9de9ff", "#e8fbff", "#f4ffff"],
    sun: "#ffffff",
    hills: ["#b6e5e8", "#8dcbd7"],
    ground: ["#9bd7e2", "#5ca9c0"],
    player: ["#2798b8", "#176b91", "#337eae", "#426c91"],
    opponent: ["#a64d9a", "#74376e", "#844b9e", "#634f82"]
  },
  {
    name: "Lava",
    duration: 60,
    sky: ["#451f33", "#a44731", "#e86b36"],
    sun: "#ffb13b",
    hills: ["#6d3932", "#4b292d"],
    ground: ["#74372c", "#3c2229"],
    player: ["#ff9d35", "#bc532b", "#d47d33", "#80523e"],
    opponent: ["#62c9d3", "#278b96", "#397caa", "#535078"]
  },
  {
    name: "Jungle",
    duration: 60,
    sky: ["#5da98a", "#b8dd9b", "#e2efb1"],
    sun: "#ffe18a",
    hills: ["#477d39", "#315c35"],
    ground: ["#4c943e", "#28663a"],
    player: ["#d4bf43", "#8f7b2e", "#a9863e", "#665a38"],
    opponent: ["#db7554", "#9e4838", "#b75c4b", "#76543b"]
  },
  {
    name: "Golden Temple",
    duration: 60,
    sky: ["#72513a", "#d49a4c", "#f4d47a"],
    sun: "#fff1a8",
    hills: ["#b4823e", "#8b5b31"],
    ground: ["#be913b", "#76502c"],
    player: ["#d5a92f", "#927124", "#ad8030", "#765b34"],
    opponent: ["#52b4a4", "#347a70", "#417c87", "#594e66"]
  },
  {
    name: "Underwater",
    duration: 60,
    coinCount: 11,
    sky: ["#073b5c", "#168f9b", "#a7dfc5"],
    sun: "#c6fff1",
    hills: ["#147c78", "#07525d"],
    ground: ["#147f72", "#084b57"],
    player: ["#40d9c2", "#188b87", "#68c9e8", "#316c88"],
    opponent: ["#ed7698", "#a74069", "#d35c88", "#714361"]
  },
  {
    name: "Candy World",
    duration: 55,
    coinCount: 12,
    sky: ["#f5a9d2", "#ffcce3", "#fff0c8"],
    sun: "#fff5ab",
    hills: ["#e997bc", "#cb70a3"],
    ground: ["#e98d9d", "#b75f87"],
    player: ["#ff668d", "#c53668", "#58a9dc", "#8054ae"],
    opponent: ["#56c8a0", "#29876f", "#edb64e", "#80633a"]
  },
  {
    name: "Neon City",
    duration: 50,
    coinCount: 13,
    sky: ["#101a52", "#273f83", "#8053a4"],
    sun: "#ff69d2",
    hills: ["#394d88", "#222d61"],
    ground: ["#303d74", "#171c46"],
    player: ["#32f1e4", "#14939f", "#ff65c9", "#514ad0"],
    opponent: ["#ffcd45", "#d57532", "#55d9ff", "#4b5799"]
  },
  {
    name: "Haunted Night",
    duration: 45,
    coinCount: 14,
    sky: ["#17152f", "#38345d", "#71607a"],
    sun: "#d8c8ff",
    hills: ["#39394f", "#27283e"],
    ground: ["#424044", "#22212d"],
    player: ["#8cdb8a", "#4d965f", "#b99ce8", "#54507b"],
    opponent: ["#e88d65", "#a7504c", "#cda957", "#665044"]
  },
  {
    name: "Cosmic Finale",
    duration: 40,
    coinCount: 15,
    sky: ["#170c3a", "#512878", "#d04f8c"],
    sun: "#ffe58b",
    hills: ["#56316f", "#351c57"],
    ground: ["#53326b", "#271744"],
    player: ["#ffe45c", "#d68137", "#64e6ff", "#5847a8"],
    opponent: ["#ff78bb", "#b63d87", "#8eea9c", "#4b6b67"]
  }
];

function getLevelConfig(level) {
  return LEVELS[Math.max(1, Math.min(10, Math.floor(Number(level) || 1))) - 1];
}

function createLevelObstacles(level) {
  const currentLevel = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
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
    { x: 650, y: 410, width: 100, height: 18, speedX: -1.1, speedY: 0 },
    { x: 270, y: 220, width: 18, height: 120, speedX: 0, speedY: -1.35 },
    { x: 465, y: 365, width: 125, height: 18, speedX: 1.45, speedY: 0 },
    { x: 80, y: 110, width: 18, height: 115, speedX: 0, speedY: 1.55 },
    { x: 430, y: 235, width: 135, height: 18, speedX: -1.65, speedY: 0 },
    { x: 710, y: 95, width: 18, height: 125, speedX: 0, speedY: -1.8 }
  ];

  obstacles.push(
    ...additionalObstacles.slice(0, Math.min(currentLevel - 1, additionalObstacles.length))
  );

  return obstacles.map(obstacle => ({
    ...obstacle,
    speedX: obstacle.speedX * speedMultiplier,
    speedY: obstacle.speedY * speedMultiplier
  }));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createLevelObstacles, getLevelConfig };
} else {
  window.DuoArenaLevels = { createLevelObstacles, getLevelConfig };
}
