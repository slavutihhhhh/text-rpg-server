const TOKEN_KEY = "karavel_token";
const USER_KEY = "karavel_user";

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
const backgroundSelect = $("backgroundSelect");
const startBtn = $("startBtn");
const saveBtn = $("saveBtn");
const logoutBtn = $("logoutBtn");

const playerName = $("playerName");
const playerOrigin = $("playerOrigin");

const healthStat = $("healthStat");
const energyStat = $("energyStat");
const goldStat = $("goldStat");
const levelStat = $("levelStat");
const xpStat = $("xpStat");
const suspicionStat = $("suspicionStat");

const placeLabel = $("placeLabel");
const locationTitle = $("locationTitle");
const mainText = $("mainText");
const actionsBox = $("actionsBox");

const peopleBox = $("peopleBox");
const worldBox = $("worldBox");
const memoryBox = $("memoryBox");

function createNewPlayer(name = "", background = "peasant") {
  const p = {
    name,
    background,
    location: "square",

    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    gold: 8,
    level: 1,
    xp: 0,
    suspicion: 0,

    relations: {
      roba: 0,
      radiy: 0,
      doctor: 0,
      guard: 0
    },

    flags: {
      metRoba: false,
      metRadiy: false,
      metDoctor: false,

      knowsRadiyName: false,
      knowsAboutHerbs: false,

      boughtFromRoba: false,
      helpedRadiySmall: false,
      promisedHerbs: false,
      savedDaughter: false,

      daughterLost: false,
      robaGone: false,
      radiyArrested: false,
      canTakeShop: false,
      ownsShop: false,

      firstChainClosed: false
    },

    world: {
      day: 1,
      time: "morning",
      hunger: 0,

      daughter: "хворіє",
      brother: "у полоні",
      roba: "у відчаї",
      radiy: "збирає викуп",
      economy: "напружена",
      shopPrices: "звичайні"
    },

    memory: []
  };

  applyBackground(p);
  return p;
}

function applyBackground(p) {
  if (p.background === "peasant") {
    p.maxEnergy += 10;
    p.energy = p.maxEnergy;
    p.gold += 2;
  }

  if (p.background === "smith_apprentice") {
    p.relations.roba += 8;
    p.gold += 2;
  }

  if (p.background === "soldier") {
    p.maxHealth += 15;
    p.health = p.maxHealth;
  }

  if (p.background === "thief") {
    p.gold += 6;
    p.suspicion += 5;
  }

  if (p.background === "merchant_kin") {
    p.gold += 15;
    p.relations.radiy += 5;
  }
}

function mergeSave(save) {
  const base = createNewPlayer();

  return {
    ...base,
    ...save,

    relations: {
      ...base.relations,
      ...(save.relations || {})
    },

    flags: {
      ...base.flags,
      ...(save.flags || {})
    },

    world: {
      ...base.world,
      ...(save.world || {})
    },

    memory: save.memory || []
  };
}

let player = createNewPlayer();

const origins = {
  peasant: "Син селянина",
  smith_apprentice: "Учень коваля",
  soldier: "Колишній солдат",
  thief: "Дрібний злодій",
  merchant_kin: "Родич купця"
};

