// Archivo: mdpp/web/src/pages/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ControlPanel from "../components/ControlPanel";

const BASE_URL = "http://localhost:4000";
const API_URL = `${BASE_URL}/api`;

// Normaliza rutas para imágenes / videos
const getFotoUrl = (ruta: string) => {
  if (!ruta) return "";

  const normalized = ruta.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("uploads/")) {
    return `${BASE_URL}/${normalized}`;
  }

  return `${BASE_URL}/uploads/${normalized}`;
};

// --- INTERFACES ---

interface UsuarioSistema {
  id: number;
  nombre_usuario?: string;
  rol?: string;
  nombres?: string;
  dni?: string;
  creado_en?: string;
  usuario?: string;
  nombre?: string;
  tipo_tabla: "APP" | "ADMIN";
  estado?: string;
  bloqueo_motivo?: string;
}

interface UserDetails extends UsuarioSistema {
  celular?: string;
  cargo?: string;
  foto_ruta?: string;
}

interface ParteArchivo {
  id: number;
  tipo: "foto" | "video";
  ruta: string;
  nombre_original: string;
}

// Forma flexible de archivos que devuelve la API
interface RawArchivoParte {
  id?: number;
  tipo?: string;
  tipo_archivo?: string;
  tipo_media?: string;
  ruta?: string;
  ruta_archivo?: string;
  path?: string;
  url?: string;
  filepath?: string;
  nombre_original?: string;
  nombre?: string;
  filename?: string;
  originalname?: string;
}

interface ParteVirtual {
  id: number;
  usuario_id: number;
  sector?: string;
  parte_fisico?: string;
  zona?: string;
  turno?: string;
  lugar?: string;
  fecha?: string;
  hora?: string;
  hora_fin?: string;
  unidad_tipo?: string;
  unidad_numero?: string;
  placa?: string;
  conductor?: string;
  dni_conductor?: string;
  sumilla?: string;
  asunto?: string;
  ocurrencia?: string;
  origen_atencion?: string;
  sup_zonal?: string;
  sup_general?: string;
  supervisor_zonal?: string;
  supervisor_general?: string;
  creado_en?: string;
  fotos?: ParteArchivo[];
  videos?: ParteArchivo[];

  // Participantes
  participantes?: { nombre: string; dni: string }[];
  participantes_texto?: string;
  serenos_participantes?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.username || "Admin";

  const [vistaActual, setVistaActual] = useState<"APP" | "ADMIN">("APP");
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<"DELETE" | "BLOCK" | "NONE">(
    "NONE"
  );

  // Modal usuario
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [usuarioPartes, setUsuarioPartes] = useState<ParteVirtual[]>([]);
  const [currentTabView, setCurrentTabView] = useState<"DETAILS" | "PARTES">(
    "DETAILS"
  );
  const [loadingModal, setLoadingModal] = useState(false);

  // Detalle de parte
  const [selectedParteDetail, setSelectedParteDetail] =
    useState<ParteVirtual | null>(null);
  const [parteDetailTab, setParteDetailTab] = useState<"INFO" | "MEDIA">(
    "INFO"
  );

