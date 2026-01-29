/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadWordButton } from "./DownloadWordButton";
import { DownloadExcelButton } from "./DownloadExcelButton";

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

const normalizeDate = (dateStr: string) => {
    if (!dateStr) return "";
    return dateStr.split('T')[0];
};

const getMinutes = (horaStr: string) => {
    if (!horaStr) return -1;
    const [hh, mm] = horaStr.split(':').map(Number);
    return hh * 60 + mm;
};

const isRangoDia = (mins: number) => mins >= 361 && mins <= 1080;
const isRangoNoche = (mins: number) => (mins >= 1081) || (mins >= 0 && mins <= 360);

const fetchOptions = () => ({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});

// ✅ 1. COMPONENTE: CALENDARIO FLOTANTE (ESTILO AZUL ORIGINAL)
const FloatingCalendar = ({ fechaSeleccionada, onChange, fechasActivas, onClose }: { fechaSeleccionada: string, onChange: (f: string) => void, fechasActivas: string[], onClose: () => void }) => {
    const [year, month] = fechaSeleccionada.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); 
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

    const dias = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const vacios = Array.from({ length: startOffset }, (_, i) => i);

    const esActivo = (d: number) => fechasActivas.includes(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    const esSeleccionado = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}` === fechaSeleccionada;

    const handleSelect = (newDate: string) => {
        onChange(newDate);
        onClose(); 
    };

    return (
        <div style={{
            position: 'absolute',
            top: '45px', // Debajo del input falso
            left: 0,
            zIndex: 100, // Superpuesto
            background: 'white', 
            border: '1px solid #cbd5e1', 
            borderRadius: '8px', 
            padding: '15px', 
            width: '260px', 
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)'
        }}>
            {/* Header del Calendario */}
            <div style={{textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', color: '#1e3a8a', textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between'}}>
                <span>{new Date(year, month - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer', color:'#94a3b8'}}>✕</button>
            </div>

            {/* Días Semana */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '5px'}}>
                {['L','M','M','J','V','S','D'].map(d => <div key={d} style={{fontSize: '10px', fontWeight:'bold', color: '#64748b', textAlign: 'center'}}>{d}</div>)}
            </div>

            {/* Días Mes */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px'}}>
                {vacios.map(v => <div key={`v-${v}`} />)}
                {dias.map(d => (
                    <div key={d} onClick={() => handleSelect(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
                        style={{
                            height: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '6px',
                            background: esSeleccionado(d) ? '#3b82f6' : (esActivo(d) ? '#eff6ff' : 'transparent'),
                            color: esSeleccionado(d) ? 'white' : (esActivo(d) ? '#1e3a8a' : '#334155'),
                            fontWeight: esSeleccionado(d) || esActivo(d) ? 'bold' : 'normal',
                            position: 'relative', border: esActivo(d) && !esSeleccionado(d) ? '1px solid #bfdbfe' : 'none'
                        }}
                    >
                        <span style={{fontSize: '12px'}}>{d}</span>
                        {/* Punto Azul */}
                        {esActivo(d) && !esSeleccionado(d) && <div style={{width: '4px', height: '4px', background: '#3b82f6', borderRadius: '50%', position: 'absolute', bottom: '2px'}}></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ✅ COMPONENTE VISUAL DE DETALLE (SIN CAMBIOS)
const ParteDetalleView = ({ parte, onClose, onOpenMedia }: { parte: any, onClose?: () => void, onOpenMedia: (m:any) => void }) => {
    const evidencias = useMemo(() => {
        if (!parte) return [];
        const lista: any[] = [];
        if (Array.isArray(parte.fotos)) {
            parte.fotos.forEach((ruta: string) => {
                const url = ruta.startsWith('http') ? ruta : `${API_URL}/uploads/${ruta}`;
                lista.push({ url, tipo: 'foto' });
            });
        }
        if (Array.isArray(parte.videos)) {
            parte.videos.forEach((ruta: string) => {
                const url = ruta.startsWith('http') ? ruta : `${API_URL}/uploads/${ruta}`;
                lista.push({ url, tipo: 'video' });
            });
        }
        if (parte.todosArchivos && lista.length === 0) return parte.todosArchivos;
        return lista;
    }, [parte]);

    if (!parte) return null;

    const s = {
        sectionTitle: { fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginTop: '15px', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' },
        row: { display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px', marginBottom: '4px', fontSize: '13px' },
        label: { fontWeight: 700, color: '#64748b' },
        value: { color: '#0f172a' },
        gpsBtn: { display: 'inline-block', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: 'bold', border: '1px solid #10b981' }
    };

    const renderParticipantes = () => {
        let parts = [];
        try {
            if (Array.isArray(parte.participantes)) parts = parte.participantes;
            else if (typeof parte.participantes === 'string') parts = JSON.parse(parte.participantes);
        } catch { parts = []; }

        if (!parts || parts.length === 0) return <span style={{color:'#cbd5e1', fontStyle:'italic', fontSize:'12px'}}>Sin participantes registrados</span>;

        return (
            <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                {parts.map((p: any, i: number) => (
                    <span key={i} style={{background:'#f1f5f9', padding:'3px 8px', borderRadius:'12px', fontSize:'11px', color:'#475569', border:'1px solid #e2e8f0'}}>
                        👤 {p.nombre} {p.dni ? `(DNI: ${p.dni})` : ''}
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div style={{background:'white', height:'100%', display:'flex', flexDirection:'column', overflow: 'hidden'}}>
            {onClose && (
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingBottom:10, borderBottom:'2px solid #f1f5f9', flexShrink: 0}}>
                    <div>
                        <h2 style={{margin:0, color:'#1e293b', fontSize:'18px'}}>Parte #{parte.id}</h2>
                        <span style={{fontSize:'11px', color:'#64748b'}}>REGISTRADO: {parte.fecha} | {parte.hora}</span>
                    </div>
                    <button onClick={onClose} style={{border:'none', background:'#f1f5f9', width:30, height:30, borderRadius:15, fontSize:16, cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center', justifyContent:'center'}}>✕</button>
                </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                <div style={s.sectionTitle}>1. INFORMACIÓN GENERAL</div>
                <div style={s.row}><span style={s.label}>N° Físico:</span><span style={s.value}>{parte.parte_fisico || '---'}</span></div>
                <div style={s.row}><span style={s.label}>Turno:</span><span style={s.value}>{parte.turno}</span></div>
                <div style={s.row}><span style={s.label}>Sector / Zona:</span><span style={s.value}>Sector {parte.sector} - {parte.zona}</span></div>
                <div style={s.row}><span style={s.label}>Lugar:</span><span style={s.value}>{parte.lugar}</span></div>
                {parte.latitud && parte.longitud && (
                    <div style={s.row}>
                        <span style={s.label}>Ubicación:</span>
                        <span>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${parte.latitud},${parte.longitud}`} target="_blank" rel="noreferrer" style={s.gpsBtn}>
                                📍 VER EN MAPA ({parte.latitud}, {parte.longitud})
                            </a>
                        </span>
                    </div>
                )}
                <div style={s.sectionTitle}>2. UNIDAD Y PERSONAL</div>
                <div style={s.row}><span style={s.label}>Unidad:</span><span style={s.value}>{parte.unidad_tipo} {parte.unidad_numero}</span></div>
                <div style={s.row}><span style={s.label}>Placa:</span><span style={s.value}>{parte.placa || '---'}</span></div>
                <div style={s.row}><span style={s.label}>Conductor:</span><span style={s.value}>{parte.conductor}</span></div>
                <div style={s.row}><span style={s.label}>DNI Conductor:</span><span style={s.value}>{parte.dni_conductor || '---'}</span></div>
                <div style={s.row}><span style={s.label}>Sup. Zonal:</span><span style={s.value}>{parte.supervisor_zonal || '---'}</span></div>
                <div style={s.row}><span style={s.label}>Sup. General:</span><span style={s.value}>{parte.supervisor_general || '---'}</span></div>
                <div style={s.sectionTitle}>3. DETALLE DEL HECHO</div>
                <div style={s.row}><span style={s.label}>Tipo (Sumilla):</span><span style={{...s.value, fontWeight:'bold', color:'#2563eb'}}>{parte.sumilla}</span></div>
                <div style={s.row}><span style={s.label}>Origen:</span><span style={s.value}>{parte.asunto || '---'}</span></div>
                <div style={{marginTop:'8px', background:'#fffbeb', padding:'12px', borderRadius:'8px', borderLeft:'4px solid #f59e0b'}}>
                    <div style={{fontSize:'10px', fontWeight:'900', color:'#b45309', marginBottom:'4px', letterSpacing:'1px'}}>OCURRENCIA:</div>
                    <p style={{margin:0, fontSize:'13px', lineHeight:'1.5', color:'#451a03', whiteSpace:'pre-wrap', fontFamily:'monospace'}}>{parte.ocurrencia}</p>
                </div>
                <div style={s.sectionTitle}>4. INTERVENIDOS / PARTICIPANTES</div>
                {renderParticipantes()}
                <div style={s.sectionTitle}>5. EVIDENCIAS ({evidencias.length})</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginTop:'10px'}}>
                    {evidencias.length > 0 ? evidencias.map((m:any, i:number) => (
                        <div key={i} onClick={() => onOpenMedia(m)} style={{aspectRatio:'1/1', background:'#000', borderRadius:'8px', overflow:'hidden', cursor:'pointer', position:'relative', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
                            {m.tipo === 'video' ? 
                                <video src={m.url} style={{width:'100%', height:'100%', objectFit:'cover', opacity:0.8}} /> :
                                <img src={m.url} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                            }
                            {m.tipo === 'video' && <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'white', background:'rgba(0,0,0,0.3)', fontSize:'24px'}}>▶</div>}
                        </div>
                    )) : <div style={{gridColumn:'1/-1', fontSize:'12px', color:'#94a3b8', textAlign:'center', padding:'15px', background:'#f8fafc', borderRadius:'6px'}}>📸 No hay evidencias adjuntas.</div>}
                </div>
                <div style={{height: 50}}></div>
            </div>
        </div>
    );
};

