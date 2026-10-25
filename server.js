const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { createLevelObstacles, getLevelConfig } = require("./levels");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const rooms = new Map();

const server = http.createServer((req, res) => {
  let pathname;

  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("ok");
  }

  const routes = {
    "/": "index.html",
    "/index.html": "index.html",
    "/style.css": "style.css",
    "/game.js": "game.js",
    "/levels.js": "levels.js"
  };

  const filename = routes[pathname];

  if (!filename) {
    res.writeHead(404);
    return res.end("Not Found");
  }

  const filepath = path.join(ROOT, filename);

  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
  };

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Could not load file");
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filename)]
    });

    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

function send(socket, data) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcast(room, data) {
  room.players.forEach(player => send(player.socket, data));
}

function makeRoomCode() {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;

  do {
    code = "";

    for (let i = 0; i < 6; i++) {
      code += characters[
        Math.floor(Math.random() * characters.length)
      ];
    }
  } while (rooms.has(code));

  return code;
}

function getPublicRooms() {
  return [...rooms.values()]
    .filter(room => room.isPublic && room.players.length < 2)
    .map(room => ({
      code: room.code,
      playerCount: room.players.length,
      status: room.players.length === 1 ? "Waiting for player 2" : "Open"
    }));
}

function broadcastPublicRooms() {
  const publicRooms = getPublicRooms();

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      send(client, {
        type: "public_room_list",
        rooms: publicRooms
      });
    }
  });
}

function spawnCoin() {
  return {
    x: 15 + Math.random() * 770,
    y: 15 + Math.random() * 470,
    radius: 9,
    id: Math.random().toString(36).slice(2, 10)
  };
}

function serverCircleTouchesObstacle(x, y, radius, obstacle) {
  const closestX = Math.max(
    obstacle.x,
    Math.min(x, obstacle.x + obstacle.width)
  );

  const closestY = Math.max(
    obstacle.y,
    Math.min(y, obstacle.y + obstacle.height)
  );

  return Math.hypot(
    x - closestX,
    y - closestY
  ) < radius;
}

function pushPlayerOut(player, obstacles, radius = 15) {
  for (let attempt = 0; attempt < obstacles.length * 2; attempt++) {
    let pushed = false;

    for (const obstacle of obstacles) {
      if (!serverCircleTouchesObstacle(player.x, player.y, radius, obstacle)) {
        continue;
      }

      const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
      const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));
      const dx = player.x - closestX;
      const dy = player.y - closestY;
      const distance = Math.hypot(dx, dy);

      if (distance >= radius) continue;

      if (distance > 0) {
        const pushDistance = radius - distance + 0.01;
        player.x += (dx / distance) * pushDistance;
        player.y += (dy / distance) * pushDistance;
      } else {
        const exits = [
          { distance: player.x - obstacle.x, x: obstacle.x - radius - 0.01, y: player.y },
          { distance: obstacle.x + obstacle.width - player.x, x: obstacle.x + obstacle.width + radius + 0.01, y: player.y },
          { distance: player.y - obstacle.y, x: player.x, y: obstacle.y - radius - 0.01 },
          { distance: obstacle.y + obstacle.height - player.y, x: player.x, y: obstacle.y + obstacle.height + radius + 0.01 }
        ];
        exits.sort((a, b) => a.distance - b.distance);
        player.x = exits[0].x;
        player.y = exits[0].y;
      }

      player.x = Math.max(radius, Math.min(800 - radius, player.x));
      player.y = Math.max(radius, Math.min(500 - radius, player.y));
      pushed = true;
    }

    if (!pushed) break;
  }
}

