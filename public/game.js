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
const locationText = $("locationText");

const healthStat = $("healthStat");
const energyStat = $("energyStat");
const goldStat = $("goldStat");
const levelStat = $("levelStat");
const xpStat = $("xpStat");
const suspicionStat = $("suspicionStat");

const scenePlace = $("scenePlace");
const sceneTitle = $("sceneTitle");
const sceneText = $("sceneText");
const choicesBox = $("choicesBox");

const peopleBox = $("peopleBox");
const worldBox = $("worldBox");
const logBox = $("logBox");

function createNewPlayer(name = "", background = "peasant") {
  const player = {
    name,
    background,
    scene: "wake_square",
    location: "Площа Каравела",

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
      heardAboutHerbs: false,
      savedDaughter: false,
      boughtFromRoba: false,
      helpedRadiy: false,
      radiyArrested: false,
      canTakeShop: false,
      ownsShop: false
    },

    world: {
      day: 1,
      robaStatus: "у відчаї",
      radiyStatus: "збирає викуп",
      daughterStatus: "помирає",
      brotherStatus: "у полоні",
      economy: "нестабільна",
      shopPrices: "normal",
      shopGoods: "normal"
    },

    memory: []
  };

  applyBackground(player);
  return player;
}

function applyBackground(p) {
  if (p.background === "smith_apprentice") {
    p.relations.roba += 8;
    p.gold += 2;
  }

  if (p.background === "soldier") {
    p.maxHealth += 15;
    p.health = p.maxHealth;
  }

  if (p.background === "thief") {
    p.suspicion += 5;
    p.gold += 6;
  }

  if (p.background === "merchant_kin") {
    p.gold += 15;
    p.relations.radiy += 5;
  }

  if (p.background === "peasant") {
    p.maxEnergy += 10;
    p.energy = p.maxEnergy;
  }
}

let player = createNewPlayer();

