const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, usuario: usuario.usuario, rol: usuario.cargo },
    process.env.JWT_SECRET || "secreto_super_seguro",
    { expiresIn: "30d" }
  );
};

// ==========================================
// 1. REGISTRAR USUARIO
// ==========================================
const registrarUsuario = async (req, res) => {
  try {

console.log("==========================================");
    console.log("📥 SOLICITUD DE REGISTRO RECIBIDA");
    console.log("📦 TIPO DE CONTENIDO:", req.headers['content-type']); // ¿Dice multipart/form-data?
    console.log("📝 DATOS (BODY):", req.body);
    console.log("📁 ARCHIVOS (FILES):", req.files); // <--- ESTO ES LO CRÍTICO
    console.log("==========================================");

    const { nombre, dni, celular, cargo, direccion_actual, referencia, ubicacion_gps, motorizado, conductor } = req.body;

    // Flexibilidad de nombres
    const nombreFinal = nombre || req.body.nombre_completo;
    
    if (!nombreFinal || !dni || !celular) {
      return res.status(400).json({ ok: false, message: "Faltan datos obligatorios" });
    }

    const partesNombre = nombreFinal.trim().split(" ");
    const primerNombre = partesNombre[0].toLowerCase();
    const apellido = partesNombre.length > 1 ? partesNombre[1].toLowerCase() : "";
    let usuarioGenerado = (primerNombre.charAt(0) + apellido).replace(/[^a-z0-9]/g, "");
    
    if (usuarioGenerado.length < 2) usuarioGenerado = "u" + dni;
    const contrasena = dni.trim();

    // Lógica de Fotos
    let rutaFotoPerfil = null;
    let rutaFotoLicencia = null;

    if (req.files) {
        if (req.files['foto'] && req.files['foto'].length > 0) {
            rutaFotoPerfil = `uploads/usuarios/${req.files['foto'][0].filename}`;
        }
        if (req.files['foto_licencia'] && req.files['foto_licencia'].length > 0) {
            rutaFotoLicencia = `uploads/usuarios/${req.files['foto_licencia'][0].filename}`;
        }
    }
    // Fallback texto
    if (!rutaFotoPerfil && req.body.foto_ruta) rutaFotoPerfil = req.body.foto_ruta;

    const esMotorizado = motorizado === 'true' || motorizado === true;
    const esConductor = conductor === 'true' || conductor === true;

    const result = await pool.query(
      `INSERT INTO usuarios 
      (nombre, dni, celular, cargo, usuario, contrasena, 
       direccion_actual, referencia, ubicacion_gps, 
       foto_ruta, foto_licencia, 
       motorizado, conductor, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ACTIVO')
      RETURNING *`,
      [
        nombreFinal.toUpperCase(), dni, celular, cargo, usuarioGenerado, contrasena,
        direccion_actual?.toUpperCase(), referencia?.toUpperCase(), ubicacion_gps,
        rutaFotoPerfil, rutaFotoLicencia,
        esMotorizado, esConductor
      ]
    );

    const nuevoUsuario = result.rows[0];
    const token = generarToken(nuevoUsuario);

    return res.status(201).json({
      ok: true,
      message: "Usuario creado exitosamente",
      data: { token, usuario: nuevoUsuario.usuario },
    });

  } catch (error) {
    console.error("Error registro:", error);
    if (error.code === "23505") return res.status(400).json({ ok: false, message: "Usuario/DNI ya existe." });
    return res.status(500).json({ ok: false, message: "Error al registrar" });
  }
};

// ==========================================
// 2. LOGIN USUARIO (CORREGIDO Ñ vs N)
// ==========================================
const loginUsuario = async (req, res) => {
  try {
    // 🔥 AQUÍ ESTÁ LA SOLUCIÓN:
    // Buscamos 'contrasena' (backend estándar) O 'contraseña' (lo que manda tu frontend)
    const usuarioRaw = req.body.usuario;
    const contrasenaRaw = req.body.contrasena || req.body.contraseña; // <--- EL FIX DE LA Ñ

    if (!usuarioRaw || !contrasenaRaw) {
      console.log("❌ Login fallido: Faltan credenciales.");
      return res.status(400).json({ ok: false, message: "Faltan credenciales" });
    }

    const usuario = String(usuarioRaw).trim();
    const contrasena = String(contrasenaRaw).trim();

    // 1. Buscamos usuario
    const result = await pool.query("SELECT * FROM usuarios WHERE usuario = $1", [usuario]);

    if (result.rows.length === 0) {
      return res.status(400).json({ ok: false, message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // 2. Comparamos contraseña (Texto plano, limpiando espacios)
    const passInput = contrasena;
    const passDB = String(user.contrasena).trim();

    const esValida = passInput === passDB;

    if (!esValida) {
      return res.status(400).json({ ok: false, message: "Contraseña incorrecta" });
    }

    if (user.estado === 'BLOQUEADO') {
        return res.status(403).json({ ok: false, message: "Usuario bloqueado." });
    }

    // 3. Calculamos categoría
    let categoria = "AGENTE"; 
    if (user.motorizado) categoria = "MOTORIZADO";
    else if (user.conductor) categoria = "CONDUCTOR";
    else if ((user.cargo || "").toLowerCase().includes("k9")) categoria = "CANINO";

    const userResponse = { ...user, categoria_calculada: categoria };
    const token = generarToken(user);

    res.json({
      ok: true,
      usuario: userResponse,
      token,
    });

  } catch (error) {
    console.error("Error Login:", error);
    res.status(500).json({ ok: false, message: "Error interno" });
  }
};

// ==========================================
// 3. EXTRAS
// ==========================================
const actualizarFotoPerfil = async (req, res) => {
    const { id } = req.params;
    try {
        if (!req.files || !req.files['foto']) return res.status(400).json({ message: "No imagen" });
        const rutaFoto = `uploads/usuarios/${req.files['foto'][0].filename}`;
        const result = await pool.query("UPDATE usuarios SET foto_ruta = $1 WHERE id = $2 RETURNING *", [rutaFoto, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Usuario no encontrado" });
        res.json({ ok: true, usuario: result.rows[0] });
    } catch (error) { res.status(500).json({ message: "Error update foto" }); }
};

const listarUsuariosApp = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nombre, cargo, foto_ruta, estado FROM usuarios ORDER BY nombre ASC");
        res.json({ ok: true, data: result.rows });
    } catch (error) { res.status(500).json({ message: "Error listar" }); }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  actualizarFotoPerfil,
  listarUsuariosApp
};