function updateRoom(room) {
  broadcast(room, {
    type: "room_update",
    roomCode: room.code,
    players: room.players.map(player => ({
      playerNumber: player.playerNumber
    })),
    playerCount: room.players.length,
    readyToPlay: room.players.length === 2
  });
}
function startRoomCountdown(room) {
  if (
    !room ||
    room.players.length !== 2 ||
    room.countdownActive ||
    room.game.started
  ) {
    return;
  }

  room.countdownActive = true;
  const generation = (room.countdownGeneration || 0) + 1;
  room.countdownGeneration = generation;

  let count = 3;

  function nextCount() {
    if (
      room.countdownGeneration !== generation ||
      !rooms.has(room.code) ||
      room.players.length !== 2
    ) {
      if (room.countdownGeneration === generation) {
        room.countdownActive = false;
      }
      return;
    }

    if (count > 0) {
      broadcast(room, {
        type: "countdown",
        value: String(count)
      });

      count--;
      setTimeout(nextCount, 1000);
      return;
    }

    broadcast(room, {
      type: "countdown",
      value: "GO!"
    });

    setTimeout(() => {
      if (
        room.countdownGeneration !== generation ||
        !rooms.has(room.code) ||
        room.players.length !== 2
      ) {
        if (room.countdownGeneration === generation) {
          room.countdownActive = false;
        }
        return;
      }

      room.game.started = true;
      room.countdownActive = false;
      room.game.startedAt = Date.now();
      room.game.timeRemaining = room.game.duration;

      broadcast(room, {
        type: "game_state",
        game: room.game
      });
    }, 700);
  }

  nextCount();
}
function leaveRoom(socket) {
  if (!socket.roomCode) return;

  const code = socket.roomCode;
  const room = rooms.get(code);

  socket.roomCode = null;
  socket.playerNumber = null;

  if (!room) return;

  room.players = room.players.filter(
    player => player.socket !== socket
  );

  if (room.players.length === 0) {
    rooms.delete(code);
    console.log(`Room ${code} closed.`);
    broadcastPublicRooms();
    return;
  }

  if (room.players.length === 1 && room.isPublic) {
    broadcastPublicRooms();
  }

  if (room.players.length === 1) {
    room.countdownGeneration = (room.countdownGeneration || 0) + 1;
    room.game.started = false;
    room.game.gameOver = false;
    room.game.winner = null;
    room.game.matchOver = false;
    room.game.startedAt = null;
    room.game.timeRemaining = room.game.duration;
    room.game.players[1].x = 100;
    room.game.players[1].y = 200;
    room.game.players[1].movementSequence = 0;
    room.game.players[2].x = 450;
    room.game.players[2].y = 250;
    room.game.players[2].movementSequence = 0;
    room.game.players[1].score = 0;
    room.game.players[2].score = 0;
    room.game.obstacles = createLevelObstacles(room.game.level);
    room.game.coins = Array.from({ length: 6 }, spawnCoin);
    room.countdownActive = false;
  }

  updateRoom(room);
}

wss.on("connection", socket => {
  socket.roomCode = null;
  socket.playerNumber = null;

  console.log("A client connected.");

  send(socket, {
    type: "server_ready",
    message: "Connected to Duo Arena server"
  });

  socket.on("message", raw => {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      return send(socket, {
        type: "error",
        message: "Invalid message format."
      });
    }

    if (!data || typeof data.type !== "string") {
      return send(socket, {
        type: "error",
        message: "Message type is required."
      });
    }

    if (data.type === "create_room") {
      if (socket.roomCode) {
        return send(socket, {
          type: "error",
          message: "You are already in a room."
        });
      }

      const code = makeRoomCode();
      const isPublic = Boolean(data.isPublic);

      const room = {
        code,
        isPublic,
        players: [{
          socket,
          playerNumber: 1
        }],
        game: {
          started: false,
          gameOver: false,
          winner: null,
          matchOver: false,
          matchWinner: null,
          level: 1,
          duration: getLevelConfig(1).duration,
          timeRemaining: getLevelConfig(1).duration,
          startedAt: null,
          targetScore: 10,
          players: {
            1: { x: 100, y: 200, score: 0, levelsWon: 0, movementSequence: 0 },
            2: { x: 450, y: 250, score: 0, levelsWon: 0, movementSequence: 0 }
          },
          obstacles: createLevelObstacles(1),
          coins: Array.from({ length: 6 }, spawnCoin)
        }
      };

      rooms.set(code, room);
      socket.roomCode = code;
      socket.playerNumber = 1;

      send(socket, {
        type: "room_created",
        roomCode: code,
        playerNumber: 1,
        message: "Room created. Waiting for Player 2."
      });

      broadcastPublicRooms();
      updateRoom(room);
      console.log(`Room ${code} created.`);
      return;
    }

    if (data.type === "join_room") {
      if (socket.roomCode) {
        return send(socket, {
          type: "error",
          message: "Leave your current room first."
        });
      }

      if (typeof data.roomCode !== "string") {
        return send(socket, {
          type: "error",
          message: "Please enter a valid room code."
        });
      }

      const code = data.roomCode.trim().toUpperCase();
      const room = rooms.get(code);

      if (!room) {
        return send(socket, {
          type: "error",
          message: "Room not found. Check the code."
        });
      }

      if (room.players.length >= 2) {
        return send(socket, {
          type: "error",
          message: "This room is already full."
        });
      }

      socket.roomCode = code;
      const playerNumber = room.players.some(player => player.playerNumber === 1)
        ? 2
        : 1;
      socket.playerNumber = playerNumber;

      room.players.push({
        socket,
        playerNumber
      });

      send(socket, {
        type: "room_joined",
        roomCode: code,
        playerNumber,
        message: "You joined the room."
      });

      broadcastPublicRooms();
      updateRoom(room);
      console.log(`Player ${playerNumber} joined room ${code}.`);
      startRoomCountdown(room);
      return;
    }

    if (data.type === "request_public_rooms") {
      send(socket, {
        type: "public_room_list",
        rooms: getPublicRooms()
      });
      return;
    }

    if (data.type === "leave_room") {
      leaveRoom(socket);

      send(socket, {
        type: "room_left",
        message: "You left the room."
      });
      broadcastPublicRooms();
      return;
    }
    
if (data.type === "restart_game" || data.type === "next_level") {
  if (!socket.roomCode || !socket.playerNumber) {
    return;
  }

  const room = rooms.get(socket.roomCode);

  if (!room || (data.type === "next_level" && room.players.length !== 2)) {
    return;
  }
  if (data.type === "next_level" && !room.game.gameOver) {
    return;
  }

  if (data.type === "next_level") {
    if (room.game.matchOver || room.game.level >= 5) return;
    room.game.level += 1;
  } else {
    room.game.level = 1;
    room.game.players[1].levelsWon = 0;
    room.game.players[2].levelsWon = 0;
  }

  const levelConfig = getLevelConfig(room.game.level);
  room.game.started = false;
  room.game.gameOver = false;
  room.game.winner = null;
  room.game.matchOver = false;
  room.game.matchWinner = null;
  room.game.duration = levelConfig.duration;
  room.game.timeRemaining = levelConfig.duration;
  room.game.startedAt = null;

  room.game.players[1] = {
    x: 100,
    y: 200,
    score: 0,
    levelsWon: room.game.players[1].levelsWon,
    movementSequence: 0
  };

  room.game.players[2] = {
    x: 450,
    y: 250,
    score: 0,
    levelsWon: room.game.players[2].levelsWon,
    movementSequence: 0
  };

  room.game.obstacles = createLevelObstacles(room.game.level);

  room.game.coins = Array.from(
    { length: 6 },
    spawnCoin
  );

  broadcast(room, {
    type: "game_state",
    game: room.game
  });

  if (room.players.length === 2) {
    startRoomCountdown(room);
  }
  return;
}
if (data.type === "player_move") {
  if (!socket.roomCode || !socket.playerNumber) {
    return;
  }

  const room = rooms.get(socket.roomCode);

  if (!room || room.players.length !== 2) {
    return;
  }
  if (!room.game.started) {
  return;
}
  if (room.game.gameOver) {
  return;
}

  const playerNumber = socket.playerNumber;
  const move = data.position;

  if (
    !move ||
    typeof move.x !== "number" ||
    typeof move.y !== "number" ||
    !Number.isFinite(move.x) ||
    !Number.isFinite(move.y)
  ) {
    return;
  }


const currentPlayer = room.game.players[playerNumber];

currentPlayer.x = Math.max(15, Math.min(785, move.x));
currentPlayer.y = Math.max(15, Math.min(485, move.y));
currentPlayer.movementSequence = Number.isSafeInteger(data.sequence)
  ? data.sequence
  : currentPlayer.movementSequence + 1;
pushPlayerOut(currentPlayer, room.game.obstacles || []);

for (let i = room.game.coins.length - 1; i >= 0; i--) {
  const coin = room.game.coins[i];

  const distance = Math.hypot(
    currentPlayer.x - coin.x,
    currentPlayer.y - coin.y
  );

  if (distance < 24) {
    room.game.coins.splice(i, 1);
    currentPlayer.score += 1;
    room.game.coins.push(spawnCoin());

    if (currentPlayer.score >= room.game.targetScore) {
      finishLevel(room, playerNumber);
    }
  }
}

return;
}
    if (data.type === "ping") {
      send(socket, { type: "pong" });
      return;
    }

    send(socket, {
      type: "error",
      message: "Unknown message type."
    });
  });

  socket.on("close", () => {
    leaveRoom(socket);
    console.log("A client disconnected.");
  });

  socket.on("error", error => {
    console.error("WebSocket error:", error.message);
  });
});

