const socket = io();

function join() {
  const name = document.getElementById("name").value;
  socket.emit("join", name);
  document.getElementById("game").style.display = "block";
}

function fight() {
  socket.emit("fight");
}

function send() {
  const msg = document.getElementById("msg").value;
  socket.emit("chat", msg);
}

socket.on("update", (player) => {
  document.getElementById("stats").innerText =
    `❤️ ${player.hp}/${player.maxHp} | LVL ${player.level} | XP ${player.xp} | 💰 ${player.gold}`;
});

socket.on("battle", (log) => {
  document.getElementById("log").innerHTML = log.join("<br>");
});

socket.on("chat", (msg) => {
  document.getElementById("chat").innerHTML += msg + "<br>";
});
