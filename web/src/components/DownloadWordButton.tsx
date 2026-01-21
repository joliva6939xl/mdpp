import React, { useState } from 'react';

const API_URL = "http://localhost:4000";

interface Props {
    fecha: string; // formato YYYY-MM-DD
    turno: string; // "TURNO DIA" o "TURNO NOCHE"
}

export const DownloadWordButton: React.FC<Props> = ({ fecha, turno }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // Petición al backend enviando fecha y turno
            const response = await fetch(`${API_URL}/api/partes/reporte/word?fecha=${fecha}&turno=${turno}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Error al descargar");

            // Convertir respuesta a Blob (Archivo)
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace invisible para forzar descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = `Conteo_${fecha}_${turno}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();

        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo generar el reporte.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleDownload} 
            disabled={loading}
            style={{
                background: '#1e3a8a', 
                color: 'white', 
                padding: '10px 15px', 
                border: 'none', 
                borderRadius: '6px', 
                fontWeight: 'bold', 
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            {loading ? 'GENERANDO...' : '📄 DESCARGAR CONTEO'}
        </button>
    );
};