// Archivo: mdpp/web/src/pages/Estadistica.tsx
// CREA ESTE NUEVO ARCHIVO con el siguiente código

import React from 'react';
import { useNavigate } from 'react-router-dom';

// Datos simulados del conteo de partes por zona (referencia a tu imagen)
const partesPorZona = [
  { zona: 'Zona 1', total: 120, color: '#007bff' }, // Azul
  { zona: 'Zona 2', total: 95, color: '#28a745' }, // Verde
  { zona: 'Zona 3', total: 60, color: '#ffc107' }, // Amarillo
  { zona: 'Zona 4', total: 45, color: '#dc3545' }, // Rojo
  { zona: 'Zona 5', total: 30, color: '#6c757d' }, // Gris
];

// Estilos
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '40px auto',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  header: {
    color: '#0066cc',
    borderBottom: '2px solid #ccc',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  },
  th: {
    borderBottom: '1px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2',
  },
  td: {
    borderBottom: '1px solid #eee',
    padding: '12px',
    textAlign: 'left',
  },
  backButton: {
    marginTop: '20px',
    padding: '10px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default function Estadistica() {
  const navigate = useNavigate();

  // Calcula el total general para la barra de progreso
  const totalGeneral = partesPorZona.reduce((sum, item) => sum + item.total, 0);

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '20px 0' }}>
      <div style={styles.container}>
        <h2 style={styles.header}>CONTEO DE PARTES POR ZONA</h2>
        
        <p style={{textAlign: 'center', fontSize: '18px', fontWeight: 'bold'}}>
            Total de Partes Registrados: {totalGeneral}
        </p>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Zona</th>
              <th style={styles.th}>Total de Partes</th>
              <th style={styles.th}>Gráfico</th>
            </tr>
          </thead>
          <tbody>
            {partesPorZona.map((item) => (
              <tr key={item.zona}>
                <td style={styles.td}>{item.zona}</td>
                <td style={styles.td}>{item.total}</td>
                <td style={styles.td}>
                  {/* Barra de Progreso Simulada */}
                  <div style={{ height: '10px', backgroundColor: '#eee', width: '100%', borderRadius: '5px' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(item.total / totalGeneral) * 100}%`,
                        backgroundColor: item.color,
                        borderRadius: '5px',
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          style={styles.backButton}
          onClick={() => navigate('/perfil')}
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );
}