import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:4000";

const EstadisticaScreen: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        Norte: 0,
        Centro: 0,
        Sur: 0,
        Total: 0
    });

    // 1. CARGA DE DATOS (Mantiene tu lógica de negocio)
    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Token para seguridad
                const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
                
                const res = await fetch(`${API_URL}/api/partes/metricas/zonales`, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.stats) {
                        setStats(data.stats);
                    } else if (data.Norte !== undefined) {
                        setStats(data);
                    }
                } else {
                    console.error("Error en respuesta de métricas");
                }
            } catch (error) {
                console.error("Error cargando estadísticas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    // ✅ 2. FIX DE NAVEGACIÓN: AHORA APUNTA A '/perfil' (Tu ruta correcta)
    const handleBack = () => {
        navigate('/perfil'); 
    };

    // 3. CÁLCULO DE PORCENTAJES
    const getPercent = (val: number) => {
        if (!stats.Total || stats.Total === 0) return 0;
        return Math.round((val / stats.Total) * 100);
    };

    const styles: Record<string, React.CSSProperties> = {
        container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
        header: { display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '20px' },
        backBtn: { background: '#64748b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
        title: { margin: 0, color: '#1e293b', fontSize: '26px', fontWeight: 800 },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
        card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
        cardLabel: { fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '10px' },
        cardNumber: { fontSize: '48px', fontWeight: 900, color: '#0f172a', lineHeight: 1 },
        progressBg: { height: '10px', width: '100%', background: '#f1f5f9', borderRadius: '5px', marginTop: '20px', overflow: 'hidden' },
        percentText: { fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginTop: '5px', textAlign: 'right' }
    };

    const renderProgressBar = (value: number, color: string) => (
        <div style={styles.progressBg}>
            <div style={{
                height: '100%',
                width: `${getPercent(value)}%`,
                background: color,
                borderRadius: '5px',
                transition: 'width 1s ease-in-out'
            }} />
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                {/* Botón que ejecuta handleBack */}
                <button onClick={handleBack} style={styles.backBtn}>
                    ⬅ VOLVER AL DASHBOARD
                </button>
                <h1 style={styles.title}>Métricas Zonales en Tiempo Real</h1>
            </div>

            {loading ? (
                <div style={{textAlign:'center', padding: 50, color: '#64748b'}}>Cargando métricas del sistema...</div>
            ) : (
                <div style={styles.grid}>
                    {/* ZONA NORTE */}
                    <div style={{...styles.card, borderTop: '6px solid #3b82f6'}}>
                        <div>
                            <div style={styles.cardLabel}>Zona Norte</div>
                            <div style={styles.cardNumber}>{stats.Norte}</div>
                        </div>
                        <div>
                            {renderProgressBar(stats.Norte, '#3b82f6')}
                            <div style={styles.percentText}>{getPercent(stats.Norte)}% del total</div>
                        </div>
                    </div>

                    {/* ZONA CENTRO */}
                    <div style={{...styles.card, borderTop: '6px solid #10b981'}}>
                        <div>
                            <div style={styles.cardLabel}>Zona Centro</div>
                            <div style={styles.cardNumber}>{stats.Centro}</div>
                        </div>
                        <div>
                            {renderProgressBar(stats.Centro, '#10b981')}
                            <div style={styles.percentText}>{getPercent(stats.Centro)}% del total</div>
                        </div>
                    </div>

                    {/* ZONA SUR */}
                    <div style={{...styles.card, borderTop: '6px solid #f59e0b'}}>
                        <div>
                            <div style={styles.cardLabel}>Zona Sur</div>
                            <div style={styles.cardNumber}>{stats.Sur}</div>
                        </div>
                        <div>
                            {renderProgressBar(stats.Sur, '#f59e0b')}
                            <div style={styles.percentText}>{getPercent(stats.Sur)}% del total</div>
                        </div>
                    </div>

                    {/* TOTAL GLOBAL */}
                    <div style={{...styles.card, borderTop: '6px solid #ef4444', background: '#fff1f2'}}>
                        <div>
                            <div style={{...styles.cardLabel, color: '#991b1b'}}>TOTAL GENERAL</div>
                            <div style={{...styles.cardNumber, color: '#ef4444'}}>{stats.Total}</div>
                        </div>
                        <div style={{marginTop: 20, fontSize: '13px', color: '#b91c1c', fontWeight: 'bold'}}>
                            Resumen consolidado de las 3 zonas
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EstadisticaScreen;