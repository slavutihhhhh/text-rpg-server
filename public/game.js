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

Варта дивиться на тебе з підозрою, але, побачивши твій жалюгідний вигляд, переключає увагу на когось більш важливого.

Неподалік, у кузні, щось із лязкотом падає на підлогу.`;
      }

      if (player.flags.radiyArrested) {
        return `Площа Каравела стала тихішою.

Люди говорять пошепки. Усі знають, що Радія забрала варта. Ніхто не знає, хто займе його місце.

Або роблять вигляд, що не знають.`;
      }

      return `Площа Каравела живе своїм життям.

Хтось сперечається про ціни. Хтось говорить про хвору доньку коваля. Хтось згадує Радія, який останнім часом надто часто ходить до замкових людей.

Ти можеш піти куди хочеш. Каравел не чекає тебе — але памʼятає.`;
    },
    actions: () => [
      action("Піти до кузні Роби", () => move("blacksmith")),
      action("Піти до крамниці Радія", () => move("shop")),
      action("Поговорити з лікарем на площі", () => move("doctor")),
      action("Просто пройтись і подивитись на місто", wanderSquare)
    ]
  },

  blacksmith: {
    place: "Каравел",
    title: "Кузня Роби",
    text: () => {
      if (player.flags.robaGone) {
        return `Кузня порожня.

Горн холодний. На дверях лишився слід від старої вивіски. Місце, де колись лунав молот, тепер мовчить.`;
      }

      if (player.flags.savedDaughter) {
        return `Горн у кузні Роби горить яскраво.

Роба працює спокійніше. Не щасливо — ні. Такі люди не стають щасливими за одну ніч. Але в його рухах більше немає того відчаю, який ти бачив раніше.

На стіні висить меч, який він зробив для тебе.`;
      }

      if (player.relations.roba <= -15) {
        return `Роба навіть не піднімає очей.

“Я зараз не хочу з тобою говорити.”

Молот падає на метал важче, ніж потрібно.`;
      }

      return `Роба стоїть біля полиць із поганим товаром.

Ніж. Лом. Шолом низької якості. Кольчуга, яка від будь-якого дотику от-от розпадеться.

Він дивиться на тебе з болем і надією.

“Купець знову за своє. Метал нікудишній. Я не можу з цим працювати. А моя донька... з кожним днем їй усе гірше.”`;
    },
    actions: () => {
      if (player.flags.robaGone) {
        return [
          action("Повернутись на площу", () => move("square"))
        ];
      }

      if (player.flags.savedDaughter) {
        return [
          action("Прийняти меч Роби", acceptRobaSword, () => !player.flags.robaSwordTaken),
          action("Поговорити з Робою", () => say(`Роба проводить рукою по краю ковадла.

“Я не забуду, що ти зробив. Не всі в Каравелі проходять повз чужий біль.”`)),
          action("Повернутись на площу", () => move("square"))
        ];
      }

      if (player.relations.roba <= -15) {
        return [
          action("Піти", () => move("square"))
        ];
      }

      return [
        action("Поговорити про доньку", talkRobaDaughter),
        action("Купити поганий ніж — 5 золота", buyBadKnife, () => player.gold >= 5 && !player.flags.boughtFromRoba),
        action("Запитати про купця", askAboutRadiy),
        action("Сказати: “У кожного свої проблеми”", hurtRoba),
        action("Мовчки піти", () => {
          player.relations.roba -= 5;
          remember("Ти мовчки пішов із кузні. Роба це запамʼятав.");
          move("square");
        }),
        action("Залишитись у кузні й нічого не робити", () => say(`Ти стоїш мовчки.

Роба більше нічого не каже. Іноді мовчання допомагає. Іноді — ранить сильніше за слова.`)),
        action("Повернутись на площу", () => move("square"))
      ];
    }
  },

  doctor: {
    place: "Площа Каравела",
    title: "Старий лікар",
    text: () => {
      if (!player.flags.knowsAboutHerbs) {
        return `Старий лікар перебирає висушені трави в потертій сумці.

