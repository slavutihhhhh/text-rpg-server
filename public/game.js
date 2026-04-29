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
    path: null,
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

    motherFavor: 0,
    rebelPower: 0,
    redemption: 0,

    flags: {},
    mutations: [],
    history: []
  };
}

let player = createNewPlayer();

const locations = {
  sanctuary: { name: "Підземне Святилище" },
  village: { name: "Селище Простолюдів" },
  forest: { name: "Заборонений Ліс" },
  catacombs: { name: "Міські Катакомби" },
  innerTemple: { name: "Внутрішній Храм" }
};

const scenes = {
  intro: {
    location: "sanctuary",
    title: "Перша ніч",
    text:
      "Ти стоїш перед вівтарем Великої Матері Плоті. Старі послідовники мовчать. Вони ще не знають, ким ти станеш.",
    choices: [
      {
        text: "Прийняти обітницю культу",
        effect: () => {
          gain("divinity", 3);
          lose("humanity", 2);
          goToScene("sanctuary_hub");
          log("Ти прийняв обітницю. Темрява відповіла.");
        }
      },
      {
        text: "Запитати, чому Мати мовчить",
        effect: () => {
          gain("mind", 5);
          player.flags.doubt = true;
          goToScene("sanctuary_hub");
          log("Питання було небезпечним. Але ти його поставив.");
        }
      }
    ]
  },

  sanctuary_hub: {
    location: "sanctuary",
    title: "Підземне святилище",
    text:
      "Святилище чекає. Вівтар голодний. Послідовники хочуть знаків. За межами храму є селище, ліс і катакомби.",
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
          log("Ритуал зробив тебе сильнішим, але менш людським.");
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
          log("Вівтар прийняв жертву. Культ став сильнішим.");
        }
      },
      {
        text: "Відновити тіло і розум",
        effect: () => {
          player.body = player.maxBody;
          player.mind = player.maxMind;
          goToScene("sanctuary_hub");
          log("Ти відновив сили у тиші святилища.");
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
      "На площі пахне димом і страхом. Тут можна знайти послідовників, полонених або проблеми.",
    choices: [
      {
        text: "Тихо проповідувати серед знедолених",
        effect: () => {
          if (roll(60)) {
            gain("followers", 1);
            log("Один зі знедолених повірив тобі.");
          } else {
            gain("suspicion", 5);
            lose("mind", 5);
            log("Твої слова почула не та людина.");
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
            log("Ти привів полоненого. Але сліди могли помітити.");
          } else {
            lose("body", 10);
            gain("suspicion", 12);
            log("Жертва вирвалась і здійняла шум.");
          }
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
      "Ліс уважний. Тут есенція просочується з землі, але кожен шепіт тисне на розум.",
    choices: [
      {
        text: "Зібрати чорну есенцію",
        effect: () => {
          const amount = rand(4, 9);
          gain("essence", amount);
          lose("mind", rand(4, 9));
          log(`Ти зібрав ${amount} есенції.`);
          goToScene("forest_edge");
        }
      },
      {
        text: "Прислухатись до шепоту дерев",
        effect: () => {
          if (roll(50)) {
            gain("divinity", 5);
            lose("humanity", 3);
            log("Шепіт відкрив частину правди.");
          } else {
            lose("mind", 12);
            log("Шепіт був занадто глибоким.");
          }
          maybeMutation();
          advanceChapter();
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
      "Під містом немає закону. Тут ховаються вигнанці, злочинці й ті, кого ніхто не шукатиме.",
    choices: [
      {
        text: "Шукати вигнанців для культу",
        effect: () => {
          if (roll(55)) {
            gain("followers", 2);
            gain("suspicion", 4);
            log("Двоє вигнанців прийняли обітницю.");
          } else {
            lose("body", 10);
            log("Тебе зустріли ножами.");
          }
          goToScene("catacombs_gate");
        }
      },
      {
        text: "Викрасти безіменного мешканця тунелів",
        effect: () => {
          if (roll(65)) {
            gain("captives", 1);
            log("Полонений не мав імені.");
          } else {
            lose("body", 8);
            gain("suspicion", 6);
            log("Хтось бачив твоє обличчя.");
          }
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
      "Підозра стала критичною. Мисливці шукають сліди культу. Якщо вони знайдуть святилище, усе може скінчитись.",
    choices: [
      {
        text: "Підставити невинного",
        effect: () => {
          lose("humanity", 12);
          player.suspicion = Math.max(0, player.suspicion - 25);
          log("Невинного повели. Культ виграв час.");
          goToScene("sanctuary_hub");
        }
      },
      {
        text: "Послати послідовників замести сліди",
        condition: () => player.followers >= 2,
        effect: () => {
          lose("followers", 2);
          player.suspicion = Math.max(0, player.suspicion - 35);
          log("Двоє послідовників не повернулись.");
          goToScene("sanctuary_hub");
        }
      },
      {
        text: "Прийняти бій у темряві",
        effect: () => {
          if (player.divinity >= 40 || roll(45)) {
            player.suspicion = Math.max(0, player.suspicion - 20);
            gain("essence", 8);
            log("Мисливці не були готові до темряви.");
          } else {
            lose("body", 35);
            lose("followers", 1);
            log("Культ вижив, але заплатив кровʼю.");
          }
          goToScene("sanctuary_hub");
        }
      }
    ]
  },

  ascension_choice: {
    location: "innerTemple",
    title: "Місце Матері",
    text:
      "Велика Мати слабшає. Культ дивиться вже не на неї, а на тебе. Це не кінець — це розлом у долі культу.",
    choices: [
      {
        text: "Залишитись вірним Матері",
        effect: () => {
          player.path = "servant";
          player.chapter = 4;
          gain("motherFavor", 20);
          goToScene("servant_start");
          log("Ти схилився перед Матірʼю. Вона дала тобі частину свого голоду.");
        }
      },
      {
        text: "Узурпувати її місце",
        condition: () => player.divinity >= 120 && player.humanity <= 60,
        effect: () => {
          player.path = "usurper";
          player.chapter = 4;
          gain("rebelPower", 20);
          gain("suspicion", 15);
          goToScene("usurper_start");
          log("Ти не схилився. Частина культу злякалась. Частина — впала на коліна.");
        }
      },
      {
        text: "Знищити культ і піти",
        condition: () => player.humanity >= 40,
        effect: () => {
          player.path = "renegade";
          player.chapter = 4;
          gain("redemption", 20);
          lose("followers", Math.floor(player.followers / 2));
          goToScene("renegade_start");
          log("Ти відвернувся від вівтаря. Але культ не відпустить тебе просто так.");
        }
      }
    ]
  },

  servant_start: {
    location: "innerTemple",
    title: "Пророк Матері",
    text:
      "Ти обрав служіння. Мати шепоче крізь вівтар: її сила розірвана, її голос слабкий. Щоб вона повернулась, культ має підкорити селище і нагодувати святилище.",
    choices: [
      {
        text: "Поширити волю Матері через послідовників",
        condition: () => player.followers >= 2,
        effect: () => {
          lose("followers", 1);
          gain("motherFavor", rand(8, 14));
          gain("suspicion", 6);
          log("Послідовники понесли її шепіт у селище.");
          checkPathProgress();
          goToScene("servant_start");
        }
      },
      {
        text: "Провести ритуал відновлення Матері",
        condition: () => player.captives >= 1 && player.essence >= 10,
        effect: () => {
          lose("captives", 1);
          lose("essence", 10);
          gain("motherFavor", 22);
          gain("divinity", 6);
          lose("humanity", 8);
          log("Мати ковтнула силу. Її голос став гучнішим.");
          checkPathProgress();
          goToScene("servant_start");
        }
      },
      {
        text: "Повернутись до звичайних справ культу",
        effect: () => goToScene("sanctuary_hub")
      }
    ]
  },

  usurper_start: {
    location: "innerTemple",
    title: "Розкол культу",
    text:
      "Ти обрав узурпацію. Тепер культ розділений. Вірні Матері шепочуть змову, а твої прихильники чекають доказу сили.",
    choices: [
      {
        text: "Переконати культ силою",
        condition: () => player.essence >= 8,
        effect: () => {
          lose("essence", 8);
          gain("rebelPower", rand(10, 18));
          gain("divinity", 5);
          lose("humanity", 5);
          log("Ти показав силу. Частина культу перейшла на твій бік.");
          checkPathProgress();
          goToScene("usurper_start");
        }
      },
      {
        text: "Знищити вірних Матері",
        condition: () => player.followers >= 3,
        effect: () => {
          lose("followers", 2);
          gain("rebelPower", 22);
          gain("suspicion", 12);
          lose("humanity", 10);
          log("Святилище пережило ніч чистки.");
          checkPathProgress();
          goToScene("usurper_start");
        }
      },
      {
        text: "Повернутись до звичайних справ культу",
        effect: () => goToScene("sanctuary_hub")
      }
    ]
  },

  renegade_start: {
    location: "forest",
    title: "Відступник",
    text:
      "Ти відмовився від культу. Але шепіт залишився в крові. Колишні послідовники шукають тебе, а Мати приходить у сни.",
    choices: [
      {
        text: "Рятувати тих, кого культ готував для ритуалів",
        condition: () => player.captives >= 1,
        effect: () => {
          lose("captives", 1);
          gain("redemption", 15);
          gain("humanity", 6);
          log("Один полонений утік. Ти почув не шепіт, а власне серце.");
          checkPathProgress();
          goToScene("renegade_start");
        }
      },
      {
        text: "Знищити старі знаки культу",
        condition: () => player.essence >= 6,
        effect: () => {
          lose("essence", 6);
          gain("redemption", rand(10, 16));
          lose("divinity", 4);
          log("Знак згорів. Але біль пройшов крізь тебе.");
          checkPathProgress();
          goToScene("renegade_start");
        }
      },
      {
        text: "Повернутись у світ і діяти обережно",
        effect: () => goToScene("village_square")
      }
    ]
  },

  servant_endgame: {
    location: "innerTemple",
    title: "Голос Матері",
    text:
      "Мати майже повернулась. Але тепер ти розумієш: її відродження забере твою волю. Ти можеш дозволити це або в останній момент зрадити.",
    choices: [
      {
        text: "Стати її Верховним Жерцем",
        effect: () => {
          player.chapter = 5;
          log("Ти став Верховним Жерцем. Гра продовжиться у майбутній Главі V.");
          goToScene("postgame");
        }
      },
      {
        text: "В останній момент забрати її силу",
        condition: () => player.divinity >= 160,
        effect: () => {
          player.path = "usurper";
          player.chapter = 5;
          gain("rebelPower", 40);
          log("Ти зрадив Матір у момент її повернення.");
          goToScene("postgame");
        }
      }
    ]
  },

  usurper_endgame: {
    location: "innerTemple",
    title: "Новий Вівтар",
    text:
      "Твої прихильники готові назвати тебе новим божеством. Але старий голос Матері ще живий у стінах.",
    choices: [
      {
        text: "Почати будівництво нового культу",
        effect: () => {
          player.chapter = 5;
          log("Ти став центром нового культу. Глава V відкриється пізніше.");
          goToScene("postgame");
        }
      }
    ]
  },

  renegade_endgame: {
    location: "forest",
    title: "Попіл святилища",
    text:
      "Ти майже зірвав владу культу. Але скверна в тобі ще жива. Спокута не завершена.",
    choices: [
      {
        text: "Продовжити очищення",
        effect: () => {
          player.chapter = 5;
          log("Ти вступив на шлях очищення. Глава V відкриється пізніше.");
          goToScene("postgame");
        }
      }
    ]
  },

  postgame: {
    location: "innerTemple",
    title: "Після перелому",
    text:
      "Це не фінал. Твій вибір змінив гру. Далі будуть нові глави: війна культів, очищення, або остаточне вознесіння.",
    choices: [
      {
        text: "Продовжити вільну гру",
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
      headers: { Authorization: `Bearer ${authToken}` }
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
  player.motherFavor = Math.max(0, player.motherFavor || 0);
  player.rebelPower = Math.max(0, player.rebelPower || 0);
  player.redemption = Math.max(0, player.redemption || 0);
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
    log("Тебе принесли назад у святилище.");
  }

  if (player.mind <= 0) {
    player.mind = 1;
    player.humanity = Math.max(0, player.humanity - 10);
    player.scene = "sanctuary_hub";
    log("Твій розум провалився в темряву.");
  }
}

function checkAscensionChoice() {
  if (
    player.chapter >= 3 &&
    player.divinity >= 120 &&
    !player.path &&
    player.scene !== "ascension_choice"
  ) {
    player.scene = "ascension_choice";
    log("Настав момент вибору: служити, узурпувати чи втекти.");
  }
}

function checkPathProgress() {
  if (player.path === "servant" && player.motherFavor >= 100) {
    goToScene("servant_endgame");
  }

  if (player.path === "usurper" && player.rebelPower >= 100) {
    goToScene("usurper_endgame");
  }

  if (player.path === "renegade" && player.redemption >= 100) {
    goToScene("renegade_endgame");
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
  } else if (player.chapter === 3) {
    objectiveText.textContent =
      "Глава III: Зрада Матері. Дійди до переломного вибору.";
  } else if (player.path === "servant") {
    objectiveText.textContent =
      `Глава IV: Пророк Матері. Віднови її силу: ${player.motherFavor}/100.`;
  } else if (player.path === "usurper") {
    objectiveText.textContent =
      `Глава IV: Розкол культу. Збери силу узурпатора: ${player.rebelPower}/100.`;
  } else if (player.path === "renegade") {
    objectiveText.textContent =
      `Глава IV: Відступник. Очисти себе і зруйнуй спадщину культу: ${player.redemption}/100.`;
  } else {
    objectiveText.textContent = "Глава V: продовження кампанії буде розширено.";
  }
}

function renderScene() {
  const scene = scenes[player.scene] || scenes.intro;
  const location = locations[scene.location] || locations.sanctuary;

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
      if (id === "innerTemple") travel("innerTemple", player.path ? `${player.path}_start` : "ascension_choice");
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
    <p class="condition-line">Шлях: ${getPathText()}</p>
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

function getPathText() {
  if (player.path === "servant") return "Пророк Матері";
  if (player.path === "usurper") return "Узурпатор";
  if (player.path === "renegade") return "Відступник";
  return "ще не обрано";
}

function getChapterName() {
  if (player.chapter === 1) return "Глава I: Народження культу";
  if (player.chapter === 2) return "Глава II: Тінь над селищем";
  if (player.chapter === 3) return "Глава III: Зрада Матері";
  if (player.chapter === 4) return "Глава IV: Наслідки вибору";
  return "Глава V: Останній шлях";
}

function log(text) {
  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);

  player.history.unshift(text);
  player.history = player.history.slice(0, 60);
}
