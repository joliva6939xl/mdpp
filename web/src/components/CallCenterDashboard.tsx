/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DownloadWordButton } from "./DownloadWordButton";

const API_URL = "http://localhost:4000";

const cleanFileName = (rawPath: any): string | null => {
    if (!rawPath) return null;
    const pathString = typeof rawPath === 'string' ? rawPath : (rawPath.ruta || rawPath.path || "");
    return pathString.split(/[\\/]/).pop() || null;
};

const fetchOptions = (token?: string | null) => ({
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
    }
});

interface CallCenterDashboardProps {
    userName?: string;
    onBack?: () => void;
    onLogout?: () => void;
    internoNombre?: string;
    internoRoperoTurno?: string;
    onOpenInternalLogin?: () => void;
}

const CallCenterDashboard: React.FC<CallCenterDashboardProps> = ({ 
    userName, 
    onLogout, 
    internoNombre, 
    internoRoperoTurno 
}) => {
    const navigate = useNavigate();

    // --- ESTADOS ---
    const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
    const [turno, setTurno] = useState<string>("TURNO DIA");
    
    const [dataZonal, setDataZonal] = useState<any>({
        Norte: [], Centro: [], Sur: [], Total: 0
    });

    const [showModal, setShowModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');
    
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [userSel, setUserSel] = useState<any>(null);
    const [userPartes, setUserPartes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'cv' | 'partes'>('cv');
    
    const [parteSel, setParteSel] = useState<any>(null);
    const [mediaSeleccionado, setMediaSeleccionado] = useState<any>(null);

    // ✅ LÓGICA DE CARGA CORREGIDA (SIN ERROR DE ESLINT)
    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        
        const loadDashboardData = async () => {
            // 1. El reinicio se hace dentro de la función asíncrona para evitar el error de ESLint
            setDataZonal({ Norte: [], Centro: [], Sur: [], Total: 0 });

            try {
                const res = await fetch(`${API_URL}/api/partes?fecha=${fecha}`, fetchOptions(token));
                if (res.ok) {
                    const data = await res.json();
                    const listaOriginal = data.partes || []; 

                    // 2. Filtro de Turno Inteligente (ma±ana, tarde, dia)
                    const filtrados = listaOriginal.filter((p: any) => {
                        const t = (p.turno || "").toLowerCase();
                        if (turno === "TURNO DIA") {
                            return t.includes("dia") || t.includes("ma") || t.includes("tarde");
                        }
                        return t.includes("noche");
                    });

                    // 3. Clasificación por Zona (Minúsculas de la base de datos)
                    const norte = filtrados.filter((p: any) => (p.zona || "").toLowerCase().includes("norte"));
                    const centro = filtrados.filter((p: any) => (p.zona || "").toLowerCase().includes("centro"));
                    const sur = filtrados.filter((p: any) => (p.zona || "").toLowerCase().includes("sur"));

                    setDataZonal({
                        Norte: norte,
                        Centro: centro,
                        Sur: sur,
                        Total: filtrados.length
                    });
                }
            } catch (e) { 
                console.error("Error Dashboard:", e); 
            }
        };
        
        loadDashboardData();
    }, [fecha, turno]);

    // --- FUNCIONES ---
    const openUsers = async () => {
        setShowModal(true); setView('list');
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${API_URL}/api/usuarios`, fetchOptions(token));
            if (res.ok) setUsuarios(await res.json());
        } catch (e) { console.error(e); }
    };

    const selectUser = async (u: any) => {
        setUserSel(u); setView('detail'); setActiveTab('cv'); setParteSel(null);
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${API_URL}/api/usuarios/${u.id}/partes`, fetchOptions(token));
            if (res.ok) {
                const data = await res.json();
                setUserPartes(data.partes || []);
            }
        } catch (e) { console.error(e); }
    };

    const handleSelectParte = async (idParte: number) => {
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${API_URL}/api/partes/${idParte}`, fetchOptions(token));
            const data = await res.json();
            const base = data.parte || data.data || null;
            if (base) {
                const rawItems = data.archivos || base.archivos || [...(base.fotos || []), ...(base.videos || [])];
                const mapped = rawItems.map((item: any, idx: number) => {
                    const rutaReal = typeof item === 'string' ? item : (item.ruta || item.path || "");
                    const fileName = cleanFileName(rutaReal);
                    const urlFinal = fileName ? `${API_URL}/uploads/partes/${idParte}/${fileName}` : "";
                    const esVideo = rutaReal.toLowerCase().endsWith(".mp4") || rutaReal.toLowerCase().endsWith(".mov");
                    return { id: item.id || idx, tipo: esVideo ? "video" : "foto", ruta: urlFinal };
                }).filter((x: any) => x.ruta !== "");
                setParteSel({ ...base, todosArchivos: mapped });
            }
        } catch (error) { console.error(error); }
    };

    const getDato = (obj: any, posibles: string[]) => {
        if (!obj) return '-';
        for (const k of posibles) if (obj[k] && String(obj[k]).trim() !== "") return obj[k];
        return '-';
    };

    const fotoPerfilUrl = useMemo(() => {
        if (!userSel?.foto_ruta) return null;
        const file = cleanFileName(userSel.foto_ruta);
        return file ? `${API_URL}/uploads/usuarios/${file}` : null;
    }, [userSel]);

    const navegarGaleria = (direccion: 'prev' | 'next') => {
        if (!parteSel?.todosArchivos || parteSel.todosArchivos.length <= 1) return;
        const currentIndex = parteSel.todosArchivos.findIndex((m: any) => m.ruta === mediaSeleccionado?.ruta);
        const newIndex = direccion === 'next' 
            ? (currentIndex + 1) % parteSel.todosArchivos.length 
            : (currentIndex - 1 + parteSel.todosArchivos.length) % parteSel.todosArchivos.length;
        setMediaSeleccionado(parteSel.todosArchivos[newIndex]);
    };

    // --- ESTILOS ---
    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '40px 20px', background: '#f4f6f8', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif'" },
        card: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' },
        input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' },
        btnNav: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
        overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000 },
        modal: { background: 'white', width: '95%', maxWidth: '1100px', height: '90vh', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
        mediaOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
        mediaContent: { background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
        arrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.2)', border: '2px solid white', color: 'white', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', zIndex: 10001 },
        detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' },
        label: { fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', display: 'block' },
        value: { fontSize: '13px', color: '#0f172a', fontWeight: 700 },
        sidebar: { width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#ffffff' },
        parteItem: { padding: '15px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '13px' },
        tabBtn: { padding: '8px 16px', marginRight: '10px', border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' },
        detailScrollContainer: { flex: 1, padding: '25px', overflowY: 'auto' },
        infoBox: { padding: '12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '13px', color: '#334155', marginTop: '5px' }
    };

    return (
        <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ margin: 0, color: '#1e293b', fontSize: '26px' }}>
                    Panel de Administración – <span style={{ color: '#3b82f6' }}>{userName || "CCENTER"}</span>
                </h1>
                {internoNombre && (
                    <div style={{ fontSize: '13px', textAlign: 'right', color: '#64748b' }}>
                        <div><strong>Operador:</strong> {internoNombre}</div>
                        <div><strong>Ropero:</strong> {internoRoperoTurno}</div>
                    </div>
                )}
            </div>

            <div style={styles.card}>
                <h2 style={{ fontSize: '14px', marginBottom: '15px', fontWeight: 800, color: '#000' }}>PANEL DE CONTROL</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={styles.input} />
                    <select value={turno} onChange={e => setTurno(e.target.value)} style={styles.input}>
                        <option value="TURNO DIA">TURNO DIA</option>
                        <option value="TURNO NOCHE">TURNO NOCHE</option>
                    </select>
                    <button style={{ ...styles.btnNav, background: '#0f172a', color: 'white' }}>ZONAS</button>
                    <button onClick={() => navigate('/estadistica')} style={styles.btnNav}>MÉTRICAS (BI)</button>
                    <button onClick={openUsers} style={styles.btnNav}>USUARIOS</button>
                    <DownloadWordButton fecha={fecha} turno={turno} />
                    <button onClick={onLogout} style={{ ...styles.btnNav, background: '#ef4444', color: 'white' }}>Salir</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' }}>
                {['Norte', 'Centro', 'Sur'].map((z) => (
                    <div key={z} style={{ background: 'white', padding: '20px', borderRadius: '12px', borderTop: '6px solid #3b82f6', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <span style={{ textTransform: 'uppercase' }}>{z}</span>
                            <span>Total: {dataZonal[z].length}</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {dataZonal[z].length > 0 ? (
                                dataZonal[z].map((p: any) => (
                                    <div key={p.id} style={{ padding: '8px', borderBottom: '1px solid #f8fafc', fontSize: '12px' }}>
                                        <div style={{ color: '#3b82f6', fontWeight: 800 }}>#{p.parte_fisico || p.id}</div>
                                        <div style={{ fontWeight: 600 }}>{p.sumilla}</div>
                                        <div style={{ color: '#64748b' }}>{p.hora} | {p.unidad_numero}</div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>∅ Sin registros</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#0f172a', color: 'white', padding: '25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL INCIDENCIAS EN ESTA FECHA ({turno})</span>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{dataZonal.Total}</span>
            </div>

            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, textTransform: 'uppercase' }}>{userSel ? userSel.usuario : "Usuarios"}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer' }}>×</button>
                        </div>
                        {view === 'list' ? (
                            <div style={{ padding: '20px', overflowY: 'auto' }}>
                                {usuarios.map(u => (
                                    <div key={u.id} onClick={() => selectUser(u)} style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                                        <strong>{u.usuario}</strong> <span style={{ float: 'right', color: '#3b82f6' }}>Ver Perfil →</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <button onClick={() => setActiveTab('cv')} style={{ ...styles.tabBtn, color: activeTab === 'cv' ? '#3b82f6' : '#64748b' }}>Información</button>
                                    <button onClick={() => setActiveTab('partes')} style={{ ...styles.tabBtn, color: activeTab === 'partes' ? '#3b82f6' : '#64748b' }}>Partes ({userPartes.length})</button>
                                </div>

                                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                    {activeTab === 'cv' ? (
                                        <div style={{ padding: '30px', display: 'flex', gap: '30px' }}>
                                            <div style={{ width: 140, height: 140, borderRadius: 70, background: '#eee', overflow: 'hidden', border: '4px solid #fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                                {fotoPerfilUrl ? <img src={fotoPerfilUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User" /> : <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40}}>👤</div>}
                                            </div>
                                            <div>
                                                <p><span style={styles.label}>DNI:</span> <span style={styles.value}>{getDato(userSel, ['dni'])}</span></p>
                                                <p><span style={styles.label}>Cargo:</span> <span style={styles.value}>{getDato(userSel, ['cargo'])}</span></p>
                                                <p><span style={styles.label}>Celular:</span> <span style={styles.value}>{getDato(userSel, ['celular', 'telefono'])}</span></p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={styles.sidebar}>
                                                {userPartes.map(p => (
                                                    <div key={p.id} onClick={() => handleSelectParte(p.id)} style={{ ...styles.parteItem, background: parteSel?.id === p.id ? '#eff6ff' : 'transparent', borderLeft: parteSel?.id === p.id ? '4px solid #3b82f6' : 'none' }}>
                                                        <strong>Parte #{p.id}</strong><br/>{p.fecha?.split('T')[0]}
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={styles.detailScrollContainer}>
                                                {parteSel ? (
                                                    <div style={{ gap: '20px', display: 'flex', flexDirection: 'column' }}>
                                                        <h3 style={{ margin: 0 }}>INFORME DE PARTE #{parteSel.id}</h3>
                                                        <div style={styles.detailGrid}>
                                                            <div>
                                                                <span style={styles.label}>Ubicación y Sectorización</span>
                                                                <p style={{margin:'5px 0'}}><strong>Lugar:</strong> {getDato(parteSel, ['lugar'])}</p>
                                                                <p style={{margin:'5px 0'}}><strong>Zona:</strong> {getDato(parteSel, ['zona'])}</p>
                                                                <p style={{margin:'5px 0'}}><strong>Turno:</strong> {getDato(parteSel, ['turno'])}</p>
                                                            </div>
                                                            <div>
                                                                <span style={styles.label}>Recursos y Supervisión</span>
                                                                <p style={{margin:'5px 0'}}><strong>Unidad:</strong> {getDato(parteSel, ['unidad_numero'])}</p>
                                                                <p style={{margin:'5px 0'}}><strong>Placa:</strong> {getDato(parteSel, ['placa'])}</p>
                                                                <p style={{margin:'5px 0'}}><strong>Conductor:</strong> {getDato(parteSel, ['conductor'])}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span style={styles.label}>Asunto / Sumilla</span>
                                                            <div style={styles.infoBox}>{getDato(parteSel, ['sumilla'])}</div>
                                                        </div>
                                                        <div>
                                                            <span style={styles.label}>Detalle de la Ocurrencia (Escrito)</span>
                                                            <div style={{ ...styles.infoBox, minHeight: '100px', whiteSpace: 'pre-wrap' }}>
                                                                {getDato(parteSel, ['ocurrencia', 'descripcion'])}
                                                            </div>
                                                        </div>
                                                        {parteSel.todosArchivos?.length > 0 && (
                                                            <button onClick={() => { setMediaSeleccionado(parteSel.todosArchivos[0]); setShowMediaModal(true); }} style={{ padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor:'pointer' }}>📂 Ver Galería Multimedia ({parteSel.todosArchivos.length})</button>
                                                        )}
                                                    </div>
                                                ) : <div style={{textAlign:'center', marginTop:100, color:'#94a3b8'}}>Seleccione un parte de la lista lateral para ver el detalle.</div>}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showMediaModal && mediaSeleccionado && (
                <div style={styles.mediaOverlay}>
                    <button onClick={() => setShowMediaModal(false)} style={{ position: 'absolute', top: 20, right: 20, padding: '10px 20px', background: 'white', borderRadius: '20px', border: 'none', fontWeight:'bold', cursor:'pointer' }}>✕ Cerrar</button>
                    {parteSel?.todosArchivos?.length > 1 && <button onClick={() => navegarGaleria('prev')} style={{ ...styles.arrowBtn, left: 20 }}>❮</button>}
                    <div style={styles.mediaContent}>
                        {mediaSeleccionado.ruta.toLowerCase().endsWith('.mp4') ? 
                            <video controls autoPlay src={mediaSeleccionado.ruta} style={{ maxWidth: '80vw', borderRadius:8 }} /> : 
                            <img src={mediaSeleccionado.ruta} alt="Adjunto" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius:8 }} />
                        }
                    </div>
                    {parteSel?.todosArchivos?.length > 1 && <button onClick={() => navegarGaleria('next')} style={{ ...styles.arrowBtn, right: 20 }}>❯</button>}
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;