Він помічає, що ти прийшов із боку кузні.

“Якщо мова про доньку Роби — монет замало. Потрібні срібні трави з Чорного Яру. Без них усе марно.”`;
      }

      return `Лікар дивиться на тебе втомлено.

“Чорний Яр не місце для дурнів. Але іноді тільки дурень і може врятувати життя.”`;
    },
    actions: () => [
      action("Сказати: “Я зберу трави”", () => {
        player.flags.metDoctor = true;
        player.flags.knowsAboutHerbs = true;
        player.flags.promisedHerbs = true;
        player.relations.doctor += 8;
        remember("Ти пообіцяв лікарю зібрати срібні трави для доньки Роби.");
        move("ravine");
      }),
      action("Спитати, чи немає іншої роботи", doctorJob),
      action("Повернутись на площу", () => move("square"))
    ]
  },

  ravine: {
    place: "За межами Каравела",
    title: "Чорний Яр",
    text: () => `Чорний Яр лежить нижче дороги, там, де сонце швидко зникає за скелями.

Срібні трави ростуть між темним корінням. Поряд чути воду. Або щось схоже на воду.

Тут легко зробити правильну річ.
І так само легко не повернутись.`,
    actions: () => [
      action("Обережно збирати трави", gatherHerbs),
      action("Злякатись і повернутись", () => {
        player.energy -= 10;
        player.relations.roba -= 4;
        remember("Ти дійшов до Чорного Яру, але не зміг змусити себе ризикнути.");
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
        return `Крамниця Радія стоїть майже порожня.

На столі лишились рахунки. Двері ще не опечатані.

Ти не знаєш, чи це шанс, чи пастка.`;
      }

      if (player.flags.ownsShop) {
        return `Тепер за прилавком стоїш ти.

Люди заходять обережно. Дехто дивиться з надією. Дехто — з недовірою.

Колись ти дивився на Радія з боку.
Тепер хтось дивиться так на тебе.`;
      }

      return `Крамниця Радія тепла й затишна. Пахне спеціями, сухофруктами і грошима.

Радій — крупний чоловік із посмішкою, яка одразу привертає увагу.

Коли ти питаєш про метал для Роби, посмішка слабне.

“О, мій дорогий друже. Він уже й тобі пожалівся? Але зрозумій... його донька хоч і хвора, але вона вдома.”

Його руки починають тремтіти.

“Мій брат у полоні в ДегРані. Король Магнус вимагає викуп. І з кожним днем сума росте.”`;
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
          action("Тримати звичайні ціни", () => setShopPrices("звичайні")),
          action("Підняти ціни", () => setShopPrices("високі")),
          action("Знизити ціни", () => setShopPrices("низькі")),
          action("Повернутись на площу", () => move("square"))
        ];
      }

      return [
        action("Купити їжу — 3 золота", buyFoodRadiy, () => player.gold >= 3),
        action("Спитати, де можна зняти кімнату", askRoomRadiy),
        action("Подивитись на товар і нічого не купити", () => {
          player.relations.radiy -= 3;
          remember("Ти довго дивився на товар Радія, але нічого не купив.");
          say(`Радій не перестає посміхатись.

“Якщо шукаєш щось дешевше за безкоштовне — у мене такого немає.”`);
        }),
        action("Піти", () => {
          player.relations.radiy -= 2;
          remember("Ти вислухав Радія і пішов.");
          move("square");
        })
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
  remember("Роба розповів тобі про хворобу доньки.");

  say(`Роба витирає руки об фартух.

“Я не прошу жалості. Мені нема коли її слухати.”

Він дивиться на полиці з поганим товаром.

“Я прошу шанс. Для неї.”`);
}

function buyBadKnife() {
  player.gold -= 5;
  player.relations.roba += 12;
  player.flags.boughtFromRoba = true;
  remember("Ти купив у Роби поганий ніж, хоча розумів, що він майже нічого не вартий.");

  say(`Роба бере монети повільно.

