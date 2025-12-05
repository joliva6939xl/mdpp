// Archivo: mdpp/web/src/pages/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ControlPanel from "../components/ControlPanel";
import {
  obtenerUsuariosSistema,
  eliminarUsuariosSeleccionados,
  bloqueoUsuarios,
  obtenerPartePorIdAdmin,
  obtenerUsuarioDetallesAdmin,
  obtenerUsuarioPartesAdmin,
} from "../services/adminService";

const BASE_URL = "http://localhost:4000";

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
  direccion?: string;
  correo?: string;
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
  const [currentMode, setCurrentMode] = useState<
  "DELETE" | "BLOCK" | "UNBLOCK" | "NONE"
>("NONE");

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
  const [parteDetailTab, setParteDetailTab] = useState<"INFO" | "MULTIMEDIA">(
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
      const { resp, json } = await obtenerUsuariosSistema(vistaActual);

      if (resp.ok && json.ok) {
        const usuariosConTipo: UsuarioSistema[] = (json.usuarios || []).map(
          (u) => ({
            ...(u as Omit<UsuarioSistema, "tipo_tabla">),
            tipo_tabla: vistaActual,
          })
        );
        setListaUsuarios(usuariosConTipo);
      } else {
        alert("Error obteniendo usuarios: " + (json.message || ""));
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

  const handleLogout = () => {
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/login");
  };

  const handleUserTargetChange = (value: "APP" | "ADMIN") => {
    setVistaActual(value);
    setSelectedUserIds([]);
    setIsSelectionModeActive(false);
    setCurrentMode("NONE");
  };

 const handleSelectModeChange = (
  mode: "DELETE" | "BLOCK" | "UNBLOCK" | "NONE"
) => {
    if (mode === "NONE") {
      setIsSelectionModeActive(false);
      setCurrentMode("NONE");
      setSelectedUserIds([]);
      return;
    }
    setIsSelectionModeActive(true);
    setCurrentMode(mode);
  };

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
      const usersPayload = selectedUserIds.map((id) => {
        const user = listaUsuarios.find((u) => u.id === id);
        return { id, tipo: user?.tipo_tabla || "APP" };
      });

      const { resp, json } = await eliminarUsuariosSeleccionados(usersPayload);

      if (resp.ok && json.ok) {
        alert("Usuarios eliminados correctamente.");
        fetchUsuarios();
        setSelectedUserIds([]);
      } else {
        alert("Error eliminando usuarios: " + (json.message || ""));
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    }
  };

  // --- ABRIR MODAL DE BLOQUEO ---
  const handleOpenBlockModal = () => {
    if (selectedUserIds.length === 0) {
      alert("No hay usuarios seleccionados.");
      return;
    }
    setBlockReason("");
    setShowBlockModal(true);
  };

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

      const { resp, json } = await bloqueoUsuarios(
        usersPayload,
        accion,
        blockReason
      );

      if (resp.ok && json.ok) {
        alert(
          accion === "BLOQUEAR"
            ? "Usuarios bloqueados correctamente."
            : "Usuarios desbloqueados correctamente."
        );
        setShowBlockModal(false);
        fetchUsuarios();
      } else {
        alert(`Error: ${json.message || "No se pudo aplicar la acción."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión al aplicar bloqueo/desbloqueo.");
    } finally {
      setBlockActionLoading(false);
    }
  };

  // --- MODO SELECCIÓN ---
  const toggleSelect = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  // --- CLICK EN UN PARTE (CARGAR DETALLE + MULTIMEDIA) ---
  const handleParteClick = async (parteId: number) => {
    setLoadingModal(true);
    try {
      const { resp, json } = await obtenerPartePorIdAdmin(parteId);

      if (!resp.ok || json.ok === false) {
        alert(`Error: ${json.message || "No se pudo obtener el parte."}`);
        return;
      }

      const rawBase =
        json.parte ||
        json.data ||
        json.parteVirtual ||
        json.parte_detalle ||
        json.detalle;

      if (!rawBase) {
        alert("No se encontraron datos del parte.");
        return;
      }

      const baseParte = rawBase as unknown as ParteVirtual;

      const origenArchivos =
        json.archivos ||
        json.media ||
        json.multimedia ||
        json.archivos_parte ||
        json.parte_archivos ||
        (baseParte as { archivos?: RawArchivoParte[] }).archivos ||
        (baseParte as { media?: RawArchivoParte[] }).media ||
        [];

      const archivosCrudos: RawArchivoParte[] = Array.isArray(origenArchivos)
        ? (origenArchivos as RawArchivoParte[])
        : [];

      let fotos: ParteArchivo[] = Array.isArray(
        (baseParte as { fotos?: ParteArchivo[] }).fotos
      )
        ? ((baseParte as { fotos?: ParteArchivo[] }).fotos as ParteArchivo[])
        : [];
      let videos: ParteArchivo[] = Array.isArray(
        (baseParte as { videos?: ParteArchivo[] }).videos
      )
        ? ((baseParte as { videos?: ParteArchivo[] }).videos as ParteArchivo[])
        : [];

      if (archivosCrudos.length > 0) {
        const mapeados: ParteArchivo[] = archivosCrudos.map((a, idx) => {
          const tipoRaw = (
            a.tipo ||
            a.tipo_archivo ||
            a.tipo_media ||
            ""
          )?.toLowerCase() as string;

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
            ruta.toLowerCase().endsWith(".mp4") ||
            ruta.toLowerCase().endsWith(".mov") ||
            ruta.toLowerCase().endsWith(".avi");

          const tipo: "foto" | "video" = esVideo ? "video" : "foto";

          return {
            id: a.id ?? idx + 1,
            tipo,
            ruta: getFotoUrl(ruta),
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
        ...baseParte,
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
      const { resp: detailResp, json: detailJson } =
        await obtenerUsuarioDetallesAdmin(user.id);

      if (detailResp.ok) {
        const rawUser =
          detailJson.user || detailJson.usuario || detailJson.data;

        if (rawUser) {
          setUserDetails(rawUser as unknown as UserDetails);
        }
      }

      if (user.tipo_tabla === "APP") {
        const { resp: partesResp, json: partesJson } =
          await obtenerUsuarioPartesAdmin(user.id);

        if (partesResp.ok) {
          const listaRaw =
            partesJson.partes ||
            partesJson.data ||
            partesJson.rows ||
            partesJson.lista ||
            [];

          const lista = listaRaw as unknown as ParteVirtual[];
          setUsuarioPartes(lista);
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
      backgroundColor: "#f4f4f4",
      fontFamily: "Arial, sans-serif",
    },
    title: {
      fontSize: "1.6rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      color: "#333",
      textAlign: "center",
    },
    usernameHighlight: {
      color: "#1976d2",
    },
    tableWrapper: {
      width: "95%",
      maxWidth: "1200px",
      marginBottom: "2rem",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      backgroundColor: "#fff",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.9rem",
    },
    th: {
      backgroundColor: "#1976d2",
      color: "#fff",
      padding: "0.75rem",
      textAlign: "left",
    },
    td: {
      padding: "0.75rem",
      borderBottom: "1px solid #ddd",
      cursor: "pointer",
    },
    rowSelected: {
      backgroundColor: "#e3f2fd",
    },
    rowHover: {
      backgroundColor: "#f5f5f5",
    },
    actionsRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "1rem",
      width: "95%",
      maxWidth: "1200px",
    },
    filterButton: {
      padding: "0.5rem 1rem",
      fontSize: "0.9rem",
      borderRadius: "4px",
      border: "none",
      backgroundColor: "#1976d2",
      color: "#fff",
      cursor: "pointer",
      marginRight: "0.5rem",
    },
    dangerButton: {
      backgroundColor: "#d32f2f",
    },
    blockButton: {
      backgroundColor: "#f57c00",
    },
    secondaryButton: {
      padding: "0.5rem 1rem",
      fontSize: "0.9rem",
      borderRadius: "4px",
      border: "1px solid #1976d2",
      backgroundColor: "#fff",
      color: "#1976d2",
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    modalContent: {
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "900px",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1rem",
    },
    modalTitle: {
      fontSize: "1.2rem",
      fontWeight: "bold",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "1.2rem",
      cursor: "pointer",
    },
    detailsRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "0.5rem",
    },
    detailsLabel: {
      fontWeight: "bold",
      marginRight: "0.5rem",
    },
    tabsContainer: {
  display: "flex",
  marginBottom: "1rem",
  borderBottom: "1px solid #ddd",
},
    tabButton: {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "none",
      borderBottom: "2px solid transparent",
      backgroundColor: "transparent",
      fontWeight: "bold",
    },
    tabButtonActive: {
      borderBottom: "2px solid #1976d2",
      color: "#1976d2",
    },
    partesList: {
      maxHeight: "300px",
      overflowY: "auto",
      border: "1px solid #ddd",
      borderRadius: "4px",
      padding: "0.5rem",
    },
    parteItem: {
      padding: "0.5rem",
      borderBottom: "1px solid #eee",
      cursor: "pointer",
    },
    parteItemHover: {
      backgroundColor: "#f5f5f5",
    },
    bloqueadoLabel: {
      color: "#d32f2f",
      fontWeight: "bold",
      marginLeft: "0.5rem",
    },
    multimediaGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: "0.75rem",
      marginTop: "1rem",
    },
    multimediaItem: {
      borderRadius: "4px",
      overflow: "hidden",
      border: "1px solid #ddd",
      padding: "0.25rem",
      backgroundColor: "#fafafa",
    },
    multimediaImage: {
      width: "100%",
      height: "auto",
      borderRadius: "4px",
    },
    multimediaVideo: {
      width: "100%",
      borderRadius: "4px",
    },
    blockModalContent: {
      backgroundColor: "#fff",
      padding: "1.5rem",
      borderRadius: "8px",
      width: "90%",
      maxWidth: "500px",
    },
    blockTextarea: {
      width: "100%",
      minHeight: "80px",
      marginTop: "0.5rem",
      marginBottom: "1rem",
      padding: "0.5rem",
      borderRadius: "4px",
      border: "1px solid #ccc",
      fontFamily: "inherit",
      fontSize: "0.9rem",
    },
    blockModalButtons: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
    },
  };

  const renderUserRow = (user: UsuarioSistema, index: number) => {
    const isSelected = selectedUserIds.includes(user.id);
    const isBlocked = user.estado === "BLOQUEADO";

    const baseRowStyle: React.CSSProperties = {
      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9f9f9", // filas zebra
    };

    return (
      <tr
        key={`${user.tipo_tabla}-${user.id}`}
        style={{
          ...baseRowStyle,
          ...(isSelected ? styles.rowSelected : {}),
        }}
        onClick={() =>
          isSelectionModeActive ? toggleSelect(user.id) : handleRowClick(user)
        }
      >
        <td>
          {isSelectionModeActive && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(user.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </td>
        <td>{user.id}</td>
        <td>{user.nombre_usuario || user.usuario || user.nombre}</td>
        <td>{user.rol || (user.tipo_tabla === "APP" ? "APP" : "ADMIN")}</td>
        <td>{user.nombres || "-"}</td>
        <td>{user.dni || "-"}</td>
        <td>{user.creado_en || "-"}</td>
        <td>
          {isBlocked ? (
            <span style={styles.bloqueadoLabel}>
              BLOQUEADO {user.bloqueo_motivo ? `(${user.bloqueo_motivo})` : ""}
            </span>
          ) : (
            "ACTIVO"
          )}
        </td>
      </tr>
    );
  };

  const renderUserDetails = () => {
    if (!userDetails) return null;

    return (
      <div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>ID Usuario:</span>
          <span>{userDetails.id}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Nombre Usuario:</span>
          <span>
            {userDetails.nombre_usuario ||
              userDetails.usuario ||
              userDetails.nombre}
          </span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Rol:</span>
          <span>{userDetails.rol || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Nombres:</span>
          <span>{userDetails.nombres || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>DNI:</span>
          <span>{userDetails.dni || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Celular:</span>
          <span>{userDetails.celular || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Cargo:</span>
          <span>{userDetails.cargo || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Dirección:</span>
          <span>{userDetails.direccion || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Correo:</span>
          <span>{userDetails.correo || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Fecha creación:</span>
          <span>{userDetails.creado_en || "-"}</span>
        </div>
      </div>
    );
  };

  const renderParteDetail = () => {
    if (!selectedParteDetail) return null;

    const p = selectedParteDetail;

    return (
      <div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>ID Parte:</span>
          <span>{p.id}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Sector:</span>
          <span>{p.sector || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Zona:</span>
          <span>{p.zona || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Turno:</span>
          <span>{p.turno || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Lugar:</span>
          <span>{p.lugar || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Fecha:</span>
          <span>{p.fecha || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Hora inicio:</span>
          <span>{p.hora || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Hora fin:</span>
          <span>{p.hora_fin || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Unidad:</span>
          <span>
            {p.unidad_tipo || ""} {p.unidad_numero || ""}
          </span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Placa:</span>
          <span>{p.placa || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Conductor:</span>
          <span>{p.conductor || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>DNI Conductor:</span>
          <span>{p.dni_conductor || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Sumilla / Incidencia:</span>
          <span>{p.sumilla || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Asunto / Origen atención:</span>
          <span>{p.asunto || p.origen_atencion || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Supervisor Zonal:</span>
          <span>{p.sup_zonal || p.supervisor_zonal || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Supervisor General:</span>
          <span>{p.sup_general || p.supervisor_general || "-"}</span>
        </div>
      </div>
    );
  };

  const renderMultimedia = () => {
    if (!selectedParteDetail) return null;

    const fotos = selectedParteDetail.fotos || [];
    const videos = selectedParteDetail.videos || [];

    if (fotos.length === 0 && videos.length === 0) {
      return <p>No hay archivos multimedia registrados para este parte.</p>;
    }

    return (
      <div style={styles.multimediaGrid}>
        {fotos.map((foto) => (
          <div key={`foto-${foto.id}`} style={styles.multimediaItem}>
            <img
              src={foto.ruta}
              alt={foto.nombre_original}
              style={styles.multimediaImage}
            />
            <div>{foto.nombre_original}</div>
          </div>
        ))}
        {videos.map((video) => (
          <div key={`video-${video.id}`} style={styles.multimediaItem}>
            <video controls style={styles.multimediaVideo}>
              <source src={video.ruta} />
              Tu navegador no soporta video.
            </video>
            <div>{video.nombre_original}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <ControlPanel
        userName={userName}
        selectedUserCount={selectedUserIds.length}
        isSelectionModeActive={isSelectionModeActive}
        currentMode={currentMode}
        currentUserTarget={vistaActual}
        onUserTargetChange={handleUserTargetChange}
        onSelectModeChange={handleSelectModeChange}
        onDeleteUsers={handleDeleteUsers}
        onOpenBlockModal={handleOpenBlockModal}
        onLogout={handleLogout}
        onBack={handleBack}
      />

      <h2 style={styles.title}>
        Panel de Administración –{" "}
        <span style={styles.usernameHighlight}>{userName}</span>
      </h2>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Sel</th>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Usuario</th>
              <th style={styles.th}>Rol</th>
              <th style={styles.th}>Nombres</th>
              <th style={styles.th}>DNI</th>
              <th style={styles.th}>Creado en</th>
              <th style={styles.th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargandoTabla ? (
              <tr>
                <td colSpan={8} style={styles.td}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : listaUsuarios.length === 0 ? (
              <tr>
                <td colSpan={8} style={styles.td}>
                  No hay usuarios registrados para esta vista.
                </td>
              </tr>
            ) : (
              listaUsuarios.map((user, index) => renderUserRow(user, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de detalles de usuario y partes */}
      {showDetailsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Detalles de Usuario – ID {userDetails?.id}
              </h3>
              <button
                style={styles.closeButton}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedParteDetail(null);
                  setUsuarioPartes([]);
                  setUserDetails(null);
                  setParteDetailTab("INFO");
                  setCurrentTabView("DETAILS");
                }}
              >
                ✕
              </button>
            </div>

            {loadingModal ? (
              <p>Cargando...</p>
            ) : (
              <>
                <div style={styles.tabsContainer}>
                  <button
                    style={{
                      ...styles.tabButton,
                      ...(currentTabView === "DETAILS"
                        ? styles.tabButtonActive
                        : {}),
                    }}
                    onClick={() => setCurrentTabView("DETAILS")}
                  >
                    Datos del usuario
                  </button>
                  <button
                    style={{
                      ...styles.tabButton,
                      ...(currentTabView === "PARTES"
                        ? styles.tabButtonActive
                        : {}),
                    }}
                    onClick={() => setCurrentTabView("PARTES")}
                  >
                    Partes registrados
                  </button>
                </div>

                {currentTabView === "DETAILS" && renderUserDetails()}

                {currentTabView === "PARTES" && (
                  <div>
                    <h4>Partes del usuario</h4>
                    {usuarioPartes.length === 0 ? (
                      <p>Este usuario no tiene partes registrados.</p>
                    ) : (
                      <div style={styles.partesList}>
                        {usuarioPartes.map((parte) => (
                          <div
                            key={parte.id}
                            style={styles.parteItem}
                            onClick={() => handleParteClick(parte.id)}
                          >
                            <strong>ID Parte:</strong> {parte.id} –{" "}
                            {parte.sumilla || parte.asunto || "Sin sumilla"}{" "}
                            ({parte.fecha || "-"})
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedParteDetail && (
                      <>
                        <div style={styles.tabsContainer}>
                          <button
                            style={{
                              ...styles.tabButton,
                              ...(parteDetailTab === "INFO"
                                ? styles.tabButtonActive
                                : {}),
                            }}
                            onClick={() => setParteDetailTab("INFO")}
                          >
                            Información
                          </button>
                          <button
                            style={{
                              ...styles.tabButton,
                              ...(parteDetailTab === "MULTIMEDIA"
                                ? styles.tabButtonActive
                                : {}),
                            }}
                            onClick={() => setParteDetailTab("MULTIMEDIA")}
                          >
                            Multimedia
                          </button>
                        </div>

                        {parteDetailTab === "INFO"
                          ? renderParteDetail()
                          : renderMultimedia()}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de bloqueo */}
      {showBlockModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.blockModalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Gestionar bloqueo de usuarios</h3>
              <button
                style={styles.closeButton}
                onClick={() => setShowBlockModal(false)}
              >
                ✕
              </button>
            </div>
            <p>
              Estás a punto de{" "}
              <strong>
                {currentMode === "BLOCK" ? "BLOQUEAR" : "DESBLOQUEAR"}
              </strong>{" "}
              {selectedUserIds.length} usuario(s).
            </p>
            {currentMode === "BLOCK" && (
              <>
                <label>
                  Motivo del bloqueo (Ej: Vacaciones, Suspensión, etc.):
                </label>
                <textarea
                  style={styles.blockTextarea}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </>
            )}
            <div style={styles.blockModalButtons}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowBlockModal(false)}
                disabled={blockActionLoading}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...styles.filterButton,
                  ...(currentMode === "BLOCK"
                    ? styles.blockButton
                    : styles.dangerButton),
                }}
                onClick={() =>
                  handleExecuteBlock(
                    currentMode === "BLOCK" ? "BLOQUEAR" : "DESBLOQUEAR"
                  )
                }
                disabled={blockActionLoading}
              >
                {blockActionLoading
                  ? "Aplicando..."
                  : currentMode === "BLOCK"
                  ? "Bloquear"
                  : "Desbloquear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
