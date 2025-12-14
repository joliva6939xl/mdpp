// web/src/components/CallCenterDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { ccdStyles as S } from "./CallCenterDashboard.styles";
import { UserDetailsModal } from "./UserDetailsModal";
import { obtenerUsuariosSistema } from "../services/adminService";

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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function safeNumber(n: unknown) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function Bar({ value, max, height = 10 }: { value: number; max: number; height?: number }) {
  const v = safeNumber(value);
  const m = Math.max(1, safeNumber(max));
  const pct = clamp((v / m) * 100, 0, 100);

  return (
    <div style={S.barOuter(height)} aria-label={`Barra: ${Math.round(pct)}%`} title={`${Math.round(pct)}%`}>
      <div style={S.barInner(pct)} />
    </div>
  );
}

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

  // ───────────── Conteo ─────────────
  const [loadingConteo, setLoadingConteo] = useState(false);
  const [conteo, setConteo] = useState<ConteoData | null>(null);
  const [errorConteo, setErrorConteo] = useState<string>("");

  const [zonaMetricas, setZonaMetricas] = useState<ZonaUI>("TODAS");

  // ───────────── Usuarios ─────────────
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState("");
  const [usersApp, setUsersApp] = useState<UsuarioSistema[]>([]);
  const [usersAdmin, setUsersAdmin] = useState<UsuarioSistema[]>([]);
  const [tipoUsers, setTipoUsers] = useState<"APP" | "ADMIN" | "TODOS">("TODOS");
  const [q, setQ] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioModal | null>(null);

  const conteoMostrado = conteo ?? conteoFallback;

  const fetchConteo = async () => {
    setLoadingConteo(true);
    setErrorConteo("");

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
        throw new Error("El servidor no devolvió JSON válido (revisa /api/callcenter/conteo).");
      }

      if (!resp.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as { message?: unknown }).message || "Error")
            : "Error consultando conteo";
        throw new Error(msg);
      }

      const parsed = json as {
        total_general?: number;
        totalGeneral?: number;
        zonas?: Partial<Record<string, { total?: number; incidencias?: Array<{ incidencia?: string; total?: number }> }>>;
        data?: {
          total_general?: number;
          totalGeneral?: number;
          zonas?: Partial<Record<string, { total?: number; incidencias?: Array<{ incidencia?: string; total?: number }> }>>;
        };
      };

      const zonasRaw = parsed.data?.zonas ?? parsed.zonas ?? {};
      const totalGeneralRaw = parsed.data?.total_general ?? parsed.data?.totalGeneral ?? parsed.total_general ?? parsed.totalGeneral ?? 0;

      const buildZona = (z: ZonaKey): ZonaCount => {
        const zr = zonasRaw[z] ?? zonasRaw[z.toLowerCase()] ?? zonasRaw[z.toUpperCase()];
        const total = Number(zr?.total ?? 0);

        const incidencias = (zr?.incidencias ?? []).map((i) => ({
          incidencia: normalizeIncidencia(String(i.incidencia ?? "SIN INCIDENCIA")),
          total: Number(i.total ?? 0),
        }));
        incidencias.sort((a, b) => b.total - a.total);

        return { zona: z, total, incidencias };
      };

      setConteo({
        zonas: {
          NORTE: buildZona("NORTE"),
          CENTRO: buildZona("CENTRO"),
          SUR: buildZona("SUR"),
        },
        totalGeneral: Number(totalGeneralRaw ?? 0),
      });
    } catch (err) {
      setErrorConteo(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoadingConteo(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers("");

    try {
      const [appRes, adminRes] = await Promise.all([
        obtenerUsuariosSistema("APP"),
        obtenerUsuariosSistema("ADMIN"),
      ]);

      if (appRes.resp.ok && appRes.json.ok) {
        setUsersApp((appRes.json.usuarios ?? []) as unknown as UsuarioSistema[]);
      } else {
        setUsersApp([]);
      }

      if (adminRes.resp.ok && adminRes.json.ok) {
        setUsersAdmin((adminRes.json.usuarios ?? []) as unknown as UsuarioSistema[]);
      } else {
        setUsersAdmin([]);
      }
    } catch (err) {
      setErrorUsers(err instanceof Error ? err.message : "Error cargando usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  // ✅ carga automática del conteo
  useEffect(() => {
    void fetchConteo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ cuando entras a VER USUARIOS, carga lista (una vez / o refrescas con botón)
  useEffect(() => {
    if (view !== "USUARIOS") return;
    if (usersApp.length === 0 && usersAdmin.length === 0) void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const topIncidenciaPorZona = useMemo(() => {
    const top = (z: ZonaKey) => conteoMostrado.zonas[z].incidencias[0] ?? { incidencia: "-", total: 0 };
    return { NORTE: top("NORTE"), CENTRO: top("CENTRO"), SUR: top("SUR") };
  }, [conteoMostrado]);

  const zonaPrioritaria = useMemo(() => {
    const arr = (["NORTE", "CENTRO", "SUR"] as ZonaKey[]).map((z) => ({ zona: z, total: conteoMostrado.zonas[z].total }));
    arr.sort((a, b) => b.total - a.total);
    return arr[0]?.zona ?? "NORTE";
  }, [conteoMostrado]);

  const rankingGeneralTop5 = useMemo(() => {
    const map = new Map<string, number>();
    const add = (list: IncidenciaCount[]) => {
      list.forEach((it) => {
        const key = normalizeIncidencia(it.incidencia);
        map.set(key, (map.get(key) ?? 0) + Number(it.total ?? 0));
      });
    };
    add(conteoMostrado.zonas.NORTE.incidencias);
    add(conteoMostrado.zonas.CENTRO.incidencias);
    add(conteoMostrado.zonas.SUR.incidencias);

    const arr = Array.from(map.entries()).map(([incidencia, total]) => ({ incidencia, total }));
    arr.sort((a, b) => b.total - a.total);
    return arr.slice(0, 5);
  }, [conteoMostrado]);

  const rankingZonaSeleccionadaTop5 = useMemo(() => {
    if (zonaMetricas === "TODAS") return rankingGeneralTop5;
    return conteoMostrado.zonas[zonaMetricas].incidencias.slice(0, 5);
  }, [conteoMostrado, zonaMetricas, rankingGeneralTop5]);

  const totalMetricas = useMemo(() => {
    if (zonaMetricas === "TODAS") return conteoMostrado.totalGeneral;
    return conteoMostrado.zonas[zonaMetricas].total;
  }, [conteoMostrado, zonaMetricas]);

  const maxZonaTotal = useMemo(() => {
    return Math.max(1, conteoMostrado.zonas.NORTE.total, conteoMostrado.zonas.CENTRO.total, conteoMostrado.zonas.SUR.total);
  }, [conteoMostrado]);

  const maxTop5 = useMemo(() => Math.max(1, rankingZonaSeleccionadaTop5[0]?.total ?? 0), [rankingZonaSeleccionadaTop5]);

  const renderZona = (z: ZonaKey) => {
    const zona = conteoMostrado.zonas[z];
    return (
      <div style={S.zoneCard}>
        <div style={S.zoneTitle}>
          <span>{z}</span>
          <span>Total: {zona.total}</span>
        </div>

        {zona.incidencias.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "13px" }}>
            {loadingConteo ? "Cargando incidencias..." : "Aún no hay incidencias para mostrar."}
          </div>
        ) : (
          <div>
            {zona.incidencias.slice(0, 10).map((it, idx) => (
              <div key={`${it.incidencia}-${idx}`} style={S.listItem}>
                <span style={{ fontWeight: 700 }}>{it.incidencia}</span>
                <span style={{ fontWeight: 900 }}>{it.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderMetricas = () => {
    return (
      <div style={S.conteoWrap}>
        <div style={S.statGrid}>
          <div style={S.statCard}>
            <div style={S.statTitle}>Zona prioritaria</div>
            <div style={S.statValue}>{zonaPrioritaria}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", fontWeight: 700 }}>Mayor cantidad total de hechos</div>
          </div>

          <div style={S.statCard}>
            <div style={S.statTitle}>Total NORTE</div>
            <div style={S.statValue}>{loadingConteo ? "..." : conteoMostrado.zonas.NORTE.total}</div>
            <div style={{ marginTop: 10 }}>
              <Bar value={conteoMostrado.zonas.NORTE.total} max={maxZonaTotal} />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Comparación vs zona mayor</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Top: <strong>{topIncidenciaPorZona.NORTE.incidencia}</strong> ({topIncidenciaPorZona.NORTE.total})
            </div>
          </div>

          <div style={S.statCard}>
            <div style={S.statTitle}>Total CENTRO</div>
            <div style={S.statValue}>{loadingConteo ? "..." : conteoMostrado.zonas.CENTRO.total}</div>
            <div style={{ marginTop: 10 }}>
              <Bar value={conteoMostrado.zonas.CENTRO.total} max={maxZonaTotal} />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Comparación vs zona mayor</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Top: <strong>{topIncidenciaPorZona.CENTRO.incidencia}</strong> ({topIncidenciaPorZona.CENTRO.total})
            </div>
          </div>

          <div style={S.statCard}>
            <div style={S.statTitle}>Total SUR</div>
            <div style={S.statValue}>{loadingConteo ? "..." : conteoMostrado.zonas.SUR.total}</div>
            <div style={{ marginTop: 10 }}>
              <Bar value={conteoMostrado.zonas.SUR.total} max={maxZonaTotal} />
              <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Comparación vs zona mayor</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
              Top: <strong>{topIncidenciaPorZona.SUR.incidencia}</strong> ({topIncidenciaPorZona.SUR.total})
            </div>
          </div>
        </div>

        <div style={S.metricPanel}>
          <div style={S.metricHeaderRow}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>MÉTRICAS (comparativo con barras)</div>

            <label style={{ fontSize: 13, fontWeight: 800 }}>
              Zona:
              <select value={zonaMetricas} onChange={(e) => setZonaMetricas(e.target.value as ZonaUI)} style={S.select}>
                <option value="TODAS">TODAS</option>
                <option value="NORTE">NORTE</option>
                <option value="CENTRO">CENTRO</option>
                <option value="SUR">SUR</option>
              </select>
            </label>

            <div style={{ fontSize: 13, color: "#0f172a" }}>
              <strong>Total hechos:</strong> {loadingConteo ? "..." : totalMetricas}
            </div>
          </div>

          {errorConteo ? <div style={{ marginTop: 10, color: "#991b1b", fontWeight: 800 }}>Error: {errorConteo}</div> : null}

          <div style={S.top5Grid}>
            {rankingZonaSeleccionadaTop5.map((it, idx) => (
              <div key={`${it.incidencia}-${idx}`} style={S.top5Card}>
                <div style={S.top5Title}>TOP {idx + 1}</div>
                <div style={S.top5Incidencia}>{it.incidencia}</div>
                <div style={S.top5Total}>{it.total}</div>
                <div style={{ marginTop: 10 }}>
                  <Bar value={it.total} max={maxTop5} height={9} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={S.smallBtn} onClick={() => void fetchConteo()}>
              Refrescar datos
            </button>
            <button type="button" style={S.darkBtn} onClick={() => setView("RESUMEN")}>
              Volver a ZONAS
            </button>
          </div>
        </div>
      </div>
    );
  };

  const allUsers = useMemo(() => {
    const qx = q.trim().toLowerCase();
    const app = usersApp.map((u) => ({ tipo: "APP" as const, u }));
    const adm = usersAdmin.map((u) => ({ tipo: "ADMIN" as const, u }));

    let merged = [...app, ...adm];

    if (tipoUsers !== "TODOS") merged = merged.filter((x) => x.tipo === tipoUsers);

    if (qx) {
      merged = merged.filter(({ u }) => {
        const nombre = (u.nombres || u.nombre || u.usuario || u.nombre_usuario || "").toString().toLowerCase();
        const usuario = (u.usuario || u.nombre_usuario || "").toString().toLowerCase();
        const dni = (u.dni || "").toString().toLowerCase();
        return nombre.includes(qx) || usuario.includes(qx) || dni.includes(qx);
      });
    }

    merged.sort((a, b) => a.u.id - b.u.id);
    return merged;
  }, [usersApp, usersAdmin, tipoUsers, q]);

  const handleOpenUser = (u: UsuarioSistema, tipo: "APP" | "ADMIN") => {
    setUsuarioModal(toUsuarioModal(u, tipo));
    setOpenModal(true);
  };

  const renderUsers = () => {
    return (
      <div style={S.conteoWrap}>
        <div style={S.usersPanel}>
          <div style={S.usersHeader}>
            <div style={S.usersTitle}>VER USUARIOS (APP y ADMIN)</div>

            <div style={S.searchRow}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre / usuario / DNI..."
                style={S.input}
              />

              <div style={S.pillsRow}>
                <button type="button" style={S.pill(tipoUsers === "TODOS")} onClick={() => setTipoUsers("TODOS")}>
                  TODOS
                </button>
                <button type="button" style={S.pill(tipoUsers === "APP")} onClick={() => setTipoUsers("APP")}>
                  APP
                </button>
                <button type="button" style={S.pill(tipoUsers === "ADMIN")} onClick={() => setTipoUsers("ADMIN")}>
                  ADMIN
                </button>
              </div>

              <button type="button" style={S.smallBtn} onClick={() => void fetchUsers()}>
                Refrescar usuarios
              </button>

              <button type="button" style={S.darkBtn} onClick={() => setView("RESUMEN")}>
                Volver a ZONAS
              </button>
            </div>
          </div>

          {errorUsers ? <div style={{ color: "#991b1b", fontWeight: 900, marginBottom: 10 }}>Error: {errorUsers}</div> : null}

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Tipo</th>
                  <th style={S.th}>ID</th>
                  <th style={S.th}>Nombre</th>
                  <th style={S.th}>Usuario</th>
                  <th style={S.th}>Cargo/Rol</th>
                  <th style={S.th}>DNI</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td style={S.td} colSpan={6}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : allUsers.length === 0 ? (
                  <tr>
                    <td style={S.td} colSpan={6}>
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                ) : (
                  allUsers.map(({ tipo, u }) => {
                    const nombre = (u.nombres || u.nombre || u.usuario || u.nombre_usuario || "-").toString();
                    const usuario = (u.usuario || u.nombre_usuario || "-").toString();
                    const cargo = (u.rol || u.cargo || "-").toString();

                    return (
                      <tr
                        key={`${tipo}-${u.id}`}
                        style={S.row}
                        onClick={() => handleOpenUser(u, tipo)}
                        title="Click para ver perfil y partes"
                      >
                        <td style={S.td}>
                          <strong>{tipo}</strong>
                        </td>
                        <td style={S.td}>{u.id}</td>
                        <td style={S.td}>{nombre}</td>
                        <td style={S.td}>{usuario}</td>
                        <td style={S.td}>{cargo}</td>
                        <td style={S.td}>{u.dni || "-"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b", fontWeight: 800 }}>
            Tip: haz click en un usuario para abrir su perfil y ver/descargar sus partes.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.layoutWrap}>
      <div style={S.topRow}>
        <div style={S.panelCallCenter}>
          <div style={{ fontWeight: 900, fontSize: "18px", textAlign: "center" }}>Panel CALL CENTER</div>

          <div style={S.bigTabs}>
            <button type="button" style={S.tabBtn(view === "RESUMEN")} onClick={() => setView("RESUMEN")}>
              ZONAS
            </button>

            <button type="button" style={S.tabBtn(view === "METRICAS")} onClick={() => setView("METRICAS")}>
              MÉTRICAS
            </button>

            <button type="button" style={S.tabBtn(view === "USUARIOS")} onClick={() => setView("USUARIOS")}>
              VER USUARIOS
            </button>
          </div>

          <div style={S.btnRow}>
            <button type="button" style={S.smallBtn} onClick={onBack}>
              Volver
            </button>
            <button type="button" style={S.darkBtn} onClick={onLogout}>
              Cerrar sesión
            </button>
            <button type="button" style={S.smallBtn} onClick={() => void fetchConteo()}>
              Refrescar conteo
            </button>
          </div>

          <div style={{ marginTop: "10px", color: "#64748b", fontSize: "12px" }}>
            Usuario actual: <strong>{userName}</strong>
          </div>
        </div>

        <div style={S.internalCard}>
          <div style={{ fontSize: "12px", color: "#475569" }}>Datos internos (CALL CENTER)</div>

          <div style={{ marginTop: "8px", fontSize: "13px" }}>
            <div>
              <strong>Nombre:</strong> {internoNombre || "-"}
            </div>
            <div style={{ marginTop: "6px" }}>
              <strong>Ropero Turno:</strong> {internoRoperoTurno || "-"}
            </div>
          </div>

          {onOpenInternalLogin ? (
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                style={{ ...S.smallBtn, width: "100%", background: "#fff", fontWeight: 800 }}
                onClick={onOpenInternalLogin}
              >
                Cambiar datos internos
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div style={S.midArea}>
        {view === "METRICAS" ? (
          renderMetricas()
        ) : view === "USUARIOS" ? (
          renderUsers()
        ) : (
          <div style={S.conteoWrap}>
            {errorConteo ? (
              <div style={S.errorBox}>
                Error cargando conteo: <strong>{errorConteo}</strong>
              </div>
            ) : null}

            <div style={S.zonesRow}>
              {renderZona("NORTE")}
              {renderZona("CENTRO")}
              {renderZona("SUR")}
            </div>

            <div style={S.totalBar}>
              <div style={{ fontWeight: 900 }}>TOTAL INCIDENCIAS DE LAS 3 ZONAS:</div>
              <div style={{ fontWeight: 900, fontSize: "18px" }}>{loadingConteo ? "..." : conteoMostrado.totalGeneral}</div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Modal de perfil + partes (ya incluye descarga del parte en el archivo 3) */}
      <UserDetailsModal open={openModal} onClose={() => setOpenModal(false)} usuario={usuarioModal} />
    </div>
  );
}
