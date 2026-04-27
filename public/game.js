const SAVE_KEY = "lost_land_save_v2";

const locations = {
  camp: {
    name: "Старий Табір",
    text: "Безпечне місце біля темного лісу. Тут можна перевести подих.",
    enemies: ["Лісовий вовк", "Голодний пацюк"],
    travel: ["forest", "road"]
  },
  forest: {
    name: "Темний Ліс",
    text: "Мокрі дерева, туман і дивні звуки. Тут небезпечно, але є здобич.",
    enemies: ["Лісовий вовк", "Печерний павук", "Розбійник"],
    travel: ["camp", "cave"]
  },
  road: {
    name: "Північна Дорога",
    text: "Стара дорога до покинутих земель. Тут часто нападають розбійники.",
    enemies: ["Розбійник", "Бродячий пес"],
    travel: ["camp", "cave"]
  },
  cave: {
    name: "Покинута Печера",
    text: "Темна печера з холодним повітрям. Слабким героям тут не місце.",
    enemies: ["Печерний павук", "Камʼяний щур", "Старий упир"],
    travel: ["forest", "road"]
  }
};

const enemyTypes = {
  "Голодний пацюк": { hp: 26, damage: 5, xp: 20, gold: 4 },
  "Лісовий вовк": { hp: 42, damage: 8, xp: 35, gold: 8 },
  "Бродячий пес": { hp: 38, damage: 7, xp: 30, gold: 7 },
  "Розбійник": { hp: 58, damage: 11, xp: 55, gold: 15 },
  "Печерний павук": { hp: 48, damage: 10, xp: 45, gold: 10 },
  "Камʼяний щур": { hp: 70, damage: 12, xp: 65, gold: 18 },
  "Старий упир": { hp: 95, damage: 16, xp: 110, gold: 35 }
};

let player = {
  name: "",
  hp: 100,
  maxHp: 100,
  level: 1,
  xp: 0,
  xpToNext: 100,
  gold: 0,
  location: "camp",
  inventory: ["Мале зілля"]
};

let enemy = createEnemy();

const $ = (id) => document.getElementById(id);

const loginPanel = $("loginPanel");
const gamePanel = $("gamePanel");
const nameInput = $("nameInput");
const startBtn = $("startBtn");
const saveBtn = $("saveBtn");

const heroName = $("heroName");
const heroStatus = $("heroStatus");
const heroHp = $("heroHp");
const heroLevel = $("heroLevel");
const heroXp = $("heroXp");
const heroGold = $("heroGold");

const locationName = $("locationName");
const locationText = $("locationText");
const locationButtons = $("locationButtons");

const enemyName = $("enemyName");
const enemyHp = $("enemyHp");
const enemyHpBar = $("enemyHpBar");

const attackBtn = $("attackBtn");
const heavyAttackBtn = $("heavyAttackBtn");
const usePotionBtn = $("usePotionBtn");
const restBtn = $("restBtn");
const newEnemyBtn = $("newEnemyBtn");

const inventoryText = $("inventoryText");
const battleLog = $("battleLog");

const chatInput = $("chatInput");
const chatBtn = $("chatBtn");
const chatBox = $("chatBox");

startBtn.addEventListener("click", startGame);
saveBtn.addEventListener("click", saveGame);
attackBtn.addEventListener("click", () => playerAttack("normal"));
heavyAttackBtn.addEventListener("click", () => playerAttack("heavy"));
usePotionBtn.addEventListener("click", usePotion);
restBtn.addEventListener("click", rest);
newEnemyBtn.addEventListener("click", spawnNewEnemy);
chatBtn.addEventListener("click", sendChat);

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startGame();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendChat();
});

loadGameIfExists();
render();

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введи імʼя героя");
    return;
  }

  player.name = name;
  enemy = createEnemy();

  loginPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");

  addLog(`Герой ${player.name} прибув у Старий Табір.`);
  saveGame(false);
  render();
}

function loadGameIfExists() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    player = data.player || player;
    enemy = data.enemy || createEnemy();

    loginPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");

    addLog("💾 Збереження завантажено.");
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }
}

function saveGame(showLog = true) {
  localStorage.setItem(SAVE_KEY, JSON.stringify({ player, enemy }));

  if (showLog) {
    addLog("💾 Гру збережено.");
  }
}

function createEnemy() {
  const location = locations[player.location] || locations.camp;
  const list = location.enemies;
  const enemyName = list[random(0, list.length - 1)];
  const base = enemyTypes[enemyName];

  const levelBonus = Math.max(0, player.level - 1);

  return {
    name: enemyName,
    maxHp: base.hp + levelBonus * 8,
    hp: base.hp + levelBonus * 8,
    damage: base.damage + levelBonus * 2,
    xp: base.xp + levelBonus * 8,
    gold: base.gold + levelBonus * 3
  };
}

function travelTo(locationId) {
  if (!locations[locationId]) return;

  player.location = locationId;
  enemy = createEnemy();

  addLog(`🧭 Ти перейшов у локацію: ${locations[locationId].name}.`);
  saveGame(false);
  render();
}

