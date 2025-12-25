import { useState } from 'react';

const API_URL = "http://localhost:4000";

interface Props {
  fecha: string;
  turno: string;
}

export const DownloadWordButton = ({ fecha, turno }: Props) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!fecha) { alert("⚠️ Selecciona una fecha."); return; }
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/exportar/word?fecha=${fecha}&turno=${turno}`);
      if (!response.ok) throw new Error("Error en servidor");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Conteo_${fecha}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Error al descargar reporte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      style={{
        backgroundColor: loading ? "#94a3b8" : "#1F4E78",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        cursor: loading ? "wait" : "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        display: "flex", alignItems: "center", gap: "10px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        height: "40px"
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      {loading ? "GENERANDO..." : "DESCARGAR CONTEO"}
    </button>
  );
};