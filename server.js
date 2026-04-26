const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const PORT = 3000;
const SAVE_FILE = path.join(__dirname, "players.json");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const ITEMS = {
  "Зілля лікування": { type: "consumable", rarity: "common", price: 15, heal: 35 },
  "Іржавий кинджал": { type: "weapon", rarity: "common", price: 20, damage: 3 },
  "Кістяний меч": { type: "weapon", rarity: "uncommon", price: 35, damage: 5 },
  "Мисливський спис": { type: "weapon", rarity: "rare", price: 55, damage: 8 },
  "Залізний меч": { type: "weapon", rarity: "rare", price: 75, damage: 10 },
  "Сталевий топір": { type: "weapon", rarity: "epic", price: 130, damage: 16 },
  "Шкіряна броня": { type: "armor", rarity: "common", price: 30, armor: 2 },
  "Шкура вовка": { type: "armor", rarity: "uncommon", price: 35, armor: 3 },
  "Залізний щит": { type: "armor", rarity: "rare", price: 70, armor: 6 },
  "Броня руїн": { type: "armor", rarity: "epic", price: 140, armor: 10 },
  "Ікло вовка": { type: "material", rarity: "common", price: 8 },
  "Металобрухт": { type: "material", rarity: "common", price: 12 },
  "Темний уламок": { type: "material", rarity: "rare", price: 25 },
  "Серце мутанта": { type: "material", rarity: "epic", price: 75 }
};

const LOCATIONS = {
  forest: { name: "🌲 Ліс", minLevel: 1, enemies: [
    { name: "Вовк", hp: 35, damage: [5, 10], xp: 12, gold: [6, 12], drops: ["Ікло вовка", "Шкура вовка", "Зілля лікування"] },
    { name: "Гоблін", hp: 45, damage: [6, 12], xp: 15, gold: [8, 15], drops: ["Іржавий кинджал", "Металобрухт", "Зілля лікування"] }
  ]},
  desert: { name: "🏜️ Пустеля", minLevel: 4, enemies: [
    { name: "Піщаний скелет", hp: 70, damage: [10, 17], xp: 25, gold: [14, 24], drops: ["Кістяний меч", "Темний уламок", "Зілля лікування"] },
    { name: "Пустельний розбійник", hp: 80, damage: [12, 20], xp: 30, gold: [16, 28], drops: ["Мисливський спис", "Шкіряна броня", "Металобрухт"] }
  ]},
  ruins: { name: "🏚️ Руїни міста", minLevel: 8, enemies: [
    { name: "Мародер", hp: 110, damage: [16, 26], xp: 45, gold: [24, 40], drops: ["Залізний меч", "Залізний щит", "Темний уламок"] },
    { name: "Заражений солдат", hp: 125, damage: [18, 30], xp: 55, gold: [30, 48], drops: ["Сталевий топір", "Броня руїн", "Зілля лікування"] }
  ]},
  mountains: { name: "⛰️ Гірський перевал", minLevel: 14, enemies: [
    { name: "Кам'яний троль", hp: 170, damage: [25, 38], xp: 80, gold: [45, 70], drops: ["Броня руїн", "Серце мутанта", "Сталевий топір"] },
    { name: "Крижаний вовк", hp: 150, damage: [23, 36], xp: 75, gold: [40, 65], drops: ["Шкура вовка", "Серце мутанта", "Зілля лікування"] }
  ]},
  deadzone: { name: "☠️ Мертва зона", minLevel: 22, enemies: [
    { name: "Мутант", hp: 240, damage: [35, 55], xp: 130, gold: [70, 110], drops: ["Серце мутанта", "Броня руїн", "Сталевий топір"] },
    { name: "Радіаційний привид", hp: 220, damage: [38, 60], xp: 150, gold: [80, 130], drops: ["Темний уламок", "Серце мутанта", "Залізний меч"] }
  ]}
};

let players = {};
let onlineSockets = {};

