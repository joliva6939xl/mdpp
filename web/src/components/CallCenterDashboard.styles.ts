// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ccdStyles: Record<string, any> = {
  layoutWrap: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', sans-serif",
    overflow: "hidden",
  },
  sectionCard: { 
    background: '#fff', 
    padding: '15px', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
    marginBottom: '15px' 
  },
  sectionTitle: { 
    fontSize: '14px', 
    fontWeight: 800, 
    color: '#1e3a8a', 
    borderBottom: '2px solid #3b82f6', 
    paddingBottom: '8px', 
    marginBottom: '12px', 
    textTransform: 'uppercase' 
  },
  infoBox: { 
    padding: '12px', 
    background: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    fontSize: '13px', 
    color: '#334155', 
    lineHeight: '1.5' 
  },
  label: { 
    fontSize: '11px', 
    fontWeight: 'bold', 
    color: '#64748b', 
    textTransform: 'uppercase' 
  },
  value: { 
    fontSize: '13px', 
    color: '#0f172a', 
    fontWeight: 700 
  },
  // ✅ BOTÓN DE GALERÍA CORREGIDO (Más pequeño y estético)
  galleryBtn: {
    padding: "8px 12px", 
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "12px", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "5px",
    width: "fit-content", // No ocupa todo el ancho, se ve más formal
    alignSelf: "center"
  },
  overlay: { 
    position: 'fixed', 
    top: 0, left: 0, 
    width: '100%', height: '100%', 
    background: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 9000 
  },
  modal: { 
    background: 'white', 
    width: '95%', 
    maxWidth: '1200px', 
    height: '90vh', 
    borderRadius: '8px', 
    overflow: 'hidden', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  sidebar: { 
    width: '320px', 
    borderRight: '1px solid #e5e7eb', 
    overflowY: 'auto', 
    background: '#ffffff' 
  }
};