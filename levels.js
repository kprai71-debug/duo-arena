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
  }
];

function getLevelConfig(level) {
  return LEVELS[Math.max(1, Math.min(5, Math.floor(Number(level) || 1))) - 1];
}

function createLevelObstacles(level) {
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