const locations = {
  square: {
    place: "Замок Каравел",
    title: "Площа",
    text: () => {
      if (!player.flags.metRoba) {
        return `Ти прокидаєшся на холодній камʼяній площі Каравела.

Варта дивиться на тебе з підозрою, але швидко втрачає інтерес.

Неподалік у кузні щось падає з гучним лязкотом.`;
      }

      if (player.flags.radiyArrested) {
        return `Площа Каравела стала тихішою.

Люди говорять пошепки. Усі знають, що Радія забрала варта.`;
      }

      return `Площа Каравела живе своїм життям.

Хтось свариться через ціни.
Хтось обговорює короля.
Хтось мовчки несе воду.

Каравел не чекає тебе.
Але памʼятає.`;
    },

    actions: () => [
      action("Піти до кузні Роби", () => move("blacksmith")),
      action("Піти до крамниці Радія", () => move("shop")),
      action("Поговорити з лікарем", () => move("doctor")),
      action("Просто пройтись містом", wanderSquare),
      action("Переночувати в таверні — 5 золота", sleepAtTavern),
      action(
        "Бродити нічними вулицями",
        nightWalk,
        () => player.world.time === "night"
      )
    ]
  },

  blacksmith: {
    place: "Каравел",
    title: "Кузня Роби",

    text: () => {
      if (player.flags.robaGone) {
        return `Кузня порожня.

Горн холодний.
Молот мовчить.`;
      }

      if (player.flags.savedDaughter) {
        return `Горн у кузні знову горить яскраво.

Роба виглядає виснаженим, але живим.

На стіні висить меч, зроблений для тебе.`;
      }

      if (player.relations.roba <= -15) {
        return `Роба навіть не дивиться на тебе.

“Я не хочу зараз говорити.”`;
      }

      return `Роба стоїть біля полиць із поганим товаром.

Ніж.
Лом.
Шолом низької якості.

“Метал нікудишній...”

Він важко видихає.

“А моя донька з кожним днем слабшає.”`;
    },

    actions: () => {
      if (player.flags.robaGone) {
        return [
          action("Повернутись на площу", () => move("square"))
        ];
      }

      if (player.flags.savedDaughter) {
        return [
          action(
            "Прийняти меч Роби",
            acceptRobaSword,
            () => !player.flags.robaSwordTaken
          ),

          action("Поговорити з Робою", () => {
            say(`Роба проводить рукою по ковадлу.

“Я не забуду, що ти зробив.”`);
          }),

          action("Повернутись на площу", () => move("square"))
        ];
      }

      return [
        action("Поговорити про доньку", talkRobaDaughter),

        action(
          "Купити поганий ніж — 5 золота",
          buyBadKnife,
          () => player.gold >= 5 && !player.flags.boughtFromRoba
        ),

        action("Запитати про купця", askAboutRadiy),

        action("Сказати: “У кожного свої проблеми”", hurtRoba),

        action("Просто постояти поруч", () => {
          say(`Ти мовчки стоїш поруч.

Роба більше нічого не каже.

Іноді мовчання теж щось означає.`);
        }),

        action("Повернутись на площу", () => move("square"))
      ];
    }
  },

  doctor: {
    place: "Площа Каравела",
    title: "Старий лікар",

    text: () => {
      if (!player.flags.knowsAboutHerbs) {
        return `Старий лікар перебирає висушені трави.

“Якщо мова про доньку Роби — монет замало.

Потрібні срібні трави з Чорного Яру.”`;
      }

      return `Лікар уважно дивиться на тебе.

“Чорний Яр не любить чужинців.”`;
    },

    actions: () => [
      action("Сказати: “Я зберу трави”", () => {
        player.flags.knowsAboutHerbs = true;
        player.flags.promisedHerbs = true;
        player.relations.doctor += 8;

        remember("Ти пообіцяв лікарю зібрати срібні трави.");

        move("ravine");
      }),

      action("Попросити іншу роботу", doctorJob),

      action("Повернутись на площу", () => move("square"))
    ]
  },

  ravine: {
    place: "За межами Каравела",
    title: "Чорний Яр",

    text: () => `Чорний Яр лежить нижче дороги.

Сирість.
Темрява.
І срібні трави серед коріння.

Тут легко загубитись.`,

    actions: () => [
      action("Обережно збирати трави", gatherHerbs),

      action("Повернутись назад", () => {
        player.energy -= 10;

        remember("Ти не наважився ризикувати в Чорному Яру.");

        passTime();

        move("square");
      })
    ]
  },

  shop: {
    place: "Каравел",
    title: "Крамниця Радія",

    text: () => {
      if (player.flags.radiyArrested && !player.flags.ownsShop) {
        return `Крамниця Радія майже порожня.

На столі лежать рахунки.

Двері ще не опечатані.`;
      }

      if (player.flags.ownsShop) {
        return `Тепер за прилавком стоїш ти.

Колись ти дивився на Радія збоку.

Тепер хтось дивиться так на тебе.`;
      }

      return `Крамниця Радія тепла й затишна.

Пахне спеціями, сухофруктами й грошима.

“Мій брат у полоні в ДегРані...”

Посмішка Радія слабне.

“І часу дедалі менше.”`;
    },

    actions: () => {
      if (player.flags.radiyArrested && !player.flags.ownsShop) {
        return [
          action("Спробувати зайняти місце купця", takeShop),

          action("Спробувати допомогти Радію", helpRadiyAfterArrest),

          action("Повернутись на площу", () => move("square"))
        ];
      }

      if (player.flags.ownsShop) {
        return [
          action("Тримати звичайні ціни", () =>
            setShopPrices("звичайні")
          ),

          action("Підняти ціни", () =>
            setShopPrices("високі")
          ),

          action("Знизити ціни", () =>
            setShopPrices("низькі")
          ),

          action("Повернутись на площу", () => move("square"))
        ];
      }

      return [
        action(
          "Купити їжу — 3 золота",
          buyFoodRadiy,
          () => player.gold >= 3
        ),

        action("Спитати про кімнату", askRoomRadiy),

        action("Нічого не купувати", () => {
          player.relations.radiy -= 3;

          remember("Ти нічого не купив у Радія.");

          say(`Радій не перестає посміхатись.

“Безкоштовно тут лише повітря.”`);
        }),

        action("Повернутись на площу", () => move("square"))
      ];
    }
  }
};

