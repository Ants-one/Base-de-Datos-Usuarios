require("dotenv").config();

const path = require("path");
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const helmet = require("helmet");

const db = require("./database/database");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("Debes configurar SESSION_SECRET en el entorno de producción.");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));

app.use(session({
  store: new SQLiteStore({
    db: "sessions.db",
    dir: path.join(__dirname, "database")
  }),
  name: "connect.sid",
  secret: process.env.SESSION_SECRET || "clave-local-solo-para-desarrollo",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Ha ocurrido un error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`Aplicación disponible en http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  db.close(() => process.exit(0));
});
