const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const db = require("../database/database");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Inténtalo de nuevo más tarde." }
});

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ error: "El nombre debe tener entre 2 y 60 caracteres." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Introduce un correo electrónico válido." });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ error: "La contraseña debe tener entre 8 y 72 caracteres." });
    }

    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM users WHERE email = ?", [email], (error, row) => {
        if (error) reject(error);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userId = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, passwordHash],
        function (error) {
          if (error) reject(error);
          else resolve(this.lastID);
        }
      );
    });

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = { id: userId, name, email };
      res.status(201).json({ user: req.session.user });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Completa el correo y la contraseña." });
    }

    const user = await new Promise((resolve, reject) => {
      db.get("SELECT id, name, email, password FROM users WHERE email = ?", [email], (error, row) => {
        if (error) reject(error);
        else resolve(row);
      });
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    req.session.regenerate((error) => {
      if (error) return next(error);

      req.session.user = { id: user.id, name: user.name, email: user.email };
      res.json({ user: req.session.user });
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada correctamente." });
  });
});

router.get("/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;
