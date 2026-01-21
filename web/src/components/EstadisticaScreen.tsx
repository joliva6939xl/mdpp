import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = "http://localhost:4000"; 

const EstadisticaScreen = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    // Estado inicial en 0
    const [stats, setStats] = useState({ Norte: 0, Centro: 0, Sur: 0, Total: 0 });

    useEffect(() => {
        const fetchMetricas = async () => {
            try {
                // Recuperamos el token para tener permiso
                const token = localStorage.getItem('token'); 

                // ✅ LLAMADA A LA RUTA QUE CREASTE EN EL BACKEND
                const res = await fetch(`${API_URL}/api/partes/metricas/zonales`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Importante porque tu ruta tiene verificarToken
                    }
                });
                
                const data = await res.json();
                
                if (data.ok && data.stats) {
                    setStats(data.stats);
                } else {
                    console.error("No se pudieron cargar las métricas:", data);
                }
            } catch (error) {
                console.error("Error de conexión:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetricas();
    }, []);

    // Calcular porcentaje para las barras
    const getPercent = (val: number) => {
        if (stats.Total === 0) return 0;
        return (val / stats.Total) * 100;
    };

    return (
        <div style={{ padding: '40px', background: '#f4f6f8', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
            
            <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', width: '100%', maxWidth: '800px' }}>
                
                <h2 style={{ textAlign: 'center', color: '#1565C0', fontWeight: 'bold', marginBottom: '10px', fontSize: '24px' }}>
                    MÉTRICAS EN TIEMPO REAL
                </h2>
                
                <div style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}></div>

                <h3 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                    Total de Partes: <span style={{ fontWeight: '900', fontSize: '22px', color: '#1565C0' }}>{loading ? '...' : stats.Total}</span>
                </h3>

                {/* TABLA DE BARRAS */}
                <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    
                    {/* Encabezado */}
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 1fr', padding: '15px 20px', background: '#f8fafc', fontWeight: 'bold', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontSize:'13px', letterSpacing:'1px' }}>
                        <div>ZONA</div>
                        <div style={{textAlign: 'center'}}>CANTIDAD</div>
                        <div>PROGRESO</div>
                    </div>

                    {loading ? <p style={{textAlign:'center', padding:20, color:'#94a3b8'}}>Cargando datos...</p> : (
                        <>
                            {/* ZONA NORTE */}
                            <FilaZona 
                                nombre="NORTE" 
                                cantidad={stats.Norte} 
                                color="#3b82f6" // Azul
                                porcentaje={getPercent(stats.Norte)} 
                            />

                            {/* ZONA CENTRO */}
                            <FilaZona 
                                nombre="CENTRO" 
                                cantidad={stats.Centro} 
                                color="#10b981" // Verde Esmeralda
                                porcentaje={getPercent(stats.Centro)} 
                            />

                            {/* ZONA SUR */}
                            <FilaZona 
                                nombre="SUR" 
                                cantidad={stats.Sur} 
                                color="#f59e0b" // Naranja Ámbar
                                porcentaje={getPercent(stats.Sur)} 
                            />
                        </>
                    )}
                </div>

                {/* Botón Volver */}
                <button 
                    onClick={() => navigate('/')} 
                    style={{ 
                        marginTop: '30px', 
                        padding: '12px 24px', 
                        background: '#64748b', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <span>⬅</span> Volver al Dashboard
                </button>

            </div>
        </div>
    );
};

// Componente visual para cada fila
const FilaZona = ({ nombre, cantidad, color, porcentaje }: { nombre: string, cantidad: number, color: string, porcentaje: number }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 1fr', padding: '15px 20px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
            <div style={{ fontWeight: '800', color: '#334155' }}>{nombre}</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{cantidad}</div>
            
            {/* Barra de fondo */}
            <div style={{ width: '100%', background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                {/* Barra de progreso animada */}
                <div style={{ 
                    width: `${porcentaje}%`, 
                    background: color, 
                    height: '100%', 
                    borderRadius: '5px',
                    transition: 'width 1s ease-in-out'
                }} />
            </div>
        </div>
    );
};

export default EstadisticaScreen;