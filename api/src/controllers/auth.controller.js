const pool = require('../config/db');

// Helper para generar usuario
const generarNombreUsuario = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    const partes = nombreCompleto.trim().split(/\s+/);
    const primerNombre = partes[0] || '';
    const primerApellido = partes[1] || '';
    return (primerNombre.charAt(0) + primerApellido).toLowerCase();
};

const registrarUsuario = async (req, res) => {
    try {
        console.log("📥 REGISTRO APP - Body:", req.body);
        
        // 1. FLEXIBILIDAD EN EL NOMBRE
        const nombreBody = req.body.nombre || req.body.nombre_completo;
        
        // 2. CORRECCIÓN DIRECCIÓN
        const direccionFinal = req.body.direccion_actual || req.body.direccion || null;

        // 🔥 3. NUEVOS CAMPOS (REFERENCIA Y GPS)
        // Capturamos los datos que envía el frontend
        const referencia = req.body.referencia || null;
        const ubicacion_gps = req.body.ubicacion_gps || null;

        const { dni, celular, cargo } = req.body;

        // 4. CORRECCIÓN CATEGORÍA
        let esMotorizado = false;
        let esConductor = false;

        // Opción A: Texto
        if (req.body.categoria) {
            const cat = String(req.body.categoria).toUpperCase().trim();
            if (cat === 'MOTORIZADO') esMotorizado = true;
            if (cat === 'CONDUCTOR') esConductor = true;
        } 
        // Opción B: Booleanos
        else {
            esMotorizado = req.body.motorizado === 'true' || req.body.motorizado === true;
            esConductor = req.body.conductor === 'true' || req.body.conductor === true;
        }

        // --- Generación de Usuario y Contraseña ---
        let usuarioFinal = req.body.usuario;
        if (!usuarioFinal || usuarioFinal.trim() === '') {
            usuarioFinal = generarNombreUsuario(nombreBody);
        }

        let passwordFinal =
            req.body['contraseña'] ||
            req.body.contrasena ||
            req.body.password ||
            dni;

        if (!nombreBody || !dni || !usuarioFinal || !passwordFinal) {
            return res.status(400).json({
                ok: false,
                message: 'Faltan datos para generar usuario (Nombre, DNI, Pass).'
            });
        }

        const passwordClean = String(passwordFinal).trim();

        // --- Manejo de Fotos ---
        // Foto Perfil
        let fotoRuta = null;
        if (req.file) fotoRuta = req.file.filename; // Upload simple
        else if (req.files && req.files['foto'] && req.files['foto'][0]) fotoRuta = req.files['foto'][0].filename; // Upload fields
        else fotoRuta = req.body.foto_ruta || null;

        // Foto Licencia
        let fotoLicencia = null;
        if (req.files && req.files['foto_licencia'] && req.files['foto_licencia'][0]) {
            fotoLicencia = req.files['foto_licencia'][0].filename;
        } else {
            fotoLicencia = req.body.foto_licencia || null;
        }

        // --- INSERT ACTUALIZADO CON REFERENCIA Y GPS ---
        const result = await pool.query(
            `INSERT INTO usuarios 
            (nombre, dni, celular, cargo, usuario, contrasena, foto_ruta, estado, 
             foto_licencia, motorizado, conductor, direccion_actual, referencia, ubicacion_gps)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO', $8, $9, $10, $11, $12, $13) 
             RETURNING *`,
            [
                nombreBody, 
                dni, 
                celular, 
                cargo, 
                usuarioFinal, 
                passwordClean, 
                fotoRuta, 
                // Nuevos campos procesados
                fotoLicencia,
                esMotorizado,
                esConductor,
                direccionFinal,
                referencia,     // $12
                ubicacion_gps   // $13
            ]
        );

        res.status(201).json({
            ok: true,
            message: 'Usuario registrado correctamente',
            data: result.rows[0]
        });

    } catch (error) {
        console.error("❌ ERROR REGISTRO:", error.message);
        if (error.code === '23505') {
            return res.status(400).json({ ok: false, message: 'El DNI o Usuario ya existe en el sistema.' });
        }
        res.status(500).json({ ok: false, message: 'Error servidor: ' + error.message });
    }
};

const loginUsuario = async (req, res) => {
    try {
        const { usuario } = req.body;
        const passInput = req.body['contraseña'] || req.body.contrasena || req.body.password;

        if (!usuario || !passInput) return res.status(400).json({ ok: false, message: 'Faltan credenciales.' });

        const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
        
        if (result.rows.length === 0) return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });

        const user = result.rows[0];
        const dbPass = String(user.contrasena ?? "").trim();
        const inputPass = String(passInput).trim();

        if (dbPass !== inputPass) return res.status(401).json({ ok: false, message: 'Contraseña incorrecta.' });

        // Determinamos la categoría para devolverla al frontend
        let categoriaCalculada = "AGENTE"; 
        if (user.motorizado) categoriaCalculada = "MOTORIZADO";
        if (user.conductor) categoriaCalculada = "CONDUCTOR";

        res.json({
            ok: true,
            message: 'Bienvenido',
            usuario: {
                id: user.id,
                nombre: user.nombre,
                usuario: user.usuario,
                cargo: user.cargo,
                dni: user.dni,
                celular: user.celular,
                foto_ruta: user.foto_ruta,
                estado: user.estado,
                // Nuevos campos
                foto_licencia: user.foto_licencia,
                motorizado: user.motorizado,
                conductor: user.conductor,
                direccion_actual: user.direccion_actual,
                referencia: user.referencia,         // <--- Agregado
                ubicacion_gps: user.ubicacion_gps,   // <--- Agregado
                categoria: categoriaCalculada 
            }
        });

    } catch (error) {
        console.error("❌ ERROR LOGIN:", error);
        res.status(500).json({ ok: false, message: 'Error interno.' });
    }
};

const actualizarFotoPerfil = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ ok: false, message: 'No se envió imagen.' });
        const fotoRuta = req.file.filename;
        await pool.query('UPDATE usuarios SET foto_ruta = $1 WHERE id = $2', [fotoRuta, id]);
        res.json({ ok: true, message: 'Foto actualizada', foto_ruta: fotoRuta });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al guardar foto.' });
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