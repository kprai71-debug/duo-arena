# Duo Arena

Duo Arena is a browser game with a solo arena and online multiplayer rooms.

## Controls

- Move with **W, A, S, D** or the **arrow keys**.
- Press **M** or select the music button to toggle music.

## How to play

Select **PLAY NOW** for solo play or **MULTIPLAYER** to create or join a room.
Collect coins, avoid obstacles, and complete all five levels before time runs out.

## Run locally

1. Install [Node.js 18 or newer](https://nodejs.org/).
2. Open a terminal in this folder and run `npm install`.
3. Run `npm start`.
4. Visit <http://localhost:3000>.

## Play online

Play Duo Arena: [https://your-game-link.example](https://your-game-link.example)

For multiplayer on a static site, set `MULTIPLAYER_SERVER_URL` near the top of
`game.js` to your online WebSocket server URL, such as
`wss://my-game.onrender.com`.