const scenes = {
  wake_square: {
    place: "Площа замку Каравел",
    title: "Пробудження",
    text: () =>
      "Ти прокидаєшся просто на площі Каравела. Камінь під боком холодний. Варта дивиться на тебе з підозрою, але, побачивши твій жалюгідний вигляд, швидко втрачає інтерес. Неподалік, у кузні, щось із лязкотом падає на підлогу.",
    choices: [
      {
        text: "Підійти до кузні",
        action: () => go("roba_first")
      },
      {
        text: "Пройтись площею",
        action: () => go("square_walk")
      }
    ]
  },

  roba_first: {
    place: "Кузня Роби",
    title: "Поганий метал",
    text: () =>
      "Коваль Роба зустрічає тебе поглядом, у якому змішались біль, сором і надія.\n\n“Купець... знову за своє. Цей метал нікудишній. Я не можу з цим працювати.”\n\nВін показує полиці: ніж, лом, шолом низької якості, кольчуга, що ось-ось розсиплеться.\n\n“Моя донька хвора. Тяжко хвора. Мені потрібні будь-які кошти. Але Радій привозить мені поганий метал і здирає втричі більше. Якщо так піде далі — я продам кузню. Я зроблю все, щоб моя донька жила.”",
    onEnter: () => {
      player.flags.metRoba = true;
    },
    choices: [
      {
        text: "Купити дешевий ніж у Роби — 5 золота",
        condition: () => player.gold >= 5,
        action: () => {
          player.gold -= 5;
          player.relations.roba += 12;
          player.flags.boughtFromRoba = true;
          remember("Ти купив у Роби поганий ніж, хоча розумів, що він майже нічого не вартий.");
          go("roba_grateful_small");
        }
      },
      {
        text: "Сказати: “У кожного свої проблеми”",
        action: () => {
          player.relations.roba -= 15;
          remember("Ти сказав Робі, що його біда — не твоя проблема.");
          go("roba_hurt");
        }
      },
      {
        text: "Мовчки піти",
        action: () => {
          player.relations.roba -= 6;
          remember("Ти мовчки пішов із кузні. Роба дивився тобі вслід.");
          go("square_walk");
        }
      },
      {
        text: "Запитати про купця Радія",
        action: () => go("ask_radiy")
      }
    ]
  },

  roba_grateful_small: {
    place: "Кузня Роби",
    title: "Дрібна допомога",
    text: () =>
      "Роба бере монети повільно. Він розуміє, що ти купив не товар, а час.\n\n“Дякую. Це... небагато. Але сьогодні я хоча б не повернусь додому з порожніми руками.”",
    choices: [
      {
        text: "Вийти на площу",
        action: () => go("square_walk")
      }
    ]
  },

  roba_hurt: {
    place: "Кузня Роби",
    title: "Холод",
    text: () =>
      "Роба опускає очі. На мить тобі здається, що він щось хоче сказати, але він лише повертається до горна.\n\n“Тоді не витрачай мій час.”",
    choices: [
      {
        text: "Піти",
        action: () => go("square_walk")
      }
    ]
  },

  ask_radiy: {
    place: "Кузня Роби",
    title: "Імʼя купця",
    text: () =>
      "Роба стискає кулак.\n\n“Радій. Його крамниця на ринку. Усміхається так, ніби світ йому винен. Якщо підеш до нього — не вір кожному слову.”",
    choices: [
      {
        text: "Піти до крамниці Радія",
        action: () => go("radiy_first")
      },
      {
        text: "Спершу пройтись площею",
        action: () => go("square_walk")
      }
    ]
  },

  square_walk: {
    place: "Площа Каравела",
    title: "Переварити почуте",
    text: () =>
      "Ти йдеш площею, намагаючись зібрати думки. Люди поспішають у своїх справах. Біля колодязя старий лікар перебирає трави в потертій сумці. Він помічає твій погляд.\n\n“Ти був у Роби, так? Якщо мова про його доньку — монет замало. Потрібні срібні трави з Чорного Яру. Без них усе марно.”",
    onEnter: () => {
      player.flags.metDoctor = true;
      player.flags.heardAboutHerbs = true;
    },
    choices: [
      {
        text: "Сказати лікарю: “Я зберу трави”",
        action: () => {
          player.relations.doctor += 8;
          remember("Ти пообіцяв лікарю зібрати срібні трави для доньки Роби.");
          go("black_ravine");
        }
      },
      {
        text: "Спитати, чи немає іншої роботи",
        action: () => {
          player.relations.doctor += 2;
          remember("Ти не взявся за трави, але попросив у лікаря іншу роботу.");
          go("doctor_small_job");
        }
      },
      {
        text: "Піти до Радія",
        action: () => go("radiy_first")
      },
      {
        text: "Піти далі своєю дорогою",
        action: () => {
          passTime();
          go("square_later");
        }
      }
    ]
  },

  doctor_small_job: {
    place: "Площа Каравела",
    title: "Інша робота",
    text: () =>
      "Лікар дивиться на тебе уважно.\n\n“Робота є завжди. Але не кожна робота рятує чиєсь життя.”\n\nВін дає тобі дрібне доручення. Ти заробляєш кілька монет, але думка про трави не зникає.",
    choices: [
      {
        text: "Виконати дрібне доручення",
        action: () => {
          player.gold += 4;
          player.energy -= 15;
          gainXp(6);
          passTime();
          remember("Ти заробив кілька монет у лікаря, але не пішов по трави.");
          go("square_later");
        }
      }
    ]
  },

  black_ravine: {
    place: "Чорний Яр",
    title: "Срібні трави",
    text: () =>
      "Чорний Яр зустрічає тебе сирістю і тишею. Каміння слизьке, повітря важке. Трави ростуть між темними коренями, там, де легко зламати ногу або зустріти щось гірше за вовка.",
    choices: [
      {
        text: "Обережно збирати трави",
        action: () => {
          player.energy -= 30;
          player.health -= 10;
          player.flags.savedDaughter = true;
          player.relations.roba += 25;
          gainXp(25);
          remember("Ти здобув срібні трави в Чорному Яру.");
          go("roba_daughter_saved");
        }
      },
      {
        text: "Зрозуміти, що це занадто небезпечно, і повернутись",
        action: () => {
          player.energy -= 10;
          player.relations.roba -= 4;
          remember("Ти дійшов до Чорного Яру, але не ризикнув збирати трави.");
          passTime();
          go("square_later");
        }
      }
    ]
  },

  roba_daughter_saved: {
    place: "Кузня Роби",
    title: "Меч вдячності",
    text: () =>
      "Коли ти повертаєшся з травами, Роба довго мовчить. Потім бере згорток так обережно, ніби тримає в руках саме життя.\n\nЧерез деякий час ти знову заходиш у кузню. Горн горить яскравіше.\n\n“Знаєш... я вдячний тобі. Я знайшов іншого постачальника. Хороший метал. Для тебе я зробив один із кращих мечів.”\n\nВін кладе меч перед тобою.",
    choices: [
      {
        text: "Прийняти меч",
        action: () => {
          player.gold += 0;
          gainXp(35);
          remember("Роба подарував тобі добрий меч за порятунок доньки.");
          passTime();
          player.world.robaStatus = "врятований";
          player.world.daughterStatus = "жива";
          player.world.radiyStatus = "втрачає прибуток";
          go("radiy_arrest");
        }
      }
    ]
  },

  radiy_first: {
    place: "Крамниця Радія",
    title: "Брат у ДегРані",
    text: () =>
      "Крамниця Радія тепла й затишна. Пахне спеціями, сухофруктами і грошима. Радій — крупний чоловік із посмішкою, яка одразу привертає увагу.\n\nКоли ти питаєш про метал для Роби, посмішка слабне.\n\n“О, мій дорогий друже. Він уже й тобі пожалівся? Але зрозумій... його донька хоч і хвора, але вона вдома.”\n\nЙого руки починають тремтіти.\n\n“Мій єдиний брат у полоні в ДегРані. Король Магнус вимагає викуп. І з кожним днем сума росте.”",
    onEnter: () => {
      player.flags.metRadiy = true;
    },
    choices: [
      {
        text: "Купити їжу — 3 золота",
        condition: () => player.gold >= 3,
        action: () => {
          player.gold -= 3;
          player.relations.radiy += 8;
          player.flags.helpedRadiy = true;
          remember("Ти купив їжу в Радія. Маленька монета на великий викуп.");
          passTime();
          go("radiy_food");
        }
      },
      {
        text: "Спитати, де можна зняти кімнату",
        action: () => {
          player.relations.radiy += 5;
          remember("Ти спитав у Радія про кімнату, знаючи, що він має з цього відсоток.");
          go("radiy_room");
        }
      },
      {
        text: "Піти",
        action: () => {
          player.relations.radiy -= 2;
          remember("Ти вислухав Радія і пішов, нічого не купивши.");
          go("square_walk");
        }
      }
    ]
  },

  radiy_food: {
    place: "Крамниця Радія",
    title: "Дрібна монета",
    text: () =>
      "Радій загортає їжу швидше, ніж треба.\n\n“Дякую. Це дрібниця, я знаю. Але іноді людина тримається саме на дрібницях.”\n\nТи бачиш: він не бреше. Але й не кається.",
    choices: [
      {
        text: "Повернутись на площу",
        action: () => go("square_walk")
      }
    ]
  },

  radiy_room: {
    place: "Крамниця Радія",
    title: "Кімната",
    text: () =>
      "Радій трохи оживає.\n\n“Є одна кімната над таверною. Не найкраща, але суха. Скажеш, що від мене.”\n\nТи розумієш: навіть твоя ночівля стане частиною його спроби врятувати брата.",
    choices: [
      {
        text: "Подякувати і піти",
        action: () => {
          passTime();
          go("square_later");
        }
      }
    ]
  },

  square_later: {
    place: "Площа Каравела",
    title: "Місто рухається",
    text: () =>
      "Площа живе своїм життям. Хтось сперечається про ціни. Хтось каже, що в кузні стало тихіше. Хтось шепоче, що Радій останнім часом надто часто ходить до замкових людей.",
    choices: [
      {
        text: "Повернутись до кузні",
        action: () => {
          if (player.flags.savedDaughter) go("roba_daughter_saved");
          else go("roba_consequence");
        }
      },
      {
        text: "Піти до Радія",
        action: () => go("radiy_first")
      }
    ]
  },

  roba_consequence: {
    place: "Кузня Роби",
    title: "Тиша",
    text: () =>
      "Ти проходиш повз кузню і зупиняєшся. Не чути жодного удару молота.\n\nПерехожий, якого ти питаєш про Робу, лише зітхає.\n\n“Ти ще не знаєш? Він продав кузню, щоб оплатити лікування. Але грошей не вистачило. Дівчинка померла. А він... поїхав. Зібрав усе, що мав, і зник.”",
    choices: [
      {
        text: "Мовчки стояти біля порожньої кузні",
        action: () => {
          passTime();
          player.world.robaStatus = "зник";
          player.world.daughterStatus = "померла";
          go("radiy_late");
        }
      }
    ]
  },

  radiy_late: {
    place: "Крамниця Радія",
    title: "Запізно",
    text: () =>
      "У крамниці Радія тихіше, ніж раніше.\n\nВін упізнає тебе.\n\n“Коваль зник. А він був моїм найбільшим клієнтом.”\n\nВін показує на скриню із золотом.\n\n“Я майже зібрав. Майже.”\n\nПауза.\n\n“ДегРан захотів удвічі більше. Брата стратили.”",
    choices: [
      {
        text: "Слухати мовчки",
        action: () => {
          player.world.radiyStatus = "зламаний";
          passTime();
          go("king_pressure");
        }
      }
    ]
  },

  radiy_arrest: {
    place: "Крамниця Радія",
    title: "Арешт",
    text: () =>
      "Коли ти заходиш до крамниці, там уже варта.\n\nРадій стоїть посеред кімнати, руки звʼязані. Він бачить тебе. На мить його погляд зупиняється.\n\nТам немає крику. Немає прокляття.\n\nЛише втома.\n\nКапітан варти киває людям, і Радія виводять.",
    onEnter: () => {
      player.flags.radiyArrested = true;
      player.flags.canTakeShop = true;
      player.world.radiyStatus = "арештований";
      player.world.brotherStatus = "не врятований";
    },
    choices: [
      {
        text: "Подумати: “Чи не зайняти мені його місце?”",
        action: () => go("take_shop_choice")
      },
      {
        text: "Спробувати допомогти Радію",
        action: () => go("help_radiy")
      },
      {
        text: "Зайнятись своїми справами",
        action: () => {
          remember("Ти бачив, як Радія забрала варта, і не втрутився.");
          go("square_after_chain");
        }
      }
    ]
  },

  help_radiy: {
    place: "Біля крамниці",
    title: "Проти варти",
    text: () =>
      "Ти робиш крок уперед, але один із вартових кладе руку на руківʼя меча.\n\n“Не твоя справа.”\n\nІ ти розумієш: допомогти можна. Але не тут. Не зараз. І точно не без наслідків.",
    choices: [
      {
        text: "Відступити",
        action: () => {
          player.relations.guard -= 5;
          remember("Ти спробував втрутитись під час арешту Радія.");
          go("square_after_chain");
        }
      }
    ]
  },

  take_shop_choice: {
    place: "Порожня крамниця",
    title: "Вакантне місце",
    text: () =>
      "Крамниця стоїть майже порожня. На столі лишились рахунки. Двері ще не опечатані.\n\nТи не знаєш, чи це шанс, чи пастка.\n\nАле вперше Каравел ніби питає тебе: ким ти хочеш бути?",
    choices: [
      {
        text: "Спробувати зайняти місце купця",
        action: () => {
          player.flags.ownsShop = true;
          player.gold = Math.max(0, player.gold - 2);
          remember("Ти вирішив спробувати зайняти місце Радія.");
          go("shop_management");
        }
      },
      {
        text: "Не лізти в це",
        action: () => go("square_after_chain")
      }
    ]
  },

  shop_management: {
    place: "Твоя крамниця",
    title: "Перші рішення",
    text: () =>
      "Тепер за прилавком стоїш ти.\n\nЛюди заходять обережно. Дехто дивиться з надією. Дехто — з недовірою. На столі лежать три рішення, які виглядають простими тільки на папері.",
    choices: [
      {
        text: "Тримати нормальні ціни",
        action: () => {
          player.world.shopPrices = "normal";
          player.gold += 6;
          remember("Ти вирішив тримати нормальні ціни.");
          go("shop_reaction");
        }
      },
      {
        text: "Підняти ціни",
        action: () => {
          player.world.shopPrices = "high";
          player.gold += 12;
          player.relations.roba -= 5;
          player.suspicion += 4;
          remember("Ти підняв ціни в крамниці.");
          go("shop_reaction");
        }
      },
      {
        text: "Продавати дешевше, щоб люди прийшли",
        action: () => {
          player.world.shopPrices = "low";
          player.gold += 2;
          player.relations.guard -= 2;
          remember("Ти знизив ціни, щоб залучити людей.");
          go("shop_reaction");
        }
      }
    ]
  },

  shop_reaction: {
    place: "Твоя крамниця",
    title: "Перший відгук",
    text: () => {
      if (player.world.shopPrices === "high") {
        return "Наступного дня людей менше.\n\nОдин чоловік бере мішок зерна, дивиться на ціну і мовчки кладе назад.\n\nРоба, проходячи повз, кидає коротко:\n\n“Ти швидко вчишся бути схожим на нього.”";
      }

      if (player.world.shopPrices === "low") {
        return "Людей стало більше. Хтось навіть дякує тобі.\n\nАле ввечері біля дверей зупиняється вартовий.\n\n“Дивні ціни. Дуже дивні. Сподіваюсь, товар не крадений.”";
      }

      return "Люди заходять обережно, але купують. Ніхто не дякує. Ніхто не проклинає.\n\nМожливо, для першого дня це вже перемога.";
    },
    choices: [
      {
        text: "Продовжити",
        action: () => go("square_after_chain")
      }
    ]
  },

  king_pressure: {
    place: "Площа Каравела",
    title: "Темні часи",
    text: () =>
      "Площа змінилась. Люди говорять тихіше. Ходять чутки, що казна замку пустує. Король Вальтер незадоволений купцями, ремісниками, усіма.\n\nКаравел входить у важкі часи.",
    choices: [
      {
        text: "Продовжити свою історію",
        action: () => go("square_after_chain")
      }
    ]
  },

  square_after_chain: {
    place: "Площа Каравела",
    title: "Після першого ланцюга",
    text: () =>
      "Ти знову стоїш на площі. Але це вже не та площа, на якій ти прокинувся.\n\nХтось отримав шанс. Хтось втратив усе. А ти отримав перший урок Каравела: навіть маленькі рішення мають довгу тінь.",
    choices: [
      {
        text: "Повернутись до крамниці",
        condition: () => player.flags.ownsShop,
        action: () => go("shop_management")
      },
      {
        text: "Піти до кузні",
        action: () => {
          if (player.flags.savedDaughter) go("roba_daughter_saved");
          else go("roba_consequence");
        }
      },
      {
        text: "Зберегти гру",
        action: () => saveGame(true)
      }
    ]
  }
};

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
    log("Історію завантажено.");
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

  if (result.save) {
    player = {
      ...createNewPlayer(),
      ...result.save
    };
    showGame();
    log("Історію завантажено.");
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
}

