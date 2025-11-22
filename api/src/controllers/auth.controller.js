// Archivo: mdpp/api/src/controllers/auth.controller.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// 1. REGISTRO (App Móvil)
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, dni, celular, cargo, usuario, contrasena, password, foto_ruta } = req.body;
        
        // ⚠️ Corregimos: Soportamos contrasena, password, O la variante con Ñ
        const passInput = contrasena || password || req.body['contraseña'];

        if (!nombre || !dni || !usuario || !passInput) {
            return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passInput, salt);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, dni, celular, cargo, usuario, contrasena, foto_ruta, estado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO') RETURNING id`,
            [nombre, dni, celular, cargo, usuario, hash, foto_ruta]
        );

        res.status(201).json({
            ok: true,
            message: 'Usuario registrado correctamente.',
            userId: result.rows[0].id
        });

    } catch (error) {
        console.error("ERROR registrarUsuario:", error);
        if (error.code === '23505') { 
            return res.status(400).json({ ok: false, message: 'El DNI o Usuario ya existe.' });
        }
        res.status(500).json({ ok: false, message: 'Error en el servidor.' });
    }
};

// 2. LOGIN (App Móvil y Web General)
const loginUsuario = async (req, res) => {
    try {
        // 💡 Log de Depuración
        console.log("LOGIN INTENTO. Body recibido:", req.body); 
        
        // ⚠️ CORRECCIÓN CLAVE: Accedemos directamente a req.body['contraseña'] para capturar la Ñ
        const { usuario, contrasena, password } = req.body;

        // PRIORIDAD: 1. Contraseña con Ñ; 2. Contrasena sin Ñ; 3. Password
        const passwordLogin = req.body['contraseña'] || contrasena || password;

        if (!usuario || String(usuario).trim() === '' || !passwordLogin || String(passwordLogin).trim() === '') {
            return res.status(400).json({ ok: false, message: 'Usuario y contraseña son obligatorios.' });
        }

        const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);

        if (result.rows.length === 0) {
            return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];

        // LÓGICA DE BLOQUEO
        if (user.estado === 'BLOQUEADO') {
            return res.status(403).json({ 
                ok: false, 
                message: `⛔ USUARIO BLOQUEADO. Motivo: ${user.bloqueo_motivo || 'Contacte al administrador.'}` 
            });
        }

        // 🔐 COMPARACIÓN SEGURA
        const esValido = await bcrypt.compare(passwordLogin, user.contrasena);

        if (!esValido) {
            return res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' });
        }

        // Generar Token
        const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            ok: true,
            message: 'Login exitoso',
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                cargo: user.cargo,
                foto: user.foto_ruta,
                estado: user.estado
            }
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ ok: false, message: 'Error interno al iniciar sesión.' });
    }
};

module.exports = {
    registrarUsuario,
    loginUsuario
};