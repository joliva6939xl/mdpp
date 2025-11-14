// Archivo: src/config/db.js
const { Pool } = require("pg");

// ⚠️ CONEXIÓN DIRECTA, SIN .env, SOLO PARA DESARROLLO EN TU PC
// Host: localhost
// Puerto: 5432
// Usuario: postgres
// Password: "1"
// Base de datos: "mdpp"

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "1",   // ← AQUÍ ESTÁ FIJO COMO STRING
  database: "mdpp",
});

pool.on("error", (err) => {
  console.error("Error en el pool de PostgreSQL:", err);
});

// Prueba de conexión al iniciar
(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Conexión a PostgreSQL OK:", res.rows[0].now);
  } catch (err) {
    console.error("Error probando conexión a PostgreSQL:", err.message);
  }
})();

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = {
  pool,
  query,
};