function startGame() {
  const name = nameInput.value.trim();

  if (!name) {
    alert("Введи імʼя");
    return;
  }

  player = createNewPlayer(name, backgroundSelect.value);
  showGame();
  log("Ти прокинувся на площі Каравела.");
  saveGame(false);
  render();
}

function choose(choice) {
  if (choice.condition && !choice.condition()) return;

  choice.action();
  normalize();
  saveGame(false);
  render();
}

function go(sceneId) {
  player.scene = sceneId;
  const scene = scenes[sceneId];

  if (scene && scene.onEnter) {
    scene.onEnter();
  }

  render();
}

function passTime() {
  player.world.day += 1;
  player.energy = Math.min(player.maxEnergy, player.energy + 25);

  if (!player.flags.savedDaughter && player.world.day >= 4) {
    player.world.daughterStatus = "критичний стан";
  }

  if (!player.flags.helpedRadiy && player.world.day >= 4) {
    player.world.brotherStatus = "вирок наближається";
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
    log("Ти став досвідченішим.");
  }
}

function remember(text) {
  player.memory.unshift(text);
  player.memory = player.memory.slice(0, 80);
  log(text);
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
  const scene = scenes[player.scene] || scenes.wake_square;

  playerName.textContent = player.name || "Безіменний";
  locationText.textContent = player.location;

  healthStat.textContent = `${player.health}/${player.maxHealth}`;
  energyStat.textContent = `${player.energy}/${player.maxEnergy}`;
  goldStat.textContent = player.gold;
  levelStat.textContent = player.level;
  xpStat.textContent = player.xp;
  suspicionStat.textContent = player.suspicion;

  scenePlace.textContent = scene.place;
  sceneTitle.textContent = scene.title;
  sceneText.textContent = typeof scene.text === "function" ? scene.text() : scene.text;

  choicesBox.innerHTML = "";

  scene.choices.forEach((choice) => {
    if (choice.condition && !choice.condition()) return;

    const button = document.createElement("button");
    button.textContent = choice.text;
    button.addEventListener("click", () => choose(choice));
    choicesBox.appendChild(button);
  });

  renderPeople();
  renderWorld();
}

