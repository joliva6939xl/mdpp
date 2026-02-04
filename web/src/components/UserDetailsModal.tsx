import React, { useState, useEffect, useMemo } from "react";
import type { UsuarioApp } from "../utils/mapUsuarioModal";
import { adminService } from "../services/adminService";
import type { Parte } from "../services/adminService";

interface Props {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioApp | null;
}

interface ParteDetalle extends Partial<Parte> {
  fotos?: string[];
  videos?: string[];
  ubicacion?: string;
  ubicacion_exacta?: string;
  lugar?: string;
  latitud?: string | number;
  longitud?: string | number;
  
  sector?: string;
  zona?: string;
  turno?: string;
  
  unidad?: string;
  unidad_tipo?: string;
  unidad_numero?: string;
  placa?: string;
  
  supervisores?: string;
  supervisor_zonal?: string;
  sup_zonal?: string;
  supervisor_general?: string;
  sup_general?: string;
  
  conductor?: string;
  dni_conductor?: string;
  auxiliar?: string;
  
  hora_inicio?: string;
  hora_fin?: string;
  
  incidencia?: unknown;
  origen?: unknown;
  
  sumilla?: string; 
  asunto?: string;
  
  ocurrencia?: string;
  parte_fisico?: string;
  descripcion?: string;
}

