import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Tipos
export type UserTarget = "APP" | "ADMIN";
export type SelectionMode = "DELETE" | "BLOCK" | "UNBLOCK" | "NONE";

export interface ControlPanelProps {
  userName: string;
  selectedUserCount: number;
  isSelectionModeActive: boolean;
  currentMode: SelectionMode;
  currentUserTarget: UserTarget;
  onUserTargetChange: (value: UserTarget) => void;
  onSelectModeChange: (mode: SelectionMode) => void;
  onDeleteUsers: () => void | Promise<void>;
  onOpenBlockModal: () => void;
  onLogout: () => void;
  onBack: () => void;
}

const API_URL = "http://localhost:4000/api";

const generarUsuarioDesdeNombre = (nombre: string) => {
  if (!nombre.trim()) return "";
  const partes = nombre.trim().split(/\s+/);
  const primerNombre = partes[0] || "";
  const primerApellido = partes[1] || "";
  return (primerNombre.charAt(0) + primerApellido).toLowerCase();
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  userName,
  selectedUserCount,
  isSelectionModeActive,
  currentMode,
  currentUserTarget,
  onUserTargetChange,
  onSelectModeChange,
  onDeleteUsers,
  onOpenBlockModal,
  onLogout,
  onBack,
}) => {
  const navigate = useNavigate();

  // Estados locales del formulario
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"APP" | "ADMIN">("APP");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [usuarioNuevo, setUsuarioNuevo] = useState("");
  
  // APP
  const [dniNuevo, setDniNuevo] = useState("");
  const [celularNuevo, setCelularNuevo] = useState("");
  const [cargoNuevo, setCargoNuevo] = useState("");
  
  // ADMIN
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [rolAdminNuevo, setRolAdminNuevo] = useState("ADMIN");
  
  // Permisos
  const [permCrearParte, setPermCrearParte] = useState(true);
  const [permBorrarParte, setPermBorrarParte] = useState(false);
  const [permCerrarParte, setPermCerrarParte] = useState(false);
  // ✅ RECUPERADO: Estado para el permiso de estadísticas
  const [permVerEstadisticasDescargar, setPermVerEstadisticasDescargar] = useState(false);
  
  const [creando, setCreando] = useState(false);

  const resetForm = () => {
    setTipoNuevo("APP");
    setNombreNuevo("");
    setUsuarioNuevo("");
    setDniNuevo("");
    setCelularNuevo("");
    setCargoNuevo("");
    setPasswordNuevo("");
    setRolAdminNuevo("ADMIN");
    setPermCrearParte(true);
    setPermBorrarParte(false);
    setPermCerrarParte(false);
    setPermVerEstadisticasDescargar(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminId");
    onLogout();
    navigate("/");
  };

  const canRunAction = isSelectionModeActive && selectedUserCount > 0;

  const handleRunCurrentModeAction = () => {
    if (!canRunAction) return;
    if (currentMode === "DELETE") onDeleteUsers();
    if (currentMode === "BLOCK" || currentMode === "UNBLOCK") onOpenBlockModal();
  };

  const handleCreateUser = async () => {
    const nombreClean = nombreNuevo.trim();
    if (!nombreClean) { alert("El nombre es obligatorio."); return; }

    try {
      setCreando(true);
      // Lógica APP
      if (tipoNuevo === "APP") {
        const dniClean = dniNuevo.trim();
        const celularClean = celularNuevo.trim();
        const cargoClean = cargoNuevo.trim();
        if (!dniClean || !celularClean || !cargoClean) { alert("Completa DNI, celular y cargo."); return; }
        
        let login = usuarioNuevo.trim();
        if (!login) {
          login = generarUsuarioDesdeNombre(nombreClean);
          if (!login) { alert("No se pudo generar usuario automático."); return; }
        }
        const password = dniClean;

        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreClean, dni: dniClean, celular: celularClean, cargo: cargoClean, usuario: login, contrasena: password }),
        });
        if (!resp.ok) { const text = await resp.text(); alert("Error: " + text); return; }
        alert(`Usuario APP creado.\nUsuario: ${login}\nPass: ${password}`);
        window.location.reload();
        return;
      }
      // Lógica ADMIN
      let login = usuarioNuevo.trim();
      if (!login) {
        login = generarUsuarioDesdeNombre(nombreClean);
        if (!login) { alert("No se pudo generar usuario."); return; }
      }
      const rol = rolAdminNuevo.trim();
      const password = passwordNuevo.trim() || "123456";

      const resp = await fetch(`${API_URL}/admin/create-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreClean, usuario: login, contrasena: password, rol,
          puede_crear_parte: permCrearParte, puede_borrar_parte: permBorrarParte,
          puede_cerrar_parte: permCerrarParte, 
          puede_ver_estadisticas_descargar: permVerEstadisticasDescargar, // ✅ SE ENVÍA AL BACKEND
        }),
      });
      if (!resp.ok) { const text = await resp.text(); alert("Error: " + text); return; }
      alert(`Usuario ADMIN creado.\nUsuario: ${login}\nPass: ${password}`);
      window.location.reload();

    } catch (e) { console.error(e); alert("Error de conexión."); } finally { setCreando(false); }
  };

  // ESTILOS LIMPIOS
  const s = {
    card: { background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', marginBottom: '25px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
    title: { margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' },
    subtitle: { margin: 0, fontSize: '13px', color: '#64748b' },
    btnBack: { background: 'white', border: '1px solid #cbd5e1', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: 16, display:'flex', alignItems:'center', justifyContent:'center', marginRight: 15 },
    btnLogout: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: 12 },
    
    toolbar: { display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' as const },
    
    // Tabs Switch
    tabGroup: { display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 8 },
    tab: (active: boolean) => ({
        padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
        background: active ? 'white' : 'transparent', color: active ? '#1e3a8a' : '#64748b', boxShadow: active ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s'
    }),

    // Action Buttons
    btnPrimary: { background: '#1e3a8a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
    btnSecondary: { background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
    btnSuccess: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }, // ✅ Nuevo estilo para desbloquear
    
    // Formulario
    formPanel: { marginTop: 20, background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginTop: 15 },
    inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: 5 },
    label: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const },
    input: { padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }
  };

  return (
    <div style={s.card}>
        {/* HEADER */}
        <div style={s.header}>
            <div style={{display:'flex', alignItems:'center'}}>
                <button onClick={onBack} style={s.btnBack}>←</button>
                <div>
                    <h2 style={s.title}>Panel de Administración</h2>
                    <p style={s.subtitle}>Gestión de Usuarios - {userName}</p>
                </div>
            </div>
            <button onClick={handleLogout} style={s.btnLogout}>Cerrar Sesión</button>
        </div>

        {/* TOOLBAR */}
        <div style={s.toolbar}>
            {/* Switch APP/ADMIN */}
            <div style={s.tabGroup}>
                <button style={s.tab(currentUserTarget === 'APP')} onClick={() => onUserTargetChange('APP')}>👥 Usuarios APP</button>
                <button style={s.tab(currentUserTarget === 'ADMIN')} onClick={() => onUserTargetChange('ADMIN')}>🛡️ Administradores</button>
            </div>

            <div style={{height: 20, width: 1, background: '#e2e8f0'}}></div>

            {/* Acciones */}
            <button style={s.btnPrimary} onClick={() => { setShowCreateUser(!showCreateUser); if(!showCreateUser) resetForm(); }}>
                {showCreateUser ? '✕ Cancelar Creación' : '+ Nuevo Usuario'}
            </button>

            {/* Modos de Selección */}
            {!showCreateUser && (
                <>
                    <button 
                        style={currentMode === 'DELETE' ? s.btnDanger : s.btnSecondary} 
                        onClick={() => onSelectModeChange(currentMode === 'DELETE' ? 'NONE' : 'DELETE')}
                    >
                        {currentMode === 'DELETE' ? 'Cancelar Eliminar' : '🗑 Eliminar'}
                    </button>
                    
                    <button 
                        style={currentMode === 'BLOCK' ? s.btnDanger : s.btnSecondary}
                        onClick={() => onSelectModeChange(currentMode === 'BLOCK' ? 'NONE' : 'BLOCK')}
                    >
                        {currentMode === 'BLOCK' ? 'Cancelar Bloqueo' : '🔒 Bloquear'}
                    </button>

                    {/* ✅ RECUPERADO: BOTÓN DESBLOQUEAR */}
                    <button 
                        style={currentMode === 'UNBLOCK' ? s.btnSuccess : s.btnSecondary}
                        onClick={() => onSelectModeChange(currentMode === 'UNBLOCK' ? 'NONE' : 'UNBLOCK')}
                    >
                        {currentMode === 'UNBLOCK' ? 'Cancelar Desbloqueo' : '🔓 Desbloquear'}
                    </button>
                </>
            )}

            {/* Botón de Ejecución Masiva */}
            {isSelectionModeActive && selectedUserCount > 0 && (
                <button style={currentMode === 'UNBLOCK' ? s.btnSuccess : s.btnDanger} onClick={handleRunCurrentModeAction}>
                    CONFIRMAR {currentMode} ({selectedUserCount})
                </button>
            )}
        </div>

        {/* FORMULARIO DE CREACIÓN (DESPLEGABLE) */}
        {showCreateUser && (
            <div style={s.formPanel}>
                <div style={{display:'flex', gap: 10, borderBottom:'1px solid #e2e8f0', paddingBottom: 10, marginBottom: 15}}>
                    <button style={s.tab(tipoNuevo === 'APP')} onClick={() => setTipoNuevo('APP')}>Para App Móvil</button>
                    <button style={s.tab(tipoNuevo === 'ADMIN')} onClick={() => setTipoNuevo('ADMIN')}>Para Panel Web</button>
                </div>

                <div style={s.formGrid}>
                    <div style={s.inputGroup}>
                        <label style={s.label}>Nombre Completo</label>
                        <input style={s.input} value={nombreNuevo} onChange={e => setNombreNuevo(e.target.value)} placeholder="Ej: Juan Perez" />
                    </div>
                    <div style={s.inputGroup}>
                        <label style={s.label}>Usuario (Login)</label>
                        <input style={s.input} value={usuarioNuevo} onChange={e => setUsuarioNuevo(e.target.value)} placeholder="Ej: jperez (opcional)" />
                    </div>

                    {tipoNuevo === 'APP' ? (
                        <>
                            <div style={s.inputGroup}><label style={s.label}>DNI (Será la contraseña)</label><input style={s.input} value={dniNuevo} onChange={e => setDniNuevo(e.target.value)} /></div>
                            <div style={s.inputGroup}><label style={s.label}>Celular</label><input style={s.input} value={celularNuevo} onChange={e => setCelularNuevo(e.target.value)} /></div>
                            <div style={s.inputGroup}><label style={s.label}>Cargo</label><input style={s.input} value={cargoNuevo} onChange={e => setCargoNuevo(e.target.value)} /></div>
                        </>
                    ) : (
                        <>
                            <div style={s.inputGroup}><label style={s.label}>Contraseña</label><input style={s.input} type="password" value={passwordNuevo} onChange={e => setPasswordNuevo(e.target.value)} placeholder="Defecto: 123456" /></div>
                            <div style={s.inputGroup}><label style={s.label}>Rol</label><input style={s.input} value={rolAdminNuevo} onChange={e => setRolAdminNuevo(e.target.value)} /></div>
                        </>
                    )}
                </div>

                {tipoNuevo === 'ADMIN' && (
                    <div style={{marginTop: 15, display:'flex', gap: 15, fontSize: 13, flexWrap:'wrap'}}>
                        <label><input type="checkbox" checked={permCrearParte} onChange={e => setPermCrearParte(e.target.checked)} /> Crear Parte</label>
                        <label><input type="checkbox" checked={permBorrarParte} onChange={e => setPermBorrarParte(e.target.checked)} /> Borrar Parte</label>
                        <label><input type="checkbox" checked={permCerrarParte} onChange={e => setPermCerrarParte(e.target.checked)} /> Cerrar Parte</label>
                        {/* ✅ RECUPERADO: CHECKBOX ESTADÍSTICAS */}
                        <label><input type="checkbox" checked={permVerEstadisticasDescargar} onChange={e => setPermVerEstadisticasDescargar(e.target.checked)} /> Ver Estadísticas y Descargar</label>
                    </div>
                )}

                <div style={{marginTop: 20, display:'flex', justifyContent:'flex-end', gap: 10}}>
                    <button style={s.btnSecondary} onClick={() => setShowCreateUser(false)}>Cancelar</button>
                    <button style={s.btnPrimary} onClick={handleCreateUser} disabled={creando}>{creando ? 'Guardando...' : 'Guardar Usuario'}</button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ControlPanel;