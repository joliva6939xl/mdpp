import { useEffect, useMemo, useState, useCallback } from "react";
import { ccdStyles as S } from "./CallCenterDashboard.styles";
import { UserDetailsModal } from "./UserDetailsModal";
import { obtenerUsuariosSistema } from "../services/adminService";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y DEFINICIONES
// ─────────────────────────────────────────────────────────────────────────────
type ZonaKey = "NORTE" | "CENTRO" | "SUR";
type ZonaUI = "TODAS" | ZonaKey;

type IncidenciaCount = { incidencia: string; total: number };
type ZonaCount = { zona: ZonaKey; total: number; incidencias: IncidenciaCount[] };

type ConteoData = {
  zonas: Record<ZonaKey, ZonaCount>;
  totalGeneral: number;
};

type Props = {
  userName: string;
  onBack: () => void;
  onLogout: () => void;
  internoNombre: string;
  internoRoperoTurno: string;
  onOpenInternalLogin?: () => void;
};

type UsuarioSistema = {
  id: number;
  nombre_usuario?: string;
  usuario?: string;
  nombre?: string;
  nombres?: string;
  rol?: string;
  cargo?: string;
  dni?: string;
  celular?: string;
  foto_ruta?: string | null;
};

type UsuarioModal = {
  id: number;
  nombre: string;
  cargo: string;
  usuario: string;
  dni: string;
  celular: string;
  foto_ruta?: string | null;
};

const API_BASE = "http://localhost:4000";

const emptyZona = (zona: ZonaKey): ZonaCount => ({ zona, total: 0, incidencias: [] });

const conteoFallback: ConteoData = {
  zonas: { NORTE: emptyZona("NORTE"), CENTRO: emptyZona("CENTRO"), SUR: emptyZona("SUR") },
  totalGeneral: 0,
};

const normalizeIncidencia = (v: string) => v.trim() || "SIN INCIDENCIA";

function toUsuarioModal(u: UsuarioSistema, tipo: "APP" | "ADMIN"): UsuarioModal {
  const nombre = (u.nombres || u.nombre || u.usuario || u.nombre_usuario || `Usuario ${u.id}`).toString();
  const usuario = (u.nombre_usuario || u.usuario || "").toString();
  const cargo = (u.rol || u.cargo || (tipo === "ADMIN" ? "ADMIN" : "APP")).toString();
  return {
    id: u.id,
    nombre,
    cargo,
    usuario,
    dni: (u.dni || "-").toString(),
    celular: (u.celular || "-").toString(),
    foto_ruta: u.foto_ruta ?? null,
  };
}

