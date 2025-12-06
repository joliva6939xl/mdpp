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

// 3. LISTAR USUARIOS APP (Ahora traemos estado y motivo)
const listarUsuariosApp = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
        res.json({ ok: true, usuarios: result.rows });
    } catch (error) {
        console.error("ERROR BD:", error.message);
        res.status(500).json({ ok: false, message: 'Error backend: ' + error.message });
    }
};

// 4. LISTAR USUARIOS ADMIN
const listarUsuariosAdmin = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre_usuario, rol, creado_en FROM gerencia_usuarios ORDER BY id DESC');
        res.json({ ok: true, usuarios: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, message: 'Error al obtener usuarios de Admin.' });
    }
};

// 5. BORRAR USUARIOS
const deleteUsuarios = async (req, res) => {
    try {
        const { users } = req.body; 
        if (!users || !Array.isArray(users) || users.length === 0) return res.status(400).json({ ok: false, message: 'No se seleccionaron usuarios.' });

        const idsApp = users.filter(u => u.tipo === 'APP').map(u => u.id);
        const idsAdmin = users.filter(u => u.tipo === 'ADMIN').map(u => u.id);

        let totalDeleted = 0;
        if (idsApp.length > 0) {
            const resultApp = await pool.query('DELETE FROM usuarios WHERE id = ANY($1::int[])', [idsApp]);
            totalDeleted += resultApp.rowCount;
        }
        if (idsAdmin.length > 0) {
            const resultAdmin = await pool.query('DELETE FROM gerencia_usuarios WHERE id = ANY($1::int[])', [idsAdmin]);
            totalDeleted += resultAdmin.rowCount;
        }
        res.json({ ok: true, deletedCount: totalDeleted, message: 'Usuarios eliminados correctamente.' });
    } catch (error) {
        console.error('Error deleteUsuarios:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
};

const getUsuarioDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Primero buscamos en la tabla de usuarios APP e incluimos foto_ruta
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

        // Si no existe, buscamos en gerencia_usuarios (ADMIN)
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
            return res
                .status(404)
                .json({ ok: false, message: 'Usuario no encontrado.' });
        }

        return res.json({ ok: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error getUsuarioDetails:', error);
        return res
            .status(500)
            .json({ ok: false, message: 'Error al obtener detalles.' });
    }
};

// 7. PARTES VIRTUALES
const getUsuarioPartes = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY id DESC', [id]);
        res.json({ ok: true, partes: result.rows });
    } catch (error) {
        console.error('Error getUsuarioPartes:', error.message);
        res.status(500).json({ ok: false, message: 'Error SQL: ' + error.message });
    }
};

// 8. 🆕 BLOQUEAR / DESBLOQUEAR USUARIO
const toggleBloqueoUsuario = async (req, res) => {
    try {
        const { users, accion, motivo } = req.body; 
        // users: [{id: 1, tipo: 'APP'}], accion: 'BLOQUEAR' | 'DESBLOQUEAR', motivo: string

        if (!users || users.length === 0) return res.status(400).json({ ok: false, message: 'Sin usuarios seleccionados.' });

        const nuevoEstado = accion === 'BLOQUEAR' ? 'BLOQUEADO' : 'ACTIVO';
        const nuevoMotivo = accion === 'BLOQUEAR' ? motivo : null; // Si desbloquea, borra motivo

        const idsApp = users.filter(u => u.tipo === 'APP').map(u => u.id);
        
        if (idsApp.length > 0) {
            await pool.query(
                'UPDATE usuarios SET estado = $1, bloqueo_motivo = $2 WHERE id = ANY($3::int[])',
                [nuevoEstado, nuevoMotivo, idsApp]
            );
        }
        
        res.json({ ok: true, message: `Usuarios ${nuevoEstado === 'ACTIVO' ? 'desbloqueados' : 'bloqueados'} correctamente.` });

    } catch (error) {
        console.error('Error toggleBloqueo:', error);
        res.status(500).json({ ok: false, message: error.message });
    }
}

module.exports = {
    registrarAdmin,
    loginAdmin,
    listarUsuariosApp,
    listarUsuariosAdmin,
    deleteUsuarios,
    getUsuarioDetails,
    getUsuarioPartes,
    toggleBloqueoUsuario // <--- ¡Exportada!
};