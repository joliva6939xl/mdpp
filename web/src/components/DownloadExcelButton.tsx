import React, { useState } from 'react';

const API_URL = "http://localhost:4000";

// ✅ ESTE PIDE 4 COSAS (Fecha, Turno, Operador, CallCenter)
interface Props {
    fecha: string;
    turno: string;
    operador: string;
    callcenter: string;
}

export const DownloadExcelButton: React.FC<Props> = ({ fecha, turno, operador, callcenter }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams({
                fecha,
                turno,
                nombre_operador: operador || "",   
                nombre_callcenter: callcenter || ""
            });

            const response = await fetch(`${API_URL}/api/partes/reporte/excel?${params.toString()}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error("Error al generar Excel");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Conteo_Diario_${fecha}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error(error);
            alert("Error al descargar Excel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleDownload} 
            disabled={loading}
            style={{
                background: loading ? '#9ca3af' : '#10b981', // Verde
                color: 'white', padding: '8px 15px', border: 'none', borderRadius: '6px', 
                fontWeight: 'bold', fontSize: '12px', cursor: loading ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}
        >
            {loading ? '⏳' : '📊'} EXCEL
        </button>
    );
};