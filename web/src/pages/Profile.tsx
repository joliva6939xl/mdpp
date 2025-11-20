// Archivo: mdpp/web/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ControlPanel from '../components/ControlPanel';

const API_URL = 'http://localhost:4000/api';

interface UsuarioSistema {
  id: number;
  nombre_usuario?: string;
  rol?: string;
  nombres?: string;
  dni?: string; // Este campo tiene 'joliva'
  creado_en?: string;
  usuario?: string;
  nombre?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialUsername = location.state?.username || 'Admin';
  const [userName] = useState(initialUsername);

  const [vistaActual, setVistaActual] = useState('APP');
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/', { replace: true });
  };

  const cargarUsuarios = async (tipo: string) => {
    setCargandoTabla(true);
    try {
      const endpoint = tipo === 'APP' ? '/admin/usuarios-app' : '/admin/usuarios-admin';
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();

      if (data.ok) {
        setListaUsuarios(data.usuarios);
      } else {
        console.warn('Backend msg:', data.message);
        setListaUsuarios([]);
      }
    } catch (error) {
      console.error('Error fetch:', error);
      alert('Error de conexión.');
    } finally {
      setCargandoTabla(false);
    }
  };

  useEffect(() => {
    cargarUsuarios(vistaActual);
  }, [vistaActual]);

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px 0' },
    header: { width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 20px', borderBottom: '1px solid #ccc', marginBottom: '20px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    title: { color: '#0066cc', margin: '10px 0 0 0' },
    welcomeText: { fontSize: '16px', color: '#333', marginBottom: '10px', fontWeight: 'bold' },
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' },
    tableSection: { width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    switchButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'left' },
    td: { borderBottom: '1px solid #ddd', padding: '10px', verticalAlign: 'middle' },
    
    celdaID: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', padding: '5px 0'}, 
    idNumero: { fontSize: '1.05em', fontWeight: 'bold', color: '#333' },
    idUsuario: { fontSize: '0.9em', color: '#fff', backgroundColor: '#e67e22', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold', marginTop: '3px'}, 
    
    nombreReal: { fontWeight: 'bold', color: '#2c3e50', fontSize: '1.05em' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.topBar}>
            <h2 style={styles.title}>DASHBOARD DE GERENCIA</h2>
            <button style={styles.logoutButton} onClick={handleLogout}>Cerrar Sesión</button>
        </div>
        <p style={styles.welcomeText}>Bienvenido, {userName}.</p>
      </div>

      <ControlPanel />

      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <h3>{vistaActual === 'APP' ? '👥 Usuarios de la App Móvil' : '👔 Usuarios Administrativos'}</h3>
          <button style={styles.switchButton} onClick={() => setVistaActual(vistaActual === 'APP' ? 'ADMIN' : 'APP')}>
            {vistaActual === 'APP' ? 'Ver Creados por Admin ➡' : '⬅ Ver Usuarios App'}
          </button>
        </div>

        {cargandoTabla ? (
          <p style={{textAlign: 'center'}}>Cargando datos...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID / Usuario</th>
                <th style={styles.th}>Nombre del Personal</th>
                {vistaActual === 'ADMIN' && <th style={styles.th}>Rol</th>}
                <th style={styles.th}>Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios && listaUsuarios.length > 0 ? (
                listaUsuarios.map((u) => {
                  
                  // LOG DE DEBUG PARA VER EL VALOR REAL DE DNI
                  if (vistaActual === 'APP') {
                    console.log(`🔎 Usuario ID ${u.id}: dni="${u.dni}"`);
                  }
                  
                  // LÓGICA DE VISUALIZACIÓN DEL USUARIO DE SISTEMA
                  const usuarioSistemaApp = u.dni || u.usuario;

                  return (
                  <tr key={u.id}> 
                    {/* COLUMNA 1: ID y USUARIO DE SISTEMA (EN RECUADRO) */}
                    <td style={styles.td}>
                      <div style={styles.celdaID}>
                        <span style={styles.idNumero}>{u.id}</span>
                        
                        {/* ⚠️ LÓGICA CORREGIDA: Solo comprobamos si la variable tiene un valor */}
                        {vistaActual === 'APP' && usuarioSistemaApp && (
                          <span style={styles.idUsuario}>
                            {usuarioSistemaApp}
                          </span>
                        )}
                        {/* Vista Admin: Muestra el nombre_usuario en el mismo estilo */}
                        {vistaActual === 'ADMIN' && u.nombre_usuario && (
                          <span style={styles.idUsuario}>
                            {u.nombre_usuario}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* COLUMNA 2: SOLO NOMBRE REAL */}
                    <td style={styles.td}>
                        {vistaActual === 'APP' ? (
                           <span style={styles.nombreReal}>
                             {u.nombres || u.nombre || 'Sin Nombre Registrado'}
                           </span>
                        ) : (
                           <span style={styles.nombreReal}>{u.rol}</span>
                        )}
                    </td>
                    
                    {vistaActual === 'ADMIN' && <td style={styles.td}>{u.rol || '-'}</td>}
                    
                    <td style={styles.td}>{u.creado_en ? new Date(u.creado_en).toLocaleDateString() : '-'}</td>
                  </tr>
                )}
              )) : (
                <tr>
                  <td colSpan={4} style={{...styles.td, textAlign: 'center'}}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}