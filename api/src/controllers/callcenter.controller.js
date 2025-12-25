const pool = require("../config/db");

// 🟢 CAMBIO CRÍTICO: Usamos 'exports.' directo para asegurar que se exporte
exports.getConteoStats = async (req, res) => {
    try {
        const { fecha, turno } = req.query;
        
        const query = `
            SELECT 
                zona, 
                sumilla, 
                COUNT(*)::int as cantidad 
            FROM partes_virtuales 
            WHERE fecha::date = $1::date 
              AND UPPER(turno) = UPPER($2)
            GROUP BY zona, sumilla 
            ORDER BY zona ASC, cantidad DESC
        `;

        const result = await pool.query(query, [fecha, turno]);
        
        const data = { Norte: [], Centro: [], Sur: [] };

        result.rows.forEach(row => {
            let zonaKey = "Norte";
            if (row.zona) {
                const z = row.zona.toLowerCase();
                if (z.includes("centro")) zonaKey = "Centro";
                else if (z.includes("sur")) zonaKey = "Sur";
            }
            
            if (data[zonaKey]) {
                data[zonaKey].push({ 
                    tipo: row.sumilla || "SIN ESPECIFICAR", 
                    cant: parseInt(row.cantidad) 
                });
            }
        });

        res.json(data);

    } catch (error) {
        console.error("❌ Error en Dashboard Stats:", error);
        res.status(500).json({ message: "Error al obtener métricas" });
    }
};
// Ya no necesitamos module.exports al final porque usamos 'exports.' arriba