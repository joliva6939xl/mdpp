// Archivo: mdpp/web/src/pages/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ControlPanel from '../components/ControlPanel';

const BASE_URL = 'http://localhost:4000'; 
const API_URL = `${BASE_URL}/api`;

const getFotoUrl = (ruta: string) => {
    if (!ruta) return '';
    return `${BASE_URL}/uploads/${ruta.replace(/\\/g, '/')}`; 
};

// --- INTERFACES ---
interface UsuarioSistema {
  id: number;
  nombre_usuario?: string;
  rol?: string;
  nombres?: string;
  dni?: string; 
  creado_en?: string;
  usuario?: string;
  nombre?: string;
  tipo_tabla: 'APP' | 'ADMIN'; 
  estado?: string; // 🆕 Nuevo campo
  bloqueo_motivo?: string; // 🆕 Nuevo campo
}

interface UserDetails extends UsuarioSistema {
    celular?: string;
    cargo?: string;
    foto_ruta?: string;
}

interface ParteVirtual {
    id: number;
    usuario_id: number;
    sector?: string;
    parte_fisico?: string;
    zona?: string;
    turno?: string;
    lugar?: string;
    fecha?: string;
    hora?: string;
    unidad_tipo?: string;
    unidad_numero?: string;
    placa?: string;
    conductor?: string;
    dni_conductor?: string;
    sumilla?: string;
    asunto?: string;
    ocurrencia?: string;
    sup_zonal?: string;
    sup_general?: string;
    creado_en?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.username || 'Admin';