function renderPeople() {
  peopleBox.innerHTML = `
    <div class="person"><b>Роба, коваль</b><br>${relationText(player.relations.roba)}<br>Стан: ${player.world.robaStatus}</div>
    <div class="person"><b>Радій, купець</b><br>${relationText(player.relations.radiy)}<br>Стан: ${player.world.radiyStatus}</div>
    <div class="person"><b>Лікар</b><br>${relationText(player.relations.doctor)}</div>
    <div class="person"><b>Варта</b><br>${relationText(player.relations.guard)}</div>
  `;
}

function relationText(value) {
  if (value >= 25) return `<span class="good">довіряє тобі</span>`;
  if (value >= 8) return `<span class="good">ставиться краще</span>`;
  if (value <= -20) return `<span class="bad">памʼятає образу</span>`;
  if (value <= -5) return `<span class="warn">холодне ставлення</span>`;
  return `<span>нейтрально</span>`;
}

function renderWorld() {
  worldBox.innerHTML = `
    <div class="world-line">День: ${player.world.day}</div>
    <div class="world-line">Донька Роби: ${player.world.daughterStatus}</div>
    <div class="world-line">Брат Радія: ${player.world.brotherStatus}</div>
    <div class="world-line">Економіка Каравела: ${player.world.economy}</div>
    ${player.flags.ownsShop ? `<div class="world-line">Твоя крамниця: ціни — ${player.world.shopPrices}</div>` : ""}
  `;
}

function log(text) {
  if (!logBox) return;

  const p = document.createElement("p");
  p.textContent = text;
  logBox.prepend(p);
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

  if (!result.ok) {
    log("Не вдалося зберегти гру.");
    return;
  }

  if (showLog) log("Гру збережено.");
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
