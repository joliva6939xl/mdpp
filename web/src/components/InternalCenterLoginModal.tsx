import React, { useState } from "react";

type Props = {
  open: boolean;
  onConfirm: (data: { nombre: string; roperoCentralTurno: string }) => void;
  onLogout: () => void;
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.55)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};

const card: React.CSSProperties = {
  width: "min(520px, 92vw)",
  background: "#fff",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,.25)",
};

const row: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};

const input: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
  outline: "none",
};

const btnRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 16,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "#2d6cdf",
  color: "#fff",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#f7f7f7",
  cursor: "pointer",
};

export const InternalCenterLoginModal: React.FC<Props> = ({
  open,
  onConfirm,
  onLogout,
}) => {
  // ✅ Hooks SIEMPRE primero (nunca condicional)
  const [nombre, setNombre] = useState("");
  const [roperoCentralTurno, setRoperoCentralTurno] = useState("");

  // ✅ render condicional DESPUÉS de hooks (cumple rules-of-hooks)
  if (!open) return null;

  const handleConfirm = () => {
    const n = nombre.trim();
    const r = roperoCentralTurno.trim();

    if (!n) {
      alert("Ingresa tu nombre.");
      return;
    }
    if (!r) {
      alert("Ingresa el Ropero Central de Turno.");
      return;
    }

    onConfirm({ nombre: n, roperoCentralTurno: r });
  };

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Validación interna (CALL CENTER)</h3>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            style={{
              border: "none",
              background: "transparent",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ marginTop: 8, marginBottom: 0, color: "#444" }}>
          Completa esta validación para continuar.
        </p>

        <div style={row}>
          <label>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
              Nombre
            </div>
            <input
              style={input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </label>

          <label>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 6 }}>
              Ropero Central de Turno
            </div>
            <input
              style={input}
              value={roperoCentralTurno}
              onChange={(e) => setRoperoCentralTurno(e.target.value)}
              placeholder="Ej: TURNO NOCHE / CENTRAL 01"
            />
          </label>
        </div>

        <div style={btnRow}>
          <button style={btnSecondary} onClick={onLogout}>
            Cerrar sesión
          </button>
          <button style={btnPrimary} onClick={handleConfirm}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
