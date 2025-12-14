// web/src/components/UserDetailsModal.tsx
import { useEffect, useMemo, useState } from "react";
import "./UserDetailsModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
type Participante = {
  nombre?: string;
  dni?: string;
};

export type UsuarioApp = {
  id: number;
  nombre: string;
  cargo: string;
  usuario: string;
  dni: string;
  celular: string;

  // opcionales (si backend los manda)
  correo?: string;
  direccion?: string;
  creado_en?: string;
  estado?: string;
  foto_ruta?: string | null;
};

type ParteArchivo = {
  id: number;
  tipo: "foto" | "video";
  ruta: string;
  nombre_original: string;
};

type RawArchivoParte = {
  id?: number;
  tipo?: string;
  tipo_archivo?: string;
  tipo_media?: string;
  ruta?: string;
  ruta_archivo?: string;
  path?: string;
  url?: string;
  filepath?: string;
  nombre_original?: string;
  nombre?: string;
  filename?: string;
  originalname?: string;
};

type ParteVirtual = {
  id: number;

  // Datos informe (opcionales)
  fecha?: string | null;
  creado_en?: string | null;

  hora?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;

  sector?: string | null;
  zona?: string | null;
  turno?: string | null;

  lugar?: string | null;
  ubicacion_exacta?: string | null;

  unidad_tipo?: string | null;
  unidad_numero?: string | null;
  placa?: string | null;

  conductor?: string | null;
  dni_conductor?: string | null;

  sumilla?: string | null; // incidencia real
  asunto?: string | null;  // origen de atención real
  ocurrencia?: string | null;

  descripcion?: string | null;
  parte_fisico?: string | null;

  supervisor_zonal?: string | null;
  supervisor_general?: string | null;
  sup_zonal?: string | null;
  sup_general?: string | null;

  participantes?: Participante[] | string | null;

  fotos?: ParteArchivo[];
  videos?: ParteArchivo[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioApp | null;
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const normalizePath = (ruta: string) => ruta.replace(/\\/g, "/").replace(/^\/+/, "");

const getMediaUrl = (ruta?: string | null) => {
  if (!ruta) return "";
  const n = normalizePath(ruta);
  if (n.startsWith("http://") || n.startsWith("https://")) return n;
  if (n.startsWith("uploads/")) return `${API_URL}/${n}`;
  return `${API_URL}/uploads/${n}`;
};

const safeJson = async <T,>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

const normalizarParticipantes = (raw: unknown): Participante[] => {
  try {
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw
        .filter((p) => typeof p === "object" && p !== null)
        .map((p) => p as Participante);
    }

    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => typeof p === "object" && p !== null)
          .map((p) => p as Participante);
      }
    }

    return [];
  } catch {
    return [];
  }
};

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────
// COMPONENTE WRAPPER (sin estado -> no se “queda pegado”)
// ─────────────────────────────────────────────
export const UserDetailsModal = ({ open, onClose, usuario }: Props) => {
  if (!open || !usuario) return null;

  // ✅ al cerrar (open=false) este componente se “desmonta” porque retorna null,
  // y al abrir, el inner se monta de cero (sin necesidad de setState en useEffect).
  return (
    <UserDetailsModalInner
      key={`udm-${usuario.id}`}
      onClose={onClose}
      usuario={usuario}
    />
  );
};

// ─────────────────────────────────────────────
// INNER (estado real aquí)
// ─────────────────────────────────────────────
type InnerProps = {
  onClose: () => void;
  usuario: UsuarioApp;
};

