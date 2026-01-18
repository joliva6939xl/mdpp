/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadWordButton } from "./DownloadWordButton";

const API_URL = "http://localhost:4000";

// --- UTILIDADES ---
const getLocalToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const cleanFileName = (rawPath: any) => {
    if (!rawPath) return null;
    const pathString = typeof rawPath === 'string' ? rawPath : (rawPath.ruta || rawPath.path || "");
    return pathString.split(/[\\/]/).pop() || null;
};

// Convierte "YYYY-MM-DDTHH:mm..." a "YYYY-MM-DD" para comparar fechas
const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split('T')[0]; // Se queda solo con la parte de la fecha
};

// Convierte hora "HH:MM" a minutos totales para comparar rangos matemáticos
const getMinutes = (horaStr: string) => {
    if (!horaStr) return -1;
    const [hh, mm] = horaStr.split(':').map(Number);
    return hh * 60 + mm;
};

// Rango DÍA: 06:01 (361 min) a 18:00 (1080 min)
const isRangoDia = (mins: number) => mins >= 361 && mins <= 1080;

// Rango NOCHE: 18:01 (1081 min) a 23:59 O 00:00 a 06:00 (360 min)
const isRangoNoche = (mins: number) => (mins >= 1081) || (mins >= 0 && mins <= 360);

const fetchOptions = () => ({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});

interface CallCenterDashboardProps {
    userName?: string;
    onLogout?: () => void;
    internoNombre?: string;
    internoRoperoTurno?: string;
}

