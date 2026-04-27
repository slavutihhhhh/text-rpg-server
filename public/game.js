const SAVE_KEY = "lost_land_save_v3";

const locations = {
  camp: {
    name: "Старий Табір",
    text: "Безпечне місце біля темного лісу. Тут є вартовий, магазин і місце для відпочинку.",
    enemies: ["Голодний пацюк", "Лісовий вовк"],
    travel: ["forest", "road"],
    npc: "Старий Вартовий",
    shop: true
  },
  forest: {
    name: "Темний Ліс",
    text: "Мокрі дерева, туман і дивні звуки. Саме тут вовки стали занадто сміливими.",
    enemies: ["Лісовий вовк", "Печерний павук", "Розбійник"],
    travel: ["camp", "cave"],
    npc: null,
    shop: false
  },
  road: {
    name: "Північна Дорога",
    text: "Стара дорога до покинутих земель. Тут часто нападають розбійники.",
    enemies: ["Розбійник", "Бродячий пес"],
    travel: ["camp", "cave"],
    npc: null,
    shop: false
  },
  cave: {
    name: "Покинута Печера",
    text: "Темна печера з холодним повітрям. Слабким героям тут не місце.",
    enemies: ["Печерний павук", "Камʼяний щур", "Старий упир"],
    travel: ["forest", "road"],
    npc: null,
    shop: false
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

const questTemplate = {
  id: "forest_wolves",
  title: "Проблема темного лісу",
  description: "Старий Вартовий просить перемогти 3 лісових вовків у Темному Лісі.",
  targetEnemy: "Лісовий вовк",
  required: 3,
  progress: 0,
  status: "not_started",
  reward: {
    gold: 50,
    xp: 80,
    items: ["Мале зілля", "Мале зілля"]
  }
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
  inventory: ["Мале зілля"],
  quest: structuredClone(questTemplate)
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

const npcText = $("npcText");
const npcButtons = $("npcButtons");
const shopText = $("shopText");
const shopButtons = $("shopButtons");

const questText = $("questText");
const inventoryText = $("inventoryText");

const enemyName = $("enemyName");
const enemyHp = $("enemyHp");
const enemyHpBar = $("enemyHpBar");

const attackBtn = $("attackBtn");
const heavyAttackBtn = $("heavyAttackBtn");
const usePotionBtn = $("usePotionBtn");
const restBtn = $("restBtn");
const exploreBtn = $("exploreBtn");
const newEnemyBtn = $("newEnemyBtn");

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
exploreBtn.addEventListener("click", exploreLocation);
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

    player = {
      ...player,
      ...(data.player || {}),
      quest: {
        ...structuredClone(questTemplate),
        ...((data.player && data.player.quest) || {})
      }
    };

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

  if (Math.random() < 0.25 && player.location !== "camp") {
    triggerTravelEvent();
  }

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

  let damage = 0;

  if (type === "heavy") {
    if (Math.random() < 0.3) {
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

  const damage = random(Math.max(1, enemy.damage - 3), enemy.damage + 4);
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

  updateQuestProgress(enemy.name);
  rollLoot();
  checkLevelUp();
}

function updateQuestProgress(enemyName) {
  const quest = player.quest;

  if (
    quest.status === "active" &&
    enemyName === quest.targetEnemy &&
    player.location === "forest"
  ) {
    quest.progress = Math.min(quest.required, quest.progress + 1);
    addLog(`📜 Квест оновлено: ${quest.progress}/${quest.required} вовків.`);

    if (quest.progress >= quest.required) {
      quest.status = "ready";
      addLog("✅ Квест виконано. Повернись до Старого Вартового за нагородою.");
    }
  }
}

function rollLoot() {
  const lootRoll = Math.random();

  if (lootRoll < 0.35) {
    player.inventory.push("Мале зілля");
    addLog("🎒 Здобич: Мале зілля.");
  } else if (lootRoll < 0.48) {
    player.inventory.push("Іржавий жетон");
    addLog("🎒 Здобич: Іржавий жетон.");
  } else if (lootRoll < 0.55) {
    player.inventory.push("Шкіра звіра");
    addLog("🎒 Здобич: Шкіра звіра.");
  }
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

function acceptQuest() {
  if (player.quest.status !== "not_started") return;

  player.quest.status = "active";
  player.quest.progress = 0;

  addLog("📜 Квест прийнято: “Проблема темного лісу”.");
  saveGame(false);
  render();
}

function claimQuestReward() {
  const quest = player.quest;

  if (quest.status !== "ready") {
    addLog("Старий Вартовий: Спершу виконай завдання.");
    return;
  }

  player.gold += quest.reward.gold;
  player.xp += quest.reward.xp;
  player.inventory.push(...quest.reward.items);
  quest.status = "completed";

  addLog(`🎁 Квест завершено! +${quest.reward.gold} золота, +${quest.reward.xp} XP, зілля отримано.`);
  checkLevelUp();
  saveGame(false);
  render();
}

function buyPotion() {
  const price = 20;

  if (!locations[player.location].shop) {
    addLog("🏪 Тут немає магазину.");
    return;
  }

  if (player.gold < price) {
    addLog(`🏪 Недостатньо золота. Потрібно ${price}.`);
    return;
  }

  player.gold -= price;
  player.inventory.push("Мале зілля");

  addLog("🏪 Куплено: Мале зілля за 20 золота.");
  saveGame(false);
  render();
}

function sellJunk() {
  const junkItems = ["Іржавий жетон", "Шкіра звіра"];
  let sold = 0;

  player.inventory = player.inventory.filter((item) => {
    if (junkItems.includes(item)) {
      sold += item === "Іржавий жетон" ? 6 : 10;
      return false;
    }

    return true;
  });

  if (sold === 0) {
    addLog("🏪 Немає речей для продажу.");
    return;
  }

  player.gold += sold;
  addLog(`🏪 Продано трофеї на ${sold} золота.`);
  saveGame(false);
  render();
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

function exploreLocation() {
  if (player.hp <= 0) {
    addLog("💀 Ти не можеш досліджувати без сил.");
    return;
  }

  const roll = Math.random();

  if (roll < 0.28) {
    const foundGold = random(5, 18);
    player.gold += foundGold;
    addLog(`🎲 Ти знайшов схованку з ${foundGold} золотими.`);
  } else if (roll < 0.48) {
    player.inventory.push("Мале зілля");
    addLog("🎲 Під каменем знайдено Мале зілля.");
  } else if (roll < 0.72) {
    enemy = createEnemy();
    addLog(`🎲 Дослідження привело тебе до ворога: ${enemy.name}.`);
  } else {
    const damage = random(4, 12);
    player.hp = Math.max(0, player.hp - damage);
    addLog(`🎲 Пастка! Ти втратив ${damage} HP.`);
  }

  saveGame(false);
  render();
}

function triggerTravelEvent() {
  const roll = Math.random();

  if (roll < 0.5) {
    const gold = random(3, 12);
    player.gold += gold;
    addLog(`🧭 Дорогою ти знайшов ${gold} золота.`);
  } else {
    const damage = random(3, 9);
    player.hp = Math.max(0, player.hp - damage);
    addLog(`🧭 Дорогою ти потрапив у засідку і втратив ${damage} HP.`);
  }
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

  renderLocationButtons(currentLocation);
  renderNpc(currentLocation);
  renderShop(currentLocation);
  renderQuest();
  renderEnemy();
  renderInventory();
}

function renderLocationButtons(currentLocation) {
  locationButtons.innerHTML = "";

  currentLocation.travel.forEach((locationId) => {
    const button = document.createElement("button");
    button.textContent = `🧭 ${locations[locationId].name}`;
    button.addEventListener("click", () => travelTo(locationId));
    locationButtons.appendChild(button);
  });
}

function renderNpc(currentLocation) {
  npcButtons.innerHTML = "";

  if (!currentLocation.npc) {
    npcText.textContent = "У цій локації нікого немає.";
    return;
  }

  npcText.textContent = `${currentLocation.npc}: “Темний Ліс став небезпечним. Нам потрібна допомога.”`;

  if (player.quest.status === "not_started") {
    const button = document.createElement("button");
    button.textContent = "📜 Взяти квест";
    button.addEventListener("click", acceptQuest);
    npcButtons.appendChild(button);
  }

  if (player.quest.status === "ready") {
    const button = document.createElement("button");
    button.textContent = "🎁 Забрати нагороду";
    button.addEventListener("click", claimQuestReward);
    npcButtons.appendChild(button);
  }

  if (player.quest.status === "completed") {
    npcText.textContent = `${currentLocation.npc}: “Ти добре послужив табору. Повертайся, коли зʼявляться нові проблеми.”`;
  }
}

function renderShop(currentLocation) {
  shopButtons.innerHTML = "";

  if (!currentLocation.shop) {
    shopText.textContent = "Магазин доступний тільки у Старому Таборі.";
    return;
  }

  shopText.textContent = "Торговець продає зілля і скуповує трофеї.";

  const buyButton = document.createElement("button");
  buyButton.textContent = "🧪 Купити зілля — 20 золота";
  buyButton.addEventListener("click", buyPotion);

  const sellButton = document.createElement("button");
  sellButton.textContent = "💰 Продати трофеї";
  sellButton.addEventListener("click", sellJunk);

  shopButtons.appendChild(buyButton);
  shopButtons.appendChild(sellButton);
}

function renderQuest() {
  const quest = player.quest;

  if (quest.status === "not_started") {
    questText.innerHTML = "Квестів немає. Поговори зі Старим Вартовим у Старому Таборі.";
    return;
  }

  if (quest.status === "active") {
    questText.innerHTML = `
      <p><strong>${quest.title}</strong></p>
      <p>${quest.description}</p>
      <p class="quest-warn">Прогрес: ${quest.progress}/${quest.required}</p>
    `;
    return;
  }

  if (quest.status === "ready") {
    questText.innerHTML = `
      <p><strong>${quest.title}</strong></p>
      <p class="quest-good">Завдання виконано. Повернись до Старого Вартового.</p>
    `;
    return;
  }

  if (quest.status === "completed") {
    questText.innerHTML = `
      <p><strong>${quest.title}</strong></p>
      <p class="quest-good">Квест завершено.</p>
    `;
  }
}

function renderEnemy() {
  enemyName.textContent = enemy.name;
  enemyHp.textContent = `${enemy.hp}/${enemy.maxHp} HP`;

  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
  enemyHpBar.style.width = `${hpPercent}%`;
}

function renderInventory() {
  inventoryText.innerHTML = "";

  if (!player.inventory.length) {
    inventoryText.textContent = "Порожньо";
    return;
  }

  const counts = {};

  player.inventory.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });

  const list = document.createElement("ul");

  Object.entries(counts).forEach(([item, count]) => {
    const li = document.createElement("li");
    li.textContent = count > 1 ? `${item} x${count}` : item;
    list.appendChild(li);
  });

  inventoryText.appendChild(list);
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
