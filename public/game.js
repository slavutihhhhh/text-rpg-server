const TOKEN_KEY = "cultgame_token";
const USER_KEY = "cultgame_user";

let authToken = localStorage.getItem(TOKEN_KEY);
let currentUser = localStorage.getItem(USER_KEY);

function createNewPlayer(name = "") {
  return {
    name,
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
}

let player = createNewPlayer();

const rituals = [
  {
    name: "Кровне пробудження",
    cost: { offerings: 1, essence: 3 },
    effect: () => {
      player.divinity += rand(5, 10);
      player.humanity -= 5;
      log("🩸 Кров відкрила шлях до сили.");
    }
  },
  {
    name: "Поклик плоті",
    cost: { offerings: 2 },
    effect: () => {
      player.followers += 1;
      player.divinity += 3;
      log("👥 Щось відгукнулось на твій поклик.");
    }
  },
  {
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

const spells = [
  {
    name: "Контроль розуму",
    cost: 5,
    unlock: 0,
    effect: () => {
      if (Math.random() < 0.7) {
        player.followers += 1;
        log("🧠 Ти підкорив чужий розум. Новий послідовник приєднався.");
      } else {
        player.mind = Math.max(0, player.mind - 10);
        log("⚠️ Розум опирався. Ти втратив частину свідомості.");
      }
    }
  },
  {
    name: "Кровний удар",
    cost: 3,
    unlock: 0,
    effect: () => {
      const gain = rand(3, 8);
      player.essence += gain;
      player.body = Math.max(0, player.body - 5);
      log(`🩸 Ти розірвав власну плоть і отримав ${gain} есенції.`);
    }
  },
  {
    name: "Бачення",
    cost: 4,
    unlock: 10,
    effect: () => {
      player.divinity += 2;
      player.humanity -= 2;
      log("👁️ Ти побачив фрагмент майбутнього. Воно дивилось у відповідь.");
    }
  },
  {
    name: "Шепіт Матері",
    cost: 8,
    unlock: 25,
    effect: () => {
      player.followers += 2;
      player.mind = Math.max(0, player.mind - 8);
      log("🌑 Шепіт пройшов крізь людей. Двоє стали твоїми.");
    }
  }
];

const $ = (id) => document.getElementById(id);

const authPanel = $("authPanel");
const startPanel = $("startPanel");
const gamePanel = $("gamePanel");

const loginInput = $("loginInput");
const passwordInput = $("passwordInput");
const loginBtn = $("loginBtn");
const registerBtn = $("registerBtn");
const authMessage = $("authMessage");

const nameInput = $("nameInput");
const startBtn = $("startBtn");
const saveBtn = $("saveBtn");
const logoutBtn = $("logoutBtn");

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

const locationName = $("locationName");
const locationText = $("locationText");
const locationButtons = $("locationButtons");

const ritualText = $("ritualText");
const ritualButtons = $("ritualButtons");

const spellText = $("spellText");
const spellButtons = $("spellButtons");

const mutationText = $("mutationText");
const cultText = $("cultText");
const cultButtons = $("cultButtons");
const pathText = $("pathText");

const logBox = $("logBox");

const gatherBtn = $("gatherBtn");
const preachBtn = $("preachBtn");
const meditateBtn = $("meditateBtn");
const restBtn = $("restBtn");

const whisperInput = $("whisperInput");
const whisperBtn = $("whisperBtn");
const whisperBox = $("whisperBox");

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
startBtn.addEventListener("click", startGame);
saveBtn.addEventListener("click", () => saveGame(true));
logoutBtn.addEventListener("click", logout);

gatherBtn.addEventListener("click", gather);
preachBtn.addEventListener("click", preach);
meditateBtn.addEventListener("click", meditate);
restBtn.addEventListener("click", rest);
whisperBtn.addEventListener("click", sendWhisper);

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startGame();
});

whisperInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") sendWhisper();
});

init();