Він розуміє, що ти купив не товар. Ти купив йому трохи часу.

“Дякую. Сьогодні я хоча б не повернусь додому з порожніми руками.”`);
}

function askAboutRadiy() {
  player.flags.knowsRadiyName = true;
  remember("Роба назвав тобі імʼя купця — Радій.");

  say(`Роба стискає кулак.

“Радій. Його крамниця на ринку. Усміхається так, ніби світ йому винен.”

Він замовкає.

“Якщо підеш до нього — не вір кожному слову.”`);
}

function hurtRoba() {
  player.relations.roba -= 15;
  remember("Ти сказав Робі, що його біда — не твоя проблема.");

  say(`Роба опускає очі.

На мить здається, що він хоче відповісти, але він лише повертається до горна.

“Тоді не витрачай мій час.”`);
}

function doctorJob() {
  player.relations.doctor += 2;
  player.energy -= 15;
  player.gold += 4;
  gainXp(6);
  remember("Ти виконав дрібне доручення лікаря і заробив кілька монет.");

  say(`Лікар дає тобі дрібне доручення.

“Робота є завжди. Але не кожна робота рятує чиєсь життя.”

Ти заробляєш кілька монет. Думка про срібні трави не зникає.`);
}

function gatherHerbs() {
  player.energy -= 30;
  player.health -= 10;
  player.flags.savedDaughter = true;
  player.world.daughter = "врятована";
  player.world.roba = "поступово відновлюється";
  player.world.radiy = "втрачає найбільшого клієнта";
  player.relations.roba += 30;
  player.relations.doctor += 10;
  gainXp(35);
  remember("Ти здобув срібні трави в Чорному Яру. Донька Роби отримала шанс.");

  move("blacksmith");
}

function acceptRobaSword() {
  player.flags.robaSwordTaken = true;
  player.relations.roba += 10;
  gainXp(30);
  remember("Роба подарував тобі добрий меч за порятунок доньки.");
  triggerRadiyArrest();

  say(`Роба знімає зі стіни меч.

“Я знайшов іншого постачальника. Хороший метал.”

Він кладе меч перед тобою.

“Це для тебе.”`);
}

function buyFoodRadiy() {
  player.gold -= 3;
  player.relations.radiy += 8;
  player.flags.helpedRadiySmall = true;
  remember("Ти купив їжу в Радія. Маленька монета на великий викуп.");

  say(`Радій загортає їжу швидше, ніж треба.

“Дякую. Це дрібниця, я знаю.”

Він дивиться на монети.

“Але іноді людина тримається саме на дрібницях.”`);
}

function askRoomRadiy() {
  player.relations.radiy += 5;
  player.flags.helpedRadiySmall = true;
  remember("Ти спитав у Радія про кімнату, знаючи, що він має з цього відсоток.");

  say(`Радій трохи оживає.

“Є кімната над таверною. Не найкраща, але суха.”

Він дивиться на тебе уважніше.

“Скажеш, що від мене.”`);
}

function triggerRadiyArrest() {
  if (player.flags.radiyArrested) return;

  player.flags.radiyArrested = true;
  player.flags.canTakeShop = true;
  player.world.radiy = "арештований";
  player.world.brother = "не врятований";
  player.world.economy = "тріщить";
  remember("Радія забрала варта. Його брат так і не був викуплений.");
}

function helpRadiyAfterArrest() {
  player.relations.guard -= 6;
  player.suspicion += 6;
  remember("Ти спробував втрутитись після арешту Радія.");

  say(`Ти робиш крок уперед.

Один із вартових кладе руку на руківʼя меча.

“Не твоя справа.”

І ти розумієш: допомогти можна. Але не тут. Не зараз. І точно не без наслідків.`);
}

function takeShop() {
  player.flags.ownsShop = true;
  player.world.shopPrices = "звичайні";
  remember("Ти вирішив спробувати зайняти місце Радія.");

  say(`Ти заходиш за прилавок.