setInterval(() => {
  for (const room of rooms.values()) {
    if (
      !room.game.started ||
      room.game.gameOver ||
      !room.game.obstacles
    ) {
      continue;
    }

    const secondsLeft = Math.max(
      0,
      Math.ceil((room.game.duration * 1000 - (Date.now() - room.game.startedAt)) / 1000)
    );
    room.game.timeRemaining = secondsLeft;

    if (secondsLeft === 0) {
      const scoreOne = room.game.players[1].score;
      const scoreTwo = room.game.players[2].score;
      finishLevel(room, scoreOne === scoreTwo ? null : scoreOne > scoreTwo ? 1 : 2);
      continue;
    }

    room.game.obstacles.forEach(obstacle => {
      obstacle.x += obstacle.speedX * 2;
      obstacle.y += obstacle.speedY * 2;

      if (
        obstacle.x <= 10 ||
        obstacle.x + obstacle.width >= 790
      ) {
        obstacle.speedX *= -1;
      }

      if (
        obstacle.y <= 10 ||
        obstacle.y + obstacle.height >= 490
      ) {
        obstacle.speedY *= -1;
      }
    });

    broadcast(room, {
      type: "game_state",
      game: room.game
    });
  }
}, 50);

function finishLevel(room, winner) {
  if (room.game.gameOver) return;

  room.game.gameOver = true;
  room.game.winner = winner;
  room.game.started = false;

  if (winner !== null) {
    room.game.players[winner].levelsWon++;
  }

  if (room.game.level === 5) {
    room.game.matchOver = true;
    const winsOne = room.game.players[1].levelsWon;
    const winsTwo = room.game.players[2].levelsWon;
    room.game.matchWinner = winsOne === winsTwo ? null : winsOne > winsTwo ? 1 : 2;
  }

  broadcast(room, { type: "game_state", game: room.game });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Duo Arena server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
