/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from 'react';
import { DownloadWordButton } from "./DownloadWordButton";
import { DownloadExcelButton } from "./DownloadExcelButton";

const API_URL = "http://localhost:4000";

const SUMILLA_COLORS: any = {
    "ROBO": "#ef4444", "HURTO": "#f97316", "APOYO": "#22c55e",
    "ACCIDENTE": "#3b82f6", "INCENDIO": "#b91c1c", "SOSPECHOSO": "#eab308", "OTROS": "#64748b"
};

const getSumillaColor = (sumilla: string) => {
    const s = (sumilla || "").toUpperCase();
    return SUMILLA_COLORS[s] || SUMILLA_COLORS["OTROS"];
};

const getLocalToday = () => {
    const now = new Date();
    if (now.getHours() < 6) now.setDate(now.getDate() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const cleanFileName = (rawPath: any) => {
    if (!rawPath) return "";
    const pathString = typeof rawPath === 'string' ? rawPath : (rawPath.ruta || rawPath.path || "");
    return pathString.split(/[\\/]/).pop() || "";
};

const fetchOptions = () => ({
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
});

// --- COMPONENTE DETALLE DE PARTE (SÍSIFO FULL DATA) ---
const ParteDetalleView = ({ parte, onClose, onOpenMedia }: any) => {
    const [descargando, setDescargando] = useState(false);

    const evidencias = useMemo(() => {
        if (!parte) return [];
        const lista: any[] = [];
        const format = (raw: string) => raw.startsWith('http') ? raw : `${API_URL}/uploads/${raw}`;
        if (Array.isArray(parte.fotos)) parte.fotos.forEach((f: any) => lista.push({ url: format(f), tipo: 'foto' }));
        if (Array.isArray(parte.videos)) parte.videos.forEach((v: any) => lista.push({ url: format(v), tipo: 'video' }));
        return lista;
    }, [parte]);

    if (!parte) return (
        <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 50, opacity: 0.3 }}>📂</div>
            <p style={{ fontSize: 13, fontWeight: 500 }}>SISTEMA SISIFO: <br/> SELECCIONE UN REGISTRO</p>
        </div>
    );

    const openGoogleMaps = () => {
        const lat = parte.latitud || parte.lat;
        const lng = parte.longitud || parte.lng;
        if (lat && lng) window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        else alert("Sin coordenadas GPS.");
    };

    const handleDescargarFolio = async () => {
        try {
            setDescargando(true);
            const rawToken = localStorage.getItem("token") || "";
            const token = rawToken.startsWith('"') ? JSON.parse(rawToken) : rawToken;
            const response = await fetch(`${API_URL}/api/partes/${parte.id}/descargar-folio`, { 
                method: 'GET', headers: { 'Authorization': `Bearer ${token}` } 
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `EXP_SISIFO_P${parte.id}.zip`;
            link.click();
        } catch { alert("Error en servidor SISIFO"); } 
        finally { setDescargando(false); }
    };

    const SectionHeader = ({ title, icon }: any) => (
        <div style={{ background: '#1e293b', color: '#f8fafc', padding: '6px 12px', fontSize: 11, fontWeight: 800, borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', gap: 8, marginTop: 15 }}>
            <span>{icon}</span> {title.toUpperCase()}
        </div>
    );

    const Row = ({ label, value, color, isBold = false }: any) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderBottom: '1px solid #e2e8f0', fontSize: 11.5, background: '#fff' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
            <span style={{ fontWeight: isBold ? 800 : 500, color: color || '#1e293b', textAlign: 'right', maxWidth: '65%', textTransform: 'uppercase' }}>{value || "---"}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
            {/* CABECERA CON OPERADOR RESTAURADA */}
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)', color: 'white', padding: '15px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img 
                            src={parte.usuario_foto ? `${API_URL}/uploads/usuarios/${cleanFileName(parte.usuario_foto)}` : 'https://via.placeholder.com/40'} 
                            style={{ width: 45, height: 45, borderRadius: '50%', border: '2px solid #3b82f6', objectFit: 'cover' }} 
                            alt="op" 
                        />
                        <div>
                            <div style={{ fontSize: 9, opacity: 0.8, fontWeight: 700 }}>OPERADOR REDACTOR</div>
                            <div style={{ fontSize: 13, fontWeight: 800 }}>{parte.usuario_nombre || "SISTEMA"}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer' }}>✕</button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 20px 15px' }}>
                
                {/* SUMILLA DESTACADA */}
                <div style={{ marginTop: 15, background: 'white', padding: '12px', borderRadius: 8, borderLeft: `6px solid ${getSumillaColor(parte.sumilla)}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>SUMILLA / CATEGORÍA</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: getSumillaColor(parte.sumilla) }}>{parte.sumilla?.toUpperCase()}</div>
                </div>

                <SectionHeader title="Intervención" icon="📍" />
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    <Row label="Parte Virtual" value={`#${parte.id}`} isBold color="#3b82f6" />
                    <Row label="Correlativo Físico" value={parte.correlativo_fisico || parte.fisico} />
                    <Row label="Fecha" value={parte.fecha} isBold />
                    {/* HORAS INICIO / FIN RESTAURADAS */}
                    <Row label="Hora Inicio" value={parte.hora_inicio || parte.hora} color="#059669" isBold />
                    <Row label="Hora Término" value={parte.hora_fin || "---"} color="#dc2626" isBold />
                    <Row label="Zona / Sector" value={`${parte.zona} / ${parte.sector || '---'}`} color="#1e3a8a" isBold />
                    <Row label="Ubicación" value={parte.lugar || parte.lugar_exacto || parte.direccion} />
                    <div style={{ padding: 10, background: 'white' }}>
                        <button onClick={openGoogleMaps} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 800, fontSize: 11 }}>🌐 GEOPOSICIONAMIENTO GPS</button>
                    </div>
                </div>

                <SectionHeader title="Recursos / Unidad" icon="🚔" />
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    <Row label="Unidad" value={parte.unidad} />
                    <Row label="Placa" value={parte.placa} isBold color="#b91c1c" />
                    <Row label="Conductor" value={parte.conductor} />
                    <Row label="DNI Conductor" value={parte.dni_conductor || parte.dni} />
                </div>

                <SectionHeader title="Ocurrencia" icon="📝" />
                <div style={{ background: 'white', padding: 15, fontSize: 12, border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', textAlign: 'justify', lineHeight: '1.5' }}>{parte.ocurrencia}</div>

                <SectionHeader title="Mandos y Responsables" icon="👮" />
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                    <Row label="Intervinientes" value={parte.participantes} />
                    <Row label="Cargos" value={parte.cargo_participantes} />
                    <Row label="Sup. General" value={parte.supervisor_general} isBold />
                    <Row label="Jefe Operaciones" value={parte.jefe_operaciones} />
                    <Row label="Sup. Zonal / Turno" value={parte.supervisor_zonal || parte.supervisor_turno} />
                </div>

                <SectionHeader title="Evidencias" icon="📸" />
                <div style={{ padding: 12, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {evidencias.map((m: any, i: number) => (
                            <div key={i} onClick={() => onOpenMedia(m)} style={{ aspectRatio: '1/1', background: '#0f172a', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '2px solid #f1f5f9' }}>
                                {m.tipo === 'video' ? <div style={{ color: '#3b82f6', fontSize: 10, textAlign: 'center', marginTop: '35%', fontWeight: 800 }}>▶ VIDEO</div> : <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="e" />}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleDescargarFolio} disabled={descargando} style={{ width: '100%', padding: 14, background: '#1e293b', color: '#10b981', border: '2px solid #10b981', borderRadius: 8, fontWeight: 900, cursor: 'pointer', marginTop: 20 }}>
                    {descargando ? "PROCESANDO..." : "📥 DESCARGAR EXPEDIENTE SISIFO"}
                </button>
            </div>
        </div>
    );
};

// --- DASHBOARD PRINCIPAL ---
const CallCenterDashboard: React.FC<any> = ({ userName, onLogout, internoNombre, internoRoperoTurno, onBack }) => {
    const [fecha, setFecha] = useState(getLocalToday());
    const [turnoSel, setTurnoSel] = useState("TURNO DIA");
    const [rawPartes, setRawPartes] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [userSel, setUserSel] = useState<any>(null);
    const [userPartes, setUserPartes] = useState<any[]>([]);
    const [parteSel, setParteSel] = useState<any>(null);
    const [parteModalSel, setParteModalSel] = useState<any>(null);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [mediaSeleccionado, setMediaSeleccionado] = useState<any>(null);

    const partesFiltrados = useMemo(() => {
        return rawPartes.filter(p => {
            const [horaStr, minStr] = (p.hora || "00:00").split(':');
            const h = parseInt(horaStr);
            const tiempoEnMinutos = h * 60 + parseInt(minStr);
            const limiteMañana = 6 * 60 + 1;
            const limiteTarde = 18 * 60;
            let fechaOperativa = p.fecha;
            if (tiempoEnMinutos < limiteMañana) {
                const d = new Date(p.fecha + "T12:00:00");
                d.setDate(d.getDate() - 1);
                fechaOperativa = d.toISOString().split('T')[0];
            }
            if (fechaOperativa !== fecha) return false;
            return turnoSel === "TURNO DIA" ? (tiempoEnMinutos >= limiteMañana && tiempoEnMinutos <= limiteTarde) : (tiempoEnMinutos > limiteTarde || tiempoEnMinutos < limiteMañana);
        });
    }, [rawPartes, turnoSel, fecha]);

    const renderMapeo = (zonaItems: any[]) => {
        const conteo = zonaItems.reduce((acc: any, p: any) => {
            const s = (p.sumilla || "OTROS").toUpperCase();
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                {Object.entries(conteo).map(([k, v]: any) => (
                    <span key={k} style={{ fontSize: 9, background: getSumillaColor(k), color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 'bold' }}>{k}: {v}</span>
                ))}
            </div>
        );
    };

    useEffect(() => {
        const load = async () => {
            try {
                const fSel = new Date(fecha + "T12:00:00");
                const fSig = new Date(fSel); fSig.setDate(fSig.getDate() + 1);
                const [resHoy, resMañana] = await Promise.all([
                    fetch(`${API_URL}/api/partes?fecha=${fecha}`, fetchOptions()),
                    fetch(`${API_URL}/api/partes?fecha=${fSig.toISOString().split('T')[0]}`, fetchOptions())
                ]);
                const dHoy = await resHoy.json();
                const dMañana = await resMañana.json();
                setRawPartes([...(dHoy.partes || []), ...(dMañana.partes || [])]);
            } catch (e) { console.error(e); }
        };
        load();
    }, [fecha]);

    return (
        <div style={{ padding: 20, background: '#f1f5f9', minHeight: '100vh', display: 'flex', gap: 20, fontFamily: 'sans-serif' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button onClick={onBack} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer' }}>←</button>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>SISIFO CALL CENTER – <span style={{ color: '#3b82f6' }}>{userName}</span></h1>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '12px', borderRadius: 12, marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    <select value={turnoSel} onChange={(e) => setTurnoSel(e.target.value)} style={{ padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                        <option value="TURNO DIA">☀️ TURNO DÍA</option>
                        <option value="TURNO NOCHE">🌙 TURNO NOCHE</option>
                    </select>
                    <div style={{ flex: 1 }} />
                    <button onClick={async () => { setShowModal(true); setView('list'); const r = await fetch(`${API_URL}/api/usuarios`, fetchOptions()); if(r.ok) setUsuarios(await r.json()); }} style={{ padding: '10px 15px', background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>GESTOR PERSONAL</button>
                    <DownloadWordButton fecha={fecha} turno={turnoSel} />
                    <DownloadExcelButton fecha={fecha} turno={turnoSel} operador={internoRoperoTurno || ""} callcenter={internoNombre || ""} />
                    <button onClick={onLogout} style={{ padding: '10px 15px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, fontWeight: 'bold' }}>SALIR</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
                    {['Norte', 'Centro', 'Sur'].map(z => {
                        const items = partesFiltrados.filter(p => (p.zona || "").toLowerCase().includes(z.toLowerCase()));
                        return (
                            <div key={z} style={{ background: 'white', borderRadius: 15, height: '62vh', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>ZONA {z.toUpperCase()} ({items.length})</div>
                                    {renderMapeo(items)}
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                                    {items.map((p: any) => (
                                        <div key={p.id} onClick={() => setParteSel(p)} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}><b>#{p.id}</b> <span style={{ color: '#94a3b8' }}>{p.hora}</span></div>
                                            <div style={{ color: getSumillaColor(p.sumilla), fontWeight: 800, fontSize: 13, margin: '2px 0' }}>{p.sumilla}</div>
                                            <div style={{ color: '#64748b', fontSize: 10 }}>{p.lugar || p.lugar_exacto}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* CONSOLIDADO INFERIOR CON TEXTO AZUL RESTAURADO */}
                <div style={{ marginTop: 15, background: '#1e293b', color: 'white', padding: '15px 25px', borderRadius: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>CONSOLIDADO DE OPERACIONES SISIFO</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Operativo: <b>{fecha}</b> | Turno: <b>{turnoSel}</b></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: 1 }}>TOTAL PARTES</div>
                        <div style={{ fontSize: 34, fontWeight: 900 }}>{partesFiltrados.length}</div>
                    </div>
                </div>
            </div>

            {/* DETALLE LATERAL */}
            {parteSel && (
                <div style={{ width: 420, background: 'white', padding: 0, borderRadius: 20, height: '90vh', position: 'sticky', top: 20, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <ParteDetalleView parte={parteSel} onClose={() => setParteSel(null)} onOpenMedia={(m: any) => { setMediaSeleccionado(m); setShowMediaModal(true); }} />
                </div>
            )}

            {/* MODAL GESTOR PERSONAL */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', width: '950px', height: '85vh', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <h3 style={{ margin: 0 }}>Gestión de Personal</h3>
                            <button onClick={() => { setShowModal(false); setView('list'); }} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
                        </div>
                        {view === 'list' ? (
                            <div style={{ padding: 30, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
                                {usuarios.map(u => (
                                    <div key={u.id} onClick={async () => { 
                                        setUserSel(u); setView('detail'); 
                                        const r = await fetch(`${API_URL}/api/usuarios/${u.id}/partes`, fetchOptions()); 
                                        if (r.ok) { const d = await r.json(); setUserPartes(d.partes || []); }
                                    }} style={{ padding: 20, background: '#f8fafc', borderRadius: 15, textAlign: 'center', cursor: 'pointer', border: '1px solid #e2e8f0' }}>
                                        <img src={`${API_URL}/uploads/usuarios/${cleanFileName(u.foto_ruta)}`} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '3px solid white' }} onError={(e: any) => e.target.src = 'https://via.placeholder.com/80'} alt="u" />
                                        <div style={{ fontWeight: 800, fontSize: 13 }}>{u.usuario}</div>
                                        <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700, marginTop: 4 }}>{u.rol || 'OPERADOR'}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                                <div style={{ width: 320, borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                                    <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
                                        <button onClick={() => setView('list')} style={{ background: '#1e293b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', marginBottom: 15 }}>← VOLVER</button>
                                        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                            <img src={`${API_URL}/uploads/usuarios/${cleanFileName(userSel?.foto_ruta)}`} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} alt="s" />
                                            <div><div style={{ fontWeight: 800, fontSize: 14 }}>{userSel?.usuario}</div><div style={{ fontSize: 10 }}>{userPartes.length} Partes</div></div>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', padding: 15 }}>
                                        {userPartes.map(p => (
                                            <div key={p.id} onClick={async () => { const r = await fetch(`${API_URL}/api/partes/${p.id}`, fetchOptions()); const d = await r.json(); setParteModalSel(d.parte || d.data); }} style={{ padding: 10, background: 'white', borderRadius: 8, marginBottom: 8, cursor: 'pointer', border: '1px solid #eee', fontSize: 11 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>#{p.id}</b> <span>{p.hora}</span></div>
                                                <div style={{ fontWeight: 700, color: getSumillaColor(p.sumilla) }}>{p.sumilla}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: 0, overflowY: 'auto', background: 'white' }}>
                                    {parteModalSel ? <ParteDetalleView parte={parteModalSel} onClose={() => setParteModalSel(null)} onOpenMedia={(m: any) => { setMediaSeleccionado(m); setShowMediaModal(true); }} /> : <div style={{ textAlign: 'center', marginTop: 100, color: '#94a3b8' }}>Seleccione un registro a la izquierda</div>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VISOR MULTIMEDIA */}
            {showMediaModal && mediaSeleccionado && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowMediaModal(false)}>
                    {mediaSeleccionado.tipo === 'video' ? <video src={mediaSeleccionado.url} controls autoPlay style={{ maxWidth: '90%', maxHeight: '90%' }} onClick={(e) => e.stopPropagation()} /> : <img src={mediaSeleccionado.url} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} alt="m" onClick={(e) => e.stopPropagation()} />}
                </div>
            )}
        </div>
    );
};

export default CallCenterDashboard;