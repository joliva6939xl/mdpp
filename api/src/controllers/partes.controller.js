const fs = require("fs");
const path = require("path");
const db = require("../config/db");
// Importamos librerías para reportes
const { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, PageBreak } = require("docx");
const ExcelJS = require('exceljs');
const PDFDocument = require("pdfkit"); // RESTAURADO ✅
const archiver = require("archiver");   // RESTAURADO ✅

const pool = db.pool || db;

// ==========================================
// 1. CATÁLOGO OFICIAL (INCIDENCIAS)
// ==========================================
const CATALOGO_INCIDENCIAS = [
    "ROBO A TRANSEUNTE",
    "CONSUMIDORES DE SUSTANCIAS TOXICAS",
    "HERIDOS POR ARMA DE FUEGO",
    "HERIDOS POR ARMA BLANCA",
    "CHOQUE VEHICULAR",
    "USURPACION O INVASION DE TERRENOI",
    "ROBO DE VEHICULOS , VIVIENDAS Y OTROS",
    "VIOLENCIA FAMILIAR",
    "PERSONAS SOSPECHOSAS",
    "DESASTRES NATURALES",
    "ALTERACION DEL ORDEN PUBLICO",
    "ACCIDENTES CON MATERIALES PELIGROSOS",
    "APOYO A EMERGENCIAS MEDICAS",
    "PROTECCION ESCOLAR",
    "OTROS NO ESPECIFICADOS"
];

// ==========================================
// 2. FUNCIONES CRUD (CREAR, LISTAR, ETC.)
// ==========================================

const crearParte = async (req, res) => {
  console.log("📥 Creando Parte Virtual...");
  const client = await pool.connect();
  const { parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, usuario_id, participantes, latitud, longitud } = req.body;

  try {
    await client.query("BEGIN");
    const insertParteQuery = `INSERT INTO partes_virtuales (parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, participantes, usuario_id, latitud, longitud) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id;`;
    
    let participantesValue = null;
    if (participantes) {
      try { const parsed = typeof participantes === "string" ? JSON.parse(participantes) : participantes; if (Array.isArray(parsed) && parsed.length > 0) participantesValue = JSON.stringify(parsed); } catch (e) {}
    }

    const valuesParte = [parte_fisico, fecha, hora || null, hora_fin?.trim() || null, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, participantesValue, usuario_id, latitud || null, longitud || null];
    const result = await client.query(insertParteQuery, valuesParte);
    const parteId = result.rows[0].id;
    const carpetaParte = path.join(__dirname, "../../uploads/partes", String(parteId));
    if (!fs.existsSync(carpetaParte)) fs.mkdirSync(carpetaParte, { recursive: true });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const newPath = path.join(carpetaParte, file.filename);
        fs.renameSync(file.path, newPath);
        const rutaRelativa = path.join("partes", String(parteId), file.filename).replace(/\\/g, "/");
        const tipo = file.mimetype.startsWith("video") ? "video" : "foto";
        await client.query(`INSERT INTO parte_archivos (parte_id, tipo, ruta, nombre_original) VALUES ($1, $2, $3, $4)`, [parteId, tipo, rutaRelativa, file.originalname || file.filename]);
      }
    }
    
    await client.query("COMMIT");

    // 🔥 SOCKET.IO: Notificar al dashboard
    const io = req.app.get("socketio");
    if (io) {
        const nuevoParteFull = await pool.query("SELECT * FROM partes_virtuales WHERE id = $1", [parteId]);
        io.emit("nuevo-parte", nuevoParteFull.rows[0]);
    }

    res.json({ ok: true, message: "Parte creado con ubicación", id: parteId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  } finally { client.release(); }
};

const listarPartes = async (req, res) => { const { usuario_id, page = 1, limit = 10 } = req.query; const pageNum = parseInt(page); const limitNum = parseInt(limit); const offset = (pageNum - 1) * limitNum; try { let query, countQuery, params, countParams; if (usuario_id) { query = `SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3;`; params = [usuario_id, limitNum, offset]; countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales WHERE usuario_id = $1;`; countParams = [usuario_id]; } else { query = `SELECT * FROM partes_virtuales ORDER BY id DESC LIMIT $1 OFFSET $2;`; params = [limitNum, offset]; countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales;`; countParams = []; } const result = await pool.query(query, params); const totalRes = await pool.query(countQuery, countParams); const total = parseInt(totalRes.rows[0].total); return res.json({ ok: true, partes: result.rows, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) }); } catch (error) { return res.status(500).json({ ok: false, message: "Error", error: error.message }); } };