function action(text, fn, condition = () => true) {
  return { text, fn, condition };
}

function move(location) {
  player.location = location;
  render();
}

function say(text) {
  mainText.textContent = text;
  actionsBox.innerHTML = "";

  addButton("Продовжити", () => render());
}

function talkRobaDaughter() {
  player.flags.metRoba = true;

  remember("Роба розповів тобі про свою доньку.");

  say(`“Я не прошу жалості.”

Роба дивиться на полиці з поганим товаром.

“Я прошу шанс для неї.”`);
}

function buyBadKnife() {
  player.gold -= 5;
  player.relations.roba += 12;
  player.flags.boughtFromRoba = true;

  remember("Ти купив у Роби поганий ніж.");

  say(`Роба повільно бере монети.

“Сьогодні я хоча б не повернусь додому з порожніми руками.”`);
}

function askAboutRadiy() {
  player.flags.knowsRadiyName = true;

  remember("Роба назвав тобі імʼя купця — Радій.");

  say(`“Радій.

Його крамниця на ринку.”`);
}

function hurtRoba() {
  player.relations.roba -= 15;

  remember("Ти сказав Робі, що це не твоя проблема.");

  say(`Роба мовчки повертається до горна.

“Тоді не витрачай мій час.”`);
}

function doctorJob() {
  player.gold += 4;
  player.energy -= 15;

  gainXp(6);

  remember("Ти виконав дрібне доручення лікаря.");

  say(`“Робота є завжди.”

Ти заробляєш кілька монет.`);
}

function gatherHerbs() {
  player.energy -= 30;
  player.health -= 10;

  player.flags.savedDaughter = true;
  player.world.daughter = "врятована";
  player.relations.roba += 30;

  gainXp(35);

  remember("Ти здобув срібні трави.");

  move("blacksmith");
}

function acceptRobaSword() {
  player.flags.robaSwordTaken = true;

  remember("Роба подарував тобі меч.");

  triggerRadiyArrest();

  say(`Роба кладе меч перед тобою.

“Це для тебе.”`);
}

function buyFoodRadiy() {
  player.gold -= 3;
  player.relations.radiy += 8;
  player.flags.helpedRadiySmall = true;

  remember("Ти купив їжу у Радія.");

  say(`“Дякую.”

Радій стискає монети в руці.

“Іноді людина тримається саме на дрібницях.”`);
}

function askRoomRadiy() {
  player.relations.radiy += 5;
  player.flags.helpedRadiySmall = true;

  remember("Ти спитав Радія про кімнату.");

  say(`“Є кімната над таверною.”

Радій трохи оживає.`);
}

function triggerRadiyArrest() {
  if (player.flags.radiyArrested) return;

  player.flags.radiyArrested = true;
  player.flags.canTakeShop = true;

  player.world.radiy = "арештований";
  player.world.brother = "не врятований";
  player.world.economy = "тріщить";

  remember("Радія забрала варта.");
}

function helpRadiyAfterArrest() {
  player.relations.guard -= 6;
  player.suspicion += 6;

  remember("Ти спробував втрутитись.");

  say(`Вартовий кладе руку на меч.

“Не твоя справа.”`);
}

function takeShop() {
  player.flags.ownsShop = true;

  remember("Ти вирішив зайняти місце Радія.");

  say(`Ти стаєш за прилавок.

Каравел не питає, чи ти готовий.`);
}

function setShopPrices(price) {
  player.world.shopPrices = price;

  if (price === "високі") {
    player.gold += 12;
    player.relations.roba -= 5;
    player.suspicion += 4;

    remember("Ти підняв ціни.");

    say(`Людей стало менше.

“Ти швидко вчишся бути схожим на нього.”`);
    return;
  }

  if (price === "низькі") {
    player.gold += 2;
    player.relations.guard -= 2;

    remember("Ти знизив ціни.");

    say(`Людей стало більше.

Але варта починає дивитись на тебе уважніше.`);
    return;
  }

  player.gold += 6;

  remember("Ти залишив звичайні ціни.");

  say(`Ніхто не дякує.

Ніхто не скаржиться.

Можливо, це вже перемога.`);
}

