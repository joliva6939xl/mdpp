/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Asegúrate de que este componente exista o coméntalo si no lo usas aún
import { DownloadWordButton } from "./DownloadWordButton";

// URL del Backend
const API_URL = "http://localhost:4000";

// Función auxiliar para limpiar nombres de archivos
const cleanFileName = (rawPath: any): string | null => {
    if (!rawPath) return null;
    const pathString = typeof rawPath === 'string' ? rawPath : (rawPath.ruta || rawPath.path || "");
    return pathString.split(/[\\/]/).pop() || null;
};

// Opciones para fetch con token
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
    
    // Contadores matemáticos
    const [counts, setCounts] = useState<any>({ Norte: 0, Centro: 0, Sur: 0, Total: 0 });
    
    // Modales y Vistas
    const [showModal, setShowModal] = useState(false);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');
    
    // Datos de usuarios y partes
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [userSel, setUserSel] = useState<any>(null);
    const [userPartes, setUserPartes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'cv' | 'partes'>('cv');
    
    const [parteSel, setParteSel] = useState<any>(null);
    const [mediaSeleccionado, setMediaSeleccionado] = useState<any>(null);

    // --- EFECTO: CARGA DE LISTA Y CÁLCULO MATEMÁTICO ---
    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        
        const loadStats = async () => {
            try {
                // 1. Solicitamos la LISTA COMPLETA de partes del día
                const res = await fetch(`${API_URL}/api/partes?fecha=${fecha}`, fetchOptions(token));
                
                if (res.ok) {
                    const data = await res.json();
                    const todosLosPartes = data.partes || []; 

                    // 2. Filtramos en memoria por el TURNO seleccionado
                    const partesDelTurno = todosLosPartes.filter((p: any) => 
                        p.turno && p.turno.toUpperCase().includes(turno)
                    );

                    // 3. Sumamos manualmente cada zona
                    const norteCount = partesDelTurno.filter((p: any) => p.zona && p.zona.toUpperCase().includes("NORTE")).length;
                    const centroCount = partesDelTurno.filter((p: any) => p.zona && p.zona.toUpperCase().includes("CENTRO")).length;
                    const surCount = partesDelTurno.filter((p: any) => p.zona && p.zona.toUpperCase().includes("SUR")).length;

                    // 4. Actualizamos los contadores visuales
                    setCounts({
                        Norte: norteCount,
                        Centro: centroCount,
                        Sur: surCount,
                        Total: partesDelTurno.length
                    });
                }
            } catch (e) { 
                console.error("Error calculando estadísticas:", e); 
            }
        };
        
        loadStats();
    }, [fecha, turno]);

    // --- FUNCIONES DE INTERACCIÓN ---
    const openUsers = async () => {
        setShowModal(true); 
        setView('list');
        const token = localStorage.getItem("adminToken");
        try {
            const res = await fetch(`${API_URL}/api/usuarios`, fetchOptions(token));
            if (res.ok) setUsuarios(await res.json());
        } catch (e) { console.error(e); }
    };

    const selectUser = async (u: any) => {
        setUserSel(u); 
        setView('detail'); 
        setActiveTab('cv');
        setParteSel(null);
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
                    const rutaReal = typeof item === 'string' ? item : (item.ruta || item.path || item.url || "");
                    const fileName = cleanFileName(rutaReal);
                    const urlFinal = fileName ? `${API_URL}/uploads/partes/${idParte}/${fileName}` : "";
                    const tipoItem = item.tipo || "";
                    const esVideo = tipoItem.includes("video") || rutaReal.toLowerCase().endsWith(".mp4") || rutaReal.toLowerCase().endsWith(".mov");

                    return { id: item.id || idx, tipo: esVideo ? "video" : "foto", ruta: urlFinal, nombre_original: item.nombre_original || "archivo" };
                }).filter((x: any) => x.ruta !== "");

                setParteSel({ ...base, todosArchivos: mapped });
            }
        } catch (error) { console.error(error); }
    };

    const getDato = (obj: any, posibles: string[]) => {
        if (!obj) return '-';
        for (const k of posibles) {
            if (obj[k] && String(obj[k]).trim() !== "") return obj[k];
        }
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
        if (currentIndex === -1) return;
        let newIndex;
        if (direccion === 'next') { newIndex = (currentIndex + 1) % parteSel.todosArchivos.length; } 
        else { newIndex = (currentIndex - 1 + parteSel.todosArchivos.length) % parteSel.todosArchivos.length; }
        setMediaSeleccionado(parteSel.todosArchivos[newIndex]);
    };

    // --- ESTILOS INTERNOS (SOLUCIÓN A TUS ERRORES) ---
    // Definimos los estilos aquí dentro para no tener problemas de exportación
    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '40px 20px', background: '#f4f6f8', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif'" },
        card: { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' },
        input: { padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' },
        btnNav: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
        overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9000 },
        modal: { background: 'white', width: '95%', maxWidth: '1000px', height: '85vh', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
        mediaOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
        mediaContent: { background: 'transparent', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '90%', maxHeight: '90%', position: 'relative' },
        arrowBtn: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.2)', border: '2px solid rgba(255,255,255,0.5)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', zIndex: 10001, transition: 'background 0.3s' },
        detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f9fafb', padding: '15px', borderRadius: '8px' },
        label: { fontSize: '12px', fontWeight: 'bold', color: '#4b5563', marginRight: '5px', textTransform: 'uppercase' },
        value: { fontSize: '12px', color: '#111827', fontWeight: 700 },
        sidebar: { width: '280px', borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#ffffff', flexShrink: 0 },
        parteItem: { padding: '15px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: '13px', transition: 'background 0.2s' },
        tabBtn: { padding: '8px 16px', marginRight: '10px', border: '1px solid #d1d5db', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 500 },
        detailScrollContainer: { flex: 1, padding: '25px', paddingBottom: '80px', overflowY: 'auto', height: '100%' }
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
                <h2 style={{ fontSize: '18px', marginBottom: '20px', fontWeight: 'bold' }}>PANEL DE CONTROL</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={styles.input} />
                    
                    <select value={turno} onChange={e => setTurno(e.target.value)} style={styles.input}>
                        <option value="TURNO DIA">TURNO DIA</option>
                        <option value="TURNO NOCHE">TURNO NOCHE</option>
                    </select>

                    <button style={{ ...styles.btnNav, background: '#0f172a', color: 'white' }}>ZONAS</button>
                    <button onClick={() => navigate('/estadistica')} style={styles.btnNav}>MÉTRICAS (BI)</button>
                    <button onClick={openUsers} style={styles.btnNav}>USUARIOS</button>
                    {/* Botón de descarga: Si no tienes este componente, comenta la siguiente línea */}
                    <DownloadWordButton fecha={fecha} turno={turno} />
                    <button onClick={onLogout} style={{ ...styles.btnNav, background: '#ef4444', color: 'white' }}>Salir</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' }}>
                {['NORTE', 'CENTRO', 'SUR'].map((zona) => {
                    const zonaKey = zona.charAt(0) + zona.slice(1).toLowerCase(); 
                    const cantidad = counts[zonaKey] || 0;
                    
                    return (
                        <div key={zona} style={{ background: 'white', padding: '20px', borderRadius: '12px', borderTop: '6px solid #3b82f6', minHeight: '350px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                <span>{zona}</span>
                                <span>Total: {cantidad}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#94a3b8', flexDirection: 'column' }}>
                                {cantidad > 0 ? (
                                    <>
                                        <div style={{ fontSize: '40px', color: '#3b82f6', fontWeight: 'bold' }}>{cantidad}</div>
                                        <div style={{ fontWeight: 'bold', color: '#64748b' }}>Incidencias Reportadas</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '30px' }}>∅</div>
                                        <div>Sin incidencias</div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ background: '#0f172a', color: 'white', padding: '25px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL INCIDENCIAS HOY</span>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>{counts.Total}</span>
            </div>

            {/* MODAL PRINCIPAL */}
            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 800, textTransform: 'uppercase' }}>
                                    {userSel ? userSel.usuario : "Lista de Usuarios"}
                                </h2>
                                {userSel && <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>ID: {userSel.id} | {userSel.rol}</span>}
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                        </div>

                        {view === 'list' ? (
                            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                                {usuarios.map(u => (
                                    <div key={u.id} onClick={() => selectUser(u)} style={{ padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{u.usuario}</strong>
                                        <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}>Ver Perfil →</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: '10px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
                                    <button onClick={() => setActiveTab('cv')} style={{ ...styles.tabBtn, background: activeTab === 'cv' ? '#e5e7eb' : '#fff' }}>Información (CV)</button>
                                    <button onClick={() => setActiveTab('partes')} style={{ ...styles.tabBtn, background: activeTab === 'partes' ? '#e5e7eb' : '#fff' }}>Partes ({userPartes.length})</button>
                                    <button onClick={() => setView('list')} style={{ float: 'right', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', background: 'white' }}>« Atrás</button>
                                </div>

                                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                    {activeTab === 'cv' ? (
                                        <div style={{ padding: '40px', display: 'flex', gap: '40px', width: '100%', overflowY: 'auto' }}>
                                            <div style={{ flex: 1 }}>
                                                <p><strong>DNI:</strong> {getDato(userSel, ['dni'])}</p>
                                                <p><strong>Celular:</strong> {getDato(userSel, ['celular', 'telefono'])}</p>
                                                <p><strong>Correo:</strong> {getDato(userSel, ['correo', 'email'])}</p>
                                            </div>
                                            <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                                {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '40px' }}>👤</div>}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
                                            <div style={styles.sidebar}>
                                                {userPartes.map(p => (
                                                    <div key={p.id} onClick={() => handleSelectParte(p.id)} style={{ ...styles.parteItem, background: parteSel?.id === p.id ? '#eff6ff' : 'transparent', borderLeft: parteSel?.id === p.id ? '4px solid #3b82f6' : '4px solid transparent' }}>
                                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>Parte #{p.id}</div>
                                                        <div style={{ color: '#6b7280', fontSize: '12px' }}>{p.fecha?.split('T')[0]}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={styles.detailScrollContainer}>
                                                {parteSel ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: 0 }}>INFORME DE PARTE #{parteSel.id}</h3>
                                                        
                                                        <div style={styles.detailGrid}>
                                                            <div>
                                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Ubicación y Sectorización</h4>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Lugar:</span> <span style={styles.value}>{getDato(parteSel, ['lugar', 'direccion', 'ubicacion'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Sector:</span> <span style={styles.value}>{getDato(parteSel, ['sector', 'cuadrante'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Zona:</span> <span style={styles.value}>{getDato(parteSel, ['zona'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Turno:</span> <span style={styles.value}>{getDato(parteSel, ['turno'])}</span></p>
                                                            </div>
                                                            <div>
                                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold' }}>Recursos y Supervisión</h4>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Unidad:</span> <span style={styles.value}>{getDato(parteSel, ['unidad', 'movil', 'recurso'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Placa:</span> <span style={styles.value}>{getDato(parteSel, ['placa', 'matricula'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Conductor:</span> <span style={styles.value}>{getDato(parteSel, ['conductor', 'chofer'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Sup. Zonal:</span> <span style={styles.value}>{getDato(parteSel, ['sup_zonal', 'supervisor_zonal'])}</span></p>
                                                                <p style={{ margin: '5px 0' }}><span style={styles.label}>Sup. General:</span> <span style={styles.value}>{getDato(parteSel, ['sup_general', 'supervisor_general'])}</span></p>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Asunto / Sumilla</h4>
                                                            <div style={{ padding: '10px', background: '#f1f5f9', fontSize: '13px', borderRadius: '4px' }}>
                                                                {getDato(parteSel, ['sumilla', 'asunto', 'titulo'])}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 5px 0' }}>Detalle de la Ocurrencia (Escrito)</h4>
                                                            <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px', minHeight: '100px', whiteSpace: 'pre-wrap', fontSize: '13px', background: '#fff' }}>
                                                                {getDato(parteSel, ['ocurrencia', 'descripcion', 'detalle_ocurrencia', 'detalle'])}
                                                            </div>
                                                        </div>

                                                        {/* MULTIMEDIA */}
                                                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', marginTop: '10px' }}>
                                                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                                                                Multimedia ({parteSel.todosArchivos?.length || 0} archivos)
                                                            </h4>
                                                            
                                                            {parteSel.todosArchivos?.length > 0 ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => {
                                                                            setMediaSeleccionado(parteSel.todosArchivos[0]);
                                                                            setShowMediaModal(true);
                                                                        }}
                                                                        style={{ background: '#3b82f6', color: 'white', border: 'none', width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '15px' }}
                                                                    >
                                                                        📂 Ver Galería Completa
                                                                    </button>

                                                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                                        {parteSel.todosArchivos.map((m: any, i: number) => (
                                                                            <div key={i} style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', position: 'relative', cursor: 'default' }}>
                                                                                {m.tipo === "video" ? (
                                                                                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                                                                        <video src={m.ruta} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                                                                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                            <span style={{ fontSize: '24px', color: 'white' }}>▶️</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <img src={m.ruta} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div style={{ padding: '15px', background: '#f1f5f9', borderRadius: '6px', textAlign: 'center', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>🚫 <span>Sin archivos adjuntos</span></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Selecciona un parte lateral.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL MULTIMEDIA (ZOOM INTERACTIVO) */}
            {showMediaModal && mediaSeleccionado && (
                <div style={styles.mediaOverlay}>
                    <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10002 }}>
                        <button onClick={() => setShowMediaModal(false)} style={{ padding: '8px 16px', background: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>✕ Cerrar</button>
                    </div>

                    {parteSel?.todosArchivos?.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); navegarGaleria('prev'); }} style={{ ...styles.arrowBtn, left: '20px' }}>❮</button>
                    )}

                    <div style={styles.mediaContent}>
                        {mediaSeleccionado.tipo === "video" ? (
                            <video controls autoPlay style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                                <source src={mediaSeleccionado.ruta} type="video/mp4" />
                            </video>
                        ) : (
                            <img src={mediaSeleccionado.ruta} alt="Full" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
                        )}
                        <div style={{ marginTop: '15px', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '5px 12px', borderRadius: '20px', fontSize: '14px' }}>
                            {parteSel.todosArchivos.findIndex((m: any) => m.ruta === mediaSeleccionado.ruta) + 1} / {parteSel.todosArchivos.length}
                        </div>
                    </div>

                    {parteSel?.todosArchivos?.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); navegarGaleria('next'); }} style={{ ...styles.arrowBtn, right: '20px' }}>❯</button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;