function loadPlayers() { if (fs.existsSync(SAVE_FILE)) { try { players = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8")); } catch { players = {}; } } }
function savePlayers() { fs.writeFileSync(SAVE_FILE, JSON.stringify(players, null, 2), "utf8"); }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function makeItem(name) { const base = ITEMS[name] || { type: "material", rarity: "common", price: 5 }; return { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name, type: base.type, rarity: base.rarity, price: base.price, damage: base.damage || 0, armor: base.armor || 0, heal: base.heal || 0, level: 0 }; }
function itemPower(item) { if (!item) return 0; if (item.type === "weapon") return item.damage + item.level * 2; if (item.type === "armor") return item.armor + item.level; return 0; }
function itemSellPrice(item) { return Math.max(1, Math.floor((item.price + item.level * 10) / 2)); }
function xpToNext(level) { return 50 + (level - 1) * 75; }
function newPlayer(name) { return { name, hp: 100, maxHp: 100, xp: 0, level: 1, gold: 50, location: "forest", inventory: [makeItem("Зілля лікування")], equipment: { weapon: makeItem("Іржавий кинджал"), armor: null }, enemy: null }; }
function normalizePlayer(player, name) { if (!player) return newPlayer(name); player.name ||= name; player.maxHp ||= 100; player.hp = Math.min(player.hp || player.maxHp, player.maxHp); player.xp ||= 0; player.level ||= 1; player.gold ||= 0; player.location = LOCATIONS[player.location] ? player.location : "forest"; player.inventory = Array.isArray(player.inventory) ? player.inventory : []; player.equipment ||= { weapon: null, armor: null }; player.equipment.weapon ||= null; player.equipment.armor ||= null; player.enemy ||= null; return player; }
function getStats(player) { const weapon = player.equipment.weapon; const armor = player.equipment.armor; return { damageMin: 8 + itemPower(weapon), damageMax: 14 + itemPower(weapon), armor: itemPower(armor) }; }
function addXp(player, amount) { player.xp += amount; const messages = []; while (player.xp >= xpToNext(player.level)) { player.xp -= xpToNext(player.level); player.level += 1; player.maxHp += 20; player.hp = player.maxHp; messages.push(`🎉 Новий рівень: ${player.level}! HP збільшено.`); } return messages; }
function publicPlayer(player) { return { name: player.name, hp: player.hp, maxHp: player.maxHp, xp: player.xp, xpNeed: xpToNext(player.level), level: player.level, gold: player.gold, location: player.location, locationName: LOCATIONS[player.location].name, equipment: player.equipment, inventory: player.inventory, stats: getStats(player), enemy: player.enemy }; }
function emitPlayer(socket, player) { socket.emit("player", publicPlayer(player)); socket.emit("locations", LOCATIONS); }
function getPlayerBySocket(socket) { const name = onlineSockets[socket.id]; if (!name) return null; return players[name] || null; }
function listOnlinePlayers() { const names = Object.values(onlineSockets); return [...new Set(names)].map(name => ({ name, location: players[name]?.location || "forest" })); }

loadPlayers();

io.on("connection", (socket) => {
  console.log("Player connected");
  socket.emit("locations", LOCATIONS);

  socket.on("join", (nameRaw) => {
    const name = String(nameRaw || "").trim().slice(0, 20);
    if (!name) return socket.emit("system", "Введи нік.");
    players[name] = normalizePlayer(players[name], name);
    onlineSockets[socket.id] = name;
    savePlayers(); emitPlayer(socket, players[name]); io.emit("online", listOnlinePlayers()); io.emit("chat", { from: "Система", text: `${name} приєднався до гри.` });
  });

  socket.on("changeLocation", (locationKey) => {
    const player = getPlayerBySocket(socket); if (!player) return;
    const location = LOCATIONS[locationKey]; if (!location) return;
    if (player.enemy) return socket.emit("system", "Спочатку закінчи бій.");
    if (player.level < location.minLevel) return socket.emit("system", `${location.name} доступна з ${location.minLevel} рівня.`);
    player.location = locationKey; savePlayers(); emitPlayer(socket, player); socket.emit("system", `Ти перемістився: ${location.name}`);
  });

  socket.on("startFight", () => {
    const player = getPlayerBySocket(socket); if (!player) return;
    if (player.enemy) { socket.emit("battle", [`Ти вже в бою з ${player.enemy.name}.`]); return emitPlayer(socket, player); }
    const enemies = LOCATIONS[player.location].enemies;
    player.enemy = clone(enemies[randomInt(0, enemies.length - 1)]); player.enemy.maxHp = player.enemy.hp;
    savePlayers(); socket.emit("battle", [`⚔️ Ти зустрів: ${player.enemy.name}!`]); emitPlayer(socket, player);
  });

  socket.on("attack", () => {
    const player = getPlayerBySocket(socket); if (!player) return;
    if (!player.enemy) return socket.emit("battle", ["Ти не в бою."]);
    const log = []; const stats = getStats(player); const enemy = player.enemy;
    if (Math.random() < 0.18) log.push("🌀 Ворог ухилився!"); else { let damage = randomInt(stats.damageMin, stats.damageMax); if (Math.random() < 0.18) { damage *= 2; log.push(`💥 КРИТ! Ти наніс ${damage} урону.`); } else log.push(`⚔️ Ти наніс ${damage} урону.`); enemy.hp -= damage; }
    if (enemy.hp <= 0) { const xp = enemy.xp; const gold = randomInt(enemy.gold[0], enemy.gold[1]); player.gold += gold; log.push(`🏆 Перемога над ${enemy.name}!`, `✨ +${xp} XP`, `💰 +${gold} золота`); log.push(...addXp(player, xp)); if (Math.random() < 0.65) { const lootName = enemy.drops[randomInt(0, enemy.drops.length - 1)]; const loot = makeItem(lootName); player.inventory.push(loot); log.push(`🎁 Лут: ${loot.name}`); } else log.push("📦 Лут не випав."); player.enemy = null; savePlayers(); socket.emit("battle", log); return emitPlayer(socket, player); }
    if (Math.random() < 0.15) log.push("🛡️ Ти ухилився від атаки."); else { const raw = randomInt(enemy.damage[0], enemy.damage[1]); const taken = Math.max(0, raw - stats.armor); player.hp -= taken; log.push(`💥 ${enemy.name} наніс ${taken} урону.`); }
    if (player.hp <= 0) { player.hp = player.maxHp; player.enemy = null; log.push("💀 Ти програв. Відродження з повним HP."); } else { log.push(`❤️ HP: ${player.hp}/${player.maxHp}`, `👹 ${enemy.name}: ${enemy.hp}/${enemy.maxHp}`); }
    savePlayers(); socket.emit("battle", log); emitPlayer(socket, player);
  });

  socket.on("equip", (itemId) => { const player = getPlayerBySocket(socket); if (!player) return; const index = player.inventory.findIndex(i => i.id === itemId); if (index === -1) return; const item = player.inventory[index]; if (!["weapon", "armor"].includes(item.type)) return socket.emit("system", "Цей предмет не можна одягнути."); player.inventory.splice(index, 1); const old = player.equipment[item.type]; if (old) player.inventory.push(old); player.equipment[item.type] = item; savePlayers(); socket.emit("system", `Одягнуто: ${item.name}`); emitPlayer(socket, player); });
  socket.on("useItem", (itemId) => { const player = getPlayerBySocket(socket); if (!player) return; const index = player.inventory.findIndex(i => i.id === itemId); if (index === -1) return; const item = player.inventory[index]; if (item.type !== "consumable") return socket.emit("system", "Цей предмет не використовується."); if (player.hp >= player.maxHp) return socket.emit("system", "HP вже повне."); player.inventory.splice(index, 1); player.hp = Math.min(player.maxHp, player.hp + item.heal); savePlayers(); socket.emit("system", `Використано: ${item.name}. +${item.heal} HP`); emitPlayer(socket, player); });
  socket.on("sell", (itemId) => { const player = getPlayerBySocket(socket); if (!player) return; const index = player.inventory.findIndex(i => i.id === itemId); if (index === -1) return; const item = player.inventory[index]; const price = itemSellPrice(item); player.inventory.splice(index, 1); player.gold += price; savePlayers(); socket.emit("system", `Продано: ${item.name}. +${price} золота`); emitPlayer(socket, player); });
  socket.on("upgrade", (slot) => { const player = getPlayerBySocket(socket); if (!player) return; if (!["weapon", "armor"].includes(slot)) return; const item = player.equipment[slot]; if (!item) return socket.emit("system", "Немає предмета для покращення."); const cost = 25 + item.level * 35; if (player.gold < cost) return socket.emit("system", `Недостатньо золота. Треба ${cost}.`); player.gold -= cost; item.level += 1; savePlayers(); socket.emit("system", `Покращено: ${item.name} +${item.level}`); emitPlayer(socket, player); });
  socket.on("buy", (name) => { const player = getPlayerBySocket(socket); if (!player) return; const item = makeItem(name); if (!ITEMS[name]) return; if (player.gold < item.price) return socket.emit("system", "Недостатньо золота."); player.gold -= item.price; player.inventory.push(item); savePlayers(); socket.emit("system", `Куплено: ${item.name}`); emitPlayer(socket, player); });
  socket.on("chat", (textRaw) => { const player = getPlayerBySocket(socket); if (!player) return; const text = String(textRaw || "").trim().slice(0, 300); if (!text) return; io.emit("chat", { from: player.name, location: LOCATIONS[player.location].name, text }); });
  socket.on("disconnect", () => { const name = onlineSockets[socket.id]; delete onlineSockets[socket.id]; if (name) { io.emit("online", listOnlinePlayers()); io.emit("chat", { from: "Система", text: `${name} вийшов з гри.` }); } });
});

server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