function sleepAtTavern() {
  if (player.gold < 5) {
    say(`У тебе недостатньо золота.`);
    return;
  }

  player.gold -= 5;
  player.energy = player.maxEnergy;
  player.health = Math.min(player.maxHealth, player.health + 15);
  player.world.hunger = Math.max(0, player.world.hunger - 40);

  passTime(2);

  remember("Ти переночував у таверні.");

  say(`Ти спиш у маленькій кімнаті над таверною.

Вперше за довгий час — у теплі.`);
}

function nightWalk() {
  passTime();

  const roll = Math.random();

  if (roll < 0.35) {
    const stolen = Math.min(player.gold, 6);

    player.gold -= stolen;
    player.health -= 10;

    remember(`Тебе пограбували. Втрачено ${stolen} золота.`);

    say(`Темрява Каравела не любить самотніх.`);
    return;
  }

  if (roll < 0.65) {
    gainXp(5);

    remember("Ти пережив небезпечну ніч.");

    say(`Ти блукаєш нічними вулицями.

Сьогодні ніч вирішила тебе не чіпати.`);
    return;
  }

  player.relations.guard += 2;

  say(`Варта зупиняє тебе серед площі.

“Небезпечний час для прогулянок.”`);
}

function wanderSquare() {
  passTime();

  if (
    !player.flags.savedDaughter &&
    player.world.day >= 4 &&
    !player.flags.daughterLost
  ) {
    player.flags.daughterLost = true;
    player.flags.robaGone = true;

    player.world.daughter = "померла";
    player.world.roba = "зник";

    remember("Роба втратив доньку й покинув Каравел.");

    say(`Кузня стоїть порожня.

“Він поїхав...”`);
    return;
  }

  say(`Ти проходишся площею.

Каравел живе своїм життям.`);
}

function passTime(hours = 1) {
  const times = ["morning", "day", "evening", "night"];

  let currentIndex = times.indexOf(player.world.time);

  if (currentIndex === -1) {
    currentIndex = 0;
    player.world.time = "morning";
  }

  currentIndex += hours;

  while (currentIndex >= times.length) {
    currentIndex -= times.length;
    player.world.day += 1;
    player.energy = Math.min(player.maxEnergy, player.energy + 20);
    player.world.hunger += 20;
  }

  player.world.time = times[currentIndex];

  if (player.world.hunger >= 80) {
    player.health -= 5;
  }

  if (!player.flags.savedDaughter && player.world.day >= 3) {
    player.world.daughter = "гірше";
  }

  if (!player.flags.helpedRadiySmall && player.world.day >= 3) {
    player.world.brother = "викуп росте";
  }
}

function gainXp(amount) {
  player.xp += amount;

  while (player.xp >= player.level * 40) {
    player.xp -= player.level * 40;
    player.level += 1;
    player.maxHealth += 5;
    player.maxEnergy += 5;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;

    remember("Ти став досвідченішим.");
  }
}

function remember(text) {
  player.memory.unshift(text);
  player.memory = player.memory.slice(0, 80);

  saveGame(false);
}