export const UserDetailsModal: React.FC<Props> = ({ open, onClose, usuario }) => {
  const [activeTab, setActiveTab] = useState<"info" | "partes">("info");
  const [partes, setPartes] = useState<Parte[]>([]);
  const [loadingPartes, setLoadingPartes] = useState(false);
  const [selectedParteId, setSelectedParteId] = useState<number | null>(null);
  const [parteDetalle, setParteDetalle] = useState<ParteDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ✅ TU FUNCIÓN (Está perfecta)
  const safeTxt = (value: unknown, fallback = "No registrada") => {
    if (value === null || value === undefined) return fallback;
    const txt = String(value).trim();
    if (txt === "" || txt.toLowerCase() === "null" || txt === "-") return fallback;
    return txt;
  };

  // ✅ LIMPIADOR (Lógica correcta)
  useEffect(() => {
      setPartes([]);
      setSelectedParteId(null);
      setParteDetalle(null);
      setActiveTab("info");
  }, [usuario]);

  useEffect(() => {
    if (open && usuario && activeTab === "partes") {
      const fetchPartes = async () => {
        setLoadingPartes(true);
        try {
          const { json, success } = await adminService.obtenerUsuarioPartesAdmin(usuario.id);
          if (success) {
            const data = json.partes || json.data || [];
            setPartes(Array.isArray(data) ? (data as Parte[]) : []);
          } else {
             console.error("Error al obtener partes:", json);
          }
        } catch (error) {
          console.error("Error crítico cargando partes", error);
        } finally {
          setLoadingPartes(false);
        }
      };
      fetchPartes();
    }
  }, [open, usuario, activeTab]);

  useEffect(() => {
    if (selectedParteId) {
      const fetchDetalle = async () => {
        setLoadingDetalle(true);
        try {
          const { json, success } = await adminService.obtenerPartePorIdAdmin(selectedParteId);
          if (success) {
            const detalle = json.data || json.parte || json.detalle;
            setParteDetalle(detalle as ParteDetalle);
          }
        } catch (error) {
          console.error("Error cargando detalle parte", error);
        } finally {
          setLoadingDetalle(false);
        }
      };
      fetchDetalle();
    } else {
      setParteDetalle(null);
    }
  }, [selectedParteId]);

  const multimedia = useMemo(() => {
    if (!parteDetalle) return { fotos: [], videos: [] };
    const API_BASE = "http://localhost:4000";
    const cleanUrl = (path: string) => {
       if (path.startsWith("http")) return path;
       const rutaLimpia = path.replace(/^uploads\//, ""); 
       return `${API_BASE}/uploads/${rutaLimpia}`;
    };
    return {
      fotos: (parteDetalle.fotos || []).map(cleanUrl),
      videos: (parteDetalle.videos || []).map(cleanUrl)
    };
  }, [parteDetalle]);

  if (!open || !usuario) return null;

  const API_URL_BASE = "http://localhost:4000";
  
  const getFullUrl = (ruta: string | null) => {
    if (!ruta) return null;
    if (ruta.startsWith("http")) return ruta;
    let cleanPath = ruta.replace(/^uploads\//, ""); 
    if (!cleanPath.includes("/")) {
        cleanPath = `usuarios/${cleanPath}`;
    }
    return `${API_URL_BASE}/uploads/${cleanPath}`;
  };

  const userPhoto = getFullUrl(usuario.foto_ruta);
  const licenciaPhoto = getFullUrl(usuario.foto_licencia);

  // ESTILOS ORIGINALES (Recuperados para que se vea bien)
  const s = {
    overlay: { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" },
    modal: { background: "white", width: "950px", maxWidth: "95vw", height: "90vh", borderRadius: "12px", display: "flex", flexDirection: "column" as const, boxShadow: "0 20px 50px rgba(0,0,0,0.3)", overflow: "hidden", fontFamily: "Segoe UI, sans-serif" },
    header: { padding: "20px 30px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" },
    closeBtn: { border: "none", background: "transparent", fontSize: "28px", color: "#64748b", cursor: "pointer" },
    tabs: { display: "flex", borderBottom: "1px solid #e2e8f0" },
    tabBtn: (isActive: boolean) => ({ flex: 1, padding: "15px", cursor: "pointer", background: isActive ? "white" : "#f1f5f9", border: "none", borderBottom: isActive ? "3px solid #0f172a" : "none", fontWeight: isActive ? 700 : 500, color: isActive ? "#0f172a" : "#64748b" }),
    body: { flex: 1, overflow: "hidden", display: "flex" },
    blockedBox: { marginTop: 10, padding: "10px 15px", background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "6px", color: "#991b1b", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" },
    infoContainer: { padding: "40px", display: "flex", gap: "40px", width: "100%", overflowY: "auto" as const },
    infoColLeft: { flex: 1, display: "flex", flexDirection: "column" as const, gap: "20px" },
    infoRightCol: { width: "300px", display: "flex", flexDirection: "column" as const, gap: "20px", alignItems: "center" },
    infoLabel: { fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" as const, marginBottom: "2px" },
    infoValue: { fontSize: "14px", color: "#1e293b", fontWeight: 500, minHeight: '20px' },
    photoBox: { width: "200px", height: "200px", borderRadius: "12px", border: "2px dashed #cbd5e1", display: "flex", justifyContent: "center", alignItems: "center", background: "#f1f5f9", overflow: "hidden", marginBottom: "10px" },
    licenciaBox: { width: "280px", height: "180px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc", overflow: "hidden", position: "relative" as const },
    roleBadge: { padding: "5px 10px", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: 700, display: "inline-flex", gap: "5px", alignItems: "center", border: "1px solid #bae6fd" },
    splitLayout: { display: "flex", width: "100%", height: "100%" },
    sidebar: { width: "300px", borderRight: "1px solid #e2e8f0", overflowY: "auto" as const, background: "#f8fafc" },
    parteItem: (isSelected: boolean) => ({ padding: "15px", borderBottom: "1px solid #e2e8f0", cursor: "pointer", background: isSelected ? "#eff6ff" : "transparent", borderLeft: isSelected ? "4px solid #3b82f6" : "4px solid transparent" }),
    content: { flex: 1, padding: "30px", overflowY: "auto" as const },
    galleryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px", marginTop: "15px" },
    thumb: { width: "100%", aspectRatio: "1/1", objectFit: "cover" as const, borderRadius: "8px", border: "1px solid #e2e8f0" }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", color: "#0f172a" }}>{safeTxt(usuario.nombre)}</h2>
            <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
              {safeTxt(usuario.cargo)} | ID: {usuario.id}
            </div>
            {usuario.estado === "BLOQUEADO" && (
              <div style={s.blockedBox}>
                <span style={{ fontSize: "16px" }}>⛔</span> 
                <div><strong>USUARIO BLOQUEADO</strong><div style={{ fontWeight: 400 }}>Motivo: {safeTxt(usuario.bloqueo_motivo || "No especificado")}</div></div>
              </div>
            )}
          </div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          <button style={s.tabBtn(activeTab === "info")} onClick={() => setActiveTab("info")}>INFORMACIÓN</button>
          <button style={s.tabBtn(activeTab === "partes")} onClick={() => setActiveTab("partes")}>PARTES ({partes.length})</button>
        </div>

        {/* BODY */}
        <div style={s.body}>
          
          {/* TAB 1: INFO USUARIO COMPLETO (Recuperado) */}
          {activeTab === "info" && (
            <div style={s.infoContainer}>
              <div style={s.infoColLeft}>
                <div><div style={s.infoLabel}>Usuario</div><div style={s.infoValue}>{safeTxt(usuario.usuario)}</div></div>
                <div><div style={s.infoLabel}>DNI</div><div style={s.infoValue}>{safeTxt(usuario.dni)}</div></div>
                <div><div style={s.infoLabel}>Celular</div><div style={s.infoValue}>{safeTxt(usuario.celular)}</div></div>
                <div><div style={s.infoLabel}>Dirección Actual</div><div style={s.infoValue}>{safeTxt(usuario.direccion_actual || usuario.direccion, "No registrada")}</div></div>
                
                {/* 🔥 REFERENCIA: TU LOGICA 🔥 */}
                <div>
                    <div style={s.infoLabel}>Referencia</div>
                    <div style={s.infoValue}>{safeTxt(usuario.referencia, "No registrada")}</div>
                </div>
                
                {/* 🔥 GPS: TU LOGICA CON ENLACE CORREGIDO 🔥 */}
                <div>
                    <div style={s.infoLabel}>Ubicación GPS</div>
                    <div style={s.infoValue}>
                        {usuario.ubicacion_gps && usuario.ubicacion_gps.trim() !== "" ? (
                            <div>
                                <span>{usuario.ubicacion_gps}</span>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${usuario.ubicacion_gps.replace(/\s/g,'')}`}
                                  target="_blank" rel="noreferrer" 
                                  style={{marginLeft:10, fontSize:12, color:'#2563eb', fontWeight:'bold', textDecoration:'underline'}}
                                >
                                  📍 Ver Mapa
                                </a>
                            </div>
                        ) : "No registrada"}
                    </div>
                </div>

                <div>
                   <div style={s.infoLabel}>Estado</div>
                   <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", background: usuario.estado === "ACTIVO" ? "#dcfce7" : "#fee2e2", color: usuario.estado === "ACTIVO" ? "#166534" : "#991b1b" }}>{usuario.estado}</span>
                </div>
                {(usuario.motorizado || usuario.conductor) && (
                    <div>
                        <div style={s.infoLabel}>Categorías</div>
                        <div style={{display:'flex', gap:'10px', marginTop:'5px'}}>
                            {usuario.motorizado && <span style={s.roleBadge}>🛵 Motorizado</span>}
                            {usuario.conductor && <span style={s.roleBadge}>🚙 Conductor</span>}
                        </div>
                    </div>
                )}
              </div>
              <div style={s.infoRightCol}>
                 <div style={{textAlign:'center'}}>
                    <div style={s.photoBox}>{userPhoto ? <img src={userPhoto} alt="Perfil" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <span style={{color:'#cbd5e1'}}>Sin Foto</span>}</div>
                    <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:600}}>FOTO DE PERFIL</span>
                 </div>
                 {(usuario.conductor || usuario.motorizado || licenciaPhoto) && (
                    <div style={{textAlign:'center', marginTop: 15}}>
                        <div style={s.licenciaBox}>{licenciaPhoto ? <a href={licenciaPhoto} target="_blank" rel="noreferrer"><img src={licenciaPhoto} alt="Licencia" style={{width:'100%', height:'100%', objectFit:'contain'}} /></a> : <span style={{fontSize:'12px', color:'#cbd5e1'}}>Sin Licencia</span>}</div>
                        <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:600}}>LICENCIA DE CONDUCIR</span>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* TAB 2: PARTES (REPORTES) */}
          {activeTab === "partes" && (
            <div style={s.splitLayout}>
              <div style={s.sidebar}>
                {loadingPartes && <div style={{padding:20, color:'#64748b'}}>Cargando...</div>}
                {!loadingPartes && partes.length === 0 && <div style={{padding:20, color:'#64748b'}}>No hay partes registrados.</div>}
                {partes.map(p => (
                  <div key={p.id} style={s.parteItem(selectedParteId === p.id)} onClick={() => setSelectedParteId(p.id)}>
                    <div style={{fontWeight:'bold', color:'#0f172a'}}>#{p.id} - {p.fecha}</div>
                    <div style={{fontSize:'12px', color:'#64748b'}}>{p.hora} | {p.zona}</div>
                    <div style={{fontSize:'13px', marginTop:4, color:'#334155'}}>{(p.sumilla || "").substring(0, 30)}...</div>
                  </div>
                ))}
              </div>

              <div style={s.content}>
                {!selectedParteId ? (
                   <div style={{display:'flex', height:'100%', alignItems:'center', justifyContent:'center', color:'#cbd5e1'}}>Selecciona un parte para ver el detalle</div>
                ) : loadingDetalle ? (
                   <div>Cargando detalle completo...</div>
                ) : parteDetalle ? (
                   <div>
                      <h3 style={{margin:'0 0 15px 0', color:'#1e3a8a', borderBottom:'1px solid #e2e8f0', paddingBottom:'10px'}}>
                        Detalle del Parte #{parteDetalle.id || ""}
                      </h3>

                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px', marginBottom:'25px'}}>
                         <div><div style={s.infoLabel}>Fecha</div>{safeTxt(parteDetalle.fecha)}</div>
                         
                         <div><div style={s.infoLabel}>Hora Inicio</div>{safeTxt(parteDetalle.hora_inicio || parteDetalle.hora)}</div>
                         <div><div style={s.infoLabel}>Hora Fin</div>{safeTxt(parteDetalle.hora_fin)}</div>
                         <div><div style={s.infoLabel}>Turno</div>{safeTxt(parteDetalle.turno)}</div>
                         <div><div style={s.infoLabel}>Sector</div>{safeTxt(parteDetalle.sector)}</div>
                         <div><div style={s.infoLabel}>Zona</div>{safeTxt(parteDetalle.zona)}</div>
                         <div><div style={s.infoLabel}>Dirección / Lugar</div>{safeTxt(parteDetalle.ubicacion || parteDetalle.lugar || parteDetalle.ubicacion_exacta)}</div>
                         <div>
                            <div style={s.infoLabel}>Coordenadas GPS</div>
                            {parteDetalle.latitud && parteDetalle.longitud ? (
                                <div>
                                    <div style={{fontSize:'12px'}}>{parteDetalle.latitud}, {parteDetalle.longitud}</div>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${parteDetalle.latitud},${parteDetalle.longitud}`} target="_blank" rel="noreferrer" style={{color:'#2563eb', fontSize:'12px', textDecoration:'underline', fontWeight:'bold'}}>📍 Ver en Google Maps</a>
                                </div>
                            ) : (<span>-</span>)}
                         </div>
                         <div><div style={s.infoLabel}>Unidad</div>{safeTxt(parteDetalle.unidad || parteDetalle.unidad_numero)}</div>
                         <div><div style={s.infoLabel}>Placa</div>{safeTxt(parteDetalle.placa)}</div>
                         <div><div style={s.infoLabel}>Incidencia</div>{safeTxt(parteDetalle.incidencia || parteDetalle.sumilla)}</div>
                         <div><div style={s.infoLabel}>Origen</div>{safeTxt(parteDetalle.origen || parteDetalle.asunto)}</div>
                         <div><div style={s.infoLabel}>Conductor</div>{safeTxt(parteDetalle.conductor)}</div>
                         <div><div style={s.infoLabel}>DNI Conductor</div>{safeTxt(parteDetalle.dni_conductor)}</div>
                         <div><div style={s.infoLabel}>Supervisor Zonal</div>{safeTxt(parteDetalle.supervisor_zonal || parteDetalle.sup_zonal)}</div>
                         <div><div style={s.infoLabel}>Supervisor General</div>{safeTxt(parteDetalle.supervisor_general || parteDetalle.sup_general)}</div>
                      </div>

                      <div style={{background:'#f8fafc', padding:'20px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #e2e8f0'}}>
                         <div style={s.infoLabel}>OCURRENCIA / DETALLE DE LOS HECHOS</div>
                         <p style={{margin:'10px 0 0 0', whiteSpace:'pre-wrap', lineHeight:'1.5', fontSize:'14px', color:'#334155'}}>
                            {parteDetalle.ocurrencia || parteDetalle.parte_fisico || parteDetalle.descripcion || "Sin descripción detallada."}
                         </p>
                      </div>

                      {(multimedia.fotos.length > 0 || multimedia.videos.length > 0) && (
                        <div>
                           <div style={s.infoLabel}>EVIDENCIAS ADJUNTAS ({multimedia.fotos.length} fotos, {multimedia.videos.length} videos)</div>
                           <div style={s.galleryGrid}>
                              {multimedia.fotos.map((src, i) => (
                                <a key={i} href={src} target="_blank" rel="noreferrer">
                                   <img src={src} style={s.thumb} alt={`Evidencia ${i}`} />
                                </a>
                              ))}
                              {multimedia.videos.map((src, i) => (
                                <div key={i} style={{...s.thumb, background:'#000', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'10px'}}>
                                   <a href={src} target="_blank" rel="noreferrer" style={{color:'white', textDecoration:'none'}}>VIDEO ▶</a>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};