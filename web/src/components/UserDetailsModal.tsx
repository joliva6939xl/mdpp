import { useEffect, useMemo, useState } from "react";
import "./UserDetailsModal.css";
import { MultimediaGallery } from "./MultimediaGallery";

// 🚨 URL FIJA AL SERVIDOR LOCAL (Asegura que apunte al puerto 4000)
const API_URL = "http://localhost:4000";

type Participante = { nombre?: string; dni?: string; };

export type UsuarioApp = {
  id: number;
  nombre: string;
  cargo: string;
  usuario: string;
  dni: string;
  celular: string;
  correo?: string;
  direccion?: string;
  creado_en?: string;
  estado?: string;
  foto_ruta?: string | null;
};

type ParteArchivo = { id: number; tipo: "foto" | "video"; ruta: string; nombre_original: string; };

type RawArchivoParte = {
  id?: number; 
  tipo?: string; tipo_archivo?: string; tipo_media?: string;
  ruta?: string; ruta_archivo?: string; path?: string; url?: string; filepath?: string; file_path?: string;
  nombre_original?: string; nombre?: string; filename?: string; originalname?: string;
  parte_id?: number;
};

type ParteVirtual = {
  id: number;
  fecha?: string | null; creado_en?: string | null;
  hora?: string | null; hora_inicio?: string | null; hora_fin?: string | null;
  sector?: string | null; zona?: string | null; turno?: string | null;
  lugar?: string | null; ubicacion_exacta?: string | null;
  unidad_tipo?: string | null; unidad_numero?: string | null; placa?: string | null;
  conductor?: string | null; dni_conductor?: string | null;
  sumilla?: string | null; asunto?: string | null; ocurrencia?: string | null;
  descripcion?: string | null; parte_fisico?: string | null;
  supervisor_zonal?: string | null; supervisor_general?: string | null;
  sup_zonal?: string | null; sup_general?: string | null;
  participantes?: Participante[] | string | null;
  fotos?: ParteArchivo[]; videos?: ParteArchivo[];
};

type Props = { open: boolean; onClose: () => void; usuario: UsuarioApp | null; };
type ParteViewProps = { parte: ParteVirtual; usuario: UsuarioApp };

const BASE_HEADERS = { "Content-Type": "application/json" };

// Helper para Foto de Perfil
const getUserPhotoUrl = (rutaRaw: string | null | undefined) => {
  if (!rutaRaw) return "";
  const clean = rutaRaw.replace(/\\/g, "/").replace(/^.*uploads\//, "");
  return `${API_URL}/uploads/${clean}`;
};

// 🟢 HELPER MAESTRO: CONSTRUCCIÓN MANUAL DE RUTA
const buildParteMediaUrl = (rutaRaw: string | undefined | null, parteId: number) => {
  if (!rutaRaw) return ""; 
  
  // 1. Limpiamos barras invertidas
  const cleanRaw = rutaRaw.replace(/\\/g, "/");
  
  // 2. Obtenemos SOLO el nombre del archivo (ej: 1766...jpg)
  const segments = cleanRaw.split("/");
  const fileName = segments[segments.length - 1];

  // 3. Construimos la URL completa manual
  // Resultado: http://localhost:4000/uploads/partes/44/nombre_archivo.jpg
  return `${API_URL}/uploads/partes/${parteId}/${fileName}`;
};

const safeJson = async <T,>(res: Response): Promise<T | null> => {
  try { return (await res.json()) as T; } catch { return null; }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizarParticipantes = (raw: any): Participante[] => {
  try {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(p => typeof p === "object").map(p => p as Participante);
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(p => typeof p === "object").map(p => p as Participante);
    }
    return [];
  } catch { return []; }
};

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
};

export const UserDetailsModal = ({ open, onClose, usuario }: Props) => {
  if (!open || !usuario) return null;
  return <UserDetailsModalInner key={`udm-${usuario.id}`} onClose={onClose} usuario={usuario} />;
};