async function init() {
  render();

  if (!authToken) {
    showAuth();
    return;
  }

  const result = await apiGetSave();

  if (!result.ok) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    authToken = null;
    currentUser = null;
    showAuth();
    return;
  }

  if (result.save) {
    player = {
      ...createNewPlayer(),
      ...result.save
    };

    showGame();
    log(`🌒 Вітаємо, ${currentUser}. Культ памʼятає тебе.`);
  } else {
    showStart();
  }

  render();
}

async function register() {
  const username = loginInput.value.trim();
  const password = passwordInput.value.trim();

  const result = await apiPost("/api/register", { username, password });

  if (!result.ok) {
    authMessage.textContent = result.error || "Помилка реєстрації";
    return;
  }

  authToken = result.token;
  currentUser = result.username;

  localStorage.setItem(TOKEN_KEY, authToken);
  localStorage.setItem(USER_KEY, currentUser);

  authMessage.textContent = "";
  player = createNewPlayer();

  showStart();
  render();
}

async function login() {
  const username = loginInput.value.trim();
  const password = passwordInput.value.trim();

  const result = await apiPost("/api/login", { username, password });

  if (!result.ok) {
    authMessage.textContent = result.error || "Помилка входу";
    return;
  }

  authToken = result.token;
  currentUser = result.username;

  localStorage.setItem(TOKEN_KEY, authToken);
  localStorage.setItem(USER_KEY, currentUser);

  authMessage.textContent = "";

  if (result.save) {
    player = {
      ...createNewPlayer(),
      ...result.save
    };

    showGame();
    log(`🌒 Вітаємо, ${currentUser}. Збереження завантажено.`);
  } else {
    player = createNewPlayer();
    showStart();
  }

  render();
}

function logout() {
  apiPost("/api/logout", {});
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  authToken = null;
  currentUser = null;
  player = createNewPlayer();

  logBox.innerHTML = "";
  showAuth();
  render();
}

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введи імʼя адепта");
    return;
  }

  player = createNewPlayer(name);

  showGame();
  log("🕯️ Ти увійшов у культ. Шлях назад зник.");

  saveGame(false);
  render();
}

async function saveGame(showLog = true) {
  if (!authToken) return;

  const result = await apiPost("/api/save", { save: player });

  if (!result.ok) {
    log("❌ Не вдалося зберегти гру.");
    return;
  }

  if (showLog) {
    log("💾 Свідомість збережено на сервері.");
  }
}

async function apiGetSave() {
  try {
    const response = await fetch("/api/save", {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    return await response.json();
  } catch {
    return { ok: false, error: "Сервер недоступний" };
  }
}

async function apiPost(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  } catch {
    return { ok: false, error: "Сервер недоступний" };
  }
}

function showAuth() {
  authPanel.classList.remove("hidden");
  startPanel.classList.add("hidden");
  gamePanel.classList.add("hidden");
}

function showStart() {
  authPanel.classList.add("hidden");
  startPanel.classList.remove("hidden");
  gamePanel.classList.add("hidden");
}

function showGame() {
  authPanel.classList.add("hidden");   // 👈 ОЦЕ ГОЛОВНЕ
  startPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
}

function gather() {
  if (player.body <= 0) {
    log("💀 Тіло не слухається. Потрібно відновитись.");
    return;
  }

  const roll = Math.random();

  if (roll < 0.35) {
    player.offerings += 1;
    log("🧍 Ти привів нову жертву до святилища.");
  } else if (roll < 0.68) {
    const essence = rand(2, 7);
    player.essence += essence;
    log(`🩸 Ти зібрав ${essence} есенції з темних місць.`);
  } else if (roll < 0.85) {
    player.followers += 1;
    log("👥 Заблукалий почув твої слова і став послідовником.");
  } else {
    const damage = rand(6, 14);
    player.body = Math.max(0, player.body - damage);
    log(`⚠️ Щось у темряві атакувало тебе. Тіло -${damage}.`);
  }

  saveGame(false);
  render();
}

function preach() {
  if (player.mind < 10) {
    log("🧠 Твій розум занадто виснажений для проповіді.");
    return;
  }

  player.mind = Math.max(0, player.mind - 10);

  if (Math.random() < 0.55) {
    player.followers += 1;
    log("👥 Новий послідовник приєднався до культу.");
  } else {
    player.humanity = Math.max(0, player.humanity - 5);
    player.essence += 2;
    log("⚖️ Ти зламав чужу волю. Людяність зменшилась, есенція зросла.");
  }

  saveGame(false);
  render();
}

function meditate() {
  if (player.essence < 5) {
    log("👁️ Недостатньо есенції для медитації.");
    return;
  }

  player.essence -= 5;
  player.divinity += rand(2, 6);
  player.humanity = Math.max(0, player.humanity - 3);
  player.mind = Math.max(0, player.mind - 4);

  log("👁️ Ти наблизився до божественного. Воно наблизилось у відповідь.");

  afterPowerGain();
}

function rest() {
  player.body = Math.min(player.maxBody, player.body + 25);
  player.mind = Math.min(player.maxMind, player.mind + 25);

  log("🕯️ Ти відновив тіло і розум у тиші святилища.");
  saveGame(false);
  render();
}

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
  afterPowerGain();
}

