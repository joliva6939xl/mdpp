// Archivo: mdpp/web/src/components/ControlPanel.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export type UserTarget = "APP" | "ADMIN";
export type SelectionMode = "DELETE" | "BLOCK" | "NONE";

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

const getRolFromToken = () => {
  try {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload).rol as string | null;
  } catch {
    return null;
  }
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "15px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  userInfo: {
    fontSize: "0.9rem",
  },
  userNameHighlight: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  headerButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  navButton: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
  btnBack: {
    backgroundColor: "#e0e0e0",
    color: "#333",
  },
  btnLogout: {
    backgroundColor: "#d32f2f",
    color: "#fff",
  },
  searchBarContainer: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  input: {
    flexGrow: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  baseButton: {
    padding: "10px 15px",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  btnAdmin: { backgroundColor: "#007bff", color: "white" },
  btnStat: { backgroundColor: "#28a745", color: "white" },
  btnDanger: { backgroundColor: "#dc3545", color: "white" },
  btnBlock: { backgroundColor: "#fd7e14", color: "white" }, // Naranja para bloquear
  btnPanel: {
    padding: "10px 15px",
    border: "1px solid #f5c6cb",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  btnSelect: { backgroundColor: "#ffc107", color: "#333" },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    backgroundColor: "#999",
  },
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
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const navigate = useNavigate();
  const esAdmin = getRolFromToken() === "ADMIN";

  const isDisabled = selectedUserCount === 0;

  const handleAction = (action: string) => {
    if (action === "ESTADISTICA") navigate("/estadistica");
    else if (action === "TOGGLE_DELETE")
      onSelectModeChange(currentMode === "DELETE" ? "NONE" : "DELETE");
    else if (action === "TOGGLE_BLOCK")
      onSelectModeChange(currentMode === "BLOCK" ? "NONE" : "BLOCK");
    else if (action === "EXECUTE_DELETE") onDeleteUsers();
    else if (action === "EXECUTE_BLOCK") onOpenBlockModal();
  };

  if (!esAdmin) return null;

  return (
    <div style={styles.container}>
      {/* 0. Encabezado usuario + navegación */}
      <div style={styles.headerRow}>
        <div style={styles.userInfo}>
          Sesión iniciada como{" "}
          <span style={styles.userNameHighlight}>{userName}</span> –{" "}
          <strong>PANEL ADMIN</strong>
        </div>
        <div style={styles.headerButtons}>
          <button
            type="button"
            style={{ ...styles.navButton, ...styles.btnBack }}
            onClick={onBack}
          >
            ⬅ Volver
          </button>
          <button
            type="button"
            style={{ ...styles.navButton, ...styles.btnLogout }}
            onClick={onLogout}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </div>

      {/* 1. Búsqueda */}
      <div style={styles.searchBarContainer}>
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />
        <button
          style={{ ...styles.baseButton, ...styles.btnAdmin }}
          type="button"
        >
          🔍 Buscar
        </button>
      </div>

      {/* 2. Selector de tipo de usuario (APP / ADMIN) */}
      <div style={styles.buttonGroup}>
        <span>Ver usuarios:</span>
        <button
          type="button"
          onClick={() => onUserTargetChange("APP")}
          style={{
            ...styles.baseButton,
            ...(currentUserTarget === "APP"
              ? styles.btnSelect
              : { backgroundColor: "#e0e0e0", color: "#333" }),
          }}
        >
          APP
        </button>
        <button
          type="button"
          onClick={() => onUserTargetChange("ADMIN")}
          style={{
            ...styles.baseButton,
            ...(currentUserTarget === "ADMIN"
              ? styles.btnSelect
              : { backgroundColor: "#e0e0e0", color: "#333" }),
          }}
        >
          ADMIN
        </button>
      </div>

      {/* 3. Botón Mostrar Panel */}
      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={() => setMostrarPanel(!mostrarPanel)}
          style={styles.btnPanel}
        >
          {mostrarPanel ? "Ocultar Panel ADMIN" : "▶️ Panel de Control ADMIN"}
        </button>
      </div>

      {/* 4. Panel de Botones */}
      {mostrarPanel && (
        <div style={styles.buttonGroup}>
          {/* BOTÓN BLOQUEAR (Selección) */}
          <button
            type="button"
            onClick={() => handleAction("TOGGLE_BLOCK")}
            style={{
              ...styles.baseButton,
              ...(currentMode === "BLOCK" ? styles.btnDanger : styles.btnBlock),
            }}
          >
            {currentMode === "BLOCK"
              ? "❌ Cancelar bloqueo"
              : "🔒 Modo Bloqueo"}
          </button>

          {/* BOTÓN ELIMINAR (Selección) */}
          <button
            type="button"
            onClick={() => handleAction("TOGGLE_DELETE")}
            style={{
              ...styles.baseButton,
              ...styles.btnDanger,
            }}
          >
            {currentMode === "DELETE"
              ? "❌ Cancelar borrado"
              : "🗑️ Modo Borrar"}
          </button>

          {/* CONFIRMAR ELIMINACIÓN */}
          {isSelectionModeActive && currentMode === "DELETE" && (
            <button
              type="button"
              onClick={() => handleAction("EXECUTE_DELETE")}
              disabled={isDisabled}
              style={{
                ...styles.baseButton,
                ...styles.btnDanger,
                ...(isDisabled ? styles.btnDisabled : {}),
              }}
            >
              🔥 Confirmar Borrado ({selectedUserCount})
            </button>
          )}

          {/* CONFIRMAR BLOQUEO (abre modal) */}
          {isSelectionModeActive && currentMode === "BLOCK" && (
            <button
              type="button"
              onClick={() => handleAction("EXECUTE_BLOCK")}
              disabled={isDisabled}
              style={{
                ...styles.baseButton,
                ...styles.btnBlock,
                ...(isDisabled ? styles.btnDisabled : {}),
              }}
            >
              🔒 Gestionar Bloqueo ({selectedUserCount})
            </button>
          )}

          {/* Botón Estadística */}
          <button
            type="button"
            onClick={() => handleAction("ESTADISTICA")}
            style={{ ...styles.baseButton, ...styles.btnStat }}
          >
            📊 Estadística
          </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