export default function CallCenterDashboard({
  userName,
  onBack,
  onLogout,
  internoNombre,
  internoRoperoTurno,
  onOpenInternalLogin,
}: Props) {
  const [view, setView] = useState<"RESUMEN" | "METRICAS" | "USUARIOS">("RESUMEN");

  // Estados Conteo
  const [loadingConteo, setLoadingConteo] = useState(false);
  const [conteo, setConteo] = useState<ConteoData | null>(null);
  const [errorConteo, setErrorConteo] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [zonaMetricas, setZonaMetricas] = useState<ZonaUI>("TODAS");

  // Estados Usuarios
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");
  const [usersApp, setUsersApp] = useState<UsuarioSistema[]>([]);
  const [usersAdmin, setUsersAdmin] = useState<UsuarioSistema[]>([]);
  const [tipoUsers, setTipoUsers] = useState<"APP" | "ADMIN" | "TODOS">("TODOS");
  const [q, setQ] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioModal | null>(null);

  const conteoMostrado = conteo ?? conteoFallback;

  const fetchConteo = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoadingConteo(true);
    if (!isBackground) setErrorConteo("");
    try {
      const resp = await fetch(`${API_BASE}/api/callcenter/conteo`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const text = await resp.text();
      let json: unknown;
      try {
        json = JSON.parse(text) as unknown;
      } catch {
        throw new Error("El servidor no devolvió JSON válido.");
      }
      if (!resp.ok) throw new Error("Error consultando conteo");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = json as any;
      const zonasRaw = parsed.data?.zonas ?? parsed.zonas ?? {};

      const buildZona = (z: ZonaKey): ZonaCount => {
        const zr = zonasRaw[z] ?? zonasRaw[z.toLowerCase()] ?? zonasRaw[z.toUpperCase()];
        const total = Number(zr?.total ?? 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incidencias = (zr?.incidencias ?? []).map((i: any) => ({
          incidencia: normalizeIncidencia(String(i.incidencia ?? "SIN INCIDENCIA")),
          total: Number(i.total ?? 0),
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        incidencias.sort((a: any, b: any) => b.total - a.total);
        return { zona: z, total, incidencias };
      };

      const zonaNorte = buildZona("NORTE");
      const zonaCentro = buildZona("CENTRO");
      const zonaSur = buildZona("SUR");
      const totalCalculado = zonaNorte.total + zonaCentro.total + zonaSur.total;

      setConteo({
        zonas: { NORTE: zonaNorte, CENTRO: zonaCentro, SUR: zonaSur },
        totalGeneral: totalCalculado,
      });
      setLastUpdated(new Date());
      setErrorConteo("");
    } catch (err) {
      console.error("Error fetching conteo:", err);
      if (!isBackground) setErrorConteo(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      if (!isBackground) setLoadingConteo(false);
    }
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers("");
    try {
      const [appRes, adminRes] = await Promise.all([obtenerUsuariosSistema("APP"), obtenerUsuariosSistema("ADMIN")]);
      
      // Casteo seguro usando unknown primero
      if (appRes.resp.ok) {
        setUsersApp((appRes.json.usuarios as unknown) as UsuarioSistema[]);
      }
      if (adminRes.resp.ok) {
        setUsersAdmin((adminRes.json.usuarios as unknown) as UsuarioSistema[]);
      }
    } catch (err) {
      setErrorUsers(err instanceof Error ? err.message : "Error cargando usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchConteo(false);
    const intervalId = setInterval(() => fetchConteo(true), 5000);
    return () => clearInterval(intervalId);
  }, [fetchConteo]);

  useEffect(() => {
    // Si cambio a vista USUARIOS y está vacía, cargar.
    if (view === "USUARIOS" && usersApp.length === 0 && usersAdmin.length === 0) {
      void fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Lógica Métricas
  const zonaPrioritaria = useMemo(() => {
    const arr = (["NORTE", "CENTRO", "SUR"] as ZonaKey[]).map((z) => ({
      zona: z,
      total: conteoMostrado.zonas[z].total,
    }));
    arr.sort((a, b) => b.total - a.total);
    return arr[0]?.zona ?? "NORTE";
  }, [conteoMostrado]);

  const rankingTop5 = useMemo(() => {
    let lista: IncidenciaCount[] = [];
    if (zonaMetricas === "TODAS") {
      lista = [
        ...conteoMostrado.zonas.NORTE.incidencias,
        ...conteoMostrado.zonas.CENTRO.incidencias,
        ...conteoMostrado.zonas.SUR.incidencias,
      ];
    } else {
      lista = conteoMostrado.zonas[zonaMetricas as ZonaKey].incidencias;
    }
    const map = new Map<string, number>();
    lista.forEach((it) => {
      const key = normalizeIncidencia(it.incidencia);
      map.set(key, (map.get(key) ?? 0) + it.total);
    });
    const arr = Array.from(map.entries()).map(([incidencia, total]) => ({ incidencia, total }));
    arr.sort((a, b) => b.total - a.total);
    return arr.slice(0, 5);
  }, [conteoMostrado, zonaMetricas]);

  const maxZonaTotal = Math.max(
    1,
    conteoMostrado.zonas.NORTE.total,
    conteoMostrado.zonas.CENTRO.total,
    conteoMostrado.zonas.SUR.total
  );

  // RENDER: Métricas Ejecutivas
  const renderMetricasExecutive = () => {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "40px" }}>
        {/* KPI CARDS */}
        <div style={S.execGrid}>
          <div style={{ ...S.kpiCard, borderLeftColor: "#3b82f6" }}>
            <div style={S.kpiLabel}>Total Incidentes</div>
            <div style={S.kpiValue}>
               {loadingConteo ? "..." : conteoMostrado.totalGeneral}
            </div>
            <div style={S.kpiSub}>Registrados hoy</div>
          </div>
          <div style={{ ...S.kpiCard, borderLeftColor: "#ef4444" }}>
            <div style={S.kpiLabel}>Zona con más carga</div>
            <div style={{ ...S.kpiValue, color: "#ef4444" }}>{zonaPrioritaria}</div>
            <div style={S.kpiSub}>Atención Prioritaria</div>
          </div>
          <div style={{ ...S.kpiCard, borderLeftColor: "#10b981" }}>
            <div style={S.kpiLabel}>Ultima Sincronización</div>
            <div style={{ ...S.kpiValue, color: "#10b981", fontSize: "24px" }}>
               {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={S.kpiSub}>Sistema en Línea</div>
          </div>
        </div>

        {/* CHART: Barras */}
        <div style={S.chartContainer}>
          <div style={S.chartHeader}>
            <div style={S.chartTitle}>Comparativa por Zona</div>
            <button type="button" style={{...S.smallBtn, opacity: loadingConteo ? 0.6 : 1}} onClick={() => void fetchConteo(false)}>
              {loadingConteo ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
          <div style={S.barChartFrame}>
            <div style={S.barColumn}>
              <div style={S.barValueFloat}>{conteoMostrado.zonas.NORTE.total}</div>
              <div style={S.barFill((conteoMostrado.zonas.NORTE.total / maxZonaTotal) * 100 || 2, "#3b82f6")} />
              <div style={S.barLabel}>NORTE</div>
            </div>
            <div style={S.barColumn}>
              <div style={S.barValueFloat}>{conteoMostrado.zonas.CENTRO.total}</div>
              <div style={S.barFill((conteoMostrado.zonas.CENTRO.total / maxZonaTotal) * 100 || 2, "#8b5cf6")} />
              <div style={S.barLabel}>CENTRO</div>
            </div>
            <div style={S.barColumn}>
              <div style={S.barValueFloat}>{conteoMostrado.zonas.SUR.total}</div>
              <div style={S.barFill((conteoMostrado.zonas.SUR.total / maxZonaTotal) * 100 || 2, "#f59e0b")} />
              <div style={S.barLabel}>SUR</div>
            </div>
          </div>
        </div>

        {/* TABLE: Ranking */}
        <div style={S.chartContainer}>
          <div style={S.chartHeader}>
            <div style={S.chartTitle}>Top 5 Incidencias</div>
            <select
              value={zonaMetricas}
              onChange={(e) => setZonaMetricas(e.target.value as ZonaUI)}
              style={S.select}
            >
              <option value="TODAS">Todas las Zonas</option>
              <option value="NORTE">Solo Norte</option>
              <option value="CENTRO">Solo Centro</option>
              <option value="SUR">Solo Sur</option>
            </select>
          </div>
          <table style={S.execTable}>
            <thead>
              <tr>
                <th style={S.execTh}>#</th>
                <th style={S.execTh}>Incidencia</th>
                <th style={S.execTh}>Cant.</th>
                <th style={S.execTh}>% Impacto</th>
              </tr>
            </thead>
            <tbody>
              {rankingTop5.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                    Sin datos disponibles.
                  </td>
                </tr>
              ) : (
                rankingTop5.map((item, idx) => {
                  const maxVal = rankingTop5[0]?.total || 1;
                  const pct = (item.total / maxVal) * 100;
                  return (
                    <tr key={idx}>
                      <td style={S.execTd}>{idx + 1}</td>
                      <td style={S.execTd}>{item.incidencia}</td>
                      <td style={S.execTd}>
                         <span style={S.badge(idx)}>{item.total}</span>
                      </td>
                      <td style={S.execTd}>
                        <div style={S.progressBarBg}>
                          <div style={S.progressBarFill(pct, idx === 0)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderZonaSimple = (z: ZonaKey) => {
    const zona = conteoMostrado.zonas[z];
    return (
      <div style={S.zoneCard}>
        <div style={S.zoneTitle}>
          <span>{z}</span>
          <span>Total: {zona.total}</span>
        </div>
        {zona.incidencias.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "13px" }}>Sin incidencias.</div>
        ) : (
          <div>
            {zona.incidencias.slice(0, 10).map((it, idx) => (
              <div key={idx} style={S.listItem}>
                <span style={{ fontWeight: 700 }}>{it.incidencia}</span>
                <span style={{ fontWeight: 900 }}>{it.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // USUARIOS
  const allUsers = useMemo(() => {
    const qx = q.trim().toLowerCase();
    const app = usersApp.map((u) => ({ tipo: "APP" as const, u }));
    const adm = usersAdmin.map((u) => ({ tipo: "ADMIN" as const, u }));
    let merged = [...app, ...adm];
    if (tipoUsers !== "TODOS") merged = merged.filter((x) => x.tipo === tipoUsers);
    if (qx) {
      merged = merged.filter(({ u }) => {
        const txt = [u.nombres, u.nombre, u.usuario, u.dni].join(" ").toLowerCase();
        return txt.includes(qx);
      });
    }
    merged.sort((a, b) => a.u.id - b.u.id);
    return merged;
  }, [usersApp, usersAdmin, tipoUsers, q]);

  const handleOpenUser = (u: UsuarioSistema, tipo: "APP" | "ADMIN") => {
    setUsuarioModal(toUsuarioModal(u, tipo));
    setOpenModal(true);
  };

  return (
    <div style={S.layoutWrap}>
      <div style={S.topRow}>
        <div style={S.panelCallCenter}>
          <div style={{ fontWeight: 900, fontSize: "20px", textAlign: "center", marginBottom: "10px" }}>
            PANEL DE CONTROL
          </div>
          <div style={S.bigTabs}>
            <button type="button" style={S.tabBtn(view === "RESUMEN")} onClick={() => setView("RESUMEN")}>
              ZONAS
            </button>
            <button type="button" style={S.tabBtn(view === "METRICAS")} onClick={() => setView("METRICAS")}>
              MÉTRICAS (BI)
            </button>
            <button type="button" style={S.tabBtn(view === "USUARIOS")} onClick={() => setView("USUARIOS")}>
              USUARIOS
            </button>
          </div>
          <div style={S.btnRow}>
            <button type="button" style={S.smallBtn} onClick={onBack}>
              Volver
            </button>
            <button type="button" style={S.darkBtn} onClick={onLogout}>
              Salir
            </button>
            {/* BOTÓN F5 REAL */}
            <button type="button" style={S.smallBtn} onClick={() => window.location.reload()}>
              ⟳ F5
            </button>
          </div>
          <div style={{ marginTop: "10px", fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
            <span>Usuario: <strong>{userName}</strong></span>
          </div>
        </div>

        <div style={S.internalCard}>
          <div style={{ fontSize: "12px", color: "#475569" }}>Datos Internos</div>
          <div style={{ marginTop: "5px", fontSize: "13px" }}>
            <strong>{internoNombre || "-"}</strong> <br />
            <span style={{ fontSize: "11px", color: "#64748b" }}>{internoRoperoTurno}</span>
          </div>
          {onOpenInternalLogin && (
            <button
              type="button"
              style={{ ...S.smallBtn, width: "100%", background: "#fff", marginTop: "8px" }}
              onClick={onOpenInternalLogin}
            >
              Cambiar
            </button>
          )}
        </div>
      </div>

      <div style={S.midArea}>
        {view === "METRICAS" ? (
          renderMetricasExecutive()
        ) : view === "USUARIOS" ? (
          <div style={S.conteoWrap}>
            <div style={S.usersPanel}>
               <div style={{ display: 'flex', gap: '10px', padding: '15px', borderBottom: '1px solid #f1f5f9' }}>
                 <input placeholder="Buscar usuario..." value={q} onChange={e => setQ(e.target.value)} style={S.input} />
                 
                 {/* Indicador visual de carga y error en usuarios */}
                 <button type="button" style={{...S.smallBtn, opacity: loadingUsers ? 0.6 : 1}} onClick={() => void fetchUsers()}>
                    {loadingUsers ? "Cargando..." : "Refrescar"}
                 </button>

                 <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                    {(["TODOS", "APP", "ADMIN"] as const).map(f => (
                       <button 
                         key={f}
                         type="button"
                         style={{
                           ...S.smallBtn, 
                           background: tipoUsers === f ? "#0f172a" : "#fff",
                           color: tipoUsers === f ? "#fff" : "#475569"
                         }}
                         onClick={() => setTipoUsers(f)}
                       >
                         {f}
                       </button>
                    ))}
                 </div>
               </div>
               
               {/* Mensaje de error de usuarios si existe */}
               {errorUsers && <div style={{padding:"10px", color:"red", fontSize:"12px"}}>{errorUsers}</div>}

               <div style={S.tableWrap}>
                 <table style={S.table}>
                   <thead>
                     <tr>
                       <th style={{...S.execTh, padding: '12px'}}>ID</th>
                       <th style={{...S.execTh, padding: '12px'}}>Usuario</th>
                       <th style={{...S.execTh, padding: '12px'}}>Nombre</th>
                       <th style={{...S.execTh, padding: '12px'}}>Rol</th>
                       <th style={{...S.execTh, padding: '12px'}}>DNI</th>
                     </tr>
                   </thead>
                   <tbody>
                     {allUsers.map(({u, tipo}) => (
                       <tr key={`${tipo}-${u.id}`} onClick={() => handleOpenUser(u, tipo)} style={{cursor:'pointer', borderBottom:'1px solid #f8fafc'}}>
                         <td style={{padding:'12px', fontSize:'13px'}}>{u.id}</td>
                         <td style={{padding:'12px', fontSize:'13px', fontWeight:600}}>{u.usuario || u.nombre_usuario}</td>
                         <td style={{padding:'12px', fontSize:'13px'}}>{u.nombres || u.nombre}</td>
                         <td style={{padding:'12px', fontSize:'13px'}}>
                           <span style={{
                             padding:'2px 8px', borderRadius:'4px', fontSize:'11px', fontWeight:700,
                             background: tipo === 'ADMIN' ? '#fef3c7' : '#e0f2fe',
                             color: tipo === 'ADMIN' ? '#d97706' : '#0369a1'
                           }}>
                             {tipo}
                           </span>
                         </td>
                         <td style={{padding:'12px', fontSize:'13px'}}>{u.dni || "-"}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        ) : (
          <div style={S.conteoWrap}>
            {errorConteo && <div style={S.errorBox}>{errorConteo}</div>}
            <div style={S.zonesRow}>
              {renderZonaSimple("NORTE")}
              {renderZonaSimple("CENTRO")}
              {renderZonaSimple("SUR")}
            </div>
            <div style={S.totalBar}>
              <div>TOTAL INCIDENCIAS HOY</div>
              <div style={{ fontSize: "24px", fontWeight: 900 }}>{conteoMostrado.totalGeneral}</div>
            </div>
          </div>
        )}
      </div>

      <UserDetailsModal open={openModal} onClose={() => setOpenModal(false)} usuario={usuarioModal} />
    </div>
  );
}