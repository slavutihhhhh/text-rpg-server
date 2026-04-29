const TOKEN_KEY = "cultgame_token";
const USER_KEY = "cultgame_user";

let authToken = localStorage.getItem(TOKEN_KEY);
let currentUser = localStorage.getItem(USER_KEY);

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
const chapterText = $("chapterText");

const bodyStat = $("bodyStat");
const mindStat = $("mindStat");
const divinityStat = $("divinityStat");
const humanityStat = $("humanityStat");
const essenceStat = $("essenceStat");
const followersStat = $("followersStat");
const captivesStat = $("captivesStat");
const suspicionStat = $("suspicionStat");

const objectiveText = $("objectiveText");
const sceneLocation = $("sceneLocation");
const sceneTitle = $("sceneTitle");
const sceneText = $("sceneText");
const choicesBox = $("choicesBox");

const mapBox = $("mapBox");
const conditionBox = $("conditionBox");
const logBox = $("logBox");

function createNewPlayer(name = "") {
  return {
    name,
    chapter: 1,
    location: "sanctuary",
    scene: "intro",

    body: 100,
    maxBody: 100,
    mind: 100,
    maxMind: 100,

    divinity: 0,
    humanity: 100,
    essence: 0,
    followers: 3,
    captives: 0,
    suspicion: 0,

    flags: {},
    mutations: [],
    history: []
  };
}

let player = createNewPlayer();

const locations = {
  sanctuary: {
    name: "Підземне Святилище",
    description: "Серце культу. Тут безпечно, але стіни памʼятають усі ритуали."
  },
  village: {
    name: "Селище Простолюдів",
    description: "Місце страху, чуток і слабких людей, які ще не знають, що вже стали частиною історії."
  },
  forest: {
    name: "Заборонений Ліс",
    description: "Темрява між деревами рухається не від вітру. Тут легко знайти есенцію — або втратити розум."
  },
  catacombs: {
    name: "Міські Катакомби",
    description: "Старі ходи під містом. Тут ховаються вигнанці, контрабандисти і ті, кого ніхто не шукатиме."
  }
};

