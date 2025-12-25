import { useEffect, useMemo, useState } from "react";
import "./UserDetailsModal.css";
import { MultimediaGallery } from "./MultimediaGallery";

const API_URL = "http://localhost:4000";

// ─────────────────────────────────────────────
// TIPOS E INTERFACES
// ─────────────────────────────────────────────
type Participante = { nombre?: string; dni?: string; };

export type UsuarioApp = { 
    id: number; 
    nombre: string; 
    cargo: string; 
    dni: string; 
    celular: string; 
    correo?: string; 
    direccion?: string; 
    foto_ruta?: string | null; 
};

type ParteArchivo = { 
    id: number; 
    tipo: "foto" | "video"; 
    ruta: string; 
    nombre_original: string; 
};

interface RawFile {
    id?: number;
    ruta?: string;
    path?: string;
    url?: string;
    tipo?: string;
    nombre_original?: string;
}

type ParteVirtual = { 
    id: number; 
    fecha?: string | null; 
    sumilla?: string | null; 
    asunto?: string | null;
    ocurrencia?: string | null;
    descripcion?: string | null; 
    lugar?: string | null;
    ubicacion_exacta?: string | null;
    sector?: string | null;
    zona?: string | null;
    turno?: string | null;
    unidad_tipo?: string | null;
    unidad_numero?: string | null;
    placa?: string | null;
    conductor?: string | null;
    supervisor_zonal?: string | null;
    supervisor_general?: string | null;
    participantes?: Participante[] | string | null; 
    fotos?: ParteArchivo[]; 
    videos?: ParteArchivo[]; 
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const cleanFileName = (rawPath: string | RawFile | null | undefined): string | null => {
    if (!rawPath) return null;
    const pathString = typeof rawPath === 'string' ? rawPath : (rawPath.ruta || rawPath.path || "");
    return pathString.split(/[\\/]/).pop() || null;
};

const getPerfilUrl = (rutaRaw: string | null | undefined) => {
    const file = cleanFileName(rutaRaw);
    return file ? `${API_URL}/uploads/usuarios/${file}` : null;
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export const UserDetailsModal = ({ open, onClose, usuario }: { open: boolean; onClose: () => void; usuario: UsuarioApp | null }) => {
    if (!open || !usuario) return null;
    return <UserDetailsModalInner key={`udm-${usuario.id}`} onClose={onClose} usuario={usuario} />;
};

const UserDetailsModalInner = ({ onClose, usuario }: { onClose: () => void; usuario: UsuarioApp }) => {
    const [tab, setTab] = useState<"info" | "partes">("info");
    const [detalleUsuario, setDetalleUsuario] = useState<UsuarioApp | null>(null);
    
    const [loadingPartes, setLoadingPartes] = useState(true);
    const [partes, setPartes] = useState<ParteVirtual[]>([]);
    const [parteSeleccionado, setParteSeleccionado] = useState<ParteVirtual | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/admin/usuario-details/${usuario.id}`).then(res => res.json()).then(data => {
            setDetalleUsuario(data.usuario || data.user || data.data || null);
        });

        fetch(`${API_URL}/api/admin/usuario-partes/${usuario.id}`)
            .then(res => res.json())
            .then(data => {
                setPartes(Array.isArray(data.partes) ? data.partes : []);
                setLoadingPartes(false); 
            })
            .catch(() => {
                setLoadingPartes(false);
            });
    }, [usuario.id]);

    const u = detalleUsuario ?? usuario;
    const fotoPerfilUrl = useMemo(() => getPerfilUrl(u.foto_ruta), [u.foto_ruta]);

    const cargarDetalleParte = async (idParte: number) => {
        const res = await fetch(`${API_URL}/api/partes/${idParte}`);
        const data = await res.json();
        const base = data.parte || data.data || null;
        if (!base) return;

        const rawItems: RawFile[] = data.archivos || base.archivos || [...(base.fotos || []), ...(base.videos || [])];
        
        const mapped: ParteArchivo[] = rawItems.map((item: RawFile, idx: number) => {
            const rutaReal = typeof item === 'string' ? item : (item.ruta || item.path || item.url || "");
            const fileName = cleanFileName(rutaReal);
            const urlFinal = fileName ? `${API_URL}/uploads/partes/${idParte}/${fileName}` : "";
            
            const tipoItem = item.tipo || "";
            const esVideo = tipoItem.includes("video") || 
                            rutaReal.toLowerCase().endsWith(".mp4") || 
                            rutaReal.toLowerCase().endsWith(".mov");

            return {
                id: item.id || idx,
                tipo: esVideo ? "video" : "foto",
                ruta: urlFinal,
                nombre_original: item.nombre_original || "archivo"
            };
        });

        setParteSeleccionado({ 
            ...base, 
            fotos: mapped.filter(x => x.tipo === "foto" && x.ruta !== ""), 
            videos: mapped.filter(x => x.tipo === "video" && x.ruta !== "") 
        });
    };

    return (
        <div className="udm-backdrop">
            <div className="udm-modal">
                <div className="udm-header">
                    <div className="udm-titleBlock">
                        <div className="udm-titleName">{u.nombre}</div>
                        <div className="udm-subLine">ID: {u.id} | {u.cargo}</div>
                    </div>
                    <button onClick={onClose} className="udm-close">✕</button>
                </div>

                <div className="udm-tabs">
                    <button className={tab === "info" ? "active" : ""} onClick={() => setTab("info")}>Información (CV)</button>
                    <button className={tab === "partes" ? "active" : ""} onClick={() => setTab("partes")}>Partes ({partes.length})</button>
                </div>

                <div className="udm-body">
                    {tab === "info" && (
                        <div className="cvWrap">
                            <div className="cvCard">
                                <div className="cvBody">
                                    <div className="cvLeft">
                                        <p><strong>DNI:</strong> {u.dni}</p>
                                        <p><strong>Celular:</strong> {u.celular}</p>
                                        <p><strong>Correo:</strong> {u.correo || "No registrado"}</p>
                                        <p><strong>Dirección:</strong> {u.direccion || "No registrada"}</p>
                                    </div>
                                    <div className="cvRight">
                                        {fotoPerfilUrl ? (
                                            <img src={fotoPerfilUrl} className="cvAvatar" alt="Perfil" 
                                                 style={{width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover'}}
                                                 onError={(e) => (e.currentTarget.style.display='none')} />
                                        ) : <div className="cvAvatarPlaceholder">Sin foto</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === "partes" && (
                        <div className="repWrap">
                            <div className="repLeftList">
                                {loadingPartes ? (
                                    <p style={{padding: '20px', textAlign: 'center', color: '#666'}}>Cargando partes...</p>
                                ) : partes.length === 0 ? (
                                    <p style={{padding: '20px', textAlign: 'center', color: '#999'}}>No hay partes registrados</p>
                                ) : (
                                    partes.map(p => (
                                        <div key={p.id} className={`repListItem ${parteSeleccionado?.id === p.id ? "selected" : ""}`} 
                                             onClick={() => cargarDetalleParte(p.id)}>
                                            Parte #{p.id} - {p.fecha || "Ver detalle"}
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="repRightReport">
                                {parteSeleccionado ? <ParteInformeView parte={parteSeleccionado} /> : <div className="udm-empty">Selecciona un parte lateral.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// VISTA DEL INFORME (Con VISTA PREVIA DE VIDEO)
// ─────────────────────────────────────────────
const ParteInformeView = ({ parte }: { parte: ParteVirtual }) => {
    const [showGallery, setShowGallery] = useState(false);
    
    const mediaParaGaleria = useMemo(() => {
        const fotos = (parte.fotos || []).map(f => ({ tipo: "image" as const, url: f.ruta }));
        const videos = (parte.videos || []).map(v => ({ tipo: "video" as const, url: v.ruta }));
        return [...fotos, ...videos].filter(m => m.url !== "");
    }, [parte]);

    return (
        <div className="repCard">
            <MultimediaGallery isOpen={showGallery} onClose={() => setShowGallery(false)} media={mediaParaGaleria} />
            
            <div className="repHeaderRow">
                <div className="repTitle">INFORME DE PARTE #{parte.id}</div>
                <div className="repSubTitle">{parte.fecha || "Sin fecha registrada"}</div>
            </div>

            <div className="repGrid2">
                <div className="repSection">
                    <div className="repSectionTitle">Ubicación y Sectorización</div>
                    <div className="repRow"><span className="repLabel">Lugar:</span> <span className="repValue">{parte.lugar || parte.ubicacion_exacta || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Sector:</span> <span className="repValue">{parte.sector || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Zona:</span> <span className="repValue">{parte.zona || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Turno:</span> <span className="repValue">{parte.turno || "-"}</span></div>
                </div>
                <div className="repSection">
                    <div className="repSectionTitle">Recursos y Supervisión</div>
                    <div className="repRow"><span className="repLabel">Unidad:</span> <span className="repValue">{parte.unidad_tipo} {parte.unidad_numero}</span></div>
                    <div className="repRow"><span className="repLabel">Placa:</span> <span className="repValue">{parte.placa || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Conductor:</span> <span className="repValue">{parte.conductor || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Sup. Zonal:</span> <span className="repValue">{parte.supervisor_zonal || "-"}</span></div>
                    <div className="repRow"><span className="repLabel">Sup. General:</span> <span className="repValue">{parte.supervisor_general || "-"}</span></div>
                </div>
            </div>

            <div className="repSection">
                <div className="repSectionTitle">Asunto / Sumilla</div>
                <div className="repParagraph" style={{fontWeight: 'bold', color: '#0f172a'}}>
                    {parte.sumilla || parte.asunto || "Sin asunto especificado"}
                </div>
            </div>

            <div className="repSection">
                <div className="repSectionTitle">Detalle de la Ocurrencia (Escrito)</div>
                <div className="repParagraph" style={{
                    whiteSpace: 'pre-wrap', 
                    background: '#f8fafc', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    {parte.ocurrencia || parte.descripcion || "No se ha registrado el detalle de la ocurrencia."}
                </div>
            </div>

            <div className="repSection">
                <div className="repSectionTitle">Multimedia ({mediaParaGaleria.length} archivos)</div>
                {mediaParaGaleria.length > 0 ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                        <button className="udm-galleryBtn" onClick={() => setShowGallery(true)} style={{padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold'}}>
                            📂 Ver Galería Completa
                        </button>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {mediaParaGaleria.map((m, i) => (
                                <div key={i} style={{ width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                                    {m.tipo === "image" ? (
                                        <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Media" />
                                    ) : (
                                        // 🟢 NUEVO: Usamos la etiqueta VIDEO para mostrar el primer frame
                                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                            <video 
                                                src={m.url} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                muted // Silenciado
                                                preload="metadata" // Carga solo el inicio para mostrar el frame
                                            />
                                            {/* Capa oscura y botón de play superpuesto */}
                                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ color: 'white', fontSize: '24px' }}>▶</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <p className="repMuted">No hay archivos multimedia adjuntos.</p>}
            </div>
        </div>
    );
};