function castSpell(spell) {
  if (player.divinity < spell.unlock) {
    log("🔒 Ти ще не готовий до цього заклинання.");
    return;
  }

  if (player.essence < spell.cost) {
    log("❌ Недостатньо есенції для заклинання.");
    return;
  }

  player.essence -= spell.cost;
  spell.effect();

  afterPowerGain();
}

function afterPowerGain() {
  normalizeStats();
  checkMutation();
  checkRank();
  checkEndingHint();
  saveGame(false);
  render();
}

function normalizeStats() {
  player.body = clamp(player.body, 0, player.maxBody);
  player.mind = clamp(player.mind, 0, player.maxMind);
  player.humanity = clamp(player.humanity, 0, 100);
  player.divinity = Math.max(0, player.divinity);
  player.essence = Math.max(0, player.essence);
  player.followers = Math.max(0, player.followers);
  player.offerings = Math.max(0, player.offerings);
}

function checkMutation() {
  if (player.divinity >= 20 && !player.mutations.includes("Очі відкриті")) {
    player.mutations.push("Очі відкриті");
    log("🧬 Мутація: твої очі бачать більше, ніж дозволено людині.");
  }

  if (player.divinity >= 50 && !player.mutations.includes("Пульс плоті")) {
    player.mutations.push("Пульс плоті");
    player.maxBody += 20;
    player.body = player.maxBody;
    log("🧬 Мутація: плоть почала пульсувати чужою силою. Максимальне тіло збільшено.");
  }

  if (player.divinity >= 90 && !player.mutations.includes("Голос у крові")) {
    player.mutations.push("Голос у крові");
    player.maxMind += 20;
    player.mind = player.maxMind;
    log("🧬 Мутація: голос у крові навчив тебе витримувати більше. Максимальний розум збільшено.");
  }
}

function checkRank() {
  if (player.divinity >= 60 && player.rank === 1) {
    player.rank = 2;
    log("📖 Ти став Жрецем Культу.");
  }

  if (player.divinity >= 120 && player.rank === 2) {
    player.rank = 3;
    log("📖 Ти став Провідником Плоті.");
  }

  if (player.divinity >= 200 && player.rank === 3) {
    player.rank = 4;
    log("👁️ Ти став Напівбогом. Послідовники вже не дивляться тобі в очі.");
  }
}

function checkEndingHint() {
  if (player.divinity >= 250 && player.humanity <= 20) {
    log("🌑 Велика Мати слабшає. Ти відчуваєш: її місце може стати твоїм.");
  }
}

function render() {
  cultistName.textContent = player.name || "Адепт";
  ascensionTitle.textContent = getTitle();

  bodyStat.textContent = `${player.body}/${player.maxBody}`;
  mindStat.textContent = `${player.mind}/${player.maxMind}`;
  divinityStat.textContent = player.divinity;
  humanityStat.textContent = player.humanity;
  essenceStat.textContent = player.essence;
  followersStat.textContent = player.followers;
  offeringsStat.textContent = player.offerings;
  rankStat.textContent = roman(player.rank);

  renderLocation();
  renderRituals();
  renderSpells();
  renderMutations();
  renderCult();
  renderPath();
}