Рахунки ще лежать на столі. Деякі плями чорнила не висохли.

Каравел не питає, чи ти готовий.

Він просто звільнив місце.`);
}

function setShopPrices(price) {
  player.world.shopPrices = price;

  if (price === "високі") {
    player.gold += 12;
    player.suspicion += 4;
    player.relations.roba -= 5;
    remember("Ти підняв ціни в крамниці.");

    say(`Наступного дня людей менше.

Один чоловік бере мішок зерна, дивиться на ціну і мовчки кладе назад.

Роба, проходячи повз, кидає коротко:

“Ти швидко вчишся бути схожим на нього.”`);
    return;
  }

  if (price === "низькі") {
    player.gold += 2;
    player.relations.guard -= 2;
    remember("Ти знизив ціни, щоб залучити людей.");

    say(`Людей стало більше.

Хтось навіть дякує тобі.

Але ввечері біля дверей зупиняється вартовий.

“Дивні ціни. Дуже дивні. Сподіваюсь, товар не крадений.”`);
    return;
  }

  player.gold += 6;
  remember("Ти вирішив тримати звичайні ціни.");

  say(`Люди заходять обережно, але купують.

Ніхто не дякує.
Ніхто не проклинає.

Можливо, для першого дня це вже перемога.`);
}

function wanderSquare() {
  passTime();

  if (!player.flags.savedDaughter && player.world.day >= 4 && !player.flags.daughterLost) {
    player.flags.daughterLost = true;
    player.flags.robaGone = true;
    player.world.daughter = "померла";
    player.world.roba = "зник";
    remember("Роба продав кузню, але цього не вистачило. Його донька померла. Він поїхав із Каравела.");

    say(`Ти проходиш повз кузню і зупиняєшся.

Там тихо.

Перехожий, якого ти питаєш про Робу, лише зітхає.

“Ти ще не знаєш? Він продав кузню. Але грошей не вистачило. Дівчинка померла. А він... поїхав.”`);
    return;
  }

  say(`Ти проходишся площею.

Каравел не пояснює себе. Він просто живе.

Хтось сміється біля крамниці. Хтось свариться через ціну на зерно. Хтось мовчки несе воду.

І десь між усім цим твої рішення вже пускають коріння.`);
}

function passTime() {
  player.world.day += 1;
  player.energy = Math.min(player.maxEnergy, player.energy + 20);

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
    <div class="person"><b>Роба</b><br>коваль<br>${relationText(player.relations.roba)}<br><span class="muted">${player.world.roba}</span></div>
    <div class="person"><b>Радій</b><br>купець<br>${relationText(player.relations.radiy)}<br><span class="muted">${player.world.radiy}</span></div>
    <div class="person"><b>Старий лікар</b><br>${relationText(player.relations.doctor)}</div>
    <div class="person"><b>Варта</b><br>${relationText(player.relations.guard)}</div>
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
  worldBox.innerHTML = `
    <div class="world-item">День: ${player.world.day}</div>
    <div class="world-item">Донька Роби: ${player.world.daughter}</div>
    <div class="world-item">Брат Радія: ${player.world.brother}</div>
    <div class="world-item">Економіка: ${player.world.economy}</div>
    ${player.flags.ownsShop ? `<div class="world-item">Твоя крамниця: ціни ${player.world.shopPrices}</div>` : ""}
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
    player = {
      ...createNewPlayer(),
      ...result.save
    };

    showGame();
    render();
  } else {
    showStart();
  }
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
  showStart();
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

  if (result.save) {
    player = {
      ...createNewPlayer(),
      ...result.save
    };
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

  const result = await apiPost("/api/save", { save: player });

  if (!result.ok) return;

  if (showLog) {
    player.memory.unshift("Гру збережено.");
    renderMemory();
  }
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
