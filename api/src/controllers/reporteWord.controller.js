const { Document, Packer, Paragraph, TextRun, PageBreak, TabStopPosition, TabStopType, AlignmentType } = require("docx");

// 🔴 CORRECCIÓN CRÍTICA: Cambiamos a '../db'. 
// Esto busca el archivo db.js (o la carpeta db) dentro de 'src', que es lo estándar.
const pool = require("../config/db"); 

const STYLES = {
    font: "Arial",
    titleSize: 24, // 12pt
    labelSize: 20, // 10pt
    valueSize: 20, // 10pt
};

const createCountLine = (label, count) => {
    return new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
            new TextRun({ text: (label || "SIN ESPECIFICAR").toUpperCase(), font: STYLES.font, size: STYLES.labelSize }),
            new TextRun({ text: `\t${count}`, font: STYLES.font, size: STYLES.valueSize, bold: true }),
        ],
        spacing: { after: 120 },
    });
};

const generarReporteWord = async (req, res) => {
    try {
        const { fecha, turno } = req.query;
        console.log(`📝 Generando Word para: ${fecha} - ${turno}`);

        const query = `
            SELECT 
                zona, 
                sumilla, 
                COUNT(*)::int as cantidad 
            FROM partes_virtuales 
            WHERE fecha::date = $1::date AND UPPER(turno) = UPPER($2)
            GROUP BY zona, sumilla 
            ORDER BY zona ASC, cantidad DESC
        `;
        
        const result = await pool.query(query, [fecha, turno]);
        
        const reporteData = { Norte: [], Centro: [], Sur: [] };
        const totales = { Norte: 0, Centro: 0, Sur: 0 };

        result.rows.forEach(row => {
            let zonaKey = "Norte"; 
            if (row.zona) {
                const z = row.zona.toLowerCase();
                if (z.includes("centro")) zonaKey = "Centro";
                else if (z.includes("sur")) zonaKey = "Sur";
            }
            
            if (reporteData[zonaKey]) {
                reporteData[zonaKey].push({ tipo: row.sumilla, cant: row.cantidad });
                totales[zonaKey] += row.cantidad;
            }
        });

        const zonas = ["Norte", "Centro", "Sur"];
        const sections = [];

        zonas.forEach((zona, index) => {
            const datosZona = reporteData[zona] || [];
            
            const children = [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: `CONTEO DE INCIDENCIAS ZONA ${zona.toUpperCase()}`, bold: true, font: STYLES.font, size: STYLES.titleSize })],
                    spacing: { after: 300 }
                }),
                new Paragraph({ children: [new TextRun({ text: `FECHA: ${fecha}`, bold: true, font: STYLES.font, size: 18 })] }),
                new Paragraph({ children: [new TextRun({ text: `TURNO: ${turno}`, bold: true, font: STYLES.font, size: 18 })], spacing: { after: 200 } }),
                new Paragraph({ children: [new TextRun({ text: "SUPERVISOR ZONAL: _______________________", font: STYLES.font, size: 18 })], spacing: { after: 100 } }),
                new Paragraph({ children: [new TextRun({ text: "SUPERVISOR GENERAL: _______________________", font: STYLES.font, size: 18 })], spacing: { after: 400 } }),
            ];

            if (datosZona.length > 0) {
                datosZona.forEach(item => children.push(createCountLine(item.tipo, item.cant)));
            } else {
                children.push(new Paragraph({ text: "Sin incidencias registradas.", font: STYLES.font, italics: true }));
            }

            children.push(
                new Paragraph({ text: "", spacing: { before: 200 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `TOTAL INCIDENCIAS ZONA ${zona.toUpperCase()}: `, font: STYLES.font, size: STYLES.valueSize }),
                        new TextRun({ text: `${totales[zona]}`, bold: true, font: STYLES.font, size: STYLES.titleSize })
                    ],
                    spacing: { before: 200 }
                })
            );
            
            if (index < zonas.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));

            sections.push({
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                children: children
            });
        });

        const doc = new Document({ creator: "MDPP", title: `Conteo ${fecha}`, sections: sections });
        const buffer = await Packer.toBuffer(doc);
        const fileName = `Reporte_${fecha}_${turno}.docx`;

        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.send(buffer);

    } catch (error) {
        console.error("❌ Error Word:", error);
        res.status(500).send("Error de servidor");
    }
};

module.exports = { generarReporteWord };