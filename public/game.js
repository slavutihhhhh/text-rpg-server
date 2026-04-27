const SAVE_KEY = "cult_save_v1";

let player = {
  name: "",
  body: 100,
  maxBody: 100,
  mind: 100,
  maxMind: 100,
  divinity: 0,
  humanity: 100,
  essence: 0,
  followers: 3,
  offerings: 0,
  rank: 1,
  mutations: []
};

const $ = (id) => document.getElementById(id);

// UI
const startPanel = $("startPanel");
const gamePanel = $("gamePanel");
const nameInput = $("nameInput");
const startBtn = $("startBtn");
const saveBtn = $("saveBtn");

const cultistName = $("cultistName");
const ascensionTitle = $("ascensionTitle");

const bodyStat = $("bodyStat");
const mindStat = $("mindStat");
const divinityStat = $("divinityStat");
const humanityStat = $("humanityStat");
const essenceStat = $("essenceStat");
const followersStat = $("followersStat");
const offeringsStat = $("offeringsStat");
const rankStat = $("rankStat");

const logBox = $("logBox");

// кнопки
const gatherBtn = $("gatherBtn");
const preachBtn = $("preachBtn");
const meditateBtn = $("meditateBtn");
const restBtn = $("restBtn");

// події
startBtn.addEventListener("click", startGame);
saveBtn.addEventListener("click", saveGame);
gatherBtn.addEventListener("click", gather);
preachBtn.addEventListener("click", preach);
meditateBtn.addEventListener("click", meditate);
restBtn.addEventListener("click", rest);

// запуск
loadGame();
render();

// ---------- ОСНОВА ----------

function startGame() {
  const name = nameInput.value.trim();
  if (!name) return alert("Введи імʼя");

  player.name = name;

  startPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");

  log(`Ти вступив у культ. Шлях назад зник.`);
  saveGame();
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  log("💾 Свідомість зафіксована.");
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return;

  player = JSON.parse(saved);

  startPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");

  log("Ти повернувся. Культ памʼятає.");
}

// ---------- ДІЇ ----------

function gather() {
  const roll = Math.random();

  if (roll < 0.4) {
    player.offerings++;
    log("🧍 Ти знайшов нову жертву.");
  } else if (roll < 0.7) {
    const essence = rand(2, 6);
    player.essence += essence;
    log(`🩸 Ти зібрав ${essence} есенції.`);
  } else {
    const dmg = rand(5, 12);
    player.body -= dmg;
    log(`⚠️ Щось у темряві атакувало тебе (-${dmg}).`);
  }

  render();
}

function preach() {
  if (player.mind < 10) {
    log("🧠 Твій розум занадто слабкий.");
    return;
  }

  const roll = Math.random();

  player.mind -= 10;

  if (roll < 0.5) {
    player.followers++;
    log("👥 Новий послідовник приєднався.");
  } else {
    player.humanity -= 5;
    log("⚖️ Ти зламав чужу волю. Людяність зменшилась.");
  }

  render();
}

function meditate() {
  if (player.essence < 5) {
    log("👁️ Недостатньо есенції.");
    return;
  }

  player.essence -= 5;
  player.divinity += rand(2, 6);
  player.humanity -= 3;

  log("👁️ Ти наблизився до божественного.");

  checkMutation();
  checkRank();

  render();
}

function rest() {
  player.body = Math.min(player.maxBody, player.body + 20);
  player.mind = Math.min(player.maxMind, player.mind + 20);

  log("🕯️ Ти відновив сили.");
  render();
}

// ---------- МУТАЦІЇ ----------

function checkMutation() {
  if (player.divinity < 20) return;

  if (player.mutations.length === 0) {
    player.mutations.push("Твої очі бачать більше, ніж дозволено.");
    log("🧬 Мутація: Очі відкрились.");
  }

  if (player.divinity > 50 && player.mutations.length === 1) {
    player.mutations.push("Твоє тіло пульсує чужою силою.");
    log("🧬 Мутація: Плоть змінюється.");
  }
}

// ---------- РАНГ ----------

function checkRank() {
  if (player.divinity > 60 && player.rank === 1) {
    player.rank = 2;
    log("📖 Ти став Жрецем.");
  }

  if (player.divinity > 120 && player.rank === 2) {
    player.rank = 3;
    log("📖 Ти став Провідником.");
  }
}

// ---------- РЕНДЕР ----------

function render() {
  cultistName.textContent = player.name || "Адепт";

  bodyStat.textContent = `${player.body}/${player.maxBody}`;
  mindStat.textContent = `${player.mind}/${player.maxMind}`;
  divinityStat.textContent = player.divinity;
  humanityStat.textContent = player.humanity;
  essenceStat.textContent = player.essence;
  followersStat.textContent = player.followers;
  offeringsStat.textContent = player.offerings;
  rankStat.textContent = roman(player.rank);

  ascensionTitle.textContent = getTitle();
}

// ---------- УТИЛІТИ ----------

function log(text) {
  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roman(num) {
  return ["I", "II", "III", "IV", "V"][num - 1] || num;
}

function getTitle() {
  if (player.rank === 3) return "Провідник Плоті";
  if (player.rank === 2) return "Жрець Культу";
  return "Немічний послідовник";
}
