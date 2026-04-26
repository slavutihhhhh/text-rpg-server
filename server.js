const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};

const enemies = [
  { name: "Вовк", hp: 30, damage: 5 },
  { name: "Гоблін", hp: 50, damage: 8 },
  { name: "Скелет", hp: 40, damage: 7 }
];

io.on("connection", (socket) => {
  console.log("Player connected");

  socket.on("join", (name) => {
    players[socket.id] = {
      name,
      hp: 100,
      maxHp: 100,
      xp: 0,
      level: 1,
      gold: 50
    };

    socket.emit("update", players[socket.id]);
  });

  socket.on("fight", () => {
    let player = players[socket.id];
    let enemy = JSON.parse(JSON.stringify(enemies[Math.floor(Math.random() * enemies.length)]));

    let log = [];

    while (player.hp > 0 && enemy.hp > 0) {
      enemy.hp -= 10;
      log.push(`Ти вдарив ${enemy.name} (-10)`);

      if (enemy.hp <= 0) break;

      player.hp -= enemy.damage;
      log.push(`${enemy.name} б'є тебе (-${enemy.damage})`);
    }

    if (player.hp <= 0) {
      player.hp = player.maxHp;
      log.push("💀 Ти програв і відновився");
    } else {
      player.xp += 10;
      player.gold += 5;
      log.push("🏆 Перемога! +10 XP, +5 золота");
    }

    socket.emit("battle", log);
    socket.emit("update", player);
  });

  socket.on("chat", (msg) => {
    let player = players[socket.id];
    io.emit("chat", `${player.name}: ${msg}`);
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
