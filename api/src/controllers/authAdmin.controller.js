// Archivo: mdpp/api/src/controllers/authAdmin.controller.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

/** Detecta si parece bcrypt */
const looksLikeBcrypt = (v) =>
  typeof v === "string" && (v.startsWith("$2a$") || v.startsWith("$2b$") || v.startsWith("$2y$"));

/** Valida password: si está hasheado => bcrypt.compare, si no => comparación exacta */
const verifyPassword = async (stored, input) => {
  const db = String(stored ?? "").trim();
  const inPass = String(input ?? "").trim();
  if (!db || !inPass) return false;

  if (looksLikeBcrypt(db)) {
    return bcrypt.compare(inPass, db);
  }
  return db === inPass;
};

// 1) REGISTRAR ADMIN (tabla administradores) (no lo tocamos aquí)
const registrarAdmin = async (req, res) => {
  try {
    const { nombre_usuario, password, rol } = req.body;
    if (!nombre_usuario || !password || !rol) {
      return res.status(400).json({ ok: false, message: "Faltan datos." });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(String(password), salt);

    const result = await pool.query(
      `INSERT INTO administradores (nombre_usuario, password_hash, rol)
       VALUES ($1, $2, $3)
       RETURNING id, nombre_usuario, rol`,
      [nombre_usuario, password_hash, rol]
    );

    return res.status(201).json({ ok: true, message: "Admin creado.", admin: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: "Error servidor." });
  }
};

// 2) LOGIN ADMIN (tabla administradores) (sin token)
const loginAdmin = async (req, res) => {
  try {
    const userInput = req.body.nombre_usuario || req.body.usuario;
    const passInput = req.body.password || req.body.contrasena || req.body["contraseña"];

    if (!userInput || !passInput) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales." });
    }

    const result = await pool.query(
      "SELECT * FROM administradores WHERE LOWER(nombre_usuario) = LOWER($1) LIMIT 1",
      [String(userInput)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    const admin = result.rows[0];
    const okPass = await verifyPassword(admin.password_hash, passInput);
    if (!okPass) return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });

    return res.json({
      ok: true,
      message: "Bienvenido",
      tipo: "ADMINISTRADORES",
      usuario: { id: admin.id, nombre: admin.nombre_usuario, rol: admin.rol },
    });
  } catch (error) {
    console.error("Error loginAdmin:", error);
    return res.status(500).json({ ok: false, message: "Error al iniciar sesión." });
  }
};

// ✅ 3) LOGIN UNIVERSAL (GERENCIA + APP + ADMINISTRADORES)
// Este es el que debes usar desde la web: POST /api/admin/login
const loginUniversal = async (req, res) => {
  try {
    const userInput =
      req.body.usuario ||
      req.body.nombre_usuario ||
      req.body.username ||
      req.body.user ||
      "";

    const passInput =
      req.body.contrasena ||
      req.body.password ||
      req.body["contraseña"] ||
      "";

    if (!userInput || !passInput) {
      return res.status(400).json({ ok: false, message: "Faltan credenciales." });
    }

    // 1) GERENCIA (gerencia_usuarios)
    const rGer = await pool.query(
      `SELECT
        id,
        nombre_usuario,
        password_hash,
        rol,
        creado_en,
        estado,
        bloqueo_motivo,
        puede_crear_parte,
        puede_borrar_parte,
        puede_cerrar_parte,
        puede_ver_estadisticas_descargar
      FROM gerencia_usuarios
      WHERE LOWER(nombre_usuario) = LOWER($1)
      LIMIT 1`,
      [String(userInput)]
    );

    if (rGer.rows.length > 0) {
      const u = rGer.rows[0];

      if (String(u.estado || "").toUpperCase() === "BLOQUEADO") {
        return res.status(403).json({
          ok: false,
          message: `Usuario BLOQUEADO. Motivo: ${u.bloqueo_motivo || "No especificado"}`,
        });
      }

      const okPass = await verifyPassword(u.password_hash, passInput);
      if (!okPass) return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });

      return res.json({
        ok: true,
        message: "Bienvenido",
        tipo: "GERENCIA_USUARIOS",
        usuario: {
          id: u.id,
          nombre: u.nombre_usuario,
          rol: u.rol,
          estado: u.estado,
          puede_crear_parte: u.puede_crear_parte,
          puede_borrar_parte: u.puede_borrar_parte,
          puede_cerrar_parte: u.puede_cerrar_parte,
          puede_ver_estadisticas_descargar: u.puede_ver_estadisticas_descargar,
        },
      });
    }

    // 2) APP (usuarios)
    const rApp = await pool.query(
      `SELECT
        id,
        nombre,
        usuario,
        contrasena,
        cargo,
        dni,
        celular,
        foto_ruta,
        estado,
        bloqueo_motivo
      FROM usuarios
      WHERE LOWER(usuario) = LOWER($1)
      LIMIT 1`,
      [String(userInput)]
    );

    if (rApp.rows.length > 0) {
      const u = rApp.rows[0];

      if (String(u.estado || "").toUpperCase() === "BLOQUEADO") {
        return res.status(403).json({
          ok: false,
          message: `Usuario BLOQUEADO. Motivo: ${u.bloqueo_motivo || "No especificado"}`,
        });
      }

      const okPass = await verifyPassword(u.contrasena, passInput);
      if (!okPass) return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });

      return res.json({
        ok: true,
        message: "Bienvenido",
        tipo: "USUARIOS_APP",
        usuario: {
          id: u.id,
          nombre: u.nombre,
          usuario: u.usuario,
          cargo: u.cargo,
          dni: u.dni,
          celular: u.celular,
          foto_ruta: u.foto_ruta,
          estado: u.estado,
        },
      });
    }

    // 3) ADMINISTRADORES (tabla administradores)
    const rAdm = await pool.query(
      `SELECT id, nombre_usuario, password_hash, rol
       FROM administradores
       WHERE LOWER(nombre_usuario) = LOWER($1)
       LIMIT 1`,
      [String(userInput)]
    );

    if (rAdm.rows.length > 0) {
      const u = rAdm.rows[0];
      const okPass = await verifyPassword(u.password_hash, passInput);
      if (!okPass) return res.status(401).json({ ok: false, message: "Contraseña incorrecta." });

      return res.json({
        ok: true,
        message: "Bienvenido",
        tipo: "ADMINISTRADORES",
        usuario: { id: u.id, nombre: u.nombre_usuario, rol: u.rol },
      });
    }

    return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
  } catch (error) {
    console.error("Error loginUniversal:", error);
    return res.status(500).json({ ok: false, message: "Error al iniciar sesión." });
  }
};

