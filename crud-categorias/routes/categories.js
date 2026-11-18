const express = require("express");
const db = require("../database/database");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", (req, res, next) => {
  db.all(
    "SELECT id, name, description, created_at FROM categories WHERE user_id = ? ORDER BY id DESC",
    [req.session.user.id],
    (error, categories) => {
      if (error) return next(error);
      res.json({ categories });
    }
  );
});

router.post("/", (req, res, next) => {
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: "El nombre debe tener entre 2 y 80 caracteres." });
  }

  if (description.length > 250) {
    return res.status(400).json({ error: "La descripción no puede superar 250 caracteres." });
  }

  db.run(
    "INSERT INTO categories (user_id, name, description) VALUES (?, ?, ?)",
    [req.session.user.id, name, description],
    function (error) {
      if (error && error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ error: "Ya tienes una categoría con ese nombre." });
      }
      if (error) return next(error);

      res.status(201).json({
        category: { id: this.lastID, name, description }
      });
    }
  );
});

router.put("/:id", (req, res, next) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();
  const description = String(req.body.description || "").trim();

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Identificador no válido." });
  }

  if (name.length < 2 || name.length > 80 || description.length > 250) {
    return res.status(400).json({ error: "Revisa el nombre y la descripción." });
  }

  db.run(
    "UPDATE categories SET name = ?, description = ? WHERE id = ? AND user_id = ?",
    [name, description, id, req.session.user.id],
    function (error) {
      if (error && error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({ error: "Ya tienes una categoría con ese nombre." });
      }
      if (error) return next(error);
      if (this.changes === 0) {
        return res.status(404).json({ error: "Categoría no encontrada." });
      }

      res.json({ message: "Categoría actualizada correctamente." });
    }
  );
});

router.delete("/:id", (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Identificador no válido." });
  }

  db.run(
    "DELETE FROM categories WHERE id = ? AND user_id = ?",
    [id, req.session.user.id],
    function (error) {
      if (error) return next(error);
      if (this.changes === 0) {
        return res.status(404).json({ error: "Categoría no encontrada." });
      }

      res.json({ message: "Categoría eliminada correctamente." });
    }
  );
});

module.exports = router;
