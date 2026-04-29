const SAVE_KEY = "cult_save_v2";

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
  offerings: 2,
  rank: 1,
  mutations: []
};

// ---------- РИТУАЛИ ----------

const rituals = [
  {
    id: "blood_awakening",
    name: "Кровне пробудження",
    cost: { offerings: 1, essence: 3 },
    effect: () => {
      player.divinity += rand(5, 10);
      player.humanity -= 5;
      log("🩸 Кров відкрила шлях до сили.");
    }
  },
  {
    id: "flesh_call",
    name: "Поклик плоті",
    cost: { offerings: 2 },
    effect: () => {
      player.followers += 1;
      player.divinity += 3;
      log("👥 Щось відгукнулось на твій поклик.");
    }
  },
  {
    id: "dark_consumption",
    name: "Темне поглинання",
    cost: { offerings: 1 },
    effect: () => {
      const heal = rand(15, 30);
      player.body = Math.min(player.maxBody, player.body + heal);
      player.divinity += 4;
      player.humanity -= 8;
      log(`🩸 Ти поглинув жертву і відновив ${heal} тіла.`);
    }
  }
];

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

const ritualButtons = $("ritualButtons");
const ritualText = $("ritualText");

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

  log("🕯️ Ти увійшов у культ.");
  saveGame();
  render();
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(player));
  log("💾 Свідомість збережено.");
}

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (!saved) return;

  player = JSON.parse(saved);

  startPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");

  log("🌒 Культ памʼятає тебе.");
}

// ---------- ДІЇ ----------

function gather() {
  const roll = Math.random();

  if (roll < 0.4) {
    player.offerings++;
    log("🧍 Ти знайшов жертву.");
  } else if (roll < 0.7) {
    const essence = rand(2, 6);
    player.essence += essence;
    log(`🩸 Ти зібрав ${essence} есенції.`);
  } else {
    const dmg = rand(5, 12);
    player.body -= dmg;
    log(`⚠️ Темрява ранить тебе (-${dmg}).`);
  }

  render();
}

function preach() {
  player.mind -= 10;

  if (Math.random() < 0.5) {
    player.followers++;
    log("👥 Новий послідовник.");
  } else {
    player.humanity -= 5;
    log("⚖️ Ти зламав волю.");
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

  log("👁️ Ти відчув щось більше.");

  checkMutation();
  checkRank();
  render();
}

function rest() {
  player.body = Math.min(player.maxBody, player.body + 20);
  player.mind = Math.min(player.maxMind, player.mind + 20);

  log("🕯️ Відновлення.");
  render();
}

// ---------- РИТУАЛИ ----------

function performRitual(ritual) {
  if (
    (ritual.cost.offerings || 0) > player.offerings ||
    (ritual.cost.essence || 0) > player.essence
  ) {
    log("❌ Недостатньо ресурсів для ритуалу.");
    return;
  }

  player.offerings -= ritual.cost.offerings || 0;
  player.essence -= ritual.cost.essence || 0;

  ritual.effect();

  checkMutation();
  checkRank();
  render();
}

// ---------- МУТАЦІЇ ----------

function checkMutation() {
  if (player.divinity > 20 && player.mutations.length === 0) {
    player.mutations.push("Очі бачать більше.");
    log("🧬 Мутація: Очі відкриті.");
  }

  if (player.divinity > 50 && player.mutations.length === 1) {
    player.mutations.push("Плоть змінюється.");
    log("🧬 Мутація: Тіло мутує.");
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

  renderRituals();
}

function renderRituals() {
  ritualButtons.innerHTML = "";
  ritualText.textContent = "Виконуй ритуали, щоб наблизитись до божественного.";

  rituals.forEach((r) => {
    const btn = document.createElement("button");
    btn.textContent = `🩸 ${r.name}`;
    btn.onclick = () => performRitual(r);
    ritualButtons.appendChild(btn);
  });
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
  return ["I", "II", "III", "IV"][num - 1] || num;
}

function getTitle() {
  if (player.rank === 3) return "Провідник Плоті";
  if (player.rank === 2) return "Жрець Культу";
  return "Адепт";
}
