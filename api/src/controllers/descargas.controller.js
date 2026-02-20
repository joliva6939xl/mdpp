const pool = require('../config/db');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const descargarFolioParte = async (req, res) => {
    const { id } = req.params;

    try {
        const parteRes = await pool.query('SELECT * FROM partes_virtuales WHERE id = $1', [id]);
        const archivosRes = await pool.query('SELECT * FROM parte_archivos WHERE parte_id = $1', [id]);

        if (parteRes.rows.length === 0) {
            return res.status(404).json({ message: 'Parte no encontrado' });
        }

        const parte = parteRes.rows[0];
        const archivos = archivosRes.rows;

        const zipName = `EXPEDIENTE_SISIFO_P${id}.zip`;
        res.attachment(zipName);
        
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        // --- DISEÑO DEL PDF FORMATO SÍSIFO ---
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        archive.append(doc, { name: `REPORTE_OFICIAL_SISIFO_P${id}.pdf` });

        // COLORES OFICIALES SISIFO
        const azulOscuro = "#1e293b";
        const azulClaro = "#3b82f6";
        const grisFondo = "#f1f5f9";

        // --- 1. ENCABEZADO TÉCNICO ---
        doc.rect(0, 0, 612, 80).fill(azulOscuro); // Franja superior
        doc.fillColor('#ffffff').fontSize(20).text('SISTEMA DE INFORMACIÓN SÍSIFO', 50, 25, { characterSpacing: 1 });
        doc.fontSize(10).text('REPORTE OPERATIVO DE INCIDENCIA DIGITAL', 50, 50, { characterSpacing: 2 });
        doc.fillColor('#ffffff').fontSize(16).text(`ID: #${id}`, 480, 35, { align: 'right' });

        doc.moveDown(4);
        doc.fillColor('#000000');

        // --- 2. BLOQUE: DATOS DE INTERVENCIÓN ---
        const drawSectionHeader = (title, y) => {
            doc.rect(40, y, 515, 18).fill(azulOscuro);
            doc.fillColor('#ffffff').fontSize(9).text(title.toUpperCase(), 50, y + 5, { bold: true });
            doc.fillColor('#000000');
        };

        drawSectionHeader("Información de la Intervención", 100);
        
        let currentY = 125;
        const rowHeight = 18;

        const drawRow = (label, value, y) => {
            doc.fontSize(9).font('Helvetica-Bold').text(label, 50, y);
            doc.font('Helvetica').text(value || '---', 180, y);
            doc.moveTo(40, y + 12).lineTo(555, y + 12).strokeColor('#e2e8f0').stroke();
        };

        drawRow("CORRELATIVO FÍSICO:", parte.parte_fisico, currentY); currentY += rowHeight;
        drawRow("FECHA REGISTRO:", parte.fecha, currentY); currentY += rowHeight;
        drawRow("HORA INICIO/FIN:", `${parte.hora} - ${parte.hora_fin || '---'}`, currentY); currentY += rowHeight;
        drawRow("ZONA / SECTOR:", `${parte.zona} / ${parte.sector}`, currentY); currentY += rowHeight;
        drawRow("LUGAR EXACTO:", parte.lugar, currentY); currentY += rowHeight;
        drawRow("SUMILLA:", (parte.sumilla || 'OTROS').toUpperCase(), currentY);

        // --- 3. BLOQUE: RECURSOS Y UNIDAD ---
        currentY += 30;
        drawSectionHeader("Recursos y Unidad Intervencionista", currentY);
        currentY += 25;

        drawRow("TIPO DE UNIDAD:", parte.unidad_tipo, currentY); currentY += rowHeight;
        drawRow("PLACA / INTERNO:", parte.placa, currentY); currentY += rowHeight;
        drawRow("CONDUCTOR:", parte.conductor, currentY); currentY += rowHeight;
        drawRow("DNI CONDUCTOR:", parte.dni_conductor, currentY);

        // --- 4. BLOQUE: NARRATIVA (EL "CORAZÓN" DEL PARTE) ---
        currentY += 40;
        drawSectionHeader("Narrativa de los Hechos (Ocurrencia)", currentY);
        currentY += 25;
        
        doc.rect(40, currentY, 515, 120).strokeColor('#cbd5e1').stroke();
        doc.fontSize(10).font('Helvetica').text(parte.ocurrencia || "Sin descripción detallada.", 50, currentY + 10, {
            width: 495,
            align: 'justify',
            lineGap: 3
        });

        // --- 5. FIRMAS (PIE DE PÁGINA) ---
        const footerY = 700;
        doc.moveTo(50, footerY).lineTo(180, footerY).stroke();
        doc.moveTo(230, footerY).lineTo(360, footerY).stroke();
        doc.moveTo(410, footerY).lineTo(540, footerY).stroke();

        doc.fontSize(8).font('Helvetica-Bold');
        doc.text("OPERADOR DE TURNO", 50, footerY + 5, { width: 130, align: 'center' });
        doc.text("SUPERVISOR ZONAL", 230, footerY + 5, { width: 130, align: 'center' });
        doc.text("JEFE DE OPERACIONES", 410, footerY + 5, { width: 130, align: 'center' });

        doc.end();

        // --- B. MULTIMEDIA (Se mantiene igual) ---
        const folderPath = path.join(__dirname, '../../uploads/partes', id.toString());
        archivos.forEach((file) => {
            const rawName = file.ruta || file.archivo || file.nombre_archivo || file.url;
            if (rawName) {
                const fileName = path.basename(rawName);
                const filePath = path.join(folderPath, fileName);
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: `MULTIMEDIA/${fileName}` });
                }
            }
        });

        // --- C. UBICACIÓN ---
        if (parte.latitud && parte.longitud) {
            const mapsContent = `[InternetShortcut]\nURL=https://www.google.com/maps?q=${parte.latitud},${parte.longitud}`;
            archive.append(mapsContent, { name: `UBICACION_GPS.url` });
        }

        await archive.finalize();

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) res.status(500).send('Error interno');
    }
};

module.exports = { descargarFolioParte };