  const [vistaActual, setVistaActual] = useState<'APP' | 'ADMIN'>('APP');
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);
  
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<'DELETE' | 'BLOCK' | 'NONE'>('NONE');

  // Estados Modal Detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [usuarioPartes, setUsuarioPartes] = useState<ParteVirtual[]>([]);
  const [currentTabView, setCurrentTabView] = useState<'DETAILS' | 'PARTES'>('DETAILS');
  const [loadingModal, setLoadingModal] = useState(false);
  const [selectedParteDetail, setSelectedParteDetail] = useState<ParteVirtual | null>(null); 

  // 🆕 Estados Modal Bloqueo
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/', { replace: true });
  };
  
  // --- CARGA DE DATOS ---
  const cargarUsuarios = async (tipo: string) => {
    setCargandoTabla(true);
    try {
      const endpoint = tipo === 'APP' ? '/admin/usuarios-app' : '/admin/usuarios-admin';
      const response = await fetch(`${API_URL}${endpoint}`);
      const data = await response.json();
      if (data.ok) {
        const usuariosConTipo = data.usuarios.map((u: Omit<UsuarioSistema, 'tipo_tabla'>) => ({
            ...u, tipo_tabla: tipo === 'APP' ? 'APP' : 'ADMIN'
        }));
        setListaUsuarios(usuariosConTipo);
      } else { setListaUsuarios([]); }
    } catch (error) { console.error(error); } 
    finally { setCargandoTabla(false); }
  };

  useEffect(() => { cargarUsuarios(vistaActual); }, [vistaActual]);

  // --- LÓGICA DE SELECCIÓN ---
  const handleToggleMode = (mode: 'DELETE' | 'BLOCK') => {
      if (currentMode === mode) {
          // Si presiona el mismo botón, cancela
          setIsSelectionModeActive(false);
          setCurrentMode('NONE');
          setSelectedUserIds([]);
      } else {
          // Activa modo nuevo
          setIsSelectionModeActive(true);
          setCurrentMode(mode);
          setSelectedUserIds([]);
      }
  };

  const toggleSelect = (id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  // --- LÓGICA BLOQUEO ---
  const handleOpenBlockModal = () => {
      if (selectedUserIds.length === 0) return;
      setBlockReason(''); // Limpiar caja
      setShowBlockModal(true);
  };

  const handleExecuteBlock = async (accion: 'BLOQUEAR' | 'DESBLOQUEAR') => {
    if (accion === 'BLOQUEAR' && !blockReason.trim()) {
        alert("Por favor escribe un motivo (Ej: Vacaciones).");
        return;
    }

    try {
        const users = listaUsuarios.filter(u => selectedUserIds.includes(u.id)).map(u => ({ id: u.id, tipo: u.tipo_tabla }));
        
        const response = await fetch(`${API_URL}/admin/toggle-bloqueo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ users, accion, motivo: blockReason }),
        });

        const json = await response.json();
        if (json.ok) {
            alert(`✅ Operación exitosa: ${accion}`);
            setShowBlockModal(false);
            handleToggleMode('BLOCK'); // Salir del modo
            cargarUsuarios(vistaActual); // Recargar tabla
        } else {
            alert("Error: " + json.message);
        }

    } catch (error) {
        console.error(error);
        alert("Error de conexión.");
    }
  };

  // --- LÓGICA BORRADO ---
  const handleDeleteUsers = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`¿Borrar ${selectedUserIds.length} usuario(s)?`)) return;

    try {
      const users = listaUsuarios.filter(u => selectedUserIds.includes(u.id)).map(u => ({ id: u.id, tipo: u.tipo_tabla }));
      const response = await fetch(`${API_URL}/admin/delete-usuarios`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      const json = await response.json();
      if (json.ok) {
        alert('✅ Usuarios eliminados.');
        handleToggleMode('DELETE');
        cargarUsuarios(vistaActual); 
      } else { alert(`Error: ${json.message}`); }
    } catch (error) { console.error(error); alert("Error de conexión."); }
  };

  // --- DETALLES Y PARTES ---
  const handleParteClick = async (parteId: number) => {
    setLoadingModal(true);
    try {
        const resp = await fetch(`${API_URL}/partes/${parteId}`);
        const json = await resp.json();
        if (json.ok) setSelectedParteDetail(json.data);
        else alert(`Error: ${json.message}`);
    } catch (error) { console.error(error); alert("Error de conexión."); } finally { setLoadingModal(false); }
  }

  const handleRowClick = async (user: UsuarioSistema) => {
    if (isSelectionModeActive) return; // Si estamos borrando/bloqueando, no abre modal
    setUserDetails(null);
    setUsuarioPartes([]);
    setSelectedParteDetail(null);
    setCurrentTabView('DETAILS');
    setShowDetailsModal(true);
    setLoadingModal(true);
    try {
        const detailResp = await fetch(`${API_URL}/admin/usuario-details/${user.id}`);
        const detailJson = await detailResp.json();
        if (detailJson.ok) setUserDetails(detailJson.user);
        if (user.tipo_tabla === 'APP') {
            const partesResp = await fetch(`${API_URL}/admin/usuario-partes/${user.id}`);
            const partesJson = await partesResp.json();
            if (partesJson.ok) setUsuarioPartes(partesJson.partes);
        }
    } catch (error) { console.error(error); } finally { setLoadingModal(false); }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px 0' },
    header: { width: '100%', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', padding: '0 20px', borderBottom: '1px solid #ccc', marginBottom: '20px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    title: { color: '#0066cc', margin: '10px 0 0 0' },
    welcomeText: { fontSize: '16px', color: '#333', marginBottom: '10px', fontWeight: 'bold' },
    logoutButton: { padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    tableSection: { width: '100%', maxWidth: '1000px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    switchButton: { padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'left' },
    td: { borderBottom: '1px solid #ddd', padding: '10px', verticalAlign: 'middle', cursor: 'pointer' },
    celdaID: { display: 'flex', flexDirection: 'column', justifyContent: 'center' }, 
    idNumero: { fontSize: '1.1em', fontWeight: 'bold', color: '#333' },
    idUsuario: { fontSize: '0.9em', color: '#fff', backgroundColor: '#e67e22', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold', marginTop: '3px'}, 
    thCheckbox: { width: '40px', backgroundColor: '#007bff', textAlign: 'center', padding: '10px' },
    tdCheckbox: { width: '40px', borderBottom: '1px solid #ddd', padding: '10px', textAlign: 'center' },
    checkbox: { transform: 'scale(1.5)', cursor: 'pointer' },
    rowSelected: { backgroundColor: '#e8f0fe' },
    // Label Bloqueado
    blockedLabel: { backgroundColor: '#dc3545', color: 'white', fontSize: '0.75em', padding: '2px 5px', borderRadius: '3px', marginLeft: '8px', fontWeight: 'bold' },
    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', borderRadius: '8px', width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
    modalHeader: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa' },
    modalBody: { padding: '20px' },
    tabBar: { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' },
    tabButton: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', color: '#666' },
    tabButtonActive: { color: '#007bff', borderBottom: '3px solid #007bff', fontWeight: 'bold' },
    parteItem: { border: '1px solid #eee', borderRadius: '6px', padding: '10px', marginBottom: '10px', backgroundColor: '#fafafa', cursor: 'pointer' }, 
    parteHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9em', color: '#666' },
    parteSumilla: { fontWeight: 'bold', color: '#333', fontSize: '1.1em' },
    labelDetalle: { fontWeight: 'bold', color: '#007bff', marginTop: '10px', borderBottom: '1px dotted #ccc', paddingBottom: '3px' },
    detalleValor: { padding: '5px 0' },
    downloadButton: { padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginLeft: '15px' },
    // Modal Bloqueo Styles
    blockInput: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', margin: '15px 0' },
    modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }
  };

  // --- RENDERIZADO MODAL BLOQUEO ---
  const renderBlockModal = () => {
      if (!showBlockModal) return null;
      return (
          <div style={styles.modalOverlay}>
              <div style={{...styles.modalContent, maxWidth: '500px'}}>
                  <div style={styles.modalHeader}>
                      <h3 style={{margin:0}}>🔒 Gestionar Bloqueo</h3>
                      <button onClick={() => setShowBlockModal(false)} style={{border:'none', background:'none', fontSize:'20px', cursor:'pointer'}}>×</button>
                  </div>
                  <div style={styles.modalBody}>
                      <p>Has seleccionado <strong>{selectedUserIds.length}</strong> usuario(s).</p>
                      
                      <label style={{fontWeight:'bold', display:'block', marginTop:'10px'}}>Motivo (obligatorio para bloquear):</label>
                      <textarea 
                        style={styles.blockInput} 
                        placeholder="Ej: Vacaciones, Falta grave..." 
                        value={blockReason} 
                        onChange={e => setBlockReason(e.target.value)}
                      />
                      
                      <div style={styles.modalFooter}>
                          <button 
                            style={{...styles.downloadButton, backgroundColor: '#28a745'}} 
                            onClick={() => handleExecuteBlock('DESBLOQUEAR')}
                          >
                              🔓 Desbloquear
                          </button>
                          <button 
                            style={{...styles.downloadButton, backgroundColor: '#dc3545'}} 
                            onClick={() => handleExecuteBlock('BLOQUEAR')}
                          >
                              🔒 BLOQUEAR
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const renderParteDetail = () => {
    if (!selectedParteDetail) return null;
    const p = selectedParteDetail;
    return (
        <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <button style={{...styles.tabButton, color:'#dc3545', borderBottom:'none'}} onClick={() => setSelectedParteDetail(null)}>⬅️ Volver</button>
                <button style={styles.downloadButton} onClick={() => alert(`Lógica descarga ID ${p.id}`)}>⬇️ Descargar</button>
            </div>
            <h3 style={{borderBottom:'2px solid #007bff', paddingBottom:'5px'}}>Detalle Parte N° {p.id}</h3>
            <div style={{marginBottom:'20px'}}>
                <p style={styles.labelDetalle}>SUMILLA / ASUNTO</p>
                <p style={styles.parteSumilla}>{p.sumilla || '-'} / {p.asunto || '-'}</p>
                <p style={styles.labelDetalle}>OCURRENCIA</p>
                <p style={styles.detalleValor}>{p.ocurrencia || '-'}</p>
            </div>
            {/* ... Resto del detalle (Simplificado para brevedad, mantener tu lógica original) ... */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                 <div><p style={styles.labelDetalle}>GENERAL</p><p>Físico: {p.parte_fisico}</p><p>Fecha: {p.fecha}</p></div>
                 <div><p style={styles.labelDetalle}>UNIDAD</p><p>Placa: {p.placa}</p><p>Conductor: {p.conductor}</p></div>
            </div>
        </div>
    );
  }

  const renderDetailsModal = () => {
    if (!showDetailsModal) return null;
    return (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
            <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHeader}>
                    <h2 style={{margin:0}}>{loadingModal ? 'Cargando...' : userDetails?.nombre || 'Usuario'}</h2>
                    {userDetails?.estado === 'BLOQUEADO' && <span style={styles.blockedLabel}>BLOQUEADO</span>}
                    <button onClick={() => setShowDetailsModal(false)} style={{border:'none', background:'none', fontSize:'24px', cursor:'pointer'}}>×</button>
                </div>
                <div style={styles.modalBody}>
                    <div style={styles.tabBar}>
                        <button style={{...styles.tabButton, ...(currentTabView === 'DETAILS' ? styles.tabButtonActive : {})}} onClick={() => { setCurrentTabView('DETAILS'); setSelectedParteDetail(null); }}>📋 Información</button>
                        <button style={{...styles.tabButton, ...(currentTabView === 'PARTES' ? styles.tabButtonActive : {})}} onClick={() => { setCurrentTabView('PARTES'); setSelectedParteDetail(null); }}>📄 Partes ({usuarioPartes.length})</button>
                    </div>
                    {currentTabView === 'PARTES' && selectedParteDetail ? renderParteDetail() : 
                     currentTabView === 'DETAILS' && userDetails ? (
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px'}}>
                            <div><strong>Estado:</strong> <span style={{color: userDetails.estado === 'BLOQUEADO' ? 'red' : 'green', fontWeight:'bold'}}>{userDetails.estado || 'ACTIVO'}</span></div>
                            {userDetails.estado === 'BLOQUEADO' && <div style={{gridColumn:'1/-1', color:'red'}}><strong>Motivo Bloqueo:</strong> {userDetails.bloqueo_motivo}</div>}
                            <div><strong>Usuario:</strong> {userDetails.dni || userDetails.usuario}</div>
                            <div><strong>Rol:</strong> {userDetails.rol}</div>
                            {userDetails.foto_ruta && <div style={{gridColumn:'1/-1'}}><img src={getFotoUrl(userDetails.foto_ruta)} alt="Perfil" style={{maxWidth:'100px'}} /></div>}
                        </div>
                     ) : currentTabView === 'PARTES' ? (
                        <div style={{maxHeight:'400px', overflowY:'auto'}}>
                             {usuarioPartes.map(p => (
                                 <div key={p.id} style={styles.parteItem} onClick={() => handleParteClick(p.id)}>
                                     <div style={styles.parteHeader}><span>📅 {p.fecha}</span><span>🆔 #{p.id}</span></div>
                                     <div style={styles.parteSumilla}>{p.sumilla}</div>
                                 </div>
                             ))}
                        </div>
                     ) : <p>Cargando...</p>}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div style={styles.container}>
      {renderDetailsModal()}
      {renderBlockModal()} 

      <div style={styles.header}>
        <div style={styles.topBar}><h2 style={styles.title}>DASHBOARD</h2><button style={styles.logoutButton} onClick={handleLogout}>Salir</button></div>
        <p style={styles.welcomeText}>Hola, {userName}</p>
      </div>

      <ControlPanel 
        selectedUserCount={selectedUserIds.length}
        onDeleteUsers={handleDeleteUsers}
        onBlockAction={handleOpenBlockModal}
        isSelectionModeActive={isSelectionModeActive}
        onToggleSelection={handleToggleMode}
        currentMode={currentMode}
      />

      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
            <h3>{vistaActual === 'APP' ? 'Usuarios App' : 'Administrativos'}</h3>
            <button style={styles.switchButton} onClick={() => setVistaActual(vistaActual === 'APP' ? 'ADMIN' : 'APP')}>{vistaActual === 'APP' ? 'Ver Admin ➡' : '⬅ Ver App'}</button>
        </div>
        {cargandoTabla ? <p style={{textAlign:'center'}}>Cargando...</p> : (
            <table style={styles.table}>
                <thead>
                    <tr>
                        {isSelectionModeActive && <th style={styles.thCheckbox}>✔</th>}
                        <th style={styles.th}>ID / Usuario</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {listaUsuarios.map(u => (
                        <tr key={u.id} onClick={() => handleRowClick(u)} style={{...styles.td, backgroundColor: selectedUserIds.includes(u.id) ? '#e8f0fe' : (u.estado === 'BLOQUEADO' ? '#fff5f5' : 'transparent'), cursor: isSelectionModeActive ? 'default' : 'pointer'}}>
                            {isSelectionModeActive && <td style={styles.tdCheckbox}><input type="checkbox" style={styles.checkbox} checked={selectedUserIds.includes(u.id)} onChange={e => {e.stopPropagation(); toggleSelect(u.id);}} /></td>}
                            <td style={styles.td}>
                                <div style={styles.celdaID}>
                                    <span style={styles.idNumero}>{u.id}</span>
                                    <span style={styles.idUsuario}>{u.dni || u.usuario}</span>
                                </div>
                            </td>
                            <td style={styles.td}>
                                {u.nombre || u.nombres}
                                {u.estado === 'BLOQUEADO' && <span style={styles.blockedLabel}>BLOQUEADO</span>}
                            </td>
                            <td style={styles.td}>{u.creado_en ? new Date(u.creado_en).toLocaleDateString() : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
      </div>
    </div>
  );
}