function normalize() {
  player.health = clamp(player.health, 1, player.maxHealth);
  player.energy = clamp(player.energy, 0, player.maxEnergy);
  player.gold = Math.max(0, player.gold);
  player.suspicion = clamp(player.suspicion, 0, 100);

  if (!player.world.time) player.world.time = "morning";
  if (typeof player.world.hunger !== "number") player.world.hunger = 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function render() {
  normalize();

  const location = locations[player.location] || locations.square;

  playerName.textContent = player.name || "Безіменний";
  playerOrigin.textContent = origins[player.background] || "";

  healthStat.textContent = `${player.health}/${player.maxHealth}`;
  energyStat.textContent = `${player.energy}/${player.maxEnergy}`;
  goldStat.textContent = player.gold;
  levelStat.textContent = player.level;
  xpStat.textContent = player.xp;
  suspicionStat.textContent = player.suspicion;

  placeLabel.textContent = location.place;
  locationTitle.textContent = location.title;
  mainText.textContent = location.text();

  actionsBox.innerHTML = "";

  location.actions().forEach((a) => {
    if (!a.condition()) return;

    addButton(a.text, () => {
      a.fn();
      normalize();
      render();
    });
  });

  renderPeople();
  renderWorld();
  renderMemory();
}

function addButton(text, fn) {
  const button = document.createElement("button");

  button.textContent = text;

  button.addEventListener("click", fn);

  actionsBox.appendChild(button);
}

function renderPeople() {
  peopleBox.innerHTML = `
    <div class="person">
      <b>Роба</b><br>
      коваль<br>
      ${relationText(player.relations.roba)}
    </div>

    <div class="person">
      <b>Радій</b><br>
      купець<br>
      ${relationText(player.relations.radiy)}
    </div>

    <div class="person">
      <b>Лікар</b><br>
      ${relationText(player.relations.doctor)}
    </div>

    <div class="person">
      <b>Варта</b><br>
      ${relationText(player.relations.guard)}
    </div>
  `;
}

function relationText(value) {
  if (value >= 25) return `<span class="good">довіряє тобі</span>`;
  if (value >= 8) return `<span class="good">ставиться тепліше</span>`;
  if (value <= -20) return `<span class="bad">памʼятає образу</span>`;
  if (value <= -5) return `<span class="warn">холодне ставлення</span>`;
  return `<span class="muted">нейтрально</span>`;
}

function renderWorld() {
  const timeNames = {
    morning: "ранок",
    day: "день",
    evening: "вечір",
    night: "ніч"
  };

  let hungerText = "ситий";

  if (player.world.hunger >= 30) hungerText = "голодний";
  if (player.world.hunger >= 60) hungerText = "дуже голодний";
  if (player.world.hunger >= 85) hungerText = "виснажений голодом";

  worldBox.innerHTML = `
    <div class="world-item">День: ${player.world.day}</div>
    <div class="world-item">Час: ${timeNames[player.world.time] || "ранок"}</div>
    <div class="world-item">Стан: ${hungerText}</div>
    <div class="world-item">Донька Роби: ${player.world.daughter}</div>
    <div class="world-item">Брат Радія: ${player.world.brother}</div>
    <div class="world-item">Економіка: ${player.world.economy}</div>
    ${
      player.flags.ownsShop
        ? `<div class="world-item">Твоя крамниця: ціни ${player.world.shopPrices}</div>`
        : ""
    }
  `;
}

function renderMemory() {
  memoryBox.innerHTML = "";

  if (!player.memory.length) {
    memoryBox.innerHTML = `<p>Світ ще нічого про тебе не памʼятає.</p>`;
    return;
  }

  player.memory.forEach((m) => {
    const p = document.createElement("p");
    p.textContent = m;
    memoryBox.appendChild(p);
  });
}

loginBtn.addEventListener("click", login);
registerBtn.addEventListener("click", register);
startBtn.addEventListener("click", startGame);
saveBtn.addEventListener("click", () => saveGame(true));
logoutBtn.addEventListener("click", logout);

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startGame();
});

init();

async function init() {
  hideAll();

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
    player = mergeSave(result.save);
    showGame();
    render();
  } else {
    showStart();
  }
}

async function register() {
  const username = loginInput.value.trim();
  const password = passwordInput.value.trim();

  const result = await apiPost("/api/register", {
    username,
    password
  });

  if (!result.ok) {
    authMessage.textContent = result.error || "Помилка";
    return;
  }

  authToken = result.token;
  currentUser = result.username;

  localStorage.setItem(TOKEN_KEY, authToken);
  localStorage.setItem(USER_KEY, currentUser);

  player = createNewPlayer();

  showStart();
}

async function login() {
  const username = loginInput.value.trim();
  const password = passwordInput.value.trim();

  const result = await apiPost("/api/login", {
    username,
    password
  });

  if (!result.ok) {
    authMessage.textContent = result.error || "Помилка";
    return;
  }

  authToken = result.token;
  currentUser = result.username;

  localStorage.setItem(TOKEN_KEY, authToken);
  localStorage.setItem(USER_KEY, currentUser);

  if (result.save) {
    player = mergeSave(result.save);
    showGame();
    render();
  } else {
    player = createNewPlayer();
    showStart();
  }
}

function logout() {
  apiPost("/api/logout", {});

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  authToken = null;
  currentUser = null;
  player = createNewPlayer();

  showAuth();
}

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введи імʼя");
    return;
  }

  player = createNewPlayer(name, backgroundSelect.value);

  remember("Ти прокинувся на площі Каравела.");

  showGame();
  saveGame(false);
  render();
}

function hideAll() {
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

async function saveGame(showLog = true) {
  if (!authToken) return;

  const result = await apiPost("/api/save", {
    save: player
  });

  if (!result.ok) return;

  if (showLog) {
    player.memory.unshift("Гру збережено.");
    renderMemory();
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
    return { ok: false };
  }
}

async function apiPost(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        ...(authToken
          ? {
              Authorization: `Bearer ${authToken}`
            }
          : {})
      },

      body: JSON.stringify(data)
    });

    return await response.json();
  } catch {
    return {
      ok: false,
      error: "Сервер недоступний"
    };
  }
}
