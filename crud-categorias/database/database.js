const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const databaseDirectory = __dirname;
fs.mkdirSync(databaseDirectory, { recursive: true });

const databasePath = path.join(databaseDirectory, "app.db");
const db = new sqlite3.Database(databasePath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, name)
    )
  `);
});

module.exports = db;
