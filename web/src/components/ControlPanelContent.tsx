import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles as rawStyles } from "./ControlPanel.styles";

export type UserTarget = "APP" | "ADMIN";
export type SelectionMode = "DELETE" | "BLOCK" | "UNBLOCK" | "NONE";

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

const API_URL = "http://localhost:4000/api";
const styles = rawStyles as Record<string, React.CSSProperties>;

const generarUsuarioDesdeNombre = (nombre: string) => {
  if (!nombre.trim()) return "";
  const partes = nombre.trim().split(/\s+/);
  const primerNombre = partes[0] || "";
  const primerApellido = partes[1] || "";
  return (primerNombre.charAt(0) + primerApellido).toLowerCase();
};

const ControlPanelContent: React.FC<ControlPanelProps> = ({
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
  const navigate = useNavigate();

  // ✅ NO ELIMINAR PANEL ADMINISTRADOR
  const [showAdminPanel, setShowAdminPanel] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const [tipoNuevo, setTipoNuevo] = useState<"APP" | "ADMIN">("APP");

  const [nombreNuevo, setNombreNuevo] = useState("");
  const [usuarioNuevo, setUsuarioNuevo] = useState("");

  // APP
  const [dniNuevo, setDniNuevo] = useState("");
  const [celularNuevo, setCelularNuevo] = useState("");
  const [cargoNuevo, setCargoNuevo] = useState("");

  // ADMIN
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [rolAdminNuevo, setRolAdminNuevo] = useState("ADMIN");

  // Permisos ADMIN
  const [permCrearParte, setPermCrearParte] = useState(true);
  const [permBorrarParte, setPermBorrarParte] = useState(false);
  const [permCerrarParte, setPermCerrarParte] = useState(false);
  const [permVerEstadisticasDescargar, setPermVerEstadisticasDescargar] =
    useState(false);

  const [creando, setCreando] = useState(false);

  const resetForm = () => {
    setTipoNuevo("APP");
    setNombreNuevo("");
    setUsuarioNuevo("");
    setDniNuevo("");
    setCelularNuevo("");
    setCargoNuevo("");
    setPasswordNuevo("");
    setRolAdminNuevo("ADMIN");
    setPermCrearParte(true);
    setPermBorrarParte(false);
    setPermCerrarParte(false);
    setPermVerEstadisticasDescargar(false);
  };

  const handleLogout = () => {
    // ✅ SIN TOKEN
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminId");

    onLogout();
    navigate("/");
  };

  const canRunAction = isSelectionModeActive && selectedUserCount > 0;

  const handleRunCurrentModeAction = () => {
    if (!canRunAction) return;

    if (currentMode === "DELETE") {
      onDeleteUsers();
      return;
    }

    if (currentMode === "BLOCK" || currentMode === "UNBLOCK") {
      onOpenBlockModal();
      return;
    }
  };

  const handleCreateUser = async () => {
    const nombreClean = nombreNuevo.trim();
    if (!nombreClean) {
      alert("El nombre es obligatorio.");
      return;
    }

    try {
      setCreando(true);

      // ───────── APP ─────────
      if (tipoNuevo === "APP") {
        const dniClean = dniNuevo.trim();
        const celularClean = celularNuevo.trim();
        const cargoClean = cargoNuevo.trim();

        if (!dniClean || !celularClean || !cargoClean) {
          alert("Completa DNI, celular y cargo.");
          return;
        }

        let login = usuarioNuevo.trim();
        if (!login) {
          login = generarUsuarioDesdeNombre(nombreClean);
          if (!login) {
            alert("No se pudo generar usuario automático. Ingresa usuario.");
            return;
          }
        }

        // Password APP = DNI (regla actual)
        const password = dniClean;

        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombreClean,
            dni: dniClean,
            celular: celularClean,
            cargo: cargoClean,
            usuario: login,
            contrasena: password,
          }),
        });

        const text = await resp.text();
        if (!resp.ok) {
          alert("Error creando APP: " + (text || "sin respuesta"));
          return;
        }

        alert(`Usuario APP creado.\nUsuario: ${login}\nContraseña: ${password}`);
        window.location.reload();
        return;
      }

      // ───────── ADMIN ─────────
      let login = usuarioNuevo.trim();
      if (!login) {
        login = generarUsuarioDesdeNombre(nombreClean);
        if (!login) {
          alert("No se pudo generar usuario automático. Ingresa usuario.");
          return;
        }
      }

      const rol = rolAdminNuevo.trim();
      if (!rol) {
        alert("El rol es obligatorio.");
        return;
      }

      const password = passwordNuevo.trim() || "123456";

      // ✅ SIN TOKEN (sin Authorization)
      const resp = await fetch(`${API_URL}/admin/create-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreClean,
          usuario: login,
          contrasena: password,
          rol,
          puede_crear_parte: permCrearParte,
          puede_borrar_parte: permBorrarParte,
          puede_cerrar_parte: permCerrarParte,
          puede_ver_estadisticas_descargar: permVerEstadisticasDescargar,
        }),
      });

      const text = await resp.text();
      if (!resp.ok) {
        alert("Error creando ADMIN: " + (text || "sin respuesta"));
        return;
      }

      alert(`Usuario ADMIN creado.\nUsuario: ${login}\nContraseña: ${password}`);
      window.location.reload();
    } catch (e) {
      console.error("Error creando usuario:", e);
      alert("Error de conexión al crear usuario.");
    } finally {
      setCreando(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Panel de control</h2>
          <p style={styles.subtitle}>Bienvenido, {userName}</p>
        </div>

        <div style={styles.headerActions}>
          <button
            type="button"
            style={{ ...(styles.baseButton || {}), ...(styles.btnBack || {}) }}
            onClick={onBack}
          >
            ⬅ Volver
          </button>

          <button
            type="button"
            style={{
              ...(styles.baseButton || {}),
              ...(styles.btnLogout || {}),
            }}
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* TOGGLE APP/ADMIN */}
      <div style={styles.toggleRow}>
        <span>Ver usuarios:</span>
        <button
          type="button"
          style={{
            ...(styles.baseButton || {}),
            ...(currentUserTarget === "APP"
              ? (styles.btnUserTargetActive || {})
              : (styles.btnUserTarget || {})),
          }}
          onClick={() => onUserTargetChange("APP")}
        >
          APP
        </button>
        <button
          type="button"
          style={{
            ...(styles.baseButton || {}),
            ...(currentUserTarget === "ADMIN"
              ? (styles.btnUserTargetActive || {})
              : (styles.btnUserTarget || {})),
          }}
          onClick={() => onUserTargetChange("ADMIN")}
        >
          ADMIN
        </button>
      </div>

      {/* INFO SELECCIÓN */}
      <div style={styles.selectionRow}>
        <div style={styles.selectionLeft}>
          <span style={styles.selectionInfo}>
            Selección:{" "}
            <strong>
              {isSelectionModeActive ? "ACTIVA" : "INACTIVA"} (seleccionados:{" "}
              {selectedUserCount})
            </strong>
          </span>
        </div>
      </div>

      {/* PANEL ADMINISTRADOR (NO SE ELIMINA) */}
      <div style={styles.adminPanelToggle}>
        <button
          type="button"
          style={{
            ...(styles.baseButton || {}),
            ...(styles.btnAdminToggle || {}),
          }}
          onClick={() => setShowAdminPanel((p) => !p)}
        >
          {showAdminPanel ? "Ocultar panel de administradores" : "Panel administrador"}
        </button>
      </div>

      {showAdminPanel && (
        <div style={styles.adminPanel}>
          <h3 style={styles.adminTitle}>Opciones de administrador</h3>

          <div style={styles.adminActionsRow}>
            {/* Crear usuario */}
            <button
              type="button"
              style={{ ...(styles.baseButton || {}), ...(styles.btnCreate || {}) }}
              onClick={() => {
                setShowCreateUser((p) => !p);
                if (!showCreateUser) resetForm();
              }}
            >
              {showCreateUser ? "Cerrar creación de usuario" : "Crear nuevo usuario"}
            </button>

            {/* Modo eliminar */}
            <button
              type="button"
              style={{
                ...(styles.baseButton || {}),
                ...(currentMode === "DELETE"
                  ? (styles.btnDanger || {})
                  : (styles.btnSecondary || {})),
              }}
              onClick={() =>
                onSelectModeChange(currentMode === "DELETE" ? "NONE" : "DELETE")
              }
            >
              🗑 Modo Eliminar
            </button>

            {/* Modo bloqueo */}
            <button
              type="button"
              style={{
                ...(styles.baseButton || {}),
                ...(currentMode === "BLOCK"
                  ? (styles.btnWarning || {})
                  : (styles.btnSecondary || {})),
              }}
              onClick={() =>
                onSelectModeChange(currentMode === "BLOCK" ? "NONE" : "BLOCK")
              }
            >
              🔒 Modo Bloqueo
            </button>

            {/* Modo desbloqueo */}
            <button
              type="button"
              style={{
                ...(styles.baseButton || {}),
                ...(currentMode === "UNBLOCK"
                  ? (styles.btnPrimary || {})
                  : (styles.btnUnblock || {})),
              }}
              onClick={() =>
                onSelectModeChange(currentMode === "UNBLOCK" ? "NONE" : "UNBLOCK")
              }
            >
              🔓 Modo Desbloqueo
            </button>

            {/* Salir selección */}
            {isSelectionModeActive && (
              <button
                type="button"
                style={{
                  ...(styles.baseButton || {}),
                  ...(styles.btnSecondary || {}),
                }}
                onClick={() => onSelectModeChange("NONE")}
              >
                Salir modo selección
              </button>
            )}
          </div>

          {/* Botón acción principal */}
          {isSelectionModeActive && currentMode !== "NONE" && (
            <div style={styles.massActions}>
              <button
                type="button"
                style={{
                  ...(styles.baseButton || {}),
                  ...(currentMode === "DELETE"
                    ? (styles.btnDanger || {})
                    : (styles.btnWarning || {})),
                  ...(!canRunAction ? (styles.btnDisabled || {}) : {}),
                }}
                onClick={handleRunCurrentModeAction}
                disabled={!canRunAction}
              >
                {currentMode === "DELETE"
                  ? "🗑 Eliminar seleccionados"
                  : currentMode === "BLOCK"
                  ? "🔒 Bloquear seleccionados"
                  : "🔓 Desbloquear seleccionados"}
              </button>
            </div>
          )}

          {/* Crear usuario panel */}
          {showCreateUser && (
            <div style={styles.createUserPanelBase}>
              <h4 style={styles.createTitle}>Crear nuevo usuario</h4>

              <div style={styles.createTabs}>
                <button
                  type="button"
                  style={{
                    ...(styles.baseButton || {}),
                    ...(tipoNuevo === "APP"
                      ? (styles.tabActive || {})
                      : (styles.tabInactive || {})),
                  }}
                  onClick={() => setTipoNuevo("APP")}
                >
                  Usuario APP
                </button>
                <button
                  type="button"
                  style={{
                    ...(styles.baseButton || {}),
                    ...(tipoNuevo === "ADMIN"
                      ? (styles.tabActive || {})
                      : (styles.tabInactive || {})),
                  }}
                  onClick={() => setTipoNuevo("ADMIN")}
                >
                  Usuario ADMIN
                </button>
              </div>

              <div style={styles.createForm}>
                <div style={styles.createField}>
                  <label style={styles.createLabel}>Nombre completo</label>
                  <input
                    type="text"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                    style={styles.createInput}
                    placeholder="Ej: JUAN GUEVARA"
                  />
                </div>

                <div style={styles.createField}>
                  <label style={styles.createLabel}>
                    Usuario (login){" "}
                    <span style={styles.smallInfo}>(si vacío se genera)</span>
                  </label>
                  <input
                    type="text"
                    value={usuarioNuevo}
                    onChange={(e) => setUsuarioNuevo(e.target.value)}
                    style={styles.createInput}
                    placeholder="Ej: jguevara"
                  />
                </div>

                {tipoNuevo === "APP" && (
                  <>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>DNI</label>
                      <input
                        type="text"
                        value={dniNuevo}
                        onChange={(e) => setDniNuevo(e.target.value)}
                        style={styles.createInput}
                      />
                    </div>

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Celular</label>
                      <input
                        type="text"
                        value={celularNuevo}
                        onChange={(e) => setCelularNuevo(e.target.value)}
                        style={styles.createInput}
                      />
                    </div>

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Cargo</label>
                      <input
                        type="text"
                        value={cargoNuevo}
                        onChange={(e) => setCargoNuevo(e.target.value)}
                        style={styles.createInput}
                      />
                    </div>
                  </>
                )}

                {tipoNuevo === "ADMIN" && (
                  <>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Contraseña</label>
                      <input
                        type="password"
                        value={passwordNuevo}
                        onChange={(e) => setPasswordNuevo(e.target.value)}
                        style={styles.createInput}
                        placeholder="Si vacío: 123456"
                      />
                    </div>

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Rol ADMIN</label>
                      <input
                        type="text"
                        value={rolAdminNuevo}
                        onChange={(e) => setRolAdminNuevo(e.target.value)}
                        style={styles.createInput}
                        placeholder="Ej: CALL CENTER"
                      />
                    </div>

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Permisos del ADMIN</label>
                      <div style={styles.checkboxRow}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={permCrearParte}
                            onChange={(e) => setPermCrearParte(e.target.checked)}
                          />
                          Crear parte
                        </label>

                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={permBorrarParte}
                            onChange={(e) => setPermBorrarParte(e.target.checked)}
                          />
                          Borrar parte
                        </label>

                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={permCerrarParte}
                            onChange={(e) => setPermCerrarParte(e.target.checked)}
                          />
                          Cerrar parte
                        </label>

                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={permVerEstadisticasDescargar}
                            onChange={(e) =>
                              setPermVerEstadisticasDescargar(e.target.checked)
                            }
                          />
                          Ver estadísticas y descargar
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div style={styles.createActions}>
                  <button
                    type="button"
                    style={{ ...(styles.baseButton || {}), ...(styles.btnCancel || {}) }}
                    onClick={() => {
                      setShowCreateUser(false);
                      resetForm();
                    }}
                    disabled={creando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    style={{
                      ...(styles.baseButton || {}),
                      ...(styles.btnCreate || {}),
                      ...(creando ? (styles.btnDisabled || {}) : {}),
                    }}
                    onClick={handleCreateUser}
                    disabled={creando}
                  >
                    {creando ? "Creando..." : "Guardar usuario"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanelContent;
