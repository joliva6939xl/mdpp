const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Aseguramos la conexión a la DB

// NOTA: Para que la subida de archivos funcione, necesitarás el middleware 'multer'.
// Por ahora, definimos la estructura para que el servidor ARRANQUE sin errores.

// Ruta para actualizar foto (Convertida de controlador a ruta directa)
router.put('/actualizar-foto/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validación básica para evitar errores si no hay middleware de archivos aún
    const archivo = req.file ? req.file.filename : null;

    if (!archivo) {
       // Si no hay middleware 'multer' configurado, req.file será undefined
       console.warn("Advertencia: req.file no existe. ¿Falta configurar Multer?");
       return res.status(400).json({ ok: false, message: "No se recibió ningún archivo de imagen." });
    }

    await pool.query(
      "UPDATE usuarios SET foto_ruta=$1 WHERE id=$2",
      [archivo, id]
    );

    res.json({ ok: true, foto: archivo });
  } catch (error) {
    console.log("ERROR SUBIENDO FOTO:", error);
    res.status(500).json({ ok: false, message: "Error subiendo foto" });
  }
});

// --- ESTA LÍNEA ES LA QUE FALTABA Y PROVOCABA EL ERROR CRÍTICO ---
module.exports = router;