// (resto de funciones tal cual tengas en tu proyecto)
// LISTAR USUARIOS APP
const listarUsuariosApp = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id DESC");
    return res.json({ ok: true, usuarios: result.rows });
  } catch (error) {
    console.error("ERROR BD:", error.message);
    return res.status(500).json({ ok: false, message: "Error backend: " + error.message });
  }
};

// LISTAR USUARIOS ADMIN (GERENCIA)
const listarUsuariosAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        nombre_usuario,
        rol,
        creado_en,
        estado,
        bloqueo_motivo,
        puede_crear_parte,
        puede_borrar_parte,
        puede_cerrar_parte,
        puede_ver_estadisticas_descargar
      FROM gerencia_usuarios
      ORDER BY id DESC`
    );
    return res.json({ ok: true, usuarios: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: "Error al obtener usuarios de Admin." });
  }
};

// BORRAR USUARIOS
const deleteUsuarios = async (req, res) => {
  try {
    const { users } = req.body;
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ ok: false, message: "No se seleccionaron usuarios." });
    }

    const idsApp = users.filter((u) => u.tipo === "APP").map((u) => u.id);
    const idsAdmin = users.filter((u) => u.tipo === "ADMIN").map((u) => u.id);

    let totalDeleted = 0;

    if (idsApp.length > 0) {
      const r1 = await pool.query("DELETE FROM usuarios WHERE id = ANY($1::int[])", [idsApp]);
      totalDeleted += r1.rowCount;
    }

    if (idsAdmin.length > 0) {
      const r2 = await pool.query("DELETE FROM gerencia_usuarios WHERE id = ANY($1::int[])", [idsAdmin]);
      totalDeleted += r2.rowCount;
    }

    return res.json({ ok: true, deletedCount: totalDeleted, message: "Usuarios eliminados correctamente." });
  } catch (error) {
    console.error("Error deleteUsuarios:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

const getUsuarioDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let result = await pool.query(
      `SELECT
        id,
        nombre,
        dni,
        celular,
        cargo,
        usuario,
        creado_en,
        estado,
        bloqueo_motivo,
        foto_ruta
      FROM usuarios
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT
          id,
          nombre_usuario AS nombre,
          rol,
          creado_en,
          estado,
          bloqueo_motivo,
          NULL::text AS foto_ruta
        FROM gerencia_usuarios
        WHERE id = $1`,
        [id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
    }

    return res.json({ ok: true, user: result.rows[0] });
  } catch (error) {
    console.error("Error getUsuarioDetails:", error);
    return res.status(500).json({ ok: false, message: "Error al obtener detalles." });
  }
};

const getUsuarioPartes = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY id DESC",
      [id]
    );
    return res.json({ ok: true, partes: result.rows });
  } catch (error) {
    console.error("Error getUsuarioPartes:", error.message);
    return res.status(500).json({ ok: false, message: "Error SQL: " + error.message });
  }
};

const toggleBloqueoUsuario = async (req, res) => {
  try {
    const { users, accion, motivo } = req.body;

    if (!users || users.length === 0) {
      return res.status(400).json({ ok: false, message: "Sin usuarios seleccionados." });
    }

    const nuevoEstado = accion === "BLOQUEAR" ? "BLOQUEADO" : "ACTIVO";
    const nuevoMotivo = accion === "BLOQUEAR" ? motivo : null;

    const idsApp = users.filter((u) => u.tipo === "APP").map((u) => u.id);

    if (idsApp.length > 0) {
      await pool.query(
        "UPDATE usuarios SET estado = $1, bloqueo_motivo = $2 WHERE id = ANY($3::int[])",
        [nuevoEstado, nuevoMotivo, idsApp]
      );
    }

    return res.json({
      ok: true,
      message: `Usuarios ${nuevoEstado === "ACTIVO" ? "desbloqueados" : "bloqueados"} correctamente.`,
    });
  } catch (error) {
    console.error("Error toggleBloqueo:", error);
    return res.status(500).json({ ok: false, message: error.message });
  }
};

module.exports = {
  registrarAdmin,
  loginAdmin,
  loginUniversal, // ✅ NUEVO
  listarUsuariosApp,
  listarUsuariosAdmin,
  deleteUsuarios,
  getUsuarioDetails,
  getUsuarioPartes,
  toggleBloqueoUsuario,
};