const scenes = {
  intro: {
    location: "sanctuary",
    title: "Перша ніч",
    text:
      "Ти стоїш перед вівтарем Великої Матері Плоті. Старі послідовники дивляться мовчки. Вони не знають, чи ти станеш їхнім провідником, чи черговою жертвою.",
    choices: [
      {
        text: "Прийняти обітницю культу",
        effect: () => {
          player.flags.oath = true;
          gain("divinity", 3);
          lose("humanity", 2);
          goToScene("sanctuary_hub");
          log("Ти прийняв обітницю. У темряві щось відповіло.");
        }
      },
      {
        text: "Запитати, чому богиня мовчить",
        effect: () => {
          player.flags.doubt = true;
          gain("mind", 5);
          goToScene("sanctuary_hub");
          log("Старі послідовники відвели очі. Питання було небезпечним.");
        }
      }
    ]
  },

  sanctuary_hub: {
    location: "sanctuary",
    title: "Підземне святилище",
    text:
      "Святилище чекає. Послідовники шепочуть молитви. Вівтар голодний. За межами храму є селище, ліс і катакомби.",
    choices: [
      {
        text: "Провести малий ритуал есенції",
        condition: () => player.essence >= 5,
        effect: () => {
          lose("essence", 5);
          gain("divinity", 8);
          lose("humanity", 4);
          maybeMutation();
          advanceChapter();
          goToScene("sanctuary_hub");
          log("Ритуал завершено. Ти відчув, як щось усередині тебе стало менш людським.");
        }
      },
      {
        text: "Провести кривавий ритуал з полоненим",
        condition: () => player.captives >= 1,
        effect: () => {
          lose("captives", 1);
          gain("essence", 10);
          gain("divinity", 12);
          lose("humanity", 10);
          gain("suspicion", 8);
          maybeMutation();
          advanceChapter();
          goToScene("sanctuary_hub");
          log("Полонений зник у темряві під вівтарем. Культ став сильнішим.");
        }
      },
      {
        text: "Відновити тіло і розум",
        effect: () => {
          player.body = player.maxBody;
          player.mind = player.maxMind;
          goToScene("sanctuary_hub");
          log("Ти провів ніч у тиші. Тіло і розум відновлено.");
        }
      },
      {
        text: "Вийти до селища",
        effect: () => travel("village", "village_square")
      },
      {
        text: "Піти в Заборонений Ліс",
        effect: () => travel("forest", "forest_edge")
      },
      {
        text: "Спуститись у катакомби",
        effect: () => travel("catacombs", "catacombs_gate")
      }
    ]
  },

  village_square: {
    location: "village",
    title: "Площа селища",
    text:
      "На площі пахне димом і мокрою землею. Біля колодязя сперечаються люди, а варта ліниво стежить за натовпом. Тут можна здобути послідовників — або привернути зайву увагу.",
    choices: [
      {
        text: "Тихо проповідувати серед знедолених",
        effect: () => {
          if (roll(60)) {
            gain("followers", 1);
            log("Один зі знедолених повірив твоїм словам.");
          } else {
            gain("suspicion", 5);
            lose("mind", 5);
            log("Твої слова почула не та людина. Підозра зросла.");
          }
          goToScene("village_square");
        }
      },
      {
        text: "Вистежити самотнього простолюдина",
        effect: () => {
          if (roll(55)) {
            gain("captives", 1);
            gain("suspicion", 8);
            log("Ти привів полоненого до культу. Але сліди могли помітити.");
          } else {
            lose("body", 10);
            gain("suspicion", 12);
            log("Жертва вирвалась і здійняла шум. Ти поранений.");
          }
          checkDanger();
          goToScene("village_square");
        }
      },
      {
        text: "Підкупити пияка за інформацію",
        condition: () => player.followers >= 1,
        effect: () => {
          lose("followers", 1);
          gain("essence", 4);
          log("Послідовник зник у нетрях, але повернувся з корисними чутками й темним знаком.");
          goToScene("village_square");
        }
      },
      {
        text: "Повернутись у святилище",
        effect: () => travel("sanctuary", "sanctuary_hub")
      }
    ]
  },

  forest_edge: {
    location: "forest",
    title: "Край Забороненого Лісу",
    text:
      "Ліс не просто темний — він уважний. Коріння схоже на жили. Тут есенція просочується з землі, але кожен крок тисне на розум.",
    choices: [
      {
        text: "Зібрати чорну есенцію",
        effect: () => {
          const amount = rand(4, 9);
          gain("essence", amount);
          lose("mind", rand(4, 9));
          log(`Ти зібрав ${amount} есенції. Ліс щось прошепотів у відповідь.`);
          goToScene("forest_edge");
        }
      },
      {
        text: "Прислухатись до шепоту дерев",
        effect: () => {
          if (roll(50)) {
            gain("divinity", 5);
            lose("humanity", 3);
            log("Шепіт відкрив тобі частину правди про Матір.");
          } else {
            lose("mind", 12);
            log("Шепіт був занадто глибоким. Розум тріснув.");
          }
          maybeMutation();
          advanceChapter();
          goToScene("forest_edge");
        }
      },
      {
        text: "Провести нічне полювання",
        effect: () => {
          if (roll(45)) {
            gain("captives", 1);
            gain("essence", 3);
            log("Полювання вдалося. Ліс прийняв твої кроки.");
          } else {
            lose("body", 14);
            log("Щось полювало на тебе у відповідь.");
          }
          goToScene("forest_edge");
        }
      },
      {
        text: "Повернутись у святилище",
        effect: () => travel("sanctuary", "sanctuary_hub")
      }
    ]
  },

  catacombs_gate: {
    location: "catacombs",
    title: "Вхід у катакомби",
    text:
      "Під містом немає закону. Лише темрява, старі кістки і люди, яких ніхто не оплакуватиме. Тут легко знайти матеріал для культу, але не всі мешканці катакомб беззахисні.",
    choices: [
      {
        text: "Шукати вигнанців для культу",
        effect: () => {
          if (roll(55)) {
            gain("followers", 2);
            gain("suspicion", 4);
            log("Двоє вигнанців прийняли твою обітницю.");
          } else {
            lose("body", 10);
            log("Тебе зустріли ножами і прокляттями.");
          }
          goToScene("catacombs_gate");
        }
      },
      {
        text: "Викрасти безіменного мешканця тунелів",
        effect: () => {
          if (roll(65)) {
            gain("captives", 1);
            log("Полонений не мав імені. Це навіть зручніше.");
          } else {
            lose("body", 8);
            gain("suspicion", 6);
            log("У темряві здійнявся шум. Хтось бачив твоє обличчя.");
          }
          checkDanger();
          goToScene("catacombs_gate");
        }
      },
      {
        text: "Знайти старий знак Матері",
        effect: () => {
          gain("essence", 6);
          gain("divinity", 4);
          lose("humanity", 2);
          log("На стіні був знак, старіший за культ. Він відгукнувся.");
          maybeMutation();
          advanceChapter();
          goToScene("catacombs_gate");
        }
      },
      {
        text: "Повернутись у святилище",
        effect: () => travel("sanctuary", "sanctuary_hub")
      }
    ]
  },

  hunters_arrive: {
    location: "village",
    title: "Мисливці на культ",
    text:
      "Підозра стала занадто високою. До селища прибули озброєні мисливці. Вони шукають сліди культу. Якщо вони знайдуть святилище, усе закінчиться.",
    choices: [
      {
        text: "Підставити невинного",
        effect: () => {
          lose("humanity", 12);
          player.suspicion = Math.max(0, player.suspicion - 25);
          log("Невинного повели на допит. Культ виграв час.");
          goToScene("sanctuary_hub");
        }
      },
      {
        text: "Послати послідовників замести сліди",
        condition: () => player.followers >= 2,
        effect: () => {
          lose("followers", 2);
          player.suspicion = Math.max(0, player.suspicion - 35);
          log("Двоє послідовників не повернулись. Але сліди зникли.");
          goToScene("sanctuary_hub");
        }
      },
      {
        text: "Прийняти бій у темряві",
        effect: () => {
          if (player.divinity >= 40 || roll(45)) {
            player.suspicion = Math.max(0, player.suspicion - 20);
            gain("essence", 8);
            log("Мисливці не були готові до того, що вийшло з темряви.");
          } else {
            lose("body", 35);
            lose("followers", 1);
            log("Бій був важким. Культ вижив, але заплатив кровʼю.");
          }
          goToScene("sanctuary_hub");
        }
      }
    ]
  },

  ascension_choice: {
    location: "sanctuary",
    title: "Місце Матері",
    text:
      "Вівтар більше не здається великим. Велика Мати слабшає, а культ дивиться вже не на неї — на тебе. Настав момент вибору.",
    choices: [
      {
        text: "Залишитись вірним Матері",
        effect: () => {
          player.flags.ending = "servant";
          log("Ти став її голосом. Культ вижив, але ти не став вільним.");
          goToScene("ending");
        }
      },
      {
        text: "Узурпувати її місце",
        condition: () => player.divinity >= 120 && player.humanity <= 40,
        effect: () => {
          player.flags.ending = "god";
          log("Ти зрадив богиню — і культ упав ниць перед новим божеством.");
          goToScene("ending");
        }
      },
      {
        text: "Знищити культ і піти",
        condition: () => player.humanity >= 60,
        effect: () => {
          player.flags.ending = "escape";
          log("Ти спалив святилище. Але шепіт залишився в тобі.");
          goToScene("ending");
        }
      }
    ]
  },

  ending: {
    location: "sanctuary",
    title: "Кінець глави",
    text:
      "Історія цієї версії завершена. Але культова хроніка може продовжитись: нові глави, вороги, ритуали, політика культу і справжнє вознесіння.",
    choices: [
      {
        text: "Продовжити після фіналу",
        effect: () => goToScene("sanctuary_hub")
      }
    ]
  }
};

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
startBtn.addEventListener("click", startGame);
saveBtn.addEventListener("click", () => saveGame(true));
logoutBtn.addEventListener("click", logout);

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") login();
});

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startGame();
});

