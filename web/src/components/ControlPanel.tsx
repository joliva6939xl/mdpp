// Archivo: mdpp/web/src/components/ControlPanel.tsx
// REEMPLAZA el contenido actual con este código

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos usando React.CSSProperties
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '15px',
    backgroundColor: 'transparent',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  searchBarContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    color: '#333',
  },
  input: {
    flexGrow: 1,
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#333',
    outline: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    // --- MODIFICACIÓN CRÍTICA ---
    justifyContent: 'center', // Centra el botón en el grupo
    // ---------------------------
    flexWrap: 'wrap',
  },
  button: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: '#007bff', // Azul primario
    color: 'white',
  },
  btnStat: { // Estilo para Estadística
    backgroundColor: '#28a745', // Verde
  },
};

export default function ControlPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Lógica de búsqueda simulada
    console.log(`Buscando usuario/parte por: ${searchTerm}`);
    alert(`Buscando: ${searchTerm}`);
  };

  const handleAction = (action: string) => {
    if (action === 'ESTADISTICA') {
      navigate('/estadistica'); // Redirección a la nueva ruta
    } else {
      alert(`Acción seleccionada: ${action}`);
    }
  };

  return (
    <div style={styles.container}>
      {/* 1. Search Bar */}
      <div style={styles.searchBarContainer}>
        <input
          type="text"
          placeholder="Buscar DNI, Nombre de Usuario o N° de Parte"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={handleSearch}
          style={styles.button}
        >
          🔍 Buscar
        </button>
      </div>

      {/* 2. Botones de Acción (Gerencia) */}
      <div style={styles.buttonGroup}>
        
        {/* BOTÓN ESTADÍSTICA */}
        <button
          onClick={() => handleAction('ESTADISTICA')}
          style={{ ...styles.button, ...styles.btnStat }}
        >
          ESTADÍSTICA
        </button>
      </div>
    </div>
  );
}