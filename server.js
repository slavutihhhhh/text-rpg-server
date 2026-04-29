const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, "users.json");
const sessions = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
  }

  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function createToken(username) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, username);
  return token;
}

function getUserFromToken(req) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  return sessions.get(token);
}

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Введи логін і пароль" });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: "Логін має бути мінімум 3 символи" });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: "Пароль має бути мінімум 4 символи" });
  }

  const db = readDb();

  if (db.users[username]) {
    return res.status(409).json({ error: "Такий логін уже існує" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  db.users[username] = {
    username,
    passwordHash,
    save: null,
    createdAt: new Date().toISOString()
  };

  writeDb(db);

  const token = createToken(username);

  res.json({
    ok: true,
    token,
    username
  });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const db = readDb();
  const user = db.users[username];

  if (!user) {
    return res.status(401).json({ error: "Невірний логін або пароль" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return res.status(401).json({ error: "Невірний логін або пароль" });
  }

  const token = createToken(username);

  res.json({
    ok: true,
    token,
    username,
    save: user.save
  });
});

app.get("/api/save", (req, res) => {
  const username = getUserFromToken(req);

  if (!username) {
    return res.status(401).json({ error: "Не авторизовано" });
  }

  const db = readDb();
  const user = db.users[username];

  res.json({
    ok: true,
    save: user.save
  });
});

app.post("/api/save", (req, res) => {
  const username = getUserFromToken(req);

  if (!username) {
    return res.status(401).json({ error: "Не авторизовано" });
  }

  const db = readDb();

  db.users[username].save = req.body.save;
  db.users[username].updatedAt = new Date().toISOString();

  writeDb(db);

  res.json({ ok: true });
});

app.post("/api/logout", (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  sessions.delete(token);

  res.json({ ok: true });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CultGame server running on port ${PORT}`);
});