init();

async function init() {
  hideAllPanels();
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
    log(`Вітаємо, ${currentUser}. Хроніку завантажено.`);
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

  player = createNewPlayer();
  authMessage.textContent = "";
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
    log("Хроніку завантажено.");
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
  log("Історія почалась у підземному святилищі.");
  saveGame(false);
  render();
}

async function saveGame(showLog = true) {
  if (!authToken) return;

  const result = await apiPost("/api/save", { save: player });

  if (!result.ok) {
    log("Не вдалося зберегти гру.");
    return;
  }

  if (showLog) log("Хроніку збережено.");
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
    return { ok: false };
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

function hideAllPanels() {
  authPanel.classList.add("hidden");
  startPanel.classList.add("hidden");
  gamePanel.classList.add("hidden");
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
  authPanel.classList.add("hidden");
  startPanel.classList.add("hidden");
  gamePanel.classList.remove("hidden");
}

function travel(locationId, sceneId) {
  player.location = locationId;
  player.scene = sceneId;
  saveGame(false);
  render();
}

function goToScene(sceneId) {
  player.scene = sceneId;
  saveGame(false);
  render();
}

function choose(choice) {
  if (choice.condition && !choice.condition()) return;

  choice.effect();
  normalizeStats();
  checkDanger();
  checkAscensionChoice();
  saveGame(false);
  render();
}

function gain(stat, amount) {
  player[stat] += amount;
}

function lose(stat, amount) {
  player[stat] -= amount;
}

function roll(percent) {
  return Math.random() * 100 < percent;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeStats() {
  player.body = clamp(player.body, 0, player.maxBody);
  player.mind = clamp(player.mind, 0, player.maxMind);
  player.humanity = clamp(player.humanity, 0, 100);
  player.divinity = Math.max(0, player.divinity);
  player.essence = Math.max(0, player.essence);
  player.followers = Math.max(0, player.followers);
  player.captives = Math.max(0, player.captives);
  player.suspicion = clamp(player.suspicion, 0, 100);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function maybeMutation() {
  if (player.divinity >= 20 && !player.mutations.includes("Очі відкриті")) {
    player.mutations.push("Очі відкриті");
    player.maxMind += 10;
    log("Мутація: очі бачать те, чого не має бачити людина.");
  }

  if (player.divinity >= 60 && !player.mutations.includes("Пульс плоті")) {
    player.mutations.push("Пульс плоті");
    player.maxBody += 20;
    player.body = player.maxBody;
    log("Мутація: плоть пульсує силою вівтаря.");
  }

  if (player.divinity >= 100 && !player.mutations.includes("Голос у крові")) {
    player.mutations.push("Голос у крові");
    player.followers += 2;
    log("Мутація: послідовники чують твій голос навіть уві сні.");
  }
}

function advanceChapter() {
  if (player.chapter === 1 && player.divinity >= 30 && player.followers >= 5) {
    player.chapter = 2;
    log("Глава II: селище починає боятись і шепотіти про культ.");
  }

  if (player.chapter === 2 && player.divinity >= 80) {
    player.chapter = 3;
    log("Глава III: ти відчуваєш слабкість Великої Матері.");
  }
}

function checkDanger() {
  if (player.suspicion >= 70 && player.scene !== "hunters_arrive") {
    player.scene = "hunters_arrive";
    log("Підозра стала критичною. Мисливці прибули.");
  }

  if (player.body <= 0) {
    player.body = 1;
    player.mind = Math.max(0, player.mind - 15);
    player.scene = "sanctuary_hub";
    log("Тебе принесли назад у святилище. Тіло майже зламане.");
  }

  if (player.mind <= 0) {
    player.mind = 1;
    player.humanity = Math.max(0, player.humanity - 10);
    player.scene = "sanctuary_hub";
    log("Твій розум провалився в темряву. Ти повернувся іншим.");
  }
}

function checkAscensionChoice() {
  if (
    player.chapter >= 3 &&
    player.divinity >= 120 &&
    player.scene !== "ascension_choice" &&
    player.scene !== "ending"
  ) {
    player.scene = "ascension_choice";
    log("Настав момент вибору: служити чи зайняти місце богині.");
  }
}

function render() {
  cultistName.textContent = player.name || "Адепт";
  chapterText.textContent = getChapterName();

  bodyStat.textContent = `${player.body}/${player.maxBody}`;
  mindStat.textContent = `${player.mind}/${player.maxMind}`;
  divinityStat.textContent = player.divinity;
  humanityStat.textContent = player.humanity;
  essenceStat.textContent = player.essence;
  followersStat.textContent = player.followers;
  captivesStat.textContent = player.captives;
  suspicionStat.textContent = player.suspicion;

  renderObjective();
  renderScene();
  renderMap();
  renderCondition();
}

function renderObjective() {
  if (player.chapter === 1) {
    objectiveText.textContent =
      "Глава I: Народження культу. Отримай 5 послідовників і 30 божественності.";
  } else if (player.chapter === 2) {
    objectiveText.textContent =
      "Глава II: Тінь над селищем. Посилюй культ, але не дай підозрі знищити тебе.";
  } else {
    objectiveText.textContent =
      "Глава III: Зрада Матері. Виріши, чи служити старій богині, чи стати новим божеством.";
  }
}

function renderScene() {
  const scene = scenes[player.scene] || scenes.intro;
  const location = locations[scene.location];

  sceneLocation.textContent = location.name;
  sceneTitle.textContent = scene.title;
  sceneText.textContent = scene.text;

  choicesBox.innerHTML = "";

  scene.choices.forEach((choice) => {
    if (choice.condition && !choice.condition()) return;

    const button = document.createElement("button");
    button.textContent = choice.text;
    button.addEventListener("click", () => choose(choice));

    choicesBox.appendChild(button);
  });
}

function renderMap() {
  mapBox.innerHTML = "";

  Object.entries(locations).forEach(([id, location]) => {
    const button = document.createElement("button");
    button.className = "map-button";
    if (id === player.location) button.classList.add("active");

    button.textContent = location.name;
    button.addEventListener("click", () => {
      if (id === "sanctuary") travel("sanctuary", "sanctuary_hub");
      if (id === "village") travel("village", "village_square");
      if (id === "forest") travel("forest", "forest_edge");
      if (id === "catacombs") travel("catacombs", "catacombs_gate");
    });

    mapBox.appendChild(button);
  });
}

function renderCondition() {
  const dangerClass = player.suspicion >= 70 ? "bad" : player.suspicion >= 40 ? "warn" : "good";
  const humanityClass = player.humanity <= 30 ? "bad" : player.humanity <= 60 ? "warn" : "good";

  conditionBox.innerHTML = `
    <p class="condition-line">Підозра світу: <span class="${dangerClass}">${getSuspicionText()}</span></p>
    <p class="condition-line">Людяність: <span class="${humanityClass}">${getHumanityText()}</span></p>
    <p class="condition-line">Мутації: ${player.mutations.length ? player.mutations.join(", ") : "немає"}</p>
  `;
}

function getSuspicionText() {
  if (player.suspicion >= 70) return "критична";
  if (player.suspicion >= 40) return "небезпечна";
  return "низька";
}

function getHumanityText() {
  if (player.humanity <= 30) return "майже втрачена";
  if (player.humanity <= 60) return "пошкоджена";
  return "стабільна";
}

function getChapterName() {
  if (player.chapter === 1) return "Глава I: Народження культу";
  if (player.chapter === 2) return "Глава II: Тінь над селищем";
  return "Глава III: Зрада Матері";
}

function log(text) {
  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);

  player.history.unshift(text);
  player.history = player.history.slice(0, 60);
}
