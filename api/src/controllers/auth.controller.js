const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Helper para generar usuario (Mantenido de tu original)
const generarNombreUsuario = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const partes = nombreCompleto.trim().split(/\s+/);
    const primerNombre = partes[0] || '';
    const primerApellido = partes[1] || '';
    return (primerNombre.charAt(0) + primerApellido).toLowerCase();
};

const registrarUsuario = async (req, res) => {
    try {
        console.log("📥 REGISTRO APP - Datos:", req.body, "FILE:", req.file);

        // ✅ Aceptamos tanto `nombre` (móvil) como `nombre_completo` (web)
        const nombreBody = req.body.nombre || req.body.nombre_completo;
        const { dni, celular, cargo } = req.body;

        let usuarioFinal = req.body.usuario;
        if (!usuarioFinal || usuarioFinal.trim() === '') {
            usuarioFinal = generarNombreUsuario(nombreBody);
        }

        // ✅ Contraseña: se permite `contraseña`, `contrasena` o `password`.
        //    Si no viene ninguna, por regla de negocio se usa el DNI.
        let passwordFinal =
            req.body['contraseña'] ||
            req.body.contrasena ||
            req.body.password ||
            dni;

        if (!nombreBody || !dni || !usuarioFinal || !passwordFinal) {
            return res.status(400).json({
                ok: false,
                message: 'Faltan datos para generar usuario.'
            });
        }

        const passwordClean = String(passwordFinal).trim();

        // ✅ Si se envía una foto (multer .single("foto")), usamos el filename generado.
        //    Si no, respetamos `foto_ruta` si viniera desde otra integración.
        const fotoRuta = req.file
            ? req.file.filename
            : req.body.foto_ruta || null;

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, dni, celular, cargo, usuario, contrasena, foto_ruta, estado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO') RETURNING *`,
            [nombreBody, dni, celular, cargo, usuarioFinal, passwordClean, fotoRuta]
        );

        res.status(201).json({
            ok: true,
            message: 'Usuario registrado correctamente',
            data: result.rows[0] // Devuelve el usuario completo
        });

    } catch (error) {
        console.error("❌ ERROR REGISTRO:", error.message);
        if (error.code === '23505') {
            return res
                .status(400)
                .json({ ok: false, message: 'DNI o Usuario ya existe.' });
        }
        res
            .status(500)
            .json({ ok: false, message: 'Error servidor: ' + error.message });
    }
};

const loginUsuario = async (req, res) => {
    try {
        console.log("🔑 LOGIN INTENTO:", req.body);

        const { usuario } = req.body;
        const passInput =
            req.body['contraseña'] ||
            req.body.contrasena ||
            req.body.password;

        if (!usuario || !passInput) {
            return res
                .status(400)
                .json({ ok: false, message: 'Faltan credenciales.' });
        }

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = $1',
            [usuario]
        );
        if (result.rows.length === 0) {
            return res
                .status(404)
                .json({ ok: false, message: 'Usuario no encontrado.' });
        }

        const user = result.rows[0];
        const dbPass = user.contrasena;
        const inputPass = String(passInput).trim();

        if (dbPass !== inputPass) {
            return res
                .status(401)
                .json({ ok: false, message: 'Contraseña incorrecta.' });
        }

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Enviamos el objeto usuario completo para que el perfil funcione
        res.json({
            ok: true,
            message: 'Bienvenido',
            token,
            usuario: {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                cargo: user.cargo,
                dni: user.dni,
                celular: user.celular,
                foto_ruta: user.foto_ruta,
                estado: user.estado
            }
        });

    } catch (error) {
        console.error("❌ ERROR LOGIN:", error);
        res.status(500).json({ ok: false, message: 'Error interno.' });
    }
};

// Función para actualizar foto (Sinergia)
const actualizarFotoPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res
                .status(400)
                .json({ ok: false, message: 'No se envió imagen.' });
        }
        const fotoRuta = req.file.filename;
        await pool.query(
            'UPDATE usuarios SET foto_ruta = $1 WHERE id = $2',
            [fotoRuta, id]
        );
        res.json({
            ok: true,
            message: 'Foto actualizada',
            foto_ruta: fotoRuta
        });
    } catch (error) {
        console.error("Error subiendo foto:", error);
        res
            .status(500)
            .json({ ok: false, message: 'Error al guardar foto.' });
    }
};

const listarUsuariosApp = async (req, res) => {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY id DESC');
    res.json({ ok: true, usuarios: result.rows });
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    actualizarFotoPerfil,
    listarUsuariosApp
};