const UserDetailsModalInner = ({ onClose, usuario }: InnerProps) => {
  // estados (inicializados como “fresh”)
  const [tab, setTab] = useState<"info" | "partes">("info");

  const [loadingUsuario, setLoadingUsuario] = useState(true);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioApp | null>(null);

  const [loadingPartes, setLoadingPartes] = useState(true);
  const [partes, setPartes] = useState<ParteVirtual[]>([]);
  const [parteSeleccionado, setParteSeleccionado] = useState<ParteVirtual | null>(null);

  const headers: HeadersInit = { "Content-Type": "application/json" }; // ✅ sin token

  // Carga usuario
  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${API_URL}/api/admin/usuario-details/${usuario.id}`, { headers });
      const data = await safeJson<{
        usuario?: UsuarioApp;
        user?: UsuarioApp;
        data?: UsuarioApp;
      }>(res);

      if (res.ok && data) {
        setDetalleUsuario(data.usuario ?? data.user ?? data.data ?? null);
      } else {
        setDetalleUsuario(null);
      }
      setLoadingUsuario(false);
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id]);

  // Carga partes
  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${API_URL}/api/admin/usuario-partes/${usuario.id}`, { headers });
      const data = await safeJson<{
        partes?: ParteVirtual[];
        data?: ParteVirtual[];
        rows?: ParteVirtual[];
        lista?: ParteVirtual[];
      }>(res);

      if (res.ok && data) {
        const lista = data.partes ?? data.data ?? data.rows ?? data.lista ?? [];
        setPartes(Array.isArray(lista) ? lista : []);
      } else {
        setPartes([]);
      }
      setLoadingPartes(false);
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario.id]);

  const u = detalleUsuario ?? usuario;

  const nombreCV = useMemo(() => {
    const n = (u.nombre || "").trim();
    return n ? n : u.usuario || `Usuario ${u.id}`;
  }, [u.id, u.nombre, u.usuario]);

  const fotoUrl = useMemo(() => getMediaUrl(u.foto_ruta ?? ""), [u.foto_ruta]);

  const resumenPartes = useMemo(() => {
    return partes.map((p) => {
      const incidencia = p.sumilla || p.descripcion || p.parte_fisico || "Sin incidencia";
      const fecha = p.fecha || p.creado_en || "-";
      return { id: p.id, incidencia, fecha };
    });
  }, [partes]);

  const cargarDetalleParte = async (idParte: number) => {
    const res = await fetch(`${API_URL}/api/partes/${idParte}`, { headers });
    const data = await safeJson<{
      parte?: ParteVirtual;
      data?: ParteVirtual;
      parteVirtual?: ParteVirtual;
      parte_detalle?: ParteVirtual;
      detalle?: ParteVirtual;
      archivos?: RawArchivoParte[];
    }>(res);

    if (!res.ok || !data) return;

    const base =
      data.parte ??
      data.data ??
      data.parteVirtual ??
      data.parte_detalle ??
      data.detalle ??
      null;

    if (!base) return;

    // multimedia (si viene como archivos, lo mapeamos)
    let fotos: ParteArchivo[] = Array.isArray(base.fotos) ? base.fotos : [];
    let videos: ParteArchivo[] = Array.isArray(base.videos) ? base.videos : [];

    const archivos = Array.isArray(data.archivos) ? data.archivos : [];
    if (archivos.length > 0) {
      const mapped: ParteArchivo[] = archivos.map((a, idx) => {
        const tipoRaw = String(a.tipo ?? a.tipo_archivo ?? a.tipo_media ?? "").toLowerCase();
        const ruta = String(a.ruta ?? a.ruta_archivo ?? a.path ?? a.url ?? a.filepath ?? "");
        const nombre = String(a.nombre_original ?? a.nombre ?? a.filename ?? a.originalname ?? `archivo_${idx + 1}`);

        const esVideo =
          tipoRaw.includes("video") ||
          ruta.toLowerCase().endsWith(".mp4") ||
          ruta.toLowerCase().endsWith(".mov") ||
          ruta.toLowerCase().endsWith(".avi");

        return {
          id: a.id ?? idx + 1,
          tipo: esVideo ? "video" : "foto",
          ruta,
          nombre_original: nombre,
        };
      });

      fotos = mapped.filter((m) => m.tipo === "foto");
      videos = mapped.filter((m) => m.tipo === "video");
    }

    const participantesNorm = normalizarParticipantes(base.participantes ?? null);

    setParteSeleccionado({
      ...base,
      fotos,
      videos,
      participantes: participantesNorm,
    });
  };

  return (
    <div className="udm-backdrop" role="dialog" aria-modal="true">
      <div className="udm-modal">
        {/* HEADER */}
        <div className="udm-header">
          <div className="udm-titleBlock">
            <div className="udm-titleName">{nombreCV}</div>
            <div className="udm-subLine">
              ID: <strong>{u.id}</strong> · Usuario: <strong>{u.usuario || "-"}</strong>
            </div>
          </div>

          <div className="udm-headerRight">
            <div className="udm-chip">{(u.cargo || "-").toUpperCase()}</div>
            <button className="udm-close" onClick={onClose} type="button">
              ✕
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="udm-tabs">
          <button
            className={`udm-tab ${tab === "info" ? "active" : ""}`}
            onClick={() => setTab("info")}
            type="button"
          >
            Información (CV)
          </button>
          <button
            className={`udm-tab ${tab === "partes" ? "active" : ""}`}
            onClick={() => setTab("partes")}
            type="button"
          >
            Partes (Informe) ({partes.length})
          </button>
        </div>

        {/* BODY */}
        <div className="udm-body">
          {/* CV */}
          {tab === "info" && (
            <div className="cvWrap">
              {loadingUsuario ? (
                <div className="udm-loading">Cargando información...</div>
              ) : (
                <div className="cvCard">
                  <div className="cvBody">
                    <div className="cvLeft">
                      <div className="cvSection">
                        <div className="cvSectionTitle">Identidad</div>
                        <div className="cvRow">
                          <span className="cvLabel">Nombre:</span>
                          <span className="cvValue">{nombreCV}</span>
                        </div>
                        <div className="cvRow">
                          <span className="cvLabel">DNI:</span>
                          <span className="cvValue">{u.dni || "-"}</span>
                        </div>
                        <div className="cvRow">
                          <span className="cvLabel">Cargo/Rol:</span>
                          <span className="cvValue">{u.cargo || "-"}</span>
                        </div>
                      </div>

                      <div className="cvSection">
                        <div className="cvSectionTitle">Contacto</div>
                        <div className="cvRow">
                          <span className="cvLabel">Celular:</span>
                          <span className="cvValue">{u.celular || "-"}</span>
                        </div>
                        <div className="cvRow">
                          <span className="cvLabel">Correo:</span>
                          <span className="cvValue">{u.correo || "-"}</span>
                        </div>
                        <div className="cvRow">
                          <span className="cvLabel">Dirección:</span>
                          <span className="cvValue">{u.direccion || "-"}</span>
                        </div>
                      </div>

                      <div className="cvSection">
                        <div className="cvSectionTitle">Estado</div>
                        <div className="cvRow">
                          <span className="cvLabel">Estado:</span>
                          <span className="cvValue">{u.estado || "-"}</span>
                        </div>
                        <div className="cvRow">
                          <span className="cvLabel">Creado en:</span>
                          <span className="cvValue">{u.creado_en || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cvRight">
                      {fotoUrl ? (
                        <img className="cvAvatar" src={fotoUrl} alt={nombreCV} />
                      ) : (
                        <div className="cvAvatarPlaceholder">Sin foto</div>
                      )}
                      <div className="cvPhotoLabel">Foto de perfil</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INFORME */}
          {tab === "partes" && (
            <div className="repWrap">
              <div className="repLeftList">
                {loadingPartes ? (
                  <div className="udm-loading">Cargando partes...</div>
                ) : resumenPartes.length === 0 ? (
                  <div className="udm-empty">Este usuario no tiene partes registrados.</div>
                ) : (
                  <ul className="repList">
                    {resumenPartes.map((p) => (
                      <li
                        key={p.id}
                        className={`repListItem ${parteSeleccionado?.id === p.id ? "selected" : ""}`}
                        onClick={() => void cargarDetalleParte(p.id)}
                        title="Click para ver el informe completo"
                      >
                        <div className="repListTitle">
                          Parte ID: <strong>{p.id}</strong>
                        </div>
                        <div className="repListSub">{p.incidencia}</div>
                        <div className="repListMeta">{p.fecha}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="repRightReport">
                {parteSeleccionado ? (
                  <ParteInformeView parte={parteSeleccionado} usuario={u} />
                ) : (
                  <div className="udm-empty">Selecciona un parte para ver el informe.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="udm-footer">
          <button className="udm-footerBtn" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// INFORME VIEW (Profesional)
// ─────────────────────────────────────────────
type ParteViewProps = { parte: ParteVirtual; usuario: UsuarioApp };

const ParteInformeView = ({ parte, usuario }: ParteViewProps) => {
  const participantes = normalizarParticipantes(parte.participantes ?? null);

  const fechaMostrada = parte.fecha || parte.creado_en || "-";
  const horaIni = parte.hora_inicio || parte.hora || "-";
  const horaFin = parte.hora_fin || "-";

  const incidencia = parte.sumilla || parte.descripcion || parte.parte_fisico || "Sin incidencia";
  const origen = parte.asunto || "-";
  const lugar = parte.lugar || parte.ubicacion_exacta || "-";

  const supervisorZonal = parte.supervisor_zonal || parte.sup_zonal || "-";
  const supervisorGeneral = parte.supervisor_general || parte.sup_general || "-";

  const fotos = parte.fotos || [];
  const videos = parte.videos || [];
  const tieneMultimedia = fotos.length > 0 || videos.length > 0;

  const handleDownload = () => {
    const payload = {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        cargo: usuario.cargo,
        dni: usuario.dni,
      },
      parte,
      exportado_en: new Date().toISOString(),
    };

    const safeUser = (usuario.usuario || usuario.nombre || `user_${usuario.id}`).replace(/\s+/g, "_");
    downloadJson(`parte_${parte.id}_${safeUser}.json`, payload);
  };

  return (
    <div className="repCard">
      <div className="repHeaderRow">
        <div>
          <div className="repTitle">INFORME DE PARTE VIRTUAL</div>
          <div className="repSubTitle">
            Parte ID <strong>{parte.id}</strong> · {fechaMostrada}
          </div>
        </div>

        <button className="repDownloadBtn" type="button" onClick={handleDownload}>
          📥 Descargar
        </button>
      </div>

      <div className="repHighlight">
        <div className="repHighlightItem">
          <span className="repHLLabel">Incidencia</span>
          <span className="repHLValue">{incidencia}</span>
        </div>
        <div className="repHighlightItem">
          <span className="repHLLabel">Origen de atención</span>
          <span className="repHLValue">{origen}</span>
        </div>
      </div>

      <div className="repGrid2">
        <div className="repSection">
          <div className="repSectionTitle">Datos generales</div>

          <div className="repRow">
            <span className="repLabel">Sector:</span>
            <span className="repValue">{parte.sector || "-"}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Zona:</span>
            <span className="repValue">{parte.zona || "-"}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Turno:</span>
            <span className="repValue">{parte.turno || "-"}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Lugar:</span>
            <span className="repValue">{lugar}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Hora inicio:</span>
            <span className="repValue">{horaIni}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Hora fin:</span>
            <span className="repValue">{horaFin}</span>
          </div>
        </div>

        <div className="repSection">
          <div className="repSectionTitle">Unidad y conductor</div>

          <div className="repRow">
            <span className="repLabel">Unidad:</span>
            <span className="repValue">
              {(parte.unidad_tipo || "-").toString()} {(parte.unidad_numero || "").toString()}
            </span>
          </div>
          <div className="repRow">
            <span className="repLabel">Placa:</span>
            <span className="repValue">{parte.placa || "-"}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Conductor:</span>
            <span className="repValue">{parte.conductor || "-"}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">DNI Conductor:</span>
            <span className="repValue">{parte.dni_conductor || "-"}</span>
          </div>
        </div>
      </div>

      <div className="repGrid2">
        <div className="repSection">
          <div className="repSectionTitle">Supervisión</div>

          <div className="repRow">
            <span className="repLabel">Supervisor Zonal:</span>
            <span className="repValue">{supervisorZonal}</span>
          </div>
          <div className="repRow">
            <span className="repLabel">Supervisor General:</span>
            <span className="repValue">{supervisorGeneral}</span>
          </div>
        </div>

        <div className="repSection">
          <div className="repSectionTitle">Ocurrencia</div>
          <div className="repParagraph">{parte.ocurrencia || parte.descripcion || "-"}</div>
        </div>
      </div>

      {participantes.length > 0 && (
        <div className="repSection">
          <div className="repSectionTitle">Sereno Operador Participante</div>
          <ul className="repPeopleList">
            {participantes.map((pt, idx) => (
              <li key={idx}>
                <strong>{pt.nombre || "-"}</strong>
                {pt.dni ? <span> · DNI: {pt.dni}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="repSection">
        <div className="repSectionTitle">Contenido multimedia</div>

        {!tieneMultimedia ? (
          <div className="repMuted">No hay contenido multimedia.</div>
        ) : (
          <div className="repMediaGrid">
            {fotos.map((f) => (
              <div key={`foto-${f.id}`} className="repMediaItem">
                <img className="repMediaImg" src={getMediaUrl(f.ruta)} alt={f.nombre_original} />
                <div className="repMediaCap">📷 {f.nombre_original}</div>
              </div>
            ))}

            {videos.map((v) => (
              <div key={`video-${v.id}`} className="repMediaItem">
                <video className="repMediaVideo" controls src={getMediaUrl(v.ruta)} />
                <div className="repMediaCap">🎬 {v.nombre_original}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
