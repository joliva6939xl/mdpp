const pool = require("../config/db");

exports.getConteoStats = async (req, res) => {
    try {
        const { fecha, turno } = req.query;

        const query = `
            SELECT 
                zona,
                sumilla,
                COUNT(*)::int AS cantidad
            FROM partes_virtuales
            WHERE fecha::date = $1::date
              AND UPPER(turno) = UPPER($2)
            GROUP BY zona, sumilla
        `;

        const result = await pool.query(query, [fecha, turno]);

        // 🔹 Estructura FIJA para que el frontend no falle
        const data = {
            Norte: [],
            Centro: [],
            Sur: []
        };

        result.rows.forEach(row => {
            const zonaKey =
                row.zona?.toUpperCase() === "NORTE" ? "Norte" :
                row.zona?.toUpperCase() === "CENTRO" ? "Centro" :
                row.zona?.toUpperCase() === "SUR" ? "Sur" :
                null;

            if (zonaKey) {
                data[zonaKey].push({
                    tipo: row.sumilla || "SIN ESPECIFICAR",
                    cant: Number(row.cantidad || 0)
                });
            }
        });

        res.json(data);

    } catch (error) {
        console.error("❌ Error en Dashboard Stats:", error);
        res.status(500).json({ message: "Error al obtener métricas" });
    }
};
