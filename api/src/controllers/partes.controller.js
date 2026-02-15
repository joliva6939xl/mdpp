const fs = require("fs");
const path = require("path");
const db = require("../config/db");
// Importamos librerías para reportes
const { Document, Packer, Paragraph, TextRun, AlignmentType, TabStopType, PageBreak } = require("docx");
const ExcelJS = require('exceljs');

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
    res.json({ ok: true, message: "Parte creado con ubicación", id: parteId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error crearParte:", error);
    res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  } finally { client.release(); }
};

const listarPartes = async (req, res) => { const { usuario_id, page = 1, limit = 10 } = req.query; const pageNum = parseInt(page); const limitNum = parseInt(limit); const offset = (pageNum - 1) * limitNum; try { let query, countQuery, params, countParams; if (usuario_id) { query = `SELECT * FROM partes_virtuales WHERE usuario_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3;`; params = [usuario_id, limitNum, offset]; countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales WHERE usuario_id = $1;`; countParams = [usuario_id]; } else { query = `SELECT * FROM partes_virtuales ORDER BY id DESC LIMIT $1 OFFSET $2;`; params = [limitNum, offset]; countQuery = `SELECT COUNT(*) AS total FROM partes_virtuales;`; countParams = []; } const result = await pool.query(query, params); const totalRes = await pool.query(countQuery, countParams); const total = parseInt(totalRes.rows[0].total); return res.json({ ok: true, partes: result.rows, total, page: pageNum, limit: limitNum, total_pages: Math.ceil(total / limitNum) }); } catch (error) { return res.status(500).json({ ok: false, message: "Error", error: error.message }); } };

const obtenerParte = async (req, res) => { const { id } = req.params; try { const parteQuery = `SELECT id, parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal AS supervisor_zonal, sup_general AS supervisor_general, participantes, usuario_id, latitud, longitud FROM partes_virtuales WHERE parte_fisico = $1 OR id::text = $1 LIMIT 1;`; const parteResult = await pool.query(parteQuery, [id]); if (parteResult.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado" }); const parte = parteResult.rows[0]; const archivosResult = await pool.query(`SELECT ruta, tipo FROM parte_archivos WHERE parte_id = $1`, [parte.id]); const archivos = archivosResult.rows || []; parte.fotos = archivos.filter(a => a.tipo === 'foto' || a.ruta.match(/\.(jpg|jpeg|png|webp)$/i)).map(a => a.ruta); parte.videos = archivos.filter(a => a.tipo === 'video' || a.ruta.match(/\.(mp4|avi|mov)$/i)).map(a => a.ruta); return res.json({ ok: true, parte, data: parte }); } catch (error) { return res.status(500).json({ ok: false, message: "Error interno", error: error.message }); } };

const actualizarParte = async (req, res) => { const { id } = req.params; const { parte_fisico, fecha, hora, hora_fin, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, } = req.body; try { const result = await pool.query(`UPDATE partes_virtuales SET parte_fisico = $1, fecha = $2, hora = $3, hora_fin = $4, sector = $5, zona = $6, turno = $7, lugar = $8, unidad_tipo = $9, unidad_numero = $10, placa = $11, conductor = $12, dni_conductor = $13, sumilla = $14, asunto = $15, ocurrencia = $16, sup_zonal = $17, sup_general = $18 WHERE parte_fisico = $19 OR id::text = $19 RETURNING *;`, [parte_fisico, fecha, hora, hora_fin || null, sector, zona, turno, lugar, unidad_tipo, unidad_numero, placa, conductor, dni_conductor, sumilla, asunto, ocurrencia, sup_zonal, sup_general, id]); if (result.rowCount === 0) return res.status(404).json({ ok: false, message: "Parte no encontrado" }); return res.json({ ok: true, message: "Parte actualizado", parte: result.rows[0] }); } catch (error) { return res.status(500).json({ ok: false, message: "Error interno", error: error.message }); } };

// ==========================================
// 🔥 CERRAR PARTE (CON LOGS Y CÁLCULO) 🔥
// ==========================================
const cerrarParte = async (req, res) => {
  const { id } = req.params;
  
  // LOG DE DIAGNÓSTICO SOLICITADO
  console.log(`🏁 [2] CONTROLADOR ALCANZADO: Cerrando Parte ID ${id}`);

  try {
    const client = await pool.connect();
    
    // 1. OBTENER FECHA Y HORA DE CREACIÓN
    const checkQuery = `SELECT fecha, hora FROM partes_virtuales WHERE parte_fisico = $1 OR id::text = $1`;
    const checkRes = await client.query(checkQuery, [id]);

    if (checkRes.rowCount === 0) {
        client.release();
        return res.status(404).json({ ok: false, message: "Parte no encontrado" });
    }

    const fila = checkRes.rows[0];
    
    // 2. CONSTRUIR FECHAS (INICIO vs FIN)
    // Fecha Inicio
    let fechaInicioStr = fila.fecha; 
    if (fila.fecha instanceof Date) {
        fechaInicioStr = fila.fecha.toISOString().split('T')[0];
    }
    // Asumimos formato HH:mm en BD. Añadimos segundos 00.
    const fechaInicio = new Date(`${fechaInicioStr}T${fila.hora}:00`);

    // Fecha Fin (AHORA MISMO en Perú 🇵🇪)
    const ahoraPeru = new Date().toLocaleString("en-US", { timeZone: "America/Lima" });
    const fechaFin = new Date(ahoraPeru);
    
    // Formatear hora de cierre (HH:MM) para guardar
    const horaCierreGuardar = fechaFin.getHours().toString().padStart(2, '0') + ':' + fechaFin.getMinutes().toString().padStart(2, '0');
    // Formatear fecha para mostrar
    const fechaCierreMostrar = fechaFin.toLocaleDateString('es-PE');

    // 3. CALCULAR DIFERENCIA (DURACIÓN)
    // Evitamos números negativos si la hora del servidor está desajustada
    const diferenciaMs = Math.max(0, fechaFin - fechaInicio); 
    
    const diffMins = Math.floor(diferenciaMs / 60000);
    const dias = Math.floor(diffMins / 1440);
    const horas = Math.floor((diffMins % 1440) / 60);
    const minutos = diffMins % 60;

    let textoDuracion = "";
    if (dias > 0) textoDuracion += `${dias} días, `;
    if (horas > 0) textoDuracion += `${horas} horas y `;
    textoDuracion += `${minutos} minutos.`;

    // 4. ACTUALIZAR BASE DE DATOS
    const updateQuery = `UPDATE partes_virtuales SET hora_fin = $2 WHERE parte_fisico = $1 OR id::text = $1 RETURNING *;`;
    const result = await client.query(updateQuery, [id, horaCierreGuardar]);
    client.release();

    const parteCerrado = result.rows[0];
    const mensajeFinal = `Parte cerrado el ${fechaCierreMostrar} a las ${horaCierreGuardar}.\nDuración: ${textoDuracion}`;

    console.log(`✅ ${mensajeFinal}`);

    return res.json({ 
        ok: true, 
        message: mensajeFinal, 
        parte: parteCerrado,
        duracion: textoDuracion,
        fecha_cierre: fechaCierreMostrar,
        hora_cierre: horaCierreGuardar
    });

  } catch (error) {
    console.error("🔥 Error cálculo fecha:", error);
    return res.status(500).json({ ok: false, message: "Error interno", error: error.message });
  }
};

const obtenerEstadisticasCallCenter = async (req, res) => { const { fecha, turno } = req.query; try { const text = `SELECT id, zona, turno FROM partes_virtuales WHERE fecha::text LIKE $1 || '%'`; const result = await pool.query(text, [fecha]); const stats = { Norte: 0, Centro: 0, Sur: 0, Total: 0 }; result.rows.forEach(row => { const dbZona = (row.zona || "").toUpperCase().trim(); if (dbZona === 'NORTE') stats.Norte++; else if (dbZona === 'CENTRO') stats.Centro++; else if (dbZona === 'SUR') stats.Sur++; }); stats.Total = stats.Norte + stats.Centro + stats.Sur; res.json(stats); } catch (error) { res.status(500).json({ ok: false, error: error.message }); } };

const obtenerMetricasZonales = async (req, res) => { try { const client = await pool.connect(); const result = await client.query("SELECT zona FROM partes_virtuales"); client.release(); const stats = { Norte: 0, Centro: 0, Sur: 0, Total: 0 }; result.rows.forEach(row => { const z = (row.zona || "").toUpperCase().trim(); if (z.includes("NORTE")) stats.Norte++; else if (z.includes("CENTRO")) stats.Centro++; else if (z.includes("SUR")) stats.Sur++; }); stats.Total = stats.Norte + stats.Centro + stats.Sur; res.json({ ok: true, stats }); } catch (error) { res.status(500).json({ ok: false, message: "Error" }); } };

// ==========================================
// 3. REPORTE WORD
// ==========================================
const descargarReporteConteo = async (req, res) => {
    const { fecha, turno } = req.query;
    try {
        const client = await pool.connect();
        const palabraClave = (turno || "").toUpperCase().includes("NOCHE") ? "NOCHE" : "DIA";
        const query = `SELECT zona, sumilla FROM partes_virtuales WHERE fecha::text = $1 AND UPPER(turno) LIKE $2`;
        const result = await client.query(query, [fecha, `%${palabraClave}%`]);
        client.release();

        const registros = result.rows;
        const zonas = { "NORTE": [], "CENTRO": [], "SUR": [] };
        registros.forEach(r => {
            const z = (r.zona || "").toUpperCase();
            if (z.includes("NORTE")) zonas["NORTE"].push(r.sumilla);
            else if (z.includes("CENTRO")) zonas["CENTRO"].push(r.sumilla);
            else if (z.includes("SUR")) zonas["SUR"].push(r.sumilla);
        });

        const totalGeneral = registros.length;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    ...crearPaginaZonaWord("ZONA NORTE", fecha, turno, zonas["NORTE"]),
                    new Paragraph({ children: [new PageBreak()] }),
                    ...crearPaginaZonaWord("ZONA CENTRO", fecha, turno, zonas["CENTRO"]),
                    new Paragraph({ children: [new PageBreak()] }),
                    ...crearPaginaZonaWord("ZONA SUR", fecha, turno, zonas["SUR"]),
                    new Paragraph({ text: "", spacing: { before: 500 } }),
                    new Paragraph({ text: "__________________________________________________", alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [ new TextRun({ text: `CONTEO TOTAL DE LAS 3 ZONAS:  ${totalGeneral}`, bold: true, size: 28 }) ], alignment: AlignmentType.CENTER, spacing: { before: 200 } })
                ],
            }],
        });
        const buffer = await Packer.toBuffer(doc);
        res.setHeader("Content-Disposition", `attachment; filename=Conteo_Incidencias_${fecha}.docx`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.send(buffer);
    } catch (error) { res.status(500).json({ ok: false, message: "Error al generar reporte" }); }
};

function crearPaginaZonaWord(nombreZona, fecha, turno, listaSumillas) {
    const conteo = {};
    listaSumillas.forEach(s => { const nombre = (s || "OTROS NO ESPECIFICADOS").toUpperCase(); conteo[nombre] = (conteo[nombre] || 0) + 1; });
    const totalZona = listaSumillas.length;
    const bloque = [ new Paragraph({ children: [new TextRun({ text: nombreZona, bold: true, size: 32, color: "1E3A8A" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }), new Paragraph({ text: "CONTEO DE INCIDENCIAS", alignment: AlignmentType.CENTER, heading: "Heading2", spacing: { after: 400 } }) ];
    if (totalZona === 0) { bloque.push(new Paragraph({ text: "Sin incidencias registradas en este turno.", alignment: AlignmentType.CENTER, italics: true })); } else { Object.entries(conteo).forEach(([incidencia, cantidad]) => { bloque.push(new Paragraph({ children: [ new TextRun({ text: `🚨 ${incidencia}`, size: 24 }), new TextRun({ text: `\t${cantidad}`, bold: true, size: 24 }) ], tabStops: [{ type: TabStopType.RIGHT, position: 9000 }], spacing: { after: 200 } })); }); }
    bloque.push(new Paragraph({ text: "", spacing: { before: 200 } }), new Paragraph({ children: [ new TextRun({ text: "TOTAL ZONA", bold: true, size: 24 }), new TextRun({ text: `\t${totalZona}`, bold: true, size: 28 }) ], tabStops: [{ type: TabStopType.RIGHT, position: 9000 }], border: { top: { style: "single", size: 6, space: 10 } }, spacing: { before: 200 } }));
    return bloque;
}

// ==========================================
// 4. REPORTE EXCEL (DISEÑO EXACTO SOLICITADO)
// ==========================================
const descargarReporteExcel = async (req, res) => {
    // 1. Recibimos parámetros (incluyendo los nombres que vienen del botón frontend)
    const { fecha, turno, nombre_callcenter, nombre_operador } = req.query;

    try {
        const client = await pool.connect();
        const palabraClave = (turno || "").toUpperCase().includes("NOCHE") ? "NOCHE" : "DIA";
        
        // 2. Consulta Base de Datos
        const query = `SELECT zona, sumilla FROM partes_virtuales WHERE fecha::text = $1 AND UPPER(turno) LIKE $2`;
        const result = await client.query(query, [fecha, `%${palabraClave}%`]);
        client.release();

        // 3. Lógica de Conteo (Usando Catálogo Fijo)
        const registros = result.rows;
        const zonas = { "NORTE": {}, "CENTRO": {}, "SUR": {} };
        // Inicializar todo en 0
        CATALOGO_INCIDENCIAS.forEach(inc => { zonas.NORTE[inc] = 0; zonas.CENTRO[inc] = 0; zonas.SUR[inc] = 0; });
        let otrosNorte = 0, otrosCentro = 0, otrosSur = 0;

        registros.forEach(r => {
            const z = (r.zona || "").toUpperCase();
            const inc = (r.sumilla || "OTROS NO ESPECIFICADOS").toUpperCase().trim();
            const existe = CATALOGO_INCIDENCIAS.includes(inc);
            const key = existe ? inc : "OTROS NO ESPECIFICADOS";
            
            if (z.includes("NORTE")) { existe ? zonas.NORTE[key]++ : otrosNorte++; }
            else if (z.includes("CENTRO")) { existe ? zonas.CENTRO[key]++ : otrosCentro++; }
            else if (z.includes("SUR")) { existe ? zonas.SUR[key]++ : otrosSur++; }
        });
        zonas.NORTE["OTROS NO ESPECIFICADOS"] += otrosNorte;
        zonas.CENTRO["OTROS NO ESPECIFICADOS"] += otrosCentro;
        zonas.SUR["OTROS NO ESPECIFICADOS"] += otrosSur;

        // 4. Armado del Excel Visual
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("CONTEO DIARIO");

        // --- Configuración de Columnas y Anchos ---
        sheet.getColumn('A').width = 40; sheet.getColumn('B').width = 10;
        sheet.getColumn('C').width = 3;  // Espacio
        sheet.getColumn('D').width = 40; sheet.getColumn('E').width = 10;
        sheet.getColumn('F').width = 3;  // Espacio
        sheet.getColumn('G').width = 40; sheet.getColumn('H').width = 10;
        sheet.getColumn('I').width = 3;  // Espacio

        sheet.getColumn('J').width = 20; 
        sheet.getColumn('K').width = 10; 
        sheet.getColumn('L').width = 10; 
        sheet.getColumn('M').width = 10; 
        sheet.getColumn('N').width = 10; 

        // Estilos Comunes
        const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }, alignment: { horizontal: 'center', vertical: 'middle' } };
        const borderStyle = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        const blackBoxStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } }, alignment: { horizontal: 'center', vertical: 'middle' } };

        // --- ENCABEZADOS PRINCIPALES ---
        sheet.getCell('A2').value = "NORTE"; sheet.getCell('B2').value = "TOTAL";
        sheet.getCell('D2').value = "CENTRO"; sheet.getCell('E2').value = "TOTAL";
        sheet.getCell('G2').value = "SUR"; sheet.getCell('H2').value = "TOTAL";
        
        ['A2','B2','D2','E2','G2','H2'].forEach(c => {
             sheet.getCell(c).style = headerStyle;
             sheet.getCell(c).border = borderStyle;
        });

        // --- LLENADO DE DATOS ---
        let currentRow = 3;
        CATALOGO_INCIDENCIAS.forEach(inc => {
            const nombre = `🚨${inc}`;
            sheet.getCell(`A${currentRow}`).value = nombre; sheet.getCell(`B${currentRow}`).value = zonas.NORTE[inc];
            sheet.getCell(`D${currentRow}`).value = nombre; sheet.getCell(`E${currentRow}`).value = zonas.CENTRO[inc];
            sheet.getCell(`G${currentRow}`).value = nombre; sheet.getCell(`H${currentRow}`).value = zonas.SUR[inc];

            ['A','B','D','E','G','H'].forEach(col => sheet.getCell(`${col}${currentRow}`).border = borderStyle);
            ['B','E','H'].forEach(col => sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center' });
            currentRow++;
        });

        // --- TOTALES POR ZONA ---
        const tNorte = Object.values(zonas.NORTE).reduce((a,b)=>a+b,0);
        const tCentro = Object.values(zonas.CENTRO).reduce((a,b)=>a+b,0);
        const tSur = Object.values(zonas.SUR).reduce((a,b)=>a+b,0);

        sheet.getCell(`A${currentRow}`).value = "TOTAL"; sheet.getCell(`B${currentRow}`).value = tNorte;
        sheet.getCell(`D${currentRow}`).value = "TOTAL"; sheet.getCell(`E${currentRow}`).value = tCentro;
        sheet.getCell(`G${currentRow}`).value = "TOTAL"; sheet.getCell(`H${currentRow}`).value = tSur;
        
        ['A','B','D','E','G','H'].forEach(col => {
            sheet.getCell(`${col}${currentRow}`).font = { bold: true };
            sheet.getCell(`${col}${currentRow}`).border = borderStyle;
            sheet.getCell(`${col}${currentRow}`).alignment = { horizontal: 'center' };
        });

        // ==========================================
        // 🟦 WIDGETS LATERALES
        // ==========================================

        // 1. TOTAL GLOBAL
        sheet.mergeCells('J4:N4');
        sheet.getCell('J4').value = "TOTAL GLOBAL INCIDENCIAS";
        sheet.getCell('J4').font = { bold: true };
        sheet.getCell('J4').alignment = { horizontal: 'center' };

        sheet.mergeCells('J5:N5');
        sheet.getCell('J5').value = tNorte + tCentro + tSur; // Suma Total
        sheet.getCell('J5').font = { bold: true, size: 20, color: { argb: 'FFFF0000' } }; // Rojo Grande
        sheet.getCell('J5').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getCell('J5').border = borderStyle;

        // 2. ROPER BASE CENTRAL
        sheet.mergeCells('J8:N8');
        sheet.getCell('J8').value = "ROPER BASE CENTRAL";
        sheet.getCell('J8').style = blackBoxStyle;

        sheet.getCell('J9').value = "NOMBRE:";
        sheet.mergeCells('K9:N9');
        sheet.getCell('K9').value = (nombre_operador || "").toUpperCase(); 
        sheet.getCell('K9').font = { bold: true, color: { argb: 'FF0000FF' } }; // Azul
        sheet.getCell('K9').alignment = { horizontal: 'center' };
        
        sheet.getCell('J10').value = "CONTEO:";
        sheet.mergeCells('K10:N10');
        sheet.getCell('K10').border = { bottom: { style: 'thin' } }; 

        // 3. CALL CENTER
        sheet.mergeCells('J13:N13');
        sheet.getCell('J13').value = "CALL CENTER";
        sheet.getCell('J13').style = blackBoxStyle;

        sheet.getCell('J14').value = "NOMBRE:";
        sheet.mergeCells('K14:N14');
        sheet.getCell('K14').value = (nombre_callcenter || "").toUpperCase(); 
        sheet.getCell('K14').font = { bold: true, color: { argb: 'FF0000FF' } };
        sheet.getCell('K14').alignment = { horizontal: 'center' };

        sheet.getCell('J15').value = "CONTEO:";
        sheet.mergeCells('K15:N15');
        sheet.getCell('K15').border = { bottom: { style: 'thin' } };

        // 4. TABLA OPERADORES
        sheet.getCell('J18').value = "OPERADOR";
        sheet.getCell('K18').value = "NORTE";
        sheet.getCell('L18').value = "CENTRO";
        sheet.getCell('M18').value = "SUR";
        sheet.getCell('N18').value = "TOTAL";

        ['J18','K18','L18','M18','N18'].forEach(c => sheet.getCell(c).style = blackBoxStyle);

        for(let r=19; r<=24; r++) {
            ['J','K','L','M','N'].forEach(col => sheet.getCell(`${col}${r}`).border = borderStyle);
        }

        sheet.getCell('J25').value = "TOTAL";
        ['J25','K25','L25','M25','N25'].forEach(c => {
             sheet.getCell(c).font = { bold: true };
             sheet.getCell(c).border = borderStyle;
             sheet.getCell(c).alignment = { horizontal: 'center' };
             if(c !== 'J25') sheet.getCell(c).value = 0;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader("Content-Disposition", `attachment; filename=Conteo_Diario_${fecha}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("❌ Error Excel:", error);
        res.status(500).json({ ok: false, message: "Error al generar Excel" });
    }
};

const obtenerFechasActivas = async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT DISTINCT to_char(fecha::date, 'YYYY-MM-DD') as fecha FROM partes_virtuales WHERE fecha IS NOT NULL AND fecha <> ''");
    client.release();
    
    const fechas = result.rows.map(r => r.fecha);
    res.json({ ok: true, fechas });
  } catch (error) {
    console.error("Error obteniendo fechas activas:", error);
    res.status(500).json({ ok: false, fechas: [] });
  }
};

module.exports = {
  crearParte,
  listarPartes,
  obtenerParte,
  actualizarParte,
  cerrarParte,
  obtenerEstadisticasCallCenter,
  obtenerMetricasZonales,
  descargarReporteConteo,
  descargarReporteExcel,
  obtenerFechasActivas
};