function playerAttack(type) {
  if (player.hp <= 0) {
    addLog("💀 Ти непритомний. Відпочинь або використай зілля.");
    return;
  }

  if (enemy.hp <= 0) {
    addLog("Ворог уже переможений. Натисни “Новий ворог”.");
    return;
  }

  let damage;

  if (type === "heavy") {
    if (Math.random() < 0.3) {
      damage = 0;
      addLog("🔥 Сильний удар промахнувся!");
    } else {
      damage = random(16, 28) + player.level * 2;
      enemy.hp = Math.max(0, enemy.hp - damage);
      addLog(`🔥 ${player.name} завдав сильний удар: ${damage} шкоди.`);
    }
  } else {
    damage = random(8, 16) + player.level;
    enemy.hp = Math.max(0, enemy.hp - damage);
    addLog(`⚔️ ${player.name} атакує: ${damage} шкоди.`);
  }

  if (enemy.hp <= 0) {
    winBattle();
  } else {
    enemyAttack();
  }

  saveGame(false);
  render();
}

function enemyAttack() {
  const dodgeChance = 0.12;

  if (Math.random() < dodgeChance) {
    addLog("💨 Ти ухилився від атаки!");
    return;
  }

  const damage = random(enemy.damage - 3, enemy.damage + 4);
  player.hp = Math.max(0, player.hp - damage);

  addLog(`🩸 ${enemy.name} завдає ${damage} шкоди.`);

  if (player.hp <= 0) {
    addLog("💀 Ти впав у бою. Потрібно відновитися.");
  }
}

function winBattle() {
  player.xp += enemy.xp;
  player.gold += enemy.gold;

  addLog(`🏆 ${enemy.name} переможений! +${enemy.xp} XP, +${enemy.gold} золота.`);

  const lootRoll = Math.random();

  if (lootRoll < 0.35) {
    player.inventory.push("Мале зілля");
    addLog("🎒 Здобич: Мале зілля.");
  } else if (lootRoll < 0.45) {
    player.inventory.push("Іржавий жетон");
    addLog("🎒 Здобич: Іржавий жетон.");
  }

  checkLevelUp();
}

function checkLevelUp() {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext += 60;
    player.maxHp += 20;
    player.hp = player.maxHp;

    addLog(`⭐ Рівень підвищено! Тепер ти рівня ${player.level}. HP повністю відновлено.`);
  }
}

function usePotion() {
  const index = player.inventory.indexOf("Мале зілля");

  if (index === -1) {
    addLog("🧪 У тебе немає малого зілля.");
    return;
  }

  if (player.hp >= player.maxHp) {
    addLog("❤️ HP вже повне.");
    return;
  }

  player.inventory.splice(index, 1);

  const heal = 35;
  player.hp = Math.min(player.maxHp, player.hp + heal);

  addLog(`🧪 Ти випив Мале зілля і відновив ${heal} HP.`);
  saveGame(false);
  render();
}

function rest() {
  const currentLocation = locations[player.location];

  if (player.location !== "camp") {
    addLog("🌙 Безпечно відпочити можна тільки у Старому Таборі.");
    return;
  }

  player.hp = player.maxHp;
  addLog(`🌙 Ти відпочив у ${currentLocation.name}. HP повністю відновлено.`);
  saveGame(false);
  render();
}

function spawnNewEnemy() {
  enemy = createEnemy();
  addLog(`👹 Новий ворог: ${enemy.name}.`);
  saveGame(false);
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
  const currentLocation = locations[player.location] || locations.camp;

  heroName.textContent = player.name || "Герой";
  heroStatus.textContent = getHeroStatus();
  heroHp.textContent = `${player.hp}/${player.maxHp}`;
  heroLevel.textContent = player.level;
  heroXp.textContent = `${player.xp}/${player.xpToNext}`;
  heroGold.textContent = player.gold;

  locationName.textContent = currentLocation.name;
  locationText.textContent = currentLocation.text;

  locationButtons.innerHTML = "";
  currentLocation.travel.forEach((locationId) => {
    const button = document.createElement("button");
    button.textContent = `🧭 ${locations[locationId].name}`;
    button.addEventListener("click", () => travelTo(locationId));
    locationButtons.appendChild(button);
  });

  enemyName.textContent = enemy.name;
  enemyHp.textContent = `${enemy.hp}/${enemy.maxHp} HP`;

  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  enemyHpBar.style.width = `${hpPercent}%`;

  inventoryText.innerHTML = "";

  if (!player.inventory.length) {
    inventoryText.textContent = "Порожньо";
  } else {
    const list = document.createElement("ul");

    player.inventory.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });

    inventoryText.appendChild(list);
  }
}

function getHeroStatus() {
  if (player.level >= 8) return "Ветеран Загубленої Землі";
  if (player.level >= 5) return "Досвідчений мандрівник";
  if (player.level >= 3) return "Мисливець";
  return "Новачок";
}

function addLog(message) {
  if (!battleLog) return;

  const p = document.createElement("p");
  p.textContent = message;
  battleLog.prepend(p);
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
