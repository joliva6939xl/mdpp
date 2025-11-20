// Archivo: mdpp/api/src/controllers/authAdmin.controller.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro_admin';

// 1. REGISTRAR ADMIN
const registrarAdmin = async (req, res) => {
    try {
        const { nombre_usuario, password, rol } = req.body;
        if (!nombre_usuario || !password || !rol) return res.status(400).json({ ok: false, message: 'Faltan datos.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO administradores (nombre_usuario, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, nombre_usuario, rol',
            [nombre_usuario, password_hash, rol]
        );
        res.status(201).json({ ok: true, message: 'Admin creado.', admin: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: 'Error servidor.' });
    }
};

// 2. LOGIN ADMIN
const loginAdmin = async (req, res) => {
    try {
        const { nombre_usuario, password } = req.body;
        const result = await pool.query('SELECT * FROM administradores WHERE nombre_usuario = $1', [nombre_usuario]);
        
        if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

        const admin = result.rows[0];
        const esValido = await bcrypt.compare(password, admin.password_hash);
        if (!esValido) return res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' });

        const token = jwt.sign({ id: admin.id, rol: admin.rol, tipo: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

        res.json({
            ok: true,
            message: 'Bienvenido Admin',
            token,
            usuario: { id: admin.id, nombre: admin.nombre_usuario, rol: admin.rol }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: 'Error al iniciar sesión.' });
    }
};

// 3. LISTAR USUARIOS DE LA APP (ESTRATEGIA 'SELECT *')
const listarUsuariosApp = async (req, res) => {
    console.log("--> PETICIÓN: Listar Usuarios App");
    try {
        // ESTRATEGIA MAESTRA: Usamos '*' para traer TODO lo que exista.
        // Esto evita el error "no existe la columna X".
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
        
        console.log(`--> ÉXITO: ${result.rows.length} usuarios encontrados.`);
        
        // CÓDIGO ESPÍA: Imprime en la terminal qué columnas existen realmente
        if (result.rows.length > 0) {
            console.log("🔎 COLUMNAS REALES EN TU BASE DE DATOS:", Object.keys(result.rows[0]));
            console.log("👤 DATOS DEL PRIMER USUARIO:", result.rows[0]);
        }

        res.json({ ok: true, usuarios: result.rows });
    } catch (error) {
        console.error("❌ ERROR BD:", error.message);
        res.status(500).json({ ok: false, message: 'Error backend: ' + error.message });
    }
};

// 4. LISTAR USUARIOS CREADOS POR ADMIN
const listarUsuariosAdmin = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre_usuario, rol, creado_en FROM gerencia_usuarios ORDER BY id DESC');
        res.json({ ok: true, usuarios: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: 'Error al obtener usuarios de Admin.' });
    }
};

module.exports = {
    registrarAdmin,
    loginAdmin,
    listarUsuariosApp,
    listarUsuariosAdmin
};