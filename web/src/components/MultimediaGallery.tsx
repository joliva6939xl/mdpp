import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type MultimediaItem = {
  tipo: "image" | "video";
  url: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  media: MultimediaItem[];
};

export const MultimediaGallery = ({ isOpen, onClose, media }: Props) => {
  const [selectedItem, setSelectedItem] = useState<MultimediaItem | null>(null);

  // Bloquear scroll al abrir
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = () => {
    setSelectedItem(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div style={styles.portalRoot}>
      
      {/* ─── VISTA ZOOM (Pantalla Completa) ─── */}
      {selectedItem && (
        <div style={styles.overlayDark}>
          <button style={styles.closeBtnFixed} onClick={() => setSelectedItem(null)}>✕ Volver</button>
          
          <div style={styles.viewerContainer}>
            {!selectedItem.url ? (
              <div style={{color: "white"}}>Error: URL vacía</div>
            ) : selectedItem.tipo === "video" ? (
              <video 
                src={selectedItem.url} 
                controls 
                autoPlay 
                style={styles.mediaFull} 
              />
            ) : (
              <img 
                src={selectedItem.url} 
                alt="Zoom" 
                style={styles.mediaFull}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = `<div style="color:#ccc;">No se pudo cargar la imagen</div>`;
                  }
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ─── VISTA GRILLA ─── */}
      <div style={selectedItem ? { display: 'none' } : styles.overlay}>
        <div style={styles.modalContent}>
          <div style={styles.header}>
            <h2 style={styles.title}>Expediente Multimedia</h2>
            <button style={styles.closeBtn} onClick={handleClose}>Cerrar</button>
          </div>

          {(!media || media.length === 0) ? (
             <div style={{ color: "#94a3b8", textAlign: "center", padding: "40px" }}>
               No hay evidencia multimedia registrada.
             </div>
          ) : (
            <div style={styles.grid}>
              {media.map((item, index) => {
                // VALIDACIÓN: Si no hay URL, no renderizamos nada roto
                const hasUrl = item.url && item.url.trim() !== "";

                return (
                  <div 
                    key={index} 
                    style={styles.card} 
                    onClick={() => hasUrl && setSelectedItem(item)}
                    title={hasUrl ? "Clic para ampliar" : "Sin archivo"}
                  >
                    {!hasUrl ? (
                      <div style={styles.videoPlaceholder}>
                        <span style={{fontSize: "20px"}}>⚠️</span>
                        <span style={{fontSize: "10px", marginTop:5}}>Sin ruta</span>
                      </div>
                    ) : item.tipo === "video" ? (
                      <div style={styles.videoPlaceholder}>
                        <span style={{fontSize: "40px"}}>▶</span>
                        <span style={{fontSize: "12px", marginTop: "10px", fontWeight: "bold"}}>VIDEO</span>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={`Evidencia ${index}`} 
                        style={styles.thumb} 
                        onError={(e) => { 
                           // Si falla la carga, ocultamos la imagen rota y mostramos un fondo
                           e.currentTarget.style.display = "none";
                           if(e.currentTarget.parentElement) {
                               e.currentTarget.parentElement.style.backgroundColor = "#cbd5e1";
                               e.currentTarget.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;font-size:10px;">Error Carga</div>';
                           }
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles: Record<string, React.CSSProperties> = {
  portalRoot: { position: "relative", zIndex: 99999 },
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(5px)",
    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999,
  },
  overlayDark: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#000", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100000,
  },
  modalContent: {
    backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "900px", maxHeight: "85vh",
    overflowY: "auto", padding: "25px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", position: "relative",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "15px",
  },
  title: { margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase" },
  closeBtn: {
    background: "#fff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", fontWeight: 700, color: "#475569", transition: "all 0.2s",
  },
  closeBtnFixed: {
    position: "absolute", top: "30px", right: "30px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "10px 24px", borderRadius: "30px", cursor: "pointer", fontWeight: 700, zIndex: 100001, backdropFilter: "blur(4px)",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "15px" },
  card: {
    aspectRatio: "1/1", backgroundColor: "#f1f5f9", borderRadius: "12px", overflow: "hidden", cursor: "pointer", border: "3px solid transparent", transition: "transform 0.2s, border-color 0.2s", position: "relative", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  thumb: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  videoPlaceholder: { width: "100%", height: "100%", backgroundColor: "#1e293b", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
  viewerContainer: { width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" },
  mediaFull: { maxWidth: "100%", maxHeight: "90vh", objectFit: "contain", borderRadius: "4px", boxShadow: "0 0 50px rgba(0,0,0,0.5)" }
};