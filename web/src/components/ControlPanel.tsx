// Archivo: mdpp/web/src/components/ControlPanel.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    return (JSON.parse(jsonPayload) as { rol?: string }).rol ?? null;
  } catch {
    return null;
  }
};

const API_URL = "http://localhost:4000/api";

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    padding: "15px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    width: "100%",
    maxWidth: "1000px",
    margin: "0 auto 16px auto",
    boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
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
    flexWrap: "wrap",
  },
  input: {
    flexGrow: 1,
    minWidth: "220px",
    padding: "8px 10px",
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
    padding: "8px 14px",
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background-color 0.2s, transform 0.1s",
  },
  btnSearch: { backgroundColor: "#1976d2", color: "#fff" },
  btnCreate: { backgroundColor: "#17a2b8", color: "#fff" },
  btnDanger: { backgroundColor: "#d32f2f", color: "#fff" },
  btnBlock: { backgroundColor: "#fd7e14", color: "#fff" },
  btnUnblock: { backgroundColor: "#6c757d", color: "#fff" },
  btnPanel: {
    padding: "8px 14px",
    border: "1px solid #f5c6cb",
    borderRadius: "4px",
    fontSize: "15px",
    cursor: "pointer",
    fontWeight: 600,
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  btnSelect: { backgroundColor: "#ffc107", color: "#333" },
  btnStat: { backgroundColor: "#28a745", color: "#fff" },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  createCard: {
    width: "100%",
    borderRadius: "8px",
    border: "1px solid #ddd",
    padding: "12px",
    backgroundColor: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  createTitle: {
    fontWeight: 600,
    fontSize: "14px",
  },
  createRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  createField: {
    flex: "1 1 200px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  createLabel: {
    fontSize: "12px",
    fontWeight: 600,
  },
  createInput: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "13px",
  },
  createSelect: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "13px",
  },
  checkboxRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "13px",
  },
  createFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
    marginTop: "4px",
  },
  smallInfo: {
    fontSize: "12px",
    color: "#555",
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
  const [mostrarPanel, setMostrarPanel] = useState(true);
  const [mostrarCrear, setMostrarCrear] = useState(false);

  const [tipoNuevo, setTipoNuevo] = useState<UserTarget>("APP");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [usuarioNuevo, setUsuarioNuevo] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [dniNuevo, setDniNuevo] = useState("");
  const [celularNuevo, setCelularNuevo] = useState("");
  const [cargoNuevo, setCargoNuevo] = useState("");
  const [rolAdminNuevo, setRolAdminNuevo] = useState("ADMIN");
  const [permCrearParte, setPermCrearParte] = useState(true);
  const [permBorrarParte, setPermBorrarParte] = useState(false);
  const [permCerrarParte, setPermCerrarParte] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [creando, setCreando] = useState(false);

  const navigate = useNavigate();
  const esAdmin = getRolFromToken() === "ADMIN";

  const isDisabledSelection = selectedUserCount === 0;

  const generarUsuarioDesdeNombre = (nombre: string) => {
    if (!nombre.trim()) return "";
    const partes = nombre.trim().split(/\s+/);
    const primerNombre = partes[0] || "";
    const primerApellido = partes[1] || "";
    return (primerNombre.charAt(0) + primerApellido).toLowerCase();
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFotoFile(files[0]);
    } else {
      setFotoFile(null);
    }
  };

  const handleCreateUser = async () => {
    if (!nombreNuevo.trim()) {
      alert("El nombre completo es obligatorio.");
      return;
    }

    let login = usuarioNuevo.trim();
    if (!login) {
      login = generarUsuarioDesdeNombre(nombreNuevo);
    }

    if (!login) {
      alert("No se pudo generar el nombre de usuario. Escríbelo manualmente.");
      return;
    }

    let password = passwordNuevo.trim();

    if (tipoNuevo === "APP") {
      if (!dniNuevo.trim()) {
        alert("El DNI es obligatorio para usuarios APP.");
        return;
      }
      if (!password) {
        password = dniNuevo.trim();
      }

      try {
        setCreando(true);
        const formData = new FormData();
        formData.append("nombre", nombreNuevo.trim());
        formData.append("dni", dniNuevo.trim());
        formData.append("celular", celularNuevo.trim());
        formData.append("cargo", cargoNuevo.trim());
        formData.append("usuario", login);
        formData.append("contrasena", password);
        if (fotoFile) {
          formData.append("foto", fotoFile);
        }

        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          body: formData,
        });
        const json = await resp.json();

        if (!resp.ok || json.ok === false) {
          alert(
            "Error creando usuario APP: " +
              (json.message || "respuesta no válida del servidor")
          );
          return;
        }

        alert(
          `Usuario APP creado correctamente.\nUsuario: ${login}\nContraseña: ${password}`
        );
        window.location.reload();
      } catch (error) {
        console.error("Error creando usuario APP:", error);
        alert("Error de conexión al crear usuario.");
      } finally {
        setCreando(false);
      }
    } else {
      if (!password) {
        password = "123456";
      }

      try {
        setCreando(true);
        const body = {
          nombre_usuario: login,
          password,
          rol: rolAdminNuevo,
          // En tu backend local estos campos deberían existir en la tabla de administradores.
          // Si aún no, luego creamos esas columnas.
          puede_crear_parte: permCrearParte,
          puede_borrar_parte: permBorrarParte,
          puede_cerrar_parte: permCerrarParte,
        };

        const resp = await fetch(`${API_URL}/admin/register-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await resp.json();

        if (!resp.ok || json.ok === false) {
          alert(
            "Error creando usuario ADMIN: " +
              (json.message || "respuesta no válida del servidor")
          );
          return;
        }

        alert(
          `Usuario ADMIN creado correctamente.\nUsuario: ${login}\nContraseña: ${password}\nRol: ${rolAdminNuevo}`
        );
        window.location.reload();
      } catch (error) {
        console.error("Error creando admin:", error);
        alert("Error de conexión al crear admin.");
      } finally {
        setCreando(false);
      }
    }
  };

  const handleAction = (action: string) => {
    if (action === "ESTADISTICA") {
      navigate("/estadistica");
    } else if (action === "TOGGLE_DELETE") {
      onSelectModeChange(currentMode === "DELETE" ? "NONE" : "DELETE");
    } else if (action === "TOGGLE_BLOCK") {
      if (currentMode === "BLOCK" || currentMode === "UNBLOCK") {
        onSelectModeChange("NONE");
      } else {
        onSelectModeChange("BLOCK");
      }
    } else if (action === "TOGGLE_UNBLOCK") {
      if (currentMode === "UNBLOCK") {
        onSelectModeChange("NONE");
      } else {
        onSelectModeChange("UNBLOCK");
      }
    } else if (action === "EXECUTE_DELETE") {
      onDeleteUsers();
    } else if (action === "EXECUTE_BLOCK") {
      onOpenBlockModal();
    }
  };

  if (!esAdmin) return null;

  return (
    <div style={styles.container}>
      {/* Encabezado usuario + botones de navegación */}
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

      {/* Buscador (por ahora solo visual) */}
      <div style={styles.searchBarContainer}>
        <input
          type="text"
          placeholder="Buscar (visual, aún sin lógica)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />
        <button
          type="button"
          style={{ ...styles.baseButton, ...styles.btnSearch }}
        >
          🔍 Buscar
        </button>
      </div>

      {/* Selector APP / ADMIN */}
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

      {/* Mostrar / ocultar panel */}
      <div style={styles.buttonGroup}>
        <button
          type="button"
          onClick={() => setMostrarPanel(!mostrarPanel)}
          style={styles.btnPanel}
        >
          {mostrarPanel ? "Ocultar Panel ADMIN" : "▶ Mostrar Panel ADMIN"}
        </button>
      </div>

      {mostrarPanel && (
        <>
          {/* Botonera principal */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => setMostrarCrear(!mostrarCrear)}
              style={{ ...styles.baseButton, ...styles.btnCreate }}
            >
              {mostrarCrear ? "✖ Cancelar creación" : "➕ Crear usuario"}
            </button>

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

            <button
              type="button"
              onClick={() => handleAction("TOGGLE_UNBLOCK")}
              style={{
                ...styles.baseButton,
                ...(currentMode === "UNBLOCK"
                  ? styles.btnDanger
                  : styles.btnUnblock),
              }}
            >
              {currentMode === "UNBLOCK"
                ? "❌ Cancelar desbloqueo"
                : "🔓 Modo Desbloqueo"}
            </button>

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

            {isSelectionModeActive &&
              (currentMode === "BLOCK" || currentMode === "UNBLOCK") && (
                <button
                  type="button"
                  onClick={() => handleAction("EXECUTE_BLOCK")}
                  disabled={isDisabledSelection}
                  style={{
                    ...styles.baseButton,
                    ...styles.btnBlock,
                    ...(isDisabledSelection ? styles.btnDisabled : {}),
                  }}
                >
                  {currentMode === "BLOCK"
                    ? `🔒 Gestionar bloqueo (${selectedUserCount})`
                    : `🔓 Gestionar desbloqueo (${selectedUserCount})`}
                </button>
              )}

            {isSelectionModeActive && currentMode === "DELETE" && (
              <button
                type="button"
                onClick={() => handleAction("EXECUTE_DELETE")}
                disabled={isDisabledSelection}
                style={{
                  ...styles.baseButton,
                  ...styles.btnDanger,
                  ...(isDisabledSelection ? styles.btnDisabled : {}),
                }}
              >
                🔥 Eliminar seleccionados ({selectedUserCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => handleAction("ESTADISTICA")}
              style={{ ...styles.baseButton, ...styles.btnStat }}
            >
              📊 Estadística
            </button>
          </div>

          {/* Formulario de creación de usuario */}
          {mostrarCrear && (
            <div style={styles.createCard}>
              <div style={styles.createTitle}>Crear nuevo usuario</div>

              <div style={styles.createRow}>
                <div style={styles.createField}>
                  <label style={styles.createLabel}>Tipo de usuario</label>
                  <select
                    value={tipoNuevo}
                    onChange={(e) =>
                      setTipoNuevo(e.target.value === "ADMIN" ? "ADMIN" : "APP")
                    }
                    style={styles.createSelect}
                  >
                    <option value="APP">APP (personal de campo)</option>
                    <option value="ADMIN">ADMIN (panel web)</option>
                  </select>
                </div>

                <div style={styles.createField}>
                  <label style={styles.createLabel}>Nombre completo</label>
                  <input
                    type="text"
                    value={nombreNuevo}
                    onChange={(e) => setNombreNuevo(e.target.value)}
                    style={styles.createInput}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div style={styles.createField}>
                  <label style={styles.createLabel}>
                    Usuario (login){" "}
                    <span style={styles.smallInfo}>
                      (si lo dejas vacío se genera solo)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={usuarioNuevo}
                    onChange={(e) => setUsuarioNuevo(e.target.value)}
                    style={styles.createInput}
                    placeholder="Ej: jperez"
                  />
                </div>
              </div>

              <div style={styles.createRow}>
                <div style={styles.createField}>
                  <label style={styles.createLabel}>
                    Contraseña{" "}
                    <span style={styles.smallInfo}>
                      {tipoNuevo === "APP"
                        ? "(si la dejas vacía será el DNI)"
                        : "(si la dejas vacía será 123456)"}
                    </span>
                  </label>
                  <input
                    type="password"
                    value={passwordNuevo}
                    onChange={(e) => setPasswordNuevo(e.target.value)}
                    style={styles.createInput}
                    placeholder="Contraseña inicial"
                  />
                </div>

                {tipoNuevo === "APP" && (
                  <>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>DNI (obligatorio)</label>
                      <input
                        type="text"
                        value={dniNuevo}
                        onChange={(e) => setDniNuevo(e.target.value)}
                        style={styles.createInput}
                        placeholder="DNI"
                      />
                    </div>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Celular</label>
                      <input
                        type="text"
                        value={celularNuevo}
                        onChange={(e) => setCelularNuevo(e.target.value)}
                        style={styles.createInput}
                        placeholder="Celular (opcional)"
                      />
                    </div>
                  </>
                )}

                {tipoNuevo === "APP" && (
                  <div style={styles.createField}>
                    <label style={styles.createLabel}>Cargo</label>
                    <input
                      type="text"
                      value={cargoNuevo}
                      onChange={(e) => setCargoNuevo(e.target.value)}
                      style={styles.createInput}
                      placeholder="Cargo (opcional)"
                    />
                  </div>
                )}

                {tipoNuevo === "ADMIN" && (
                  <div style={styles.createField}>
                    <label style={styles.createLabel}>Rol ADMIN</label>
                    <input
                      type="text"
                      value={rolAdminNuevo}
                      onChange={(e) => setRolAdminNuevo(e.target.value)}
                      style={styles.createInput}
                      placeholder="Ej: ADMIN, JEFE_MAESTRO..."
                    />
                  </div>
                )}
              </div>

              <div style={styles.createRow}>
                <div style={styles.createField}>
                  <label style={styles.createLabel}>
                    Foto de usuario ({tipoNuevo === "APP" ? "opcional" : "solo UI"})
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    style={styles.createInput}
                  />
                  {tipoNuevo === "ADMIN" && (
                    <span style={styles.smallInfo}>
                      Para admins, la foto se podrá integrar al backend cuando
                      añadamos soporte de imagen en esa tabla.
                    </span>
                  )}
                </div>

                {tipoNuevo === "ADMIN" && (
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
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.createFooter}>
                <button
                  type="button"
                  onClick={() => setMostrarCrear(false)}
                  style={{ ...styles.baseButton, ...styles.btnBack }}
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateUser}
                  style={{
                    ...styles.baseButton,
                    ...styles.btnCreate,
                    ...(creando ? styles.btnDisabled : {}),
                  }}
                  disabled={creando}
                >
                  {creando ? "Creando..." : "Guardar usuario"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ControlPanel;
