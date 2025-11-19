export const actualizarFotoUsuario = async (req, res) => {
  try {
    const id = req.params.id;
    const archivo = req.file.filename;

    await pool.query(
      "UPDATE usuarios SET foto_ruta=$1 WHERE id=$2",
      [archivo, id]
    );

    res.json({ ok: true, foto: archivo });
  } catch (error) {
    console.log("ERROR SUBIENDO FOTO:", error);
    res.status(500).json({ ok: false, message: "Error subiendo foto" });
  }
};
