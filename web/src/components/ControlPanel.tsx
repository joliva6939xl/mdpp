// web/src/components/ControlPanel.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./ControlPanel.styles";

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

const decodeJwtRol = (token: string | null): string | null => {
  if (!token) return null;
  try {
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
  const navigate = useNavigate();

  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"APP" | "ADMIN">("APP");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [usuarioNuevo, setUsuarioNuevo] = useState("");
  const [dniNuevo, setDniNuevo] = useState("");
  const [celularNuevo, setCelularNuevo] = useState("");
  const [cargoNuevo, setCargoNuevo] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [rolAdminNuevo, setRolAdminNuevo] = useState("ADMIN");
  const [permCrearParte, setPermCrearParte] = useState(true);
  const [permBorrarParte, setPermBorrarParte] = useState(false);
  const [permCerrarParte, setPermCerrarParte] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [creando, setCreando] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  const decodedRol =
    typeof window !== "undefined"
      ? decodeJwtRol(localStorage.getItem("adminToken"))
      : null;

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

    // USUARIO APP
    if (tipoNuevo === "APP") {
      if (!dniNuevo.trim()) {
        alert("El DNI es obligatorio para usuarios APP.");
        return;
      }
      if (!password) {
        // contraseña = DNI
        password = dniNuevo.trim();
      }

      try {
        setCreando(true);

        const formData = new FormData();
        formData.append("nombre_completo", nombreNuevo);
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

        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
          alert(
            "Error creando usuario APP: " +
              (json.message || "respuesta no válida del servidor")
          );
          return;
        }

        alert(
          `Usuario APP creado correctamente.\nUsuario: ${login}\nContraseña (DNI): ${password}`
        );
        window.location.reload();
      } catch (error) {
        console.error("Error creando usuario APP:", error);
        alert("Error de conexión al crear usuario.");
      } finally {
        setCreando(false);
      }

      return;
    }

    // USUARIO ADMIN
    if (tipoNuevo === "ADMIN") {
      if (!password) {
        password = "123456";
      }

      try {
        setCreando(true);
        const body = {
          nombre_usuario: login,
          password,
          rol: rolAdminNuevo,
          puede_crear_parte: permCrearParte,
          puede_borrar_parte: permBorrarParte,
          puede_cerrar_parte: permCerrarParte,
        };

        const resp = await fetch(`${API_URL}/admin/register-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
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
        console.error("Error creando usuario ADMIN:", error);
        alert("Error de conexión al crear admin.");
      } finally {
        setCreando(false);
      }

      return;
    }
  };

  const isDisabledSelection =
    !isSelectionModeActive || selectedUserCount === 0;

  return (
    <div style={styles.container}>
      {/* CABECERA */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.userInfo}>
            <span>Sesión iniciada como </span>
            <span style={styles.userNameHighlight}>{userName}</span>
            <span> – PANEL ADMIN</span>
          </div>
        </div>

        <div style={styles.headerButtons}>
          <button
            type="button"
            style={{ ...styles.navButton, ...styles.btnBack }}
            onClick={onBack}
          >
            ← Volver
          </button>
          <button
            type="button"
            style={{ ...styles.navButton, ...styles.btnLogout }}
            onClick={onLogout}
          >
            🔒 Cerrar sesión
          </button>
        </div>
      </div>

      {/* BUSCADOR (UI) */}
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Buscar (visual, aún sin lógica)..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={styles.searchInput}
        />
        <button
          type="button"
          style={{ ...styles.baseButton, ...styles.btnSearch }}
          onClick={() => {
            alert(
              "La búsqueda visual aún no está implementada. (Es solo UI por ahora.)"
            );
          }}
        >
          🔍 Buscar
        </button>
      </div>

      {/* TOGGLES PRINCIPALES */}
      <div style={styles.toggleRow}>
        <span>Ver usuarios:</span>
        <button
          type="button"
          style={{
            ...styles.baseButton,
            ...(currentUserTarget === "APP"
              ? styles.btnUserTargetActive
              : styles.btnUserTarget),
          }}
          onClick={() => onUserTargetChange("APP")}
        >
          APP
        </button>
        <button
          type="button"
          style={{
            ...styles.baseButton,
            ...(currentUserTarget === "ADMIN"
              ? styles.btnUserTargetActive
              : styles.btnUserTarget),
          }}
          onClick={() => onUserTargetChange("ADMIN")}
        >
          ADMIN
        </button>

        <button
          type="button"
          style={{ ...styles.baseButton, ...styles.btnCreate }}
          onClick={() => {
            setShowCreateUser((prev) => !prev);
            if (!showCreateUser) {
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
              setFotoFile(null);
            }
          }}
        >
          {showCreateUser ? "✖ Cancelar creación" : "➕ Crear nuevo usuario"}
        </button>

        <button
          type="button"
          style={{
            ...styles.baseButton,
            ...(currentMode === "BLOCK" ? styles.btnDanger : styles.btnBlock),
          }}
          onClick={() =>
            onSelectModeChange(currentMode === "BLOCK" ? "NONE" : "BLOCK")
          }
          disabled={currentUserTarget !== "APP"}
        >
          🔒 Modo Bloqueo
        </button>

        <button
          type="button"
          style={{
            ...styles.baseButton,
            ...(currentMode === "UNBLOCK"
              ? styles.btnPrimary
              : styles.btnUnblock),
          }}
          onClick={() =>
            onSelectModeChange(currentMode === "UNBLOCK" ? "NONE" : "UNBLOCK")
          }
          disabled={currentUserTarget !== "APP"}
        >
          🔓 Modo Desbloqueo
        </button>

        <button
          type="button"
          style={{
            ...styles.baseButton,
            ...styles.btnDanger,
          }}
          onClick={() =>
            onSelectModeChange(currentMode === "DELETE" ? "NONE" : "DELETE")
          }
        >
          🗑 Modo Borrar
        </button>

        <button
          type="button"
          style={{ ...styles.baseButton, ...styles.btnStat }}
          onClick={() => navigate("/estadistica")}
        >
          📊 Estadística
        </button>
      </div>

      {/* ACCIONES SOBRE SELECCIÓN */}
      {isSelectionModeActive && (
        <div style={styles.selectionInfo}>
          <span>{selectedUserCount} usuarios seleccionados.</span>
          <button
            type="button"
            style={{
              ...styles.baseButton,
              ...styles.btnBlock,
              ...(isDisabledSelection ? styles.btnDisabled : {}),
            }}
            onClick={onOpenBlockModal}
            disabled={isDisabledSelection || currentUserTarget !== "APP"}
          >
            🔒 Bloquear seleccionados
          </button>
          <button
            type="button"
            style={{
              ...styles.baseButton,
              ...styles.btnDanger,
              ...(isDisabledSelection ? styles.btnDisabled : {}),
            }}
            onClick={onOpenBlockModal}
            disabled={isDisabledSelection || currentUserTarget !== "APP"}
          >
            🔓 Desbloquear seleccionados
          </button>
          <button
            type="button"
            style={{
              ...styles.baseButton,
              ...styles.btnDanger,
              ...(isDisabledSelection ? styles.btnDisabled : {}),
            }}
            onClick={onDeleteUsers}
            disabled={isDisabledSelection}
          >
            🗑 Eliminar seleccionados
          </button>
        </div>
      )}

      {/* PANEL ADMIN + CREACIÓN DE USUARIO */}
      {decodedRol && (
        <div style={styles.adminPanelToggle}>
          <button
            type="button"
            style={{ ...styles.baseButton, ...styles.btnAdminToggle }}
            onClick={() => setShowAdminPanel((prev) => !prev)}
          >
            {showAdminPanel ? "Ocultar Panel ADMIN" : "Mostrar Panel ADMIN"}
          </button>
        </div>
      )}

      {decodedRol && showAdminPanel && (
        <>
          <div style={styles.adminPanelTitle}>
            <h2>Panel de Administración – {decodedRol}</h2>
          </div>

          {showCreateUser && (
            <div style={styles.createUserCard}>
              <h3>Crear nuevo usuario</h3>

              <div style={styles.createRow}>
                <div style={styles.createField}>
                  <label style={styles.createLabel}>Tipo de usuario</label>
                  <select
                    value={tipoNuevo}
                    onChange={(e) =>
                      setTipoNuevo(e.target.value === "ADMIN" ? "ADMIN" : "APP")
                    }
                    style={styles.createInput}
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
                    placeholder="Ej: JUAN VEGA"
                  />
                </div>
              </div>

              <div style={styles.createRow}>
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

              {/* BLOQUE: CONTRASEÑA SOLO ADMIN, CAMPOS APP SIN CONTRASEÑA */}
              <div style={styles.createRow}>
                {tipoNuevo === "ADMIN" && (
                  <>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>
                        Contraseña{" "}
                        <span style={styles.smallInfo}>
                          (si la dejas vacía será 123456)
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
                  </>
                )}

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

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Cargo</label>
                      <select
                        value={cargoNuevo}
                        onChange={(e) => setCargoNuevo(e.target.value)}
                        style={styles.createSelect}
                      >
                          <option value="">Seleccionar cargo...</option>
                          <option value="sereno operador de campo">
                            sereno operador de campo
                          </option>
                          <option value="sereno conductor">
                            sereno conductor
                          </option>
                          <option value="sereno operador de camaras">
                            sereno operador de camaras
                          </option>
                          <option value="sereno motorizado">
                            sereno motorizado
                          </option>
                          <option value="sereno paramedico">
                            sereno paramedico
                          </option>
                          <option value="unidad k9">unidad k9</option>
                          <option value="amazonas">amazonas</option>
                          <option value="DELTA">DELTA</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              {/* FIN BLOQUE */}

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
              </div>

              {tipoNuevo === "ADMIN" && (
                <div style={styles.createRow}>
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
                </div>
              )}

              <div style={styles.createActionsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.baseButton,
                    ...styles.btnBack,
                  }}
                  onClick={() => setShowCreateUser(false)}
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.baseButton,
                    ...styles.btnCreate,
                    ...(creando ? styles.btnDisabled : {}),
                  }}
                  onClick={handleCreateUser}
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