// Interface Dashboard
interface CallCenterDashboardProps {
    userName?: string;
    onLogout?: () => void;
    internoNombre?: string;
    internoRoperoTurno?: string;
    onOpenInternalLogin?: () => void;
    onBack?: () => void;
}

const CallCenterDashboard: React.FC<CallCenterDashboardProps> = ({ 
    userName, onLogout, internoNombre, internoRoperoTurno, onBack, onOpenInternalLogin 
}) => {
    const navigate = useNavigate();
    const [fecha, setFecha] = useState<string>(getLocalToday());
    const [turnoSel, setTurnoSel] = useState<string>("TURNO DIA");
    const [dataZonal, setDataZonal] = useState<any>({ Norte: [], Centro: [], Sur: [], Total: 0 });
    const [loading, setLoading] = useState(false);
    
    // ✅ ESTADO DEL CALENDARIO
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [fechasActivas, setFechasActivas] = useState<string[]>([]);

    const [operadorInput, setOperadorInput] = useState(internoRoperoTurno || "");
    const [callCenterInput, setCallCenterInput] = useState(internoNombre || "");

    const [showModal, setShowModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [userSel, setUserSel] = useState<any>(null);
    const [userPartes, setUserPartes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'cv' | 'partes'>('cv');
    const [parteSel, setParteSel] = useState<any>(null);
    const [mediaSeleccionado, setMediaSeleccionado] = useState<any>(null);

    useEffect(() => {
        if(internoRoperoTurno) setOperadorInput(internoRoperoTurno);
        if(internoNombre) setCallCenterInput(internoNombre);
    }, [internoRoperoTurno, internoNombre]);

    // ✅ EFECTO: CARGAR PUNTOS AZULES (Fechas con datos)
    useEffect(() => {
        fetch(`${API_URL}/api/partes/fechas-activas`, fetchOptions())
            .then(r => r.json()).then(d => { if(d.ok) setFechasActivas(d.fechas); })
            .catch(e => console.error(e));
    }, []);

    // --- CARGA DE DATOS ---
    useEffect(() => {
        setParteSel(null);
        let isMounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/partes?fecha=${fecha}`, fetchOptions());
                const data = await res.json();
                
                if (isMounted && data.ok) {
                    const lista = data.partes || [];
                    const filtrados = lista.filter((p: any) => {
                        if (normalizeDate(p.fecha) !== fecha) return false;
                        if (!p.hora) return false; 
                        const mins = getMinutes(p.hora);
                        const textoTurno = (p.turno || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                        if (turnoSel === "TURNO DIA") {
                            const diceDia = textoTurno.includes("DIA") || textoTurno.includes("MANANA");
                            const esHoraDia = isRangoDia(mins);
                            return diceDia && esHoraDia;
                        } else {
                            const diceNoche = textoTurno.includes("NOCHE");
                            const esHoraNoche = isRangoNoche(mins);
                            return diceNoche && esHoraNoche;
                        }
                    });
                    const getZ = (p: any) => (p.zona || "").toLowerCase().trim();
                    setDataZonal({
                        Norte: filtrados.filter((p: any) => getZ(p).includes("norte")),
                        Centro: filtrados.filter((p: any) => getZ(p).includes("centro")),
                        Sur: filtrados.filter((p: any) => getZ(p).includes("sur")),
                        Total: filtrados.length
                    });
                }
            } catch { /* Error silencioso */ } finally { if(isMounted) setLoading(false); }
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

    const openUsers = async () => { setShowModal(true); setView('list'); const r = await fetch(`${API_URL}/api/usuarios`, fetchOptions()); if(r.ok) setUsuarios(await r.json()); };
    const selectUser = async (u:any) => { setUserSel(u); setView('detail'); setActiveTab('cv'); setParteSel(null); const r = await fetch(`${API_URL}/api/usuarios/${u.id}/partes`, fetchOptions()); if(r.ok) { const d=await r.json(); setUserPartes(d.partes||[]); } };
    
    const handleSelectParte = async (id: number) => { 
        try { 
            if (parteSel && parteSel.id === id) { setParteSel(null); return; }
            const r = await fetch(`${API_URL}/api/partes/${id}`, fetchOptions()); 
            const d = await r.json(); 
            if(d.ok) setParteSel(d.parte || d.data); 
        } catch { /* Error */ } 
    };

    const navegarGaleria = (dir: 'prev'|'next') => { 
        if(!parteSel?.todosArchivos?.length) return; 
        const idx = parteSel.todosArchivos.findIndex((m:any) => m.url === mediaSeleccionado?.url); 
        const nxt = dir==='next' ? (idx+1)%parteSel.todosArchivos.length : (idx-1+parteSel.todosArchivos.length)%parteSel.todosArchivos.length; 
        setMediaSeleccionado(parteSel.todosArchivos[nxt]); 
    };
    const fotoPerfilUrl = useMemo(() => userSel?.foto_ruta ? `${API_URL}/uploads/usuarios/${cleanFileName(userSel.foto_ruta)}` : null, [userSel]);

    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '30px', background: '#f4f6f8', minHeight: '100vh', display:'flex', gap:20, fontFamily:'sans-serif' },
        card: { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: 10, alignItems:'center', flexWrap: 'wrap' },
        overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000 },
        modal: { background: 'white', width: '90%', maxWidth: '1000px', height: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        btnNav: { padding: '8px 15px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#e2e8f0', fontWeight: 'bold', fontSize: 12 },
        tabBtn: { padding: '8px 16px', marginRight: 10, border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: 4, fontWeight: 'bold' }
    };

    return (
        <div 
            style={styles.container}
            onMouseDown={(e) => {
                // Cierra calendario y panel si se hace clic fuera
                if (e.target === e.currentTarget) setParteSel(null);
            }}
        >
            {/* OVERLAY INVISIBLE: Para cerrar el calendario si haces clic fuera */}
            {isCalendarOpen && (
                <div onClick={() => setIsCalendarOpen(false)} style={{position:'fixed', inset:0, zIndex:90}}></div>
            )}

            <div style={{flex:1}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                        {onBack && (
                            <button 
                                onClick={onBack} 
                                style={{background:'#64748b', color:'white', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', fontWeight:'bold', fontSize:16}}
                                title="Volver al menú"
                            >
                                ←
                            </button>
                        )}
                        <h1 style={{margin:0, fontSize:24}}>Panel Call Center – <span style={{color:'#3b82f6'}}>{userName}</span></h1>
                    </div>
                    <div style={{fontSize:12, textAlign:'right'}}>
                        <div>Op: <b>{internoNombre}</b> | Turno: <b>{internoRoperoTurno}</b></div>
                        {onOpenInternalLogin && <button onClick={onOpenInternalLogin} style={{background:'none', border:'none', color:'#3b82f6', textDecoration:'underline', cursor:'pointer', padding:0}}>Cambiar Credenciales</button>}
                    </div>
                </div>

                <div style={styles.card}>
                    
                    {/* ✅ 2. AQUÍ ESTÁ EL CAMBIO: CALENDARIO FLOTANTE */}
                    <div style={{display:'flex', flexDirection:'column', position:'relative'}}>
                        <label style={{fontSize:10, fontWeight:'bold', color:'#64748b'}}>FECHA</label>
                        <button 
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            style={{
                                padding:'8px', borderRadius:'6px', border:'1px solid #ccc', 
                                background:'white', cursor:'pointer', textAlign:'left', 
                                minWidth: '130px', display:'flex', justifyContent:'space-between', alignItems:'center'
                            }}
                        >
                            <span>{fecha}</span>
                            <span style={{fontSize:10}}>▼</span>
                        </button>

                        {/* EL CALENDARIO APARECE AQUÍ FLOTANDO */}
                        {isCalendarOpen && (
                            <FloatingCalendar 
                                fechaSeleccionada={fecha} 
                                onChange={setFecha} 
                                fechasActivas={fechasActivas} 
                                onClose={() => setIsCalendarOpen(false)}
                            />
                        )}
                    </div>

                    <div style={{display:'flex', flexDirection:'column'}}>
                        <label style={{fontSize:10, fontWeight:'bold', color:'#64748b'}}>TURNO</label>
                        <select value={turnoSel} onChange={e=>setTurnoSel(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc'}}>
                            <option value="TURNO DIA">TURNO DÍA (06:01 - 18:00)</option>
                            <option value="TURNO NOCHE">TURNO NOCHE (18:01 - 06:00)</option>
                        </select>
                    </div>

                    <div style={{display:'flex', flexDirection:'column'}}>
                        <label style={{fontSize:10, fontWeight:'bold', color:'#64748b'}}>ROPER</label>
                        <input type="text" value={operadorInput} onChange={e => setOperadorInput(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc', width:120}} placeholder="Nombre Roper" />
                    </div>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <label style={{fontSize:10, fontWeight:'bold', color:'#64748b'}}>CALL CENTER</label>
                        <input type="text" value={callCenterInput} onChange={e => setCallCenterInput(e.target.value)} style={{padding:8, borderRadius:6, border:'1px solid #ccc', width:120}} placeholder="Tu Nombre" />
                    </div>

                    <div style={{display:'flex', gap:10, marginLeft:'auto', alignItems:'center'}}>
                        <button onClick={() => navigate('/estadistica')} style={styles.btnNav}>MÉTRICAS</button>
                        <button onClick={openUsers} style={styles.btnNav}>USUARIOS</button>
                        
                        <DownloadWordButton fecha={fecha} turno={turnoSel} />
                        
                        <DownloadExcelButton 
                            fecha={fecha} 
                            turno={turnoSel} 
                            operador={operadorInput} 
                            callcenter={callCenterInput} 
                        />

                        <button onClick={onLogout} style={{...styles.btnNav, background:'#ef4444', color:'white'}}>SALIR</button>
                    </div>
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

            {/* PANEL DETALLE LATERAL */}
            {parteSel && !showModal && (
                <div style={{
                    width: 450, 
                    background: 'white', 
                    padding: 25, 
                    borderRadius: 12, 
                    boxShadow: '-5px 0 20px rgba(0,0,0,0.05)', 
                    borderLeft: '1px solid #eee', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    position: 'sticky', 
                    top: 20, 
                    height: 'calc(100vh - 40px)', 
                    overflow: 'hidden' 
                }}>
                    <ParteDetalleView 
                        parte={parteSel} 
                        onClose={() => setParteSel(null)}
                        onOpenMedia={(m) => { 
                            setMediaSeleccionado(m); 
                            setShowMediaModal(true); 
                        }} 
                    />
                </div>
            )}

            {/* MODAL USUARIOS */}
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
                                            <div style={{
                                                flex: 1, 
                                                padding: 30, 
                                                overflow: 'hidden', 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                height: '65vh'
                                            }}>
                                                {parteSel ? (
                                                    <ParteDetalleView 
                                                        parte={parteSel} 
                                                        onClose={undefined} 
                                                        onOpenMedia={(m) => { setMediaSeleccionado(m); setShowMediaModal(true); }} 
                                                    />
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