const obtenerParte = async (req, res) => { const { id } = req.params; try { const parteQuery = `SELECT id, parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal AS supervisor_zonal, sup_general AS supervisor_general, participantes, usuario_id, latitud, longitud FROM partes_virtuales WHERE parte_fisico = $1 OR id::text = $1 LIMIT 1;`; const parteResult = await pool.query(parteQuery, [id]); if (parteResult.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado" }); const parte = parteResult.rows[0]; const archivosResult = await pool.query(`SELECT ruta, tipo FROM parte_archivos WHERE parte_id = $1`, [parte.id]); const archivos = archivosResult.rows || []; parte.fotos = archivos.filter(a => a.tipo === 'foto' || a.ruta.match(/\.(jpg|jpeg|png|webp)$/i)).map(a => a.ruta); parte.videos = archivos.filter(a => a.tipo === 'video' || a.ruta.match(/\.(mp4|avi|mov)$/i)).map(a => a.ruta); return res.json({ ok: true, parte, data: parte }); } catch (error) { return res.status(500).json({ ok: false, message: "Error interno", error: error.message }); } };

const actualizarParte = async (req, res) => { const { id } = req.params; const { parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, } = req.body; try { const result = await pool.query(`UPDATE partes_virtuales SET parte_fisico = $1, fecha = $2, hora = $3, hora_fin = $4, sector = $5, zona = $6, turno = $7, lugar = $8, unidad_tipo = $9, unidad_numero = $10, placa = $11, conductor = $12, dni_conductor = $13, sumilla = $14, asunto = $15, ocurrencia = $16, sup_zonal = $17, sup_general = $18 WHERE parte_fisico = $19 OR id::text = $19 RETURNING *;`, [parte_fisico, fecha, hora, hora_fin || null, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, id]); if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado" }); return res.json({ ok: true, message: "Parte actualizado", parte: result.rows[0] }); } catch (error) { return res.status(500).json({ ok: false, message: "Error interno", error: error.message }); } };

// ==========================================
// 🔥 CERRAR PARTE (CON DÍAS Y RESPUESTA JSON COMPLETA) ✅
// ==========================================
const cerrarParte = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    const checkQuery = `SELECT fecha, hora FROM partes_virtuales WHERE parte_fisico = $1 OR id::text = $1`;
    const checkRes = await client.query(checkQuery, [id]);

    if (checkRes.rowCount === 0) { client.release(); return res.status(404).json({ ok: false, message: "Parte no encontrado" }); }

    const fila = checkRes.rows[0];
    let fechaInicioStr = fila.fecha instanceof Date ? fila.fecha.toISOString().split('T')[0] : fila.fecha;
    const fechaInicio = new Date(`${fechaInicioStr}T${fila.hora}:00`);
    const ahoraPeru = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    
    const horaCierreGuardar = ahoraPeru.getHours().toString().padStart(2, '0') + ':' + ahoraPeru.getMinutes().toString().padStart(2, '0');
    const fechaCierreMostrar = ahoraPeru.toLocaleDateString('es-PE');

    const diferenciaMs = Math.max(0, ahoraPeru - fechaInicio); 
    const diffMins = Math.floor(diferenciaMs / 60000);
    const dias = Math.floor(diffMins / 1440);
    const horas = Math.floor((diffMins % 1440) / 60);
    const minutos = diffMins % 60;

    let textoDuracion = "";
    if (dias > 0) textoDuracion += `${dias} días, `;
    if (horas > 0 || dias > 0) textoDuracion += `${horas} horas y `;
    textoDuracion += `${minutos} minutos.`;

    const result = await client.query(`UPDATE partes_virtuales SET hora_fin = $2 WHERE parte_fisico = $1 OR id::text = $1 RETURNING *;`, [id, horaCierreGuardar]);
    client.release();

    return res.json({ 
        ok: true, 
        message: `Parte cerrado.\nDuración: ${textoDuracion}`, 
        parte: result.rows[0],
        duracion: textoDuracion,
        fecha_cierre: fechaCierreMostrar,
        hora_cierre: horaCierreGuardar
    });
  } catch (error) { return res.status(500).json({ ok: false, error: error.message }); }
};

// ==========================================
// 3. EXPEDIENTE COMPLETO (SÍSIFO PDF + ZIP) ✅ RESTAURADO FULL DISEÑO
// ==========================================
const descargarFolioParte = async (req, res) => {
    const { id } = req.params;

    try {
        const parteRes = await pool.query('SELECT * FROM partes_virtuales WHERE id = $1', [id]);
        const archivosRes = await pool.query('SELECT * FROM parte_archivos WHERE parte_id = $1', [id]);

        if (parteRes.rows.length === 0) return res.status(404).json({ message: 'Parte no encontrado' });

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

        // --- 4. BLOQUE: NARRATIVA ---
        currentY += 40;
        drawSectionHeader("Narrativa de los Hechos (Ocurrencia)", currentY);
        currentY += 25;
        
        doc.rect(40, currentY, 515, 120).strokeColor('#cbd5e1').stroke();
        doc.fontSize(10).font('Helvetica').text(parte.ocurrencia || "Sin descripción detallada.", 50, currentY + 10, {
            width: 495, align: 'justify', lineGap: 3
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

        // --- B. MULTIMEDIA ---
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
            const mapsContent = `[InternetShortcut]\nURL=http://googleusercontent.com/maps.google.com/?q=${parte.latitud},${parte.longitud}`;
            archive.append(mapsContent, { name: `UBICACION_GPS.url` });
        }

        await archive.finalize();

    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) res.status(500).send('Error interno');
    }
};
// ==========================================
// 4. REPORTES WORD Y EXCEL RESTAURADOS ✅
// ==========================================

const descargarReporteConteo = async (req, res) => {
    const { fecha, turno } = req.query;
    try {
        const palabraClave = (turno || "").toUpperCase().includes("NOCHE") ? "NOCHE" : "DIA";
        const result = await pool.query(`SELECT zona, sumilla FROM partes_virtuales WHERE fecha::text = $1 AND UPPER(turno) LIKE $2`, [fecha, `%${palabraClave}%`]);
        const registros = result.rows;
        const zonas = { "NORTE": [], "CENTRO": [], "SUR": [] };
        registros.forEach(r => {
            const z = (r.zona || "").toUpperCase();
            if (z.includes("NORTE")) zonas["NORTE"].push(r.sumilla);
            else if (z.includes("CENTRO")) zonas["CENTRO"].push(r.sumilla);
            else if (z.includes("SUR")) zonas["SUR"].push(r.sumilla);
        });
        const doc = new Document({
            sections: [{ children: [ ...crearPaginaZonaWord("ZONA NORTE", fecha, turno, zonas["NORTE"]), new Paragraph({ children: [new PageBreak()] }), ...crearPaginaZonaWord("ZONA CENTRO", fecha, turno, zonas["CENTRO"]), new Paragraph({ children: [new PageBreak()] }), ...crearPaginaZonaWord("ZONA SUR", fecha, turno, zonas["SUR"]), new Paragraph({ children: [ new TextRun({ text: `TOTAL GENERAL: ${registros.length}`, bold: true, size: 28 }) ], alignment: AlignmentType.CENTER, spacing: { before: 500 } }) ] }]
        });
        const buffer = await Packer.toBuffer(doc);
        res.setHeader("Content-Disposition", `attachment; filename=Conteo_${fecha}.docx`);
        res.send(buffer);
    } catch (error) { res.status(500).json({ ok: false }); }
};

function crearPaginaZonaWord(nombreZona, fecha, turno, listaSumillas) {
    const conteo = {};
    listaSumillas.forEach(s => { const n = (s || "OTROS").toUpperCase(); conteo[n] = (conteo[n] || 0) + 1; });
    const bloque = [ new Paragraph({ children: [new TextRun({ text: nombreZona, bold: true, size: 32, color: "1E3A8A" })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }) ];
    Object.entries(conteo).forEach(([inc, cant]) => { bloque.push(new Paragraph({ children: [ new TextRun({ text: `🚨 ${inc}`, size: 24 }), new TextRun({ text: `\t${cant}`, bold: true, size: 24 }) ], tabStops: [{ type: TabStopType.RIGHT, position: 9000 }], spacing: { after: 200 } })); });
    return bloque;
}

const descargarReporteExcel = async (req, res) => {
    const { fecha, turno, nombre_callcenter, nombre_operador } = req.query;
    try {
        const palabraClave = (turno || "").toUpperCase().includes("NOCHE") ? "NOCHE" : "DIA";
        const result = await pool.query(`SELECT zona, sumilla FROM partes_virtuales WHERE fecha::text = $1 AND UPPER(turno) LIKE $2`, [fecha, `%${palabraClave}%`]);
        const registros = result.rows;
        const zonas = { "NORTE": {}, "CENTRO": {}, "SUR": {} };
        CATALOGO_INCIDENCIAS.forEach(inc => { zonas.NORTE[inc] = 0; zonas.CENTRO[inc] = 0; zonas.SUR[inc] = 0; });
        
        registros.forEach(r => {
            const z = (r.zona || "").toUpperCase();
            const inc = (r.sumilla || "OTROS NO ESPECIFICADOS").toUpperCase().trim();
            const key = CATALOGO_INCIDENCIAS.includes(inc) ? inc : "OTROS NO ESPECIFICADOS";
            if (z.includes("NORTE")) zonas.NORTE[key]++;
            else if (z.includes("CENTRO")) zonas.CENTRO[key]++;
            else if (z.includes("SUR")) zonas.SUR[key]++;
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("CONTEO DIARIO");
        sheet.getColumn('A').width = 40; sheet.getColumn('B').width = 10;
        sheet.getColumn('D').width = 40; sheet.getColumn('E').width = 10;
        sheet.getColumn('G').width = 40; sheet.getColumn('H').width = 10;
        sheet.getColumn('J').width = 20; sheet.getColumn('K').width = 10; 

        const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }, alignment: { horizontal: 'center' } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        const blackBoxStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }, alignment: { horizontal: 'center' } };

        sheet.getCell('A2').value = "NORTE"; sheet.getCell('B2').value = "TOTAL";
        sheet.getCell('D2').value = "CENTRO"; sheet.getCell('E2').value = "TOTAL";
        sheet.getCell('G2').value = "SUR"; sheet.getCell('H2').value = "TOTAL";
        ['A2','B2','D2','E2','G2','H2'].forEach(c => { sheet.getCell(c).style = headerStyle; sheet.getCell(c).border = borderStyle; });

        let currentRow = 3;
        CATALOGO_INCIDENCIAS.forEach(inc => {
            sheet.getCell(`A${currentRow}`).value = `🚨${inc}`; sheet.getCell(`B${currentRow}`).value = zonas.NORTE[inc];
            sheet.getCell(`D${currentRow}`).value = `🚨${inc}`; sheet.getCell(`E${currentRow}`).value = zonas.CENTRO[inc];
            sheet.getCell(`G${currentRow}`).value = `🚨${inc}`; sheet.getCell(`H${currentRow}`).value = zonas.SUR[inc];
            ['A','B','D','E','G','H'].forEach(col => sheet.getCell(`${col}${currentRow}`).border = borderStyle);
            currentRow++;
        });

        const tNorte = Object.values(zonas.NORTE).reduce((a,b)=>a+b,0);
        const tCentro = Object.values(zonas.CENTRO).reduce((a,b)=>a+b,0);
        const tSur = Object.values(zonas.SUR).reduce((a,b)=>a+b,0);

        sheet.getCell(`A${currentRow}`).value = "TOTAL"; sheet.getCell(`B${currentRow}`).value = tNorte;
        sheet.getCell(`D${currentRow}`).value = "TOTAL"; sheet.getCell(`E${currentRow}`).value = tCentro;
        sheet.getCell(`G${currentRow}`).value = "TOTAL"; sheet.getCell(`H${currentRow}`).value = tSur;
        ['A','B','D','E','G','H'].forEach(col => { sheet.getCell(`${col}${currentRow}`).font = { bold: true }; sheet.getCell(`${col}${currentRow}`).border = borderStyle; });

        // Widgets
        sheet.mergeCells('J4:N4'); sheet.getCell('J4').value = "TOTAL GLOBAL";
        sheet.mergeCells('J5:N5'); sheet.getCell('J5').value = tNorte + tCentro + tSur;
        sheet.getCell('J5').font = { bold: true, size: 20, color: { argb: 'FFFF0000' } };
        sheet.getCell('J5').border = borderStyle;

        sheet.mergeCells('J8:N8'); sheet.getCell('J8').value = "ROPER BASE CENTRAL";
        sheet.getCell('J8').style = blackBoxStyle;
        sheet.getCell('J9').value = "NOMBRE:";
        sheet.mergeCells('K9:N9'); sheet.getCell('K9').value = (nombre_operador || "").toUpperCase();
        sheet.getCell('K9').font = { bold: true, color: { argb: 'FF0000FF' } };
        sheet.getCell('J10').value = "CONTEO:";
        sheet.mergeCells('K10:N10'); sheet.getCell('K10').border = { bottom: { style: 'thin' } }; // ✅

        sheet.mergeCells('J13:N13'); sheet.getCell('J13').value = "CALL CENTER";
        sheet.getCell('J13').style = blackBoxStyle;
        sheet.getCell('J14').value = "NOMBRE:";
        sheet.mergeCells('K14:N14'); sheet.getCell('K14').value = (nombre_callcenter || "").toUpperCase();
        sheet.getCell('K14').font = { bold: true, color: { argb: 'FF0000FF' } };
        sheet.getCell('J15').value = "CONTEO:";
        sheet.mergeCells('K15:N15'); sheet.getCell('K15').border = { bottom: { style: 'thin' } }; // ✅

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader("Content-Disposition", `attachment; filename=Conteo_${fecha}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { res.status(500).json({ ok: false }); }
};

// ==========================================
// 5. ESTADÍSTICAS Y FECHAS
// ==========================================

const obtenerEstadisticasCallCenter = async (req, res) => { const { fecha } = req.query; try { const result = await pool.query(`SELECT zona FROM partes_virtuales WHERE fecha::text LIKE $1 || '%'`, [fecha]); const stats = { Norte: 0, Centro: 0, Sur: 0, Total: 0 }; result.rows.forEach(row => { const z = (row.zona || "").toUpperCase().trim(); if (z === 'NORTE') stats.Norte++; else if (z === 'CENTRO') stats.Centro++; else if (z === 'SUR') stats.Sur++; }); stats.Total = stats.Norte + stats.Centro + stats.Sur; res.json(stats); } catch (error) { res.status(500).json({ ok: false }); } };

const obtenerMetricasZonales = async (req, res) => { try { const result = await pool.query("SELECT zona FROM partes_virtuales"); const stats = { Norte: 0, Centro: 0, Sur: 0, Total: 0 }; result.rows.forEach(row => { const z = (row.zona || "").toUpperCase(); if (z.includes("NORTE")) stats.Norte++; else if (z.includes("CENTRO")) stats.Centro++; else if (z.includes("SUR")) stats.Sur++; }); stats.Total = stats.Norte + stats.Centro + stats.Sur; res.json({ ok: true, stats }); } catch (error) { res.status(500).json({ ok: false }); } };

const obtenerFechasActivas = async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT to_char(fecha::date, 'YYYY-MM-DD') as fecha FROM partes_virtuales WHERE fecha IS NOT NULL AND fecha <> ''");
    res.json({ ok: true, fechas: result.rows.map(r => r.fecha) });
  } catch (error) { res.status(500).json({ ok: false, fechas: [] }); }
};

module.exports = {
  crearParte, listarPartes, obtenerParte, actualizarParte, cerrarParte, descargarFolioParte, obtenerEstadisticasCallCenter, obtenerMetricasZonales, descargarReporteConteo, descargarReporteExcel, obtenerFechasActivas
};