type InnerProps = { onClose: () => void; usuario: UsuarioApp; };

const UserDetailsModalInner = ({ onClose, usuario }: InnerProps) => {
  const [tab, setTab] = useState<"info" | "partes">("info");
  const [loadingUsuario, setLoadingUsuario] = useState(true);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioApp | null>(null);
  const [loadingPartes, setLoadingPartes] = useState(true);
  const [partes, setPartes] = useState<ParteVirtual[]>([]);
  const [parteSeleccionado, setParteSeleccionado] = useState<ParteVirtual | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${API_URL}/api/admin/usuario-details/${usuario.id}`, { headers: BASE_HEADERS });
      const data = await safeJson<{ usuario?: UsuarioApp; user?: UsuarioApp; data?: UsuarioApp }>(res);
      setDetalleUsuario(res.ok && data ? (data.usuario ?? data.user ?? data.data ?? null) : null);
      setLoadingUsuario(false);
    };
    void run();
  }, [usuario.id]);

  useEffect(() => {
    const run = async () => {
      const res = await fetch(`${API_URL}/api/admin/usuario-partes/${usuario.id}`, { headers: BASE_HEADERS });
      const data = await safeJson<{ partes?: ParteVirtual[]; data?: ParteVirtual[]; rows?: ParteVirtual[]; lista?: ParteVirtual[] }>(res);
      if (res.ok && data) {
        const lista = data.partes ?? data.data ?? data.rows ?? data.lista ?? [];
        setPartes(Array.isArray(lista) ? lista : []);
      } else {
        setPartes([]);
      }
      setLoadingPartes(false);
    };
    void run();
  }, [usuario.id]);

  const u = detalleUsuario ?? usuario;
  const nombreCV = useMemo(() => u.nombre || u.usuario || `Usuario ${u.id}`, [u]);
  const fotoUrl = useMemo(() => getUserPhotoUrl(u.foto_ruta), [u.foto_ruta]);

  const resumenPartes = useMemo(() => partes.map((p) => ({
    id: p.id,
    incidencia: p.sumilla || p.descripcion || p.parte_fisico || "Sin incidencia",
    fecha: p.fecha || p.creado_en || "-"
  })), [partes]);

  const cargarDetalleParte = async (idParte: number) => {
    // 🟢 SIN HEADERS RAROS: Solo usamos ?t= para evitar caché.
    // Esto evita el error de CORS "Cache-Control not allowed".
    const timestamp = new Date().getTime();
    const res = await fetch(`${API_URL}/api/partes/${idParte}?t=${timestamp}`, { 
      headers: BASE_HEADERS 
    });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await safeJson<any>(res);
    
    if (!res.ok || !data) return;

    const base = data.parte ?? data.data ?? data.parteVirtual ?? data.parte_detalle ?? data.detalle ?? null;
    if (!base) return;

    let archivosRaw: RawArchivoParte[] = [];
    if (Array.isArray(data.archivos)) {
        archivosRaw = data.archivos;
    } else if (Array.isArray(base.archivos)) {
        archivosRaw = base.archivos;
    } else if (Array.isArray(base.fotos) || Array.isArray(base.videos)) {
        archivosRaw = [...(base.fotos || []), ...(base.videos || [])];
    }

    console.log(`[Parte ${idParte}] Archivos crudos:`, archivosRaw);

    let fotos: ParteArchivo[] = [];
    let videos: ParteArchivo[] = [];

    if (archivosRaw.length > 0) {
      const mapped: ParteArchivo[] = archivosRaw.map((a: RawArchivoParte, idx: number) => {
        const rawPath = a.ruta || a.path || a.filepath || a.url || "";
        const nombreOriginal = a.nombre_original || a.originalname || `archivo_${idx + 1}`;
        
        // 🟢 Generamos la URL usando la lógica ID + Nombre
        const finalUrl = buildParteMediaUrl(rawPath, idParte);

        const tipoRaw = String(a.tipo || a.tipo_archivo || "").toLowerCase();
        const esVideo = tipoRaw.includes("video") || 
                        finalUrl.toLowerCase().endsWith(".mp4") || 
                        finalUrl.toLowerCase().endsWith(".mov");

        const tipoFinal: "video" | "foto" = esVideo ? "video" : "foto";

        return {
          id: a.id ?? idx + 1,
          tipo: tipoFinal,
          ruta: finalUrl,
          nombre_original: nombreOriginal
        } as ParteArchivo;
      });

      fotos = mapped.filter((m) => m.tipo === "foto");
      videos = mapped.filter((m) => m.tipo === "video");
    }

    setParteSeleccionado({
      ...base,
      fotos,
      videos,
      participantes: normalizarParticipantes(base.participantes)
    });
  };

  return (
    <div className="udm-backdrop" role="dialog">
      <div className="udm-modal">
        <div className="udm-header">
          <div className="udm-titleBlock">
            <div className="udm-titleName">{nombreCV}</div>
            <div className="udm-subLine">ID: <strong>{u.id}</strong> · Usuario: <strong>{u.usuario}</strong></div>
          </div>
          <div className="udm-headerRight">
            <div className="udm-chip">{u.cargo || "USUARIO"}</div>
            <button className="udm-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="udm-tabs">
          <button className={`udm-tab ${tab === "info" ? "active" : ""}`} onClick={() => setTab("info")}>Información (CV)</button>
          <button className={`udm-tab ${tab === "partes" ? "active" : ""}`} onClick={() => setTab("partes")}>Partes ({partes.length})</button>
        </div>

        <div className="udm-body">
          {tab === "info" && (
            <div className="cvWrap">
              {loadingUsuario ? <div className="udm-loading">Cargando...</div> : (
                <div className="cvCard">
                  <div className="cvBody">
                    <div className="cvLeft">
                      <div className="cvSection">
                        <div className="cvSectionTitle">Identidad</div>
                        <div className="cvRow"><span className="cvLabel">Nombre:</span><span className="cvValue">{nombreCV}</span></div>
                        <div className="cvRow"><span className="cvLabel">DNI:</span><span className="cvValue">{u.dni || "-"}</span></div>
                      </div>
                      <div className="cvSection">
                        <div className="cvSectionTitle">Contacto</div>
                        <div className="cvRow"><span className="cvLabel">Celular:</span><span className="cvValue">{u.celular || "-"}</span></div>
                        <div className="cvRow"><span className="cvLabel">Correo:</span><span className="cvValue">{u.correo || "-"}</span></div>
                        <div className="cvRow"><span className="cvLabel">Dirección:</span><span className="cvValue">{u.direccion || "-"}</span></div>
                      </div>
                    </div>
                    <div className="cvRight">
                      {fotoUrl ? <img className="cvAvatar" src={fotoUrl} alt="avatar" /> : <div className="cvAvatarPlaceholder">Sin foto</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "partes" && (
            <div className="repWrap">
              <div className="repLeftList">
                {loadingPartes ? <div className="udm-loading">Cargando...</div> : (
                  <ul className="repList">
                    {resumenPartes.map(p => (
                      <li key={p.id} className={`repListItem ${parteSeleccionado?.id === p.id ? "selected" : ""}`} onClick={() => cargarDetalleParte(p.id)}>
                        <div className="repListTitle">Parte #{p.id}</div>
                        <div className="repListSub">{p.incidencia}</div>
                        <div className="repListMeta">{p.fecha}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="repRightReport">
                {parteSeleccionado ? <ParteInformeView parte={parteSeleccionado} usuario={u} /> : <div className="udm-empty">Selecciona un parte.</div>}
              </div>
            </div>
          )}
        </div>
        <div className="udm-footer"><button className="udm-footerBtn" onClick={onClose}>Cerrar</button></div>
      </div>
    </div>
  );
};

// ... InformeView ...
const ParteInformeView = ({ parte, usuario }: ParteViewProps) => {
  const [showGallery, setShowGallery] = useState(false);
  const participantes = normalizarParticipantes(parte.participantes);
  
  const incidencia = parte.sumilla || parte.descripcion || parte.parte_fisico || "Sin incidencia";
  const lugar = parte.lugar || parte.ubicacion_exacta || "-";
  const supervisorZonal = parte.supervisor_zonal || parte.sup_zonal || "-";
  const supervisorGeneral = parte.supervisor_general || parte.sup_general || "-";

  const mediaParaGaleria = [
    ...(parte.fotos || []).map(f => ({ tipo: "image" as const, url: f.ruta })),
    ...(parte.videos || []).map(v => ({ tipo: "video" as const, url: v.ruta }))
  ];

  // 🚨 LOG CLAVE: Verifica en consola qué URLs se están generando
  console.log("📸 URLs finales para la galería:", mediaParaGaleria);

  const handleDownload = () => {
    downloadJson(`parte_${parte.id}.json`, { usuario, parte, exportado: new Date().toISOString() });
  };

  return (
    <>
      <MultimediaGallery isOpen={showGallery} onClose={() => setShowGallery(false)} media={mediaParaGaleria} />

      <div className="repCard">
        <div className="repHeaderRow">
          <div>
            <div className="repTitle">INFORME DE PARTE</div>
            <div className="repSubTitle">ID <strong>{parte.id}</strong> · {parte.fecha || parte.creado_en}</div>
          </div>
          <button className="repDownloadBtn" onClick={handleDownload}>📥 Descargar</button>
        </div>

        <div className="repHighlight">
          <div className="repHighlightItem"><span className="repHLLabel">Incidencia</span><span className="repHLValue">{incidencia}</span></div>
          <div className="repHighlightItem"><span className="repHLLabel">Lugar</span><span className="repHLValue">{lugar}</span></div>
        </div>

        <div className="repGrid2">
          <div className="repSection">
            <div className="repSectionTitle">Datos Generales</div>
            <div className="repRow"><span className="repLabel">Sector:</span><span className="repValue">{parte.sector || "-"}</span></div>
            <div className="repRow"><span className="repLabel">Zona:</span><span className="repValue">{parte.zona || "-"}</span></div>
            <div className="repRow"><span className="repLabel">Turno:</span><span className="repValue">{parte.turno || "-"}</span></div>
          </div>
          <div className="repSection">
            <div className="repSectionTitle">Unidad</div>
            <div className="repRow"><span className="repLabel">Unidad:</span><span className="repValue">{parte.unidad_tipo || "-"} {parte.unidad_numero}</span></div>
            <div className="repRow"><span className="repLabel">Conductor:</span><span className="repValue">{parte.conductor || "-"}</span></div>
            <div className="repRow"><span className="repLabel">Placa:</span><span className="repValue">{parte.placa || "-"}</span></div>
          </div>
        </div>

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

        {participantes.length > 0 && (
          <div className="repSection">
            <div className="repSectionTitle">Participantes</div>
            <ul className="repPeopleList">
              {participantes.map((pt, idx) => <li key={idx}><strong>{pt.nombre}</strong> ({pt.dni || "-"})</li>)}
            </ul>
          </div>
        )}

        <div className="repSection">
          <div className="repSectionTitle">Multimedia</div>
          {mediaParaGaleria.length === 0 ? (
            <div className="repMuted">No hay archivos adjuntos.</div>
          ) : (
            <button className="udm-galleryBtn" onClick={() => setShowGallery(true)} style={{
              width: "100%", padding: "15px", backgroundColor: "#f8fafc", border: "2px dashed #cbd5e1", borderRadius: "8px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize: "15px", fontWeight: "600", color: "#334155"
            }}>
              <span style={{fontSize: "20px"}}>📂</span> Ver Expediente Multimedia ({mediaParaGaleria.length})
            </button>
          )}
        </div>
      </div>
    </>
  );
};