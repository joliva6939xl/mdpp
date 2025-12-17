// mdpp/api/src/controllers/callcenter.controller.js

let pool;
try {
  pool = require("../db");
} catch {
  pool = require("../config/db");
}

const ZONAS = ["norte", "centro", "sur"];

function initZonas() {
  return {
    norte: { total: 0, incidencias: [] },
    centro: { total: 0, incidencias: [] },
    sur: { total: 0, incidencias: [] },
  };
}

async function detectarColumnaIncidencia() {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='partes_virtuales'
      AND column_name IN ('sumilla','incidencia');
  `;
  const { rows } = await pool.query(q);
  const cols = rows.map((r) => r.column_name);
  if (cols.includes("sumilla")) return "sumilla";
  if (cols.includes("incidencia")) return "incidencia";
  return null;
}

// Lógica compartida para obtener datos filtrados por zona
async function getConteoData() {
  const colInc = await detectarColumnaIncidencia();
  if (!colInc) throw new Error("No column 'sumilla' or 'incidencia' found.");

  // 1) Conteo SOLO norte/centro/sur (normalizando)
  // SE AGREGA FILTRO PARA EXCLUIR "BASURA" (incidencias numéricas o muy cortas)
  // Heurística:
  // - LENGTH > 2 (descarta "1", "a", "b", etc)
  // - No empieza con dígito (descarta "2121...", "32asd...")
  const sql = `
    SELECT
      LOWER(TRIM(zona)) AS zona_norm,
      TRIM(COALESCE(${colInc}, 'SIN INCIDENCIA')) AS incidencia,
      COUNT(*)::int AS total
    FROM partes_virtuales
    WHERE zona IS NOT NULL
      AND LOWER(TRIM(zona)) IN ('norte','centro','sur')
      AND LENGTH(TRIM(COALESCE(${colInc}, ''))) > 2
      AND TRIM(COALESCE(${colInc}, '')) !~ '^[0-9]'
    GROUP BY 1,2
    ORDER BY 1, total DESC, incidencia ASC;
  `;

  const { rows } = await pool.query(sql);

  const zonas = initZonas();
  // Mapa para agregar incidencias globales
  const incidenciasMap = new Map();

  for (const r of rows) {
    const z = r.zona_norm;
    if (!zonas[z]) continue;

    const totalNum = parseInt(r.total, 10);
    const incStr = r.incidencia;

    // Agregar a la zona específica
    zonas[z].incidencias.push({ incidencia: incStr, total: totalNum });
    zonas[z].total += totalNum;

    // Agregar al global de incidencias
    const currentVal = incidenciasMap.get(incStr) || 0;
    incidenciasMap.set(incStr, currentVal + totalNum);
  }

  const total_general =
    (zonas.norte.total || 0) +
    (zonas.centro.total || 0) +
    (zonas.sur.total || 0);

  // Convertir mapa global a array ordenado
  const incidencias_total = Array.from(incidenciasMap.entries())
    .map(([inc, tot]) => ({ incidencia: inc, total: tot }))
    .sort((a, b) => b.total - a.total);

  return { zonas, total_general, incidencias_total };
}

async function obtenerConteoZonas(req, res) {
  try {
    const { zonas, total_general } = await getConteoData();

    // 2) Debug REAL: cuántas NO son norte/centro/sur (opcional, para mantener compatibilidad)
    const debugSql = `
      SELECT
        COUNT(*)::int AS total_en_bd,
        SUM(
          CASE
            WHEN zona IS NULL THEN 1
            WHEN LOWER(TRIM(zona)) IN ('norte','centro','sur') THEN 0
            ELSE 1
          END
        )::int AS total_fuera
      FROM partes_virtuales;
    `;
    const dbg = await pool.query(debugSql);

    return res.json({
      ok: true,
      zonas,
      total_general, // ✅ SOLO norte/centro/sur
      debug: dbg.rows?.[0] || null,
    });
  } catch (error) {
    console.error("Error en obtenerConteoZonas:", error);
    return res.status(500).json({
      ok: false,
      message: "Error obteniendo conteo de zonas.",
    });
  }
}

// ✅ NUEVO: Endpoint para la página /count que requiere desglose total de incidencias
async function obtenerConteoIncidencias(req, res) {
  try {
    const { zonas, total_general, incidencias_total } = await getConteoData();

    return res.json({
      ok: true,
      total_general,
      zonas, // Se envían también las zonas por si acaso
      incidencias_total,
    });
  } catch (error) {
    console.error("Error en obtenerConteoIncidencias:", error);
    return res.status(500).json({
      ok: false,
      message: "Error obteniendo conteo de incidencias.",
    });
  }
}

module.exports = { obtenerConteoZonas, obtenerConteoIncidencias };