  // Modal bloqueo
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockActionLoading, setBlockActionLoading] = useState(false);

  // --- LISTA DE USUARIOS ---
  const fetchUsuarios = useCallback(async () => {
    setCargandoTabla(true);
    setSelectedUserIds([]);
    try {
      const endpoint =
        vistaActual === "APP" ? "/admin/usuarios-app" : "/admin/usuarios-admin";

      const resp = await fetch(`${API_URL}${endpoint}`);
      const json = await resp.json();

      if (json.ok) {
        const usuariosConTipo: UsuarioSistema[] = json.usuarios.map(
          (u: Omit<UsuarioSistema, "tipo_tabla">) => ({
            ...u,
            tipo_tabla: vistaActual,
          })
        );
        setListaUsuarios(usuariosConTipo);
      } else {
        alert("Error obteniendo usuarios: " + json.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor.");
    } finally {
      setCargandoTabla(false);
    }
  }, [vistaActual]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // --- LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  // --- ELIMINAR USUARIOS ---
  const handleDeleteUsers = async () => {
    if (selectedUserIds.length === 0) {
      alert("No hay usuarios seleccionados.");
      return;
    }

    if (
      !window.confirm(
        "¿Seguro que deseas eliminar los usuarios seleccionados?"
      )
    )
      return;

    try {
      const resp = await fetch(`${API_URL}/admin/usuarios`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: selectedUserIds.map((id) => {
            const user = listaUsuarios.find((u) => u.id === id);
            return { id, tipo: user?.tipo_tabla || "APP" };
          }),
        }),
      });
      const json = await resp.json();
      if (json.ok) {
        alert("Usuarios eliminados correctamente.");
        fetchUsuarios();
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    }
  };

  // --- ABRIR MODAL BLOQUEO ---
  const handleOpenBlockModal = () => {
    if (selectedUserIds.length === 0) return;
    setBlockReason("");
    setShowBlockModal(true);
  };

  // --- APLICAR BLOQUEO / DESBLOQUEO ---
  const handleExecuteBlock = async (accion: "BLOQUEAR" | "DESBLOQUEAR") => {
    if (accion === "BLOQUEAR" && !blockReason.trim()) {
      alert("Por favor escribe un motivo (Ej: Vacaciones).");
      return;
    }

    setBlockActionLoading(true);
    try {
      const usersPayload = selectedUserIds.map((id) => {
        const user = listaUsuarios.find((u) => u.id === id);
        return { id, tipo: user?.tipo_tabla || "APP" };
      });

      const resp = await fetch(`${API_URL}/admin/usuarios/bloqueo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: usersPayload,
          accion,
          motivo: blockReason,
        }),
      });

      const json = await resp.json();
      if (json.ok) {
        alert(
          accion === "BLOQUEAR"
            ? "Usuarios bloqueados correctamente."
            : "Usuarios desbloqueados correctamente."
        );
        setShowBlockModal(false);
        fetchUsuarios();
      } else {
        alert(`Error: ${json.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al aplicar bloqueo/desbloqueo.");
    } finally {
      setBlockActionLoading(false);
    }
  };

  // --- MODO SELECCIÓN ---
  const handleToggleSelectionMode = (mode: "DELETE" | "BLOCK") => {
    if (currentMode === mode) {
      setIsSelectionModeActive(false);
      setCurrentMode("NONE");
      setSelectedUserIds([]);
    } else {
      setIsSelectionModeActive(true);
      setCurrentMode(mode);
      setSelectedUserIds([]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // --- CLICK EN UN PARTE (CARGAR DETALLE + MULTIMEDIA) ---
  const handleParteClick = async (parteId: number) => {
    setLoadingModal(true);
    try {
      const resp = await fetch(`${API_URL}/partes/${parteId}`);
      const json = await resp.json();

      if (!resp.ok || json.ok === false) {
        alert(`Error: ${json.message || "No se pudo obtener el parte."}`);
        return;
      }

      const baseParte =
        json.parte ||
        json.data ||
        json.parteVirtual ||
        json.parte_detalle ||
        json.detalle ||
        json;

      const origenArchivos =
        json.archivos ||
        json.media ||
        json.multimedia ||
        json.archivos_parte ||
        json.parte_archivos ||
        baseParte.archivos ||
        baseParte.media ||
        [];

      const archivosCrudos: RawArchivoParte[] = Array.isArray(origenArchivos)
        ? (origenArchivos as RawArchivoParte[])
        : [];

      let fotos: ParteArchivo[] = Array.isArray(
        (baseParte as ParteVirtual).fotos
      )
        ? ((baseParte as ParteVirtual).fotos as ParteArchivo[])
        : [];
      let videos: ParteArchivo[] = Array.isArray(
        (baseParte as ParteVirtual).videos
      )
        ? ((baseParte as ParteVirtual).videos as ParteArchivo[])
        : [];

      if (archivosCrudos.length > 0) {
        const mapeados: ParteArchivo[] = archivosCrudos.map((a, idx) => {
          const tipoRaw = (
            a.tipo ||
            a.tipo_archivo ||
            a.tipo_media ||
            ""
          ).toLowerCase();

          const ruta =
            a.ruta ||
            a.ruta_archivo ||
            a.path ||
            a.url ||
            a.filepath ||
            "";

          const nombre =
            a.nombre_original ||
            a.nombre ||
            a.filename ||
            a.originalname ||
            `archivo_${idx + 1}`;

          const esVideo =
            tipoRaw.includes("video") ||
            /\.(mp4|mov|avi|mkv|webm|3gp)$/i.test(ruta);

          const tipo: "foto" | "video" = esVideo ? "video" : "foto";

          return {
            id: a.id ?? idx + 1,
            tipo,
            ruta,
            nombre_original: nombre,
          };
        });

        const nuevasFotos = mapeados.filter((m) => m.tipo === "foto");
        const nuevosVideos = mapeados.filter((m) => m.tipo === "video");

        if (nuevasFotos.length) {
          fotos = fotos.concat(nuevasFotos);
        }
        if (nuevosVideos.length) {
          videos = videos.concat(nuevosVideos);
        }
      }

      const parteConMultimedia: ParteVirtual = {
        ...(baseParte as ParteVirtual),
        fotos,
        videos,
      };

      setSelectedParteDetail(parteConMultimedia);
      setParteDetailTab("INFO");

      console.log("Parte detalle cargada:", parteConMultimedia);
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setLoadingModal(false);
    }
  };

  // --- CLICK EN FILA DE USUARIO ---
  const handleRowClick = async (user: UsuarioSistema) => {
    if (isSelectionModeActive) return;

    setUserDetails(null);
    setUsuarioPartes([]);
    setSelectedParteDetail(null);
    setParteDetailTab("INFO");
    setCurrentTabView("DETAILS");
    setShowDetailsModal(true);
    setLoadingModal(true);

    try {
      const detailResp = await fetch(
        `${API_URL}/admin/usuario-details/${user.id}`
      );
      const detailJson = await detailResp.json();
      if (detailResp.ok) {
        setUserDetails(
          (detailJson.user ||
            detailJson.usuario ||
            detailJson.data ||
            detailJson) as UserDetails
        );
      }

      if (user.tipo_tabla === "APP") {
        const partesResp = await fetch(
          `${API_URL}/admin/usuario-partes/${user.id}`
        );
        const partesJson = await partesResp.json();

        if (partesResp.ok) {
          const lista =
            partesJson.partes ||
            partesJson.data ||
            partesJson.rows ||
            partesJson.lista ||
            partesJson;

          setUsuarioPartes(lista as ParteVirtual[]);
        } else {
          console.warn("No se pudieron cargar partes:", partesJson);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingModal(false);
    }
  };

  // --- ESTILOS EN LÍNEA ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#f0f2f5",
      padding: "20px 0",
    },
    header: {
      width: "100%",
      maxWidth: "1000px",
      margin: "0 auto 10px auto",
      padding: "0 20px",
      borderBottom: "1px solid #ccc",
      marginBottom: "20px",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    title: { color: "#0066cc", margin: "10px 0 0 0" },
    welcomeText: {
      fontSize: "16px",
      color: "#333",
      marginBottom: "10px",
      fontWeight: "bold",
    },
    logoutButton: {
      padding: "8px 15px",
      backgroundColor: "#dc3545",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    tableSection: {
      width: "100%",
      maxWidth: "1000px",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "8px",
      marginTop: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    tableHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    switchButton: {
      padding: "10px 20px",
      backgroundColor: "#6c757d",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    table: { width: "100%", borderCollapse: "collapse" },
    th: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px",
      textAlign: "left",
    },
    td: {
      borderBottom: "1px solid #ddd",
      padding: "10px",
      verticalAlign: "middle",
      cursor: "pointer",
    },
    celdaID: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    },
    idNumero: { fontSize: "1.1em", fontWeight: "bold", color: "#333" },
    idUsuario: {
      fontSize: "0.9em",
      color: "#fff",
      backgroundColor: "#28a745",
      padding: "2px 6px",
      borderRadius: "3px",
      fontWeight: "bold",
      marginTop: "3px",
    },
    thCheckbox: {
      width: "40px",
      backgroundColor: "#007bff",
      textAlign: "center",
      padding: "10px",
    },
    tdCheckbox: {
      width: "40px",
      borderBottom: "1px solid #ddd",
      padding: "10px",
      textAlign: "center",
    },
    checkbox: { transform: "scale(1.5)", cursor: "pointer" },
    rowSelected: { backgroundColor: "#e8f0fe" },
    blockedLabel: {
      marginLeft: "8px",
      fontSize: "0.8em",
      backgroundColor: "#dc3545",
      color: "#fff",
      padding: "2px 5px",
      borderRadius: "3px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "900px",
      maxHeight: "90vh",
      overflowY: "auto",
      overflowX: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      padding: "20px",
      borderBottom: "1px solid #eee",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f8f9fa",
      gap: "10px",
    },
    modalBody: { padding: "20px" },
    tabBar: {
      display: "flex",
      borderBottom: "1px solid #ddd",
      marginBottom: "20px",
    },
    tabButton: {
      padding: "10px 20px",
      border: "none",
      background: "none",
      cursor: "pointer",
      fontSize: "15px",
      color: "#666",
    },
    tabButtonActive: {
      color: "#007bff",
      borderBottom: "3px solid #007bff",
      fontWeight: "bold",
    },
    parteItem: {
      border: "1px solid #eee",
      borderRadius: "6px",
      padding: "10px",
      marginBottom: "10px",
      backgroundColor: "#fafafa",
      cursor: "pointer",
    },
    parteHeader: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "5px",
      fontSize: "0.9em",
      color: "#666",
    },
    parteSumilla: {
      fontWeight: "bold",
      color: "#333",
      fontSize: "1.1em",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    labelDetalle: {
      fontWeight: "bold",
      color: "#007bff",
      marginTop: "10px",
      borderBottom: "1px dotted #ccc",
      paddingBottom: "3px",
    },
    detalleValor: {
      padding: "5px 0",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    downloadButton: {
      padding: "8px 15px",
      backgroundColor: "#28a745",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      marginLeft: "15px",
    },
    blockInput: {
      width: "100%",
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      minHeight: "80px",
      margin: "15px 0",
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
    },
  };

  // --- MODAL BLOQUEO ---
  const renderBlockModal = () => {
    if (!showBlockModal) return null;
    return (
      <div style={styles.modalOverlay}>
        <div style={{ ...styles.modalContent, maxWidth: "500px" }}>
          <div style={styles.modalHeader}>
            <h2 style={{ margin: 0 }}>Bloquear / Desbloquear</h2>
            <button
              onClick={() => setShowBlockModal(false)}
              style={{
                border: "none",
                background: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <div style={styles.modalBody}>
            <p>
              Usuarios seleccionados:{" "}
              <strong>{selectedUserIds.length}</strong>
            </p>
            <p>
              Puedes bloquear (ej: vacaciones) o desbloquear los usuarios
              seleccionados.
            </p>
            <textarea
              style={styles.blockInput}
              placeholder="Motivo del bloqueo (ejemplo: Vacaciones del 10 al 20)..."
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            />
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowBlockModal(false)}
                style={{
                  padding: "8px 15px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExecuteBlock("DESBLOQUEAR")}
                disabled={blockActionLoading}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#17a2b8",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {blockActionLoading ? "Procesando..." : "Desbloquear"}
              </button>
              <button
                onClick={() => handleExecuteBlock("BLOQUEAR")}
                disabled={blockActionLoading}
                style={{
                  padding: "8px 15px",
                  border: "none",
                  borderRadius: "4px",
                  background: "#dc3545",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {blockActionLoading ? "Procesando..." : "Bloquear"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- DETALLE DE PARTE: INFO + MULTIMEDIA ---
  const renderParteDetail = () => {
    if (!selectedParteDetail) return null;
    const p = selectedParteDetail;

    const supervisorZonal = p.supervisor_zonal || p.sup_zonal;
    const supervisorGeneral = p.supervisor_general || p.sup_general;

    const fotos = p.fotos || [];
    const videos = p.videos || [];
    const hayMultimedia =
      (fotos && fotos.length > 0) || (videos && videos.length > 0);

    const participantesLista = p.participantes || [];
    const participantesTexto =
      p.participantes_texto || p.serenos_participantes || "";

    // 🔹 SUB-VISTA SOLO MULTIMEDIA
    if (parteDetailTab === "MEDIA") {
      return (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <button
              style={{
                ...styles.tabButton,
                color: "#dc3545",
                borderBottom: "none",
              }}
              onClick={() => setSelectedParteDetail(null)}
            >
              ⬅️ Volver a la lista de partes
            </button>

            <div>
              <button
                style={{
                  ...styles.tabButton,
                  borderBottom: "none",
                  marginRight: "10px",
                }}
                onClick={() => setParteDetailTab("INFO")}
              >
                📄 Ver detalle
              </button>
              <button
                style={styles.downloadButton}
                onClick={() => alert(`Lógica descarga ID ${p.id}`)}
              >
                ⬇️ Descargar
              </button>
            </div>
          </div>

          <h3
            style={{
              borderBottom: "2px solid #007bff",
              paddingBottom: "5px",
            }}
          >
            Contenido multimedia del Parte N° {p.id}
          </h3>

          {!hayMultimedia ? (
            <p style={styles.detalleValor}>
              No hay archivos multimedia registrados.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "10px",
              }}
            >
              {/* FOTOS */}
              {fotos.map((f) => {
                const url = getFotoUrl(f.ruta);
                return (
                  <div
                    key={f.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#fafafa",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(url, "_blank")}
                  >
                    <div
                      style={{
                        height: "90px",
                        overflow: "hidden",
                        background: "#000",
                      }}
                    >
                      <img
                        src={url}
                        alt={f.nombre_original}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "12px", padding: "4px 6px" }}>
                      📷 {f.nombre_original}
                    </div>
                  </div>
                );
              })}

              {/* VIDEOS */}
              {videos.map((v) => {
                const url = getFotoUrl(v.ruta);
                return (
                  <div
                    key={v.id}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "#fafafa",
                      padding: "8px 6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => window.open(url, "_blank")}
                  >
                    <video
                      src={url}
                      style={{ width: "100%", maxHeight: "140px" }}
                      controls
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      style={{
                        fontSize: "12px",
                        width: "100%",
                        padding: "0 2px",
                        textAlign: "center",
                      }}
                    >
                      🎬 {v.nombre_original}{" "}
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: "11px", marginLeft: "4px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        (Abrir)
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // 🔹 SUB-VISTA PRINCIPAL DE INFORMACIÓN
    return (
      <div>
        {/* Barra superior */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <button
            style={{
              ...styles.tabButton,
              color: "#dc3545",
              borderBottom: "none",
            }}
            onClick={() => setSelectedParteDetail(null)}
          >
            ⬅️ Volver a la lista de partes
          </button>

          <div>
            <button
              style={{
                ...styles.tabButton,
                borderBottom: "none",
                marginRight: "10px",
              }}
              onClick={() => setParteDetailTab("MEDIA")}
            >
              📷 Ver contenido multimedia
            </button>
            <button
              style={styles.downloadButton}
              onClick={() => alert(`Lógica descarga ID ${p.id}`)}
            >
              ⬇️ Descargar
            </button>
          </div>
        </div>

        {/* Encabezado */}
        <h3
          style={{
            borderBottom: "2px solid #007bff",
            paddingBottom: "5px",
          }}
        >
          Parte Virtual #{p.id}
        </h3>
        <p style={{ marginTop: "5px", marginBottom: "15px" }}>
          <strong>N° Parte Físico:</strong> {p.parte_fisico || "-"}
        </p>

        {/* 1. Fecha y Horas */}
        <div style={{ marginBottom: "15px" }}>
          <p style={styles.labelDetalle}>Fecha y Horas</p>
          <p style={styles.detalleValor}>
            <strong>Fecha:</strong> {p.fecha || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Hora inicio:</strong> {p.hora || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Hora fin:</strong> {p.hora_fin || "-"}
          </p>
        </div>

        {/* 2. Ubicación y Turno */}
        <div style={{ marginBottom: "15px" }}>
          <p style={styles.labelDetalle}>Ubicación y Turno</p>
          <p style={styles.detalleValor}>
            <strong>Sector:</strong> {p.sector || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Zona:</strong> {p.zona || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Turno:</strong> {p.turno || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Lugar:</strong> {p.lugar || "-"}
          </p>
        </div>

        {/* 3. Unidad y Conductor + Participantes */}
        <div style={{ marginBottom: "15px" }}>
          <p style={styles.labelDetalle}>Unidad y Conductor</p>
          <p style={styles.detalleValor}>
            <strong>Unidad / Tipo:</strong> {p.unidad_tipo || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Unidad N°:</strong> {p.unidad_numero || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Placa:</strong> {p.placa || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Conductor:</strong> {p.conductor || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>DNI Conductor:</strong> {p.dni_conductor || "-"}
          </p>

          {/* SERENO OPERADOR PARTICIPANTE */}
          <div style={{ marginTop: "10px" }}>
            <p
              style={{
                ...styles.detalleValor,
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              SERENO OPERADOR PARTICIPANTE
            </p>

            {participantesLista.length > 0 ? (
              <ol style={{ paddingLeft: "20px", margin: 0 }}>
                {participantesLista.map((pa, idx) => (
                  <li key={idx} style={{ marginBottom: "4px" }}>
                    <div>{pa.nombre || "-"}</div>
                    <div style={{ fontSize: "0.9em" }}>
                      DNI: {pa.dni || "-"}
                    </div>
                  </li>
                ))}
              </ol>
            ) : participantesTexto ? (
              <p style={styles.detalleValor}>{participantesTexto}</p>
            ) : (
              <p style={styles.detalleValor}>
                No se registraron participantes adicionales.
              </p>
            )}
          </div>
        </div>

        {/* 4. Detalle de la Incidencia */}
        <div style={{ marginBottom: "15px" }}>
          <p style={styles.labelDetalle}>Detalle de la Incidencia</p>
          <p style={styles.detalleValor}>
            <strong>Incidencia:</strong> {p.sumilla || p.asunto || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Origen de atención:</strong>{" "}
            {p.origen_atencion || "No especificado"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Ocurrencia:</strong>
          </p>
          <p style={styles.detalleValor}>{p.ocurrencia || "-"}</p>
        </div>

        {/* 5. Supervisión */}
        <div style={{ marginBottom: "5px" }}>
          <p style={styles.labelDetalle}>Supervisión</p>
          <p style={styles.detalleValor}>
            <strong>Supervisor Zonal:</strong> {supervisorZonal || "-"}
          </p>
          <p style={styles.detalleValor}>
            <strong>Supervisor General:</strong> {supervisorGeneral || "-"}
          </p>
        </div>
      </div>
    );
  };

  // --- MODAL DE DETALLE DE USUARIO + PARTES ---
  const renderDetailsModal = () => {
    if (!showDetailsModal) return null;

    const det = userDetails;
    const nombreMostrar =
      det?.nombre || det?.nombres || det?.nombre_usuario || "Usuario";
    const cargoMostrar =
      det?.cargo || (det?.rol && det.tipo_tabla === "ADMIN" ? det.rol : "");
    const usuarioLogin = det?.usuario || det?.nombre_usuario || "";
    const dni = det?.dni || "";
    const celular = det?.celular || "";
    const fotoUrl = det?.foto_ruta ? getFotoUrl(det.foto_ruta) : "";

    let content: React.ReactNode;

    if (currentTabView === "PARTES" && selectedParteDetail) {
      content = renderParteDetail();
    } else if (currentTabView === "PARTES") {
      content = (
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {usuarioPartes.length === 0 ? (
            <p>No hay partes registrados para este usuario.</p>
          ) : (
            usuarioPartes.map((p) => (
              <div
                key={p.id}
                style={styles.parteItem}
                onClick={() => handleParteClick(p.id)}
              >
                <div style={styles.parteHeader}>
                  <span>📅 {p.fecha}</span>
                  <span>🆔 #{p.id}</span>
                </div>
                <div style={styles.parteSumilla}>
                  {p.sumilla || p.asunto || "-"}
                </div>
              </div>
            ))
          )}
        </div>
      );
    } else if (det) {
      content = (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          <div>
            <p style={styles.labelDetalle}>DATOS DEL USUARIO</p>
            <p style={styles.detalleValor}>
              <strong>Cargo:</strong> {cargoMostrar || "-"}
            </p>
            <p style={styles.detalleValor}>
              <strong>Usuario:</strong> {usuarioLogin || "-"}
            </p>
            <p style={styles.detalleValor}>
              <strong>DNI:</strong> {dni || "-"}
            </p>
            <p style={styles.detalleValor}>
              <strong>Celular:</strong> {celular || "-"}
            </p>
            <p style={styles.detalleValor}>
              <strong>Estado:</strong>{" "}
              <span style={{ fontWeight: "bold" }}>
                {det.estado || "ACTIVO"}
              </span>
            </p>
            {det.estado === "BLOQUEADO" && det.bloqueo_motivo && (
              <p style={styles.detalleValor}>
                <strong>Motivo bloqueo:</strong> {det.bloqueo_motivo}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={nombreMostrar}
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "2px solid #ddd",
                }}
              />
            ) : (
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "8px",
                  border: "2px dashed #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                Sin foto
              </div>
            )}
          </div>
        </div>
      );
    } else {
      content = <p>Cargando...</p>;
    }

    return (
      <div
        style={styles.modalOverlay}
        onClick={() => setShowDetailsModal(false)}
      >
        <div
          style={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={styles.modalHeader}>
            <h2 style={{ margin: 0 }}>
              {loadingModal ? "Cargando..." : nombreMostrar}
            </h2>
            {det?.estado === "BLOQUEADO" && (
              <span style={styles.blockedLabel}>BLOQUEADO</span>
            )}
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                border: "none",
                background: "none",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.tabBar}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(currentTabView === "DETAILS"
                    ? styles.tabButtonActive
                    : {}),
                }}
                onClick={() => {
                  setCurrentTabView("DETAILS");
                  setSelectedParteDetail(null);
                }}
              >
                📋 Información
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(currentTabView === "PARTES"
                    ? styles.tabButtonActive
                    : {}),
                }}
                onClick={() => {
                  setCurrentTabView("PARTES");
                  setSelectedParteDetail(null);
                }}
              >
                📄 Partes ({usuarioPartes.length})
              </button>
            </div>
            {content}
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER PRINCIPAL ---
  return (
    <div style={styles.container}>
      {renderDetailsModal()}
      {renderBlockModal()}

      <div style={styles.header}>
        <div style={styles.topBar}>
          <h2 style={styles.title}>Panel de Administración</h2>
          <button style={styles.logoutButton} onClick={handleLogout}>
            Salir
          </button>
        </div>
        <p style={styles.welcomeText}>Hola, {userName}</p>
      </div>

      <ControlPanel
        selectedUserCount={selectedUserIds.length}
        onDeleteUsers={handleDeleteUsers}
        onBlockAction={handleOpenBlockModal}
        isSelectionModeActive={isSelectionModeActive}
        currentMode={currentMode}
        onToggleSelection={handleToggleSelectionMode}
      />

      <div style={styles.tableSection}>
        <div style={styles.tableHeader}>
          <h3>{vistaActual === "APP" ? "Usuarios App" : "Administrativos"}</h3>
          <button
            style={styles.switchButton}
            onClick={() =>
              setVistaActual(vistaActual === "APP" ? "ADMIN" : "APP")
            }
          >
            {vistaActual === "APP" ? "Ver Admin ➡" : "⬅ Ver App"}
          </button>
        </div>
        {cargandoTabla ? (
          <p style={{ textAlign: "center" }}>Cargando...</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {isSelectionModeActive && (
                  <th style={styles.thCheckbox}>✔</th>
                )}
                <th style={styles.th}>ID / Usuario</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {listaUsuarios.map((u) => (
                <tr
                  key={`${u.tipo_tabla}-${u.id}`}
                  style={
                    selectedUserIds.includes(u.id)
                      ? { ...styles.rowSelected }
                      : {}
                  }
                  onClick={() => !isSelectionModeActive && handleRowClick(u)}
                >
                  {isSelectionModeActive && (
                    <td
                      style={styles.tdCheckbox}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        style={styles.checkbox}
                      />
                    </td>
                  )}
                  <td style={styles.td}>
                    <div style={styles.celdaID}>
                      <span style={styles.idNumero}>{u.id}</span>
                      <span style={styles.idUsuario}>{u.tipo_tabla}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {u.nombre || u.nombres}
                    {u.estado === "BLOQUEADO" && (
                      <span style={styles.blockedLabel}>BLOQUEADO</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {u.creado_en
                      ? new Date(u.creado_en).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