const CallCenterDashboard: React.FC<CallCenterDashboardProps> = ({ 
    userName, onLogout, internoNombre, internoRoperoTurno 
}) => {
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [fecha, setFecha] = useState<string>(getLocalToday());
    const [turnoSel, setTurnoSel] = useState<string>("TURNO DIA");
    const [dataZonal, setDataZonal] = useState<any>({ Norte: [], Centro: [], Sur: [], Total: 0 });
    const [loading, setLoading] = useState(false);

    // GESTIÓN MODALES
    const [showModal, setShowModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [userSel, setUserSel] = useState<any>(null);
    const [userPartes, setUserPartes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'cv' | 'partes'>('cv');
    const [parteSel, setParteSel] = useState<any>(null);
    const [mediaSeleccionado, setMediaSeleccionado] = useState<any>(null);

    // --- LÓGICA PRINCIPAL DE FILTRADO ---
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                // Pedimos al API los datos (aunque el API filtre, reforzamos en frontend)
                const res = await fetch(`${API_URL}/api/partes?fecha=${fecha}`, fetchOptions());
                const data = await res.json();
                
                if (isMounted && data.ok) {
                    const lista = data.partes || [];
                    
                    // 🔍 FILTRO TRIPLE: FECHA + ETIQUETA + HORA
                    const filtrados = lista.filter((p: any) => {
                        // 1. VALIDAR FECHA EXACTA (Del Calendario)
                        if (normalizeDate(p.fecha) !== fecha) return false;

                        // 2. PREPARAR DATOS DE TIEMPO Y TEXTO
                        if (!p.hora) return false; 
                        const mins = getMinutes(p.hora);
                        const textoTurno = (p.turno || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                        // 3. VALIDAR TURNO (DOBLE FACTOR)
                        if (turnoSel === "TURNO DIA") {
                            // FACTOR A: Texto dice "DIA" o "MAÑANA"
                            const diceDia = textoTurno.includes("DIA") || textoTurno.includes("MANANA");
                            // FACTOR B: Hora entre 06:01 y 18:00
                            const esHoraDia = isRangoDia(mins);
                            
                            return diceDia && esHoraDia;
                        } else {
                            // FACTOR A: Texto dice "NOCHE"
                            const diceNoche = textoTurno.includes("NOCHE");
                            // FACTOR B: Hora entre 18:01 y 06:00
                            const esHoraNoche = isRangoNoche(mins);
                            
                            return diceNoche && esHoraNoche;
                        }
                    });

                    // 4. CLASIFICACIÓN ZONAL
                    const getZ = (p: any) => (p.zona || "").toLowerCase().trim();
                    
                    setDataZonal({
                        Norte: filtrados.filter((p: any) => getZ(p).includes("norte")),
                        Centro: filtrados.filter((p: any) => getZ(p).includes("centro")),
                        Sur: filtrados.filter((p: any) => getZ(p).includes("sur")),
                        Total: filtrados.length
                    });
                }
            } catch (e) { console.error(e); } finally { if(isMounted) setLoading(false); }
        };
        
        load();
        return () => { isMounted = false; };
    }, [fecha, turnoSel]);

    const renderMapeo = (lista: any[]) => {
        if (lista.length === 0) return <div style={{textAlign:'center', color:'#94a3b8', marginTop:20, fontSize:12}}>∅ Sin registros</div>;
        const conteo: Record<string, number> = {};
        lista.forEach(p => {
            const s = (p.sumilla || "SIN ESPECIFICAR").trim().toUpperCase();
            conteo[s] = (conteo[s] || 0) + 1;
        });
        return (
            <div style={{marginTop:10}}>
                {Object.entries(conteo).map(([n, c]) => (
                    <div key={n} style={{display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px dashed #eee', fontSize:11}}>
                        <span style={{fontWeight:600, color:'#334155'}}>{n}</span>
                        <span style={{fontWeight:800, color:'#3b82f6'}}>{c}</span>
                    </div>
                ))}
            </div>
        );
    };

    // --- FUNCIONES GESTIÓN ---
    const openUsers = async () => { setShowModal(true); setView('list'); const r = await fetch(`${API_URL}/api/usuarios`, fetchOptions()); if(r.ok) setUsuarios(await r.json()); };
    const selectUser = async (u:any) => { setUserSel(u); setView('detail'); setActiveTab('cv'); setParteSel(null); const r = await fetch(`${API_URL}/api/usuarios/${u.id}/partes`, fetchOptions()); if(r.ok) { const d=await r.json(); setUserPartes(d.partes||[]); } };
    const handleSelectParte = async (id: number) => { try { const r = await fetch(`${API_URL}/api/partes/${id}`, fetchOptions()); const d = await r.json(); if(d.ok) setParteSel(d.parte || d.data); } catch(e) { console.error(e); } };
    const navegarGaleria = (dir: 'prev'|'next') => { if(!parteSel?.todosArchivos?.length) return; const idx = parteSel.todosArchivos.findIndex((m:any) => m.url === mediaSeleccionado?.url); const nxt = dir==='next' ? (idx+1)%parteSel.todosArchivos.length : (idx-1+parteSel.todosArchivos.length)%parteSel.todosArchivos.length; setMediaSeleccionado(parteSel.todosArchivos[nxt]); };
    const fotoPerfilUrl = useMemo(() => userSel?.foto_ruta ? `${API_URL}/uploads/usuarios/${cleanFileName(userSel.foto_ruta)}` : null, [userSel]);

    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '30px', background: '#f4f6f8', minHeight: '100vh', display:'flex', gap:20, fontFamily:'sans-serif' },
        card: { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: 10, alignItems:'center' },
        overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000 },
        modal: { background: 'white', width: '90%', maxWidth: '1000px', height: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        btnNav: { padding: '8px 15px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#e2e8f0', fontWeight: 'bold', fontSize: 12 },
        tabBtn: { padding: '8px 16px', marginRight: 10, border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: 4, fontWeight: 'bold' }
    };

    return (
        <div style={styles.container}>
            <div style={{flex:1}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                    <h1 style={{margin:0, fontSize:24}}>Panel Call Center – <span style={{color:'#3b82f6'}}>{userName}</span></h1>
                    <div style={{fontSize:12, textAlign:'right'}}>Op: {internoNombre} | Turno: {internoRoperoTurno}</div>
                </div>

                <div style={styles.card}>
                    {/* INPUT FECHA: ESTE VALOR FILTRA ESTRICTAMENTE POR DÍA */}
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc'}} />
                    
                    <select value={turnoSel} onChange={e=>setTurnoSel(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc'}}>
                        <option value="TURNO DIA">TURNO DÍA (06:01 - 18:00)</option>
                        <option value="TURNO NOCHE">TURNO NOCHE (18:01 - 06:00)</option>
                    </select>

                    <button onClick={() => navigate('/estadistica')} style={styles.btnNav}>MÉTRICAS</button>
                    <button onClick={openUsers} style={styles.btnNav}>USUARIOS</button>
                    <DownloadWordButton fecha={fecha} turno={turnoSel} />
                    <button onClick={onLogout} style={{...styles.btnNav, background:'#ef4444', color:'white'}}>SALIR</button>
                </div>

                {loading ? <p>Cargando datos...</p> : (
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20}}>
                        {['Norte', 'Centro', 'Sur'].map(z => (
                            <div key={z} style={{background:'white', padding:20, borderRadius:12, borderTop:'5px solid #3b82f6', minHeight:400, display:'flex', flexDirection:'column', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                                <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', borderBottom:'1px solid #eee', paddingBottom:10, marginBottom:10}}>
                                    <span>ZONA {z.toUpperCase()}</span>
                                    <span style={{color:'#3b82f6', fontSize:18}}>{dataZonal[z].length}</span>
                                </div>
                                {renderMapeo(dataZonal[z])}
                            </div>
                        ))}
                    </div>
                )}
                
                <div style={{background:'#0f172a', color:'white', padding:20, borderRadius:12, marginTop:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontWeight:'bold', fontSize:18}}>TOTAL PARTES VIRTUALES DEL TURNO</span>
                    <span style={{fontSize:36, fontWeight:900}}>{dataZonal.Total}</span>
                </div>
            </div>

            {/* PANEL DETALLE (SIN CAMBIOS) */}
            {parteSel && !showModal && (
                <div style={{width:420, background:'white', padding:25, borderRadius:12, boxShadow:'-5px 0 20px rgba(0,0,0,0.05)', overflowY:'auto', borderLeft:'1px solid #eee'}}>
                    <button onClick={()=>setParteSel(null)} style={{float:'right', border:'none', background:'none', fontSize:20, cursor:'pointer', color:'#94a3b8'}}>✕</button>
                    <h2 style={{marginTop:0, color:'#1e293b'}}>Parte #{parteSel.id}</h2>
                    <div style={{fontSize:13, color:'#334155'}}>
                        <div style={{background:'#f8fafc', padding:15, borderRadius:8, marginBottom:15}}>
                            <h4 style={{margin:'0 0 10px 0', color:'#475569'}}>PERSONAL</h4>
                            <p style={{margin:'5px 0'}}><b>Conductor:</b> {parteSel.conductor || "---"}</p>
                            <p style={{margin:'5px 0'}}><b>Sup. Zonal:</b> {parteSel.supervisor_zonal || "---"}</p>
                            <p style={{margin:'5px 0'}}><b>Sup. General:</b> {parteSel.supervisor_general || "---"}</p>
                        </div>
                        <p><b>Lugar:</b> {parteSel.lugar}</p>
                        <p><b>Sumilla:</b> {parteSel.sumilla}</p>
                        <p style={{background:'#fffbeb', padding:10, borderRadius:6, border:'1px solid #fcd34d'}}>
                            <b>Ocurrencia:</b><br/>{parteSel.ocurrencia}
                        </p>
                        <h4 style={{marginTop:20, marginBottom:10}}>Evidencias ({parteSel.todosArchivos?.length || 0})</h4>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                            {parteSel.todosArchivos?.length > 0 ? parteSel.todosArchivos.map((m:any, i:number) => (
                                <div key={i} onClick={()=>{setMediaSeleccionado(m); setShowMediaModal(true);}} style={{cursor:'pointer', position:'relative'}}>
                                    {m.tipo==='video' ? 
                                        <video src={m.url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:8, background:'#000'}} /> : 
                                        <img src={m.url} style={{width:'100%', aspectRatio:'1/1', objectFit:'cover', borderRadius:8}} />
                                    }
                                    {m.tipo==='video' && <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)', color:'white', fontSize:24}}>▶</div>}
                                </div>
                            )) : <p style={{gridColumn:'span 2', textAlign:'center', color:'#cbd5e1'}}>Sin evidencias.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES USUARIOS / MULTIMEDIA (SIN CAMBIOS) */}
            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ padding: 20, borderBottom: '1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <h2 style={{margin:0}}>{userSel ? userSel.usuario : "GESTIÓN DE USUARIOS"}</h2>
                            <button onClick={()=>setShowModal(false)} style={{background:'none', border:'none', fontSize:28, cursor:'pointer'}}>×</button>
                        </div>
                        {view === 'list' ? (
                            <div style={{ padding: 20, overflowY: 'auto' }}>
                                {usuarios.map(u => (
                                    <div key={u.id} onClick={()=>selectUser(u)} style={{padding:15, borderBottom:'1px solid #eee', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                        <span style={{fontWeight:'bold'}}>{u.usuario}</span>
                                        <span style={{color:'#3b82f6', fontSize:12, background:'#eff6ff', padding:'4px 8px', borderRadius:4}}>Ver Perfil →</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <button onClick={()=>setActiveTab('cv')} style={{...styles.tabBtn, background: activeTab==='cv'?'white':'transparent'}}>Información</button>
                                    <button onClick={()=>setActiveTab('partes')} style={{...styles.tabBtn, background: activeTab==='partes'?'white':'transparent'}}>Partes ({userPartes.length})</button>
                                    <button onClick={()=>setView('list')} style={{float:'right', border:'none', background:'none', cursor:'pointer', color:'#64748b'}}>← Volver a lista</button>
                                </div>
                                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                    {activeTab === 'cv' ? (
                                        <div style={{ padding: 40, display: 'flex', gap: 40, alignItems:'flex-start' }}>
                                            <div style={{ width: 150, height: 150, borderRadius: 75, background: '#e2e8f0', overflow:'hidden', border:'4px solid white', boxShadow:'0 4px 6px rgba(0,0,0,0.1)' }}>
                                                {fotoPerfilUrl ? <img src={fotoPerfilUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:50}}>👤</div>}
                                            </div>
                                            <div>
                                                <h2 style={{marginTop:0}}>{userSel.usuario}</h2>
                                                <p><b>DNI:</b> {userSel.dni}</p>
                                                <p><b>Cargo:</b> {userSel.cargo}</p>
                                                <p><b>Celular:</b> {userSel.celular || "No registrado"}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{flex:1, display:'flex'}}>
                                            <div style={{width:300, borderRight:'1px solid #eee', overflowY:'auto', background:'#f8fafc'}}>
                                                {userPartes.map(p=>(
                                                    <div key={p.id} onClick={()=>handleSelectParte(p.id)} style={{padding:15, borderBottom:'1px solid #eee', cursor:'pointer', background: parteSel?.id===p.id?'#e0f2fe':'transparent'}}>
                                                        <b>Parte #{p.id}</b><br/><span style={{fontSize:11, color:'#64748b'}}>{p.fecha}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{flex:1, padding:30, overflowY:'auto'}}>
                                                {parteSel ? (
                                                    <div>
                                                        <h2>{parteSel.sumilla}</h2>
                                                        <p>{parteSel.ocurrencia}</p>
                                                        {parteSel.todosArchivos?.length > 0 && (
                                                            <button onClick={()=>{setMediaSeleccionado(parteSel.todosArchivos[0]); setShowMediaModal(true);}} style={{marginTop:20, padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:6, cursor:'pointer'}}>Ver Galería ({parteSel.todosArchivos.length})</button>
                                                        )}
                                                    </div>
                                                ) : <p style={{color:'#94a3b8', textAlign:'center', marginTop:50}}>Seleccione un parte de la lista izquierda</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showMediaModal && mediaSeleccionado && (
                <div style={{...styles.overlay, zIndex:10000, background:'rgba(0,0,0,0.95)'}}>
                    <button onClick={()=>setShowMediaModal(false)} style={{position:'absolute', top:20, right:20, fontSize:40, color:'white', background:'none', border:'none', cursor:'pointer'}}>✕</button>
                    <button onClick={()=>navegarGaleria('prev')} style={{position:'absolute', left:20, color:'white', fontSize:60, background:'none', border:'none', cursor:'pointer'}}>❮</button>
                    <div style={{textAlign:'center', maxWidth:'90vw', maxHeight:'90vh'}}>
                        {mediaSeleccionado.tipo === 'video' ? 
                            <video src={mediaSeleccionado.url} controls autoPlay style={{maxWidth:'100%', maxHeight:'80vh', boxShadow:'0 0 50px rgba(0,0,0,0.5)'}} /> : 
                            <img src={mediaSeleccionado.url} style={{maxWidth:'100%', maxHeight:'80vh', boxShadow:'0 0 50px rgba(0,0,0,0.5)'}} />
                        }
                    </div>
                    <button onClick={()=>navegarGaleria('next')} style={{position:'absolute', right:20, color:'white', fontSize:60, background:'none', border:'none', cursor:'pointer'}}>❯</button>
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;