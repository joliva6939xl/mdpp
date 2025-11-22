// Archivo: mdpp/web/src/components/ControlPanel.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ControlPanelProps {
    selectedUserCount: number;
    onDeleteUsers: () => void;
    onBlockAction: () => void; // 🆕 Gatillo para abrir modal bloqueo
    isSelectionModeActive: boolean; 
    onToggleSelection: (mode: 'DELETE' | 'BLOCK') => void; // 🆕 Ahora recibe qué modo activamos
    currentMode: 'DELETE' | 'BLOCK' | 'NONE'; // 🆕 Para saber qué botón pintar activo
}

const getRolFromToken = () => {
    try {
        const token = localStorage.getItem('adminToken');
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload).rol; 
    } catch { return null; }
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px', width: '100%', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  searchBarContainer: { display: 'flex', gap: '10px', alignItems: 'center' },
  input: { flexGrow: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
  buttonGroup: { display: 'flex', gap: '10px', justifyContent: 'flex-start', flexWrap: 'wrap' },
  baseButton: { padding: '10px 15px', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold', transition: 'background-color 0.2s' },
  btnAdmin: { backgroundColor: '#007bff', color: 'white' },
  btnStat: { backgroundColor: '#28a745', color: 'white' },
  btnDanger: { backgroundColor: '#dc3545', color: 'white' },
  btnBlock: { backgroundColor: '#fd7e14', color: 'white' }, // Naranja para bloquear
  btnPanel: { padding: '10px 15px', border: '1px solid #f5c6cb', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#f8d7da', color: '#721c24' },
  btnSelect: { backgroundColor: '#ffc107', color: '#333' }, 
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#999' }
};

export default function ControlPanel({ 
    selectedUserCount, 
    onDeleteUsers, 
    onBlockAction,
    isSelectionModeActive, 
    onToggleSelection,
    currentMode
}: ControlPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const navigate = useNavigate();
  const esAdmin = getRolFromToken() === 'ADMIN';

  const isDisabled = selectedUserCount === 0;

  const handleAction = (action: string) => {
    if (action === 'ESTADISTICA') navigate('/estadistica');
    else if (action === 'TOGGLE_DELETE') onToggleSelection('DELETE');
    else if (action === 'TOGGLE_BLOCK') onToggleSelection('BLOCK');
    else if (action === 'EXECUTE_DELETE') onDeleteUsers();
    else if (action === 'EXECUTE_BLOCK') onBlockAction();
  };

  if (!esAdmin) return null;

  return (
    <div style={styles.container}>
      {/* 1. Búsqueda */}
      <div style={styles.searchBarContainer}>
        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.input} />
        <button style={{ ...styles.baseButton, ...styles.btnAdmin }}>🔍 Buscar</button>
      </div>
      
      {/* 2. Botón Mostrar Panel */}
      <div style={styles.buttonGroup}>
          <button onClick={() => setMostrarPanel(!mostrarPanel)} style={{...styles.baseButton, ...styles.btnPanel}}>
            {mostrarPanel ? 'Ocultar Panel ADMIN' : '▶️ Panel de Control ADMIN'}
          </button>
      </div>

      {/* 3. Panel de Botones */}
      {mostrarPanel && (
        <div style={styles.buttonGroup}>
          <button style={{ ...styles.baseButton, ...styles.btnAdmin }}>➕ Crear</button>
          
          {/* BOTÓN BLOQUEAR (Selección) */}
          <button 
            onClick={() => handleAction('TOGGLE_BLOCK')} 
            style={{ 
                ...styles.baseButton, 
                ...(currentMode === 'BLOCK' ? styles.btnDanger : styles.btnBlock) 
            }}
          >
            {currentMode === 'BLOCK' ? '❌ Cancelar' : '🔒 Bloquear Usuario'}
          </button>
          
          {/* BOTÓN BORRAR (Selección) */}
          <button 
            onClick={() => handleAction('TOGGLE_DELETE')} 
            style={{ 
                ...styles.baseButton, 
                ...(currentMode === 'DELETE' ? styles.btnDanger : styles.btnDanger) 
            }}
          >
            {currentMode === 'DELETE' ? '❌ Cancelar' : '🗑️ Borrar Usuario'}
          </button>

          {/* ACCIONES CONFIRMAR */}
          {isSelectionModeActive && currentMode === 'DELETE' && (
            <button 
                onClick={() => handleAction('EXECUTE_DELETE')} 
                disabled={isDisabled}
                style={{ ...styles.baseButton, ...styles.btnDanger, ...(isDisabled ? styles.btnDisabled : {}) }}
            >
                🔥 Confirmar Borrado ({selectedUserCount})
            </button>
          )}

          {isSelectionModeActive && currentMode === 'BLOCK' && (
             <button 
                onClick={() => handleAction('EXECUTE_BLOCK')} 
                disabled={isDisabled}
                style={{ ...styles.baseButton, ...styles.btnBlock, ...(isDisabled ? styles.btnDisabled : {}) }}
             >
                 🔒 Gestionar Bloqueo ({selectedUserCount})
             </button>
          )}

          <button onClick={() => handleAction('ESTADISTICA')} style={{ ...styles.baseButton, ...styles.btnStat }}>📊 Estadística</button>
        </div>
      )}
    </div>
  );
}