function renderLocation() {
  locationName.textContent = "Підземне Святилище";
  locationText.textContent =
    "Під землею дихає храм. Стіни вологі, свічки не гаснуть, а в центрі стоїть вівтар Великої Матері Плоті.";

  locationButtons.innerHTML = "";
}

function renderRituals() {
  ritualButtons.innerHTML = "";
  ritualText.textContent = "Ритуали перетворюють жертви й есенцію на силу, але кожен крок забирає щось людське.";

  rituals.forEach((ritual) => {
    const button = document.createElement("button");
    const offerings = ritual.cost.offerings || 0;
    const essence = ritual.cost.essence || 0;

    button.textContent = `🩸 ${ritual.name} (${offerings} жертв, ${essence} есенції)`;
    button.addEventListener("click", () => performRitual(ritual));

    ritualButtons.appendChild(button);
  });
}

function renderSpells() {
  spellButtons.innerHTML = "";
  spellText.textContent = "Заклинання витрачають есенцію. Нові відкриваються разом із божественністю.";

  spells.forEach((spell) => {
    const button = document.createElement("button");

    if (player.divinity < spell.unlock) {
      button.textContent = `🔒 ${spell.name} (${spell.unlock} божественності)`;
    } else {
      button.textContent = `✨ ${spell.name} (${spell.cost} есенції)`;
    }

    button.addEventListener("click", () => castSpell(spell));
    spellButtons.appendChild(button);
  });
}

function renderMutations() {
  mutationText.innerHTML = "";

  if (!player.mutations.length) {
    mutationText.textContent = "Тіло ще зберігає людську форму.";
    return;
  }

  player.mutations.forEach((mutation) => {
    const p = document.createElement("p");
    p.textContent = `🧬 ${mutation}`;
    mutationText.appendChild(p);
  });
}

function renderCult() {
  cultText.textContent =
    `Культ має ${player.followers} послідовників і ${player.offerings} підготовлених жертв. ` +
    `Чим менше людяності, тим сильніше вони бояться тебе.`;

  cultButtons.innerHTML = "";
}

function renderPath() {
  pathText.innerHTML = `
    <p><span class="divine">Мета:</span> стати сильнішим за Велику Матір Плоті.</p>
    <p><span class="warning">Поточний шлях:</span> ${getPathDescription()}</p>
    <p><span class="blood">Наступна межа:</span> ${getNextGoal()}</p>
  `;
}

function getPathDescription() {
  if (player.divinity >= 200) return "ти вже більше не людина";
  if (player.divinity >= 120) return "культ бачить у тобі майбутнє божество";
  if (player.divinity >= 60) return "ти став центром культу";
  if (player.divinity >= 20) return "плоть почала відповідати";
  return "ти лише торкнувся забороненого";
}

function getNextGoal() {
  if (player.divinity < 20) return "20 божественності — перша мутація";
  if (player.divinity < 60) return "60 божественності — ранг Жреця";
  if (player.divinity < 120) return "120 божественності — Провідник Плоті";
  if (player.divinity < 200) return "200 божественності — Напівбог";
  return "250 божественності і низька людяність — шлях узурпатора";
}

function sendWhisper() {
  const text = whisperInput.value.trim();
  if (!text) return;

  const p = document.createElement("p");
  p.textContent = `${player.name || currentUser || "Гість"}: ${text}`;
  whisperBox.appendChild(p);

  whisperInput.value = "";
  whisperBox.scrollTop = whisperBox.scrollHeight;
}

function log(text) {
  if (!logBox) return;

  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roman(num) {
  return ["I", "II", "III", "IV", "V"][num - 1] || num;
}

function getTitle() {
  if (player.rank >= 4) return "Напівбог Плоті";
  if (player.rank === 3) return "Провідник Плоті";
  if (player.rank === 2) return "Жрець Культу";
  return "Немічний послідовник";
}
