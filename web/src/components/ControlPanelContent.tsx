// web/src/components/ControlPanelContent.tsx
import React, { useState, useEffect } from "react";
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
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

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
    if (!files || files.length === 0) {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
      setFotoFile(null);
      setFotoPreview(null);
      return;
    }
    const file = files[0];
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }
    setFotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFotoPreview(previewUrl);
  };

  const handleCreateUser = async () => {
    const nombreClean = nombreNuevo.trim();
    const dniClean = dniNuevo.trim();
    const celularClean = celularNuevo.trim();
    const cargoClean = cargoNuevo.trim();

    if (tipoNuevo === "APP") {
      // ✅ Igual que en la app móvil: todos obligatorios
      if (!nombreClean || !dniClean || !celularClean || !cargoClean) {
        alert(
          "Completa todos los campos obligatorios (nombre, DNI, celular, cargo)."
        );
        return;
      }

      let login = usuarioNuevo.trim();
      if (!login) {
        login = generarUsuarioDesdeNombre(nombreClean);
        if (!login) {
          alert(
            "No se pudo generar un usuario automático. Por favor, ingrese uno manualmente."
          );
          return;
        }
      }

      // ✅ Contraseña = DNI (regla de negocio)
      const password = dniClean;

      try {
        setCreando(true);

        const formData = new FormData();
        formData.append("nombre", nombreClean);   // nombre (no nombre_completo)
        formData.append("dni", dniClean);
        formData.append("celular", celularClean);
        formData.append("cargo", cargoClean);
        formData.append("usuario", login);
        formData.append("contrasena", password); // la API igual la usaría, pero ya va claro

        if (fotoFile) {
          formData.append("foto", fotoFile);     // foto de perfil (userPhotoUpload.single("foto"))
        }

        const resp = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          body: formData,
        });

        if (!resp.ok) {
          const text = await resp.text();
          alert(
            "Error creando usuario APP: " +
              (text || "respuesta no válida del servidor")
          );
          return;
        }

        alert(
          `Usuario APP creado correctamente.\nUsuario: ${login}\nContraseña: ${password}`
        );
        window.location.reload();
      } catch (error) {
        console.error("Error creando usuario APP:", error);
        alert("Error de conexión al crear usuario APP.");
      } finally {
        setCreando(false);
      }

      return;
    }

    // 🔐 Creación de ADMIN (misma lógica, con contraseña opcional)
    const nombreAdminClean = nombreClean;
    let login = usuarioNuevo.trim();
    if (!login) {
      login = generarUsuarioDesdeNombre(nombreAdminClean);
      if (!login) {
        alert(
          "No se pudo generar un usuario automático. Por favor, ingrese uno manualmente."
        );
        return;
      }
    }

    if (!rolAdminNuevo.trim()) {
      alert("El rol ADMIN es obligatorio.");
      return;
    }

    let password = passwordNuevo.trim();
    if (!password) {
      password = "123456";
    }

    try {
      setCreando(true);

      const body = {
        nombre: nombreAdminClean,
        usuario: login,
        contrasena: password,
        rol: rolAdminNuevo.trim(),
        puede_crear_parte: permCrearParte,
        puede_borrar_parte: permBorrarParte,
        puede_cerrar_parte: permCerrarParte,
      };

      const resp = await fetch(`${API_URL}/admin/create-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text();
        alert(
          "Error creando usuario ADMIN: " +
            (text || "respuesta no válida del servidor")
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
  };

  const isDisabledSelection =
    !isSelectionModeActive || selectedUserCount === 0 || currentMode === "NONE";

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    onLogout();
    navigate("/login");
  };

  // 🔁 Mostrar / ocultar la tabla de administradores externa
  useEffect(() => {
    const tableContainer = document.getElementById("admin-users-table");
    if (!tableContainer) return;

    if (showAdminPanel && showCreateUser) {
      tableContainer.style.display = "none";
    } else {
      tableContainer.style.display = "";
    }
  }, [showAdminPanel, showCreateUser]);

  // 🧹 Limpiar URL de la foto cuando cambie o se desmonte
  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  return (
    <div style={styles.container}>
      {/* ENCABEZADO PRINCIPAL */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Panel de control</h2>
          <p style={styles.subtitle}>Bienvenido, {userName}</p>
        </div>
        <div style={styles.headerActions}>
          <button
            type="button"
            style={{ ...styles.baseButton, ...styles.btnBack }}
            onClick={onBack}
          >
            ⬅ Volver
          </button>
          <button
            type="button"
            style={{ ...styles.baseButton, ...styles.btnLogout }}
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o DNI..."
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

      {/* TOGGLES APP / ADMIN */}
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
      </div>

      {/* INFO SELECCIÓN */}
      <div style={styles.selectionRow}>
        <div style={styles.selectionLeft}>
          <span>
            Selección:{" "}
            <strong>
              {isSelectionModeActive ? "ACTIVA" : "INACTIVA"} (seleccionados:{" "}
              {selectedUserCount})
            </strong>
          </span>
        </div>
      </div>

      {/* ACCIONES MASIVAS */}
      {isSelectionModeActive && (
        <div style={styles.massActions}>
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

      {/* BOTÓN PANEL ADMIN */}
      {decodedRol && (
        <div style={styles.adminPanelToggle}>
          <button
            type="button"
            style={{ ...styles.baseButton, ...styles.btnAdminToggle }}
            onClick={() => setShowAdminPanel((prev) => !prev)}
          >
            {showAdminPanel
              ? "Ocultar panel de administradores"
              : "Panel administrador"}
          </button>
        </div>
      )}

      {/* PANEL ADMIN + CREACIÓN */}
      {decodedRol && showAdminPanel && (
        <>
          {/* Panel administración (desaparece al abrir crear) */}
          <div
            style={{
              ...styles.adminPanel,
              ...(showCreateUser
                ? styles.adminPanelHidden
                : styles.adminPanelVisible),
            }}
          >
            <h3 style={styles.adminTitle}>Opciones de administrador</h3>
            <p style={styles.adminSubtitle}>
              Desde aquí puedes gestionar usuarios APP y usuarios ADMIN.
            </p>

            <div style={styles.adminActionsRow}>
              <button
                type="button"
                style={{ ...styles.baseButton, ...styles.btnCreate }}
                onClick={() => setShowCreateUser((prev) => !prev)}
              >
                {showCreateUser
                  ? "Cerrar creación de usuario"
                  : "Crear nuevo usuario"}
              </button>

              <button
                type="button"
                style={{
                  ...styles.baseButton,
                  ...(currentMode === "DELETE"
                    ? styles.btnDanger
                    : styles.btnSecondary),
                }}
                onClick={() =>
                  onSelectModeChange(
                    currentMode === "DELETE" ? "NONE" : "DELETE"
                  )
                }
                disabled={currentUserTarget !== "APP"}
              >
                🗑 Modo Eliminar
              </button>

              <button
                type="button"
                style={{
                  ...styles.baseButton,
                  ...(currentMode === "BLOCK"
                    ? styles.btnWarning
                    : styles.btnSecondary),
                }}
                onClick={() =>
                  onSelectModeChange(
                    currentMode === "BLOCK" ? "NONE" : "BLOCK"
                  )
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
                  onSelectModeChange(
                    currentMode === "UNBLOCK" ? "NONE" : "UNBLOCK"
                  )
                }
                disabled={currentUserTarget !== "APP"}
              >
                🔓 Modo Desbloqueo
              </button>
            </div>
          </div>

          {/* Panel crear usuario (animado) */}
          <div
            style={{
              ...styles.createUserPanelBase,
              ...(showCreateUser
                ? styles.createUserPanelVisible
                : styles.createUserPanelHidden),
            }}
          >
            <h4 style={styles.createTitle}>Crear nuevo usuario</h4>

            <div style={styles.createTabs}>
              <button
                type="button"
                style={{
                  ...styles.baseButton,
                  ...(tipoNuevo === "APP"
                    ? styles.tabActive
                    : styles.tabInactive),
                }}
                onClick={() => setTipoNuevo("APP")}
              >
                Usuario APP
              </button>
              <button
                type="button"
                style={{
                  ...styles.baseButton,
                  ...(tipoNuevo === "ADMIN"
                    ? styles.tabActive
                    : styles.tabInactive),
                }}
                onClick={() => setTipoNuevo("ADMIN")}
              >
                Usuario ADMIN
              </button>
            </div>

            <div style={styles.createForm}>
              {/* Nombre + foto */}
              <div style={styles.createRow}>
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
                  <label style={styles.createLabel}>Foto (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    style={styles.createInput}
                  />
                  {fotoPreview && (
                    <div
                      style={{
                        marginTop: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <img
                        src={fotoPreview}
                        alt="Previsualización"
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "999px",
                          objectFit: "cover",
                          border: "1px solid #1f2937",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                          maxWidth: "180px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fotoFile?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Usuario + contraseña (solo ADMIN) */}
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
                    placeholder="Ej: jguevara"
                  />
                </div>

                {tipoNuevo === "ADMIN" && (
                  <div style={styles.createField}>
                    <label style={styles.createLabel}>
                      Contraseña{" "}
                      <span style={styles.smallInfo}>
                        (si está vacío se usa un valor por defecto)
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
                )}
              </div>

              {tipoNuevo === "APP" && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "-4px",
                    marginBottom: "6px",
                  }}
                >
                  La contraseña inicial del usuario APP será su DNI.
                </p>
              )}

              {/* Rol admin */}
              {tipoNuevo === "ADMIN" && (
                <div style={styles.createRow}>
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
                </div>
              )}

              {/* Campos específicos APP */}
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

                  <div style={styles.createRow}>
                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Celular</label>
                      <input
                        type="text"
                        value={celularNuevo}
                        onChange={(e) => setCelularNuevo(e.target.value)}
                        style={styles.createInput}
                        placeholder="Celular"
                      />
                    </div>

                    <div style={styles.createField}>
                      <label style={styles.createLabel}>Cargo</label>
                      <select
                        value={cargoNuevo}
                        onChange={(e) => setCargoNuevo(e.target.value)}
                        style={styles.createInput as React.CSSProperties}
                      >
                        <option value="">Selecciona un cargo...</option>
                        <option value="sereno operador de campo">
                          sereno operador de campo
                        </option>
                        <option value="sereno conductor">sereno conductor</option>
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
                  </div>
                </>
              )}

              {/* Permisos admin */}
              {tipoNuevo === "ADMIN" && (
                <div style={styles.createRow}>
                  <div style={styles.createField}>
                    <label style={styles.createLabel}>
                      Permisos del ADMIN
                    </label>
                    <div style={styles.checkboxRow}>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={permCrearParte}
                          onChange={(e) =>
                            setPermCrearParte(e.target.checked)
                          }
                        />
                        Crear parte
                      </label>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={permBorrarParte}
                          onChange={(e) =>
                            setPermBorrarParte(e.target.checked)
                          }
                        />
                        Borrar parte
                      </label>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={permCerrarParte}
                          onChange={(e) =>
                            setPermCerrarParte(e.target.checked)
                          }
                        />
                        Cerrar parte
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div style={styles.createActions}>
                <button
                  type="button"
                  style={{ ...styles.baseButton, ...styles.btnCancel }}
                  onClick={() => {
                    setShowCreateUser(false);
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
                    if (fotoPreview) {
                      URL.revokeObjectURL(fotoPreview);
                    }
                    setFotoFile(null);
                    setFotoPreview(null);
                  }}
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
          </div>
        </>
      )}
    </div>
  );
};

export default ControlPanelContent;
