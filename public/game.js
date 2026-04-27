const player = {
  name: "",
  hp: 100,
  maxHp: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  gold: 0,
  inventory: []
};

let enemy = createEnemy();

const loginPanel = document.getElementById("loginPanel");
const gamePanel = document.getElementById("gamePanel");
const nameInput = document.getElementById("nameInput");
const startBtn = document.getElementById("startBtn");

const heroName = document.getElementById("heroName");
const heroHp = document.getElementById("heroHp");
const heroLevel = document.getElementById("heroLevel");
const heroXp = document.getElementById("heroXp");
const heroGold = document.getElementById("heroGold");

const enemyName = document.getElementById("enemyName");
const enemyHp = document.getElementById("enemyHp");
const enemyHpBar = document.getElementById("enemyHpBar");

const attackBtn = document.getElementById("attackBtn");
const heavyAttackBtn = document.getElementById("heavyAttackBtn");
const healBtn = document.getElementById("healBtn");
const newEnemyBtn = document.getElementById("newEnemyBtn");

const battleLog = document.getElementById("battleLog");
const inventoryText = document.getElementById("inventoryText");

const chatInput = document.getElementById("chatInput");
const chatBtn = document.getElementById("chatBtn");
const chatBox = document.getElementById("chatBox");

startBtn.addEventListener("click", startGame);
attackBtn.addEventListener("click", () => playerAttack("normal"));
heavyAttackBtn.addEventListener("click", () => playerAttack("heavy"));
healBtn.addEventListener("click", rest);
newEnemyBtn.addEventListener("click", spawnNewEnemy);
chatBtn.addEventListener("click", sendChat);

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startGame();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendChat();
});

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введи імʼя героя");
    return;
  }

  player.name = name;
  loginPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");

  addLog(`Герой ${player.name} прибув у Старий Табір.`);
  render();
}

function createEnemy() {
  const enemies = [
    { name: "Лісовий вовк", hp: 40, maxHp: 40, damage: 8, xp: 35, gold: 8 },
    { name: "Розбійник", hp: 55, maxHp: 55, damage: 11, xp: 50, gold: 14 },
    { name: "Печерний павук", hp: 35, maxHp: 35, damage: 7, xp: 30, gold: 6 }
  ];

  return { ...enemies[Math.floor(Math.random() * enemies.length)] };
}

function playerAttack(type) {
  if (player.hp <= 0) {
    addLog("Ти непритомний. Натисни “Відпочити”.");
    return;
  }

  if (enemy.hp <= 0) {
    addLog("Ворог уже переможений. Шукай нового.");
    return;
  }

  let damage = type === "heavy"
    ? random(16, 28)
    : random(8, 16);

  if (type === "heavy" && Math.random() < 0.25) {
    damage = 0;
    addLog("🔥 Сильний удар промахнувся!");
  } else {
    enemy.hp = Math.max(0, enemy.hp - damage);
    addLog(`${player.name} завдав ${damage} шкоди ворогу.`);
  }

  if (enemy.hp <= 0) {
    winBattle();
  } else {
    enemyAttack();
  }

  render();
}

function enemyAttack() {
  const damage = random(enemy.damage - 3, enemy.damage + 4);
  player.hp = Math.max(0, player.hp - damage);

  addLog(`${enemy.name} атакує і завдає ${damage} шкоди.`);

  if (player.hp <= 0) {
    addLog("💀 Ти впав у бою. Відпочинь, щоб відновитись.");
  }
}

function winBattle() {
  player.xp += enemy.xp;
  player.gold += enemy.gold;

  addLog(`🏆 ${enemy.name} переможений! +${enemy.xp} XP, +${enemy.gold} золота.`);

  if (Math.random() < 0.35) {
    player.inventory.push("Малий лікувальний настій");
    addLog("🎒 Знайдено предмет: Малий лікувальний настій.");
  }

  checkLevelUp();
}

function checkLevelUp() {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext += 50;
    player.maxHp += 20;
    player.hp = player.maxHp;

    addLog(`⭐ Новий рівень! Тепер ти рівня ${player.level}.`);
  }
}

function rest() {
  const heal = random(20, 35);
  player.hp = Math.min(player.maxHp, player.hp + heal);

  addLog(`🧪 Ти відпочив і відновив ${heal} HP.`);
  render();
}

function spawnNewEnemy() {
  enemy = createEnemy();
  addLog(`🌲 З темного лісу виходить новий ворог: ${enemy.name}.`);
  render();
}

function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  const p = document.createElement("p");
  p.textContent = `${player.name || "Гість"}: ${text}`;
  chatBox.appendChild(p);
  chatInput.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;
}

function render() {
  heroName.textContent = player.name || "Герой";
  heroHp.textContent = `${player.hp}/${player.maxHp}`;
  heroLevel.textContent = player.level;
  heroXp.textContent = `${player.xp}/${player.xpToNext}`;
  heroGold.textContent = player.gold;

  enemyName.textContent = enemy.name;
  enemyHp.textContent = `${enemy.hp}/${enemy.maxHp} HP`;

  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  enemyHpBar.style.width = `${hpPercent}%`;

  inventoryText.textContent = player.inventory.length
    ? player.inventory.join(", ")
    : "Порожньо";
}

function addLog(message) {
  const p = document.createElement("p");
  p.textContent = message;
  battleLog.prepend(p);
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

render();
