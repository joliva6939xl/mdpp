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
import { profileStyles as styles } from "./Profile.styles";

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
  foto_ruta?: string;
  foto?: string;
  fotoPerfil?: string;
  foto_perfil?: string;
}

interface ParteArchivo {
  id: number;
  tipo: "foto" | "video";
  ruta: string;
  nombre_original: string;
}

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

  // Campos base
  sector?: string;
  parte_fisico?: string;
  zona?: string;
  turno?: string;
  tipo?: string;
  descripcion?: string;
  ubicacion_exacta?: string;
  hora_inicio?: string;
  hora_fin?: string;
  unidad_tipo?: string;
  unidad_numero?: string;
  placa?: string;
  estado?: string;
  creado_en?: string;

  // Campos extra que usa la app
  fecha?: string;
  lugar?: string;
  conductor?: string;
  dni_conductor?: string;

  // *** Campos reales en BD para incidencia y origen de atención ***
  sumilla?: string; // Incidencia
  asunto?: string;  // Origen de atención

  // Incidencia (varias posibles claves según backend)
  incidencia?: string;
  incidencia_nombre?: string;
  incidencia_detalle?: string;

  // Origen de atención (varias posibles claves)
  origen_atencion?: string;
  origenAtencion?: string;
  origen_atencion_nombre?: string;

  ocurrencia?: string;

  // Supervisores (dos nombres posibles)
  supervisor_zonal?: string;
  supervisor_general?: string;
  sup_zonal?: string;
  sup_general?: string;

  fotos?: ParteArchivo[];
  videos?: ParteArchivo[];
}


const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userName = location.state?.username || "ADMIN";

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

  // Hover en partes
  const [hoveredParteId, setHoveredParteId] = useState<number | null>(null);

  // --- LISTA DE USUARIOS ---
  const fetchUsuarios = useCallback(async () => {
    setCargandoTabla(true);
    setSelectedUserIds([]);
    try {
      const { resp, json } = await obtenerUsuariosSistema(vistaActual);

      if (resp.ok && json.ok) {
        const usuariosRaw = (json.usuarios || []) as unknown as UsuarioSistema[];

        const usuariosConTipo: UsuarioSistema[] = usuariosRaw.map((u) => ({
          ...u,
          tipo_tabla: vistaActual,
        }));

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
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleToggleVista = (vista: "APP" | "ADMIN") => {
    setVistaActual(vista);
  };

  const toggleSelect = (id: number) => {
    if (!isSelectionModeActive) return;
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleModeChange = (mode: "DELETE" | "BLOCK" | "UNBLOCK" | "NONE") => {
    if (mode === "NONE") {
      setIsSelectionModeActive(false);
      setSelectedUserIds([]);
    } else {
      setIsSelectionModeActive(true);
      setSelectedUserIds([]);
    }
    setCurrentMode(mode);
  };

  const handleDeleteSelected = async () => {
    if (selectedUserIds.length === 0) {
      alert("No hay usuarios seleccionados para eliminar.");
      return;
    }
    if (
      !window.confirm("¿Seguro que deseas eliminar los usuarios seleccionados?")
    ) {
      return;
    }

    try {
      const usersPayload = selectedUserIds.map((id) => {
        const user = listaUsuarios.find((u) => u.id === id);
        return { id, tipo: user?.tipo_tabla || "APP" };
      });

      const { resp, json } = await eliminarUsuariosSeleccionados(usersPayload);
      if (!resp.ok) {
        alert(json.message || "Error al eliminar usuarios.");
        return;
      }

      alert(json.message || "Usuarios eliminados correctamente.");
      await fetchUsuarios();
    } catch (error) {
      console.error("Error al eliminar usuarios:", error);
      alert("Error de conexión al eliminar usuarios.");
    }
  };

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
        blockReason.trim()
      );

      if (!resp.ok) {
        alert(json.message || "Error al bloquear/desbloquear usuarios.");
        return;
      }

      alert(json.message || "Acción realizada correctamente.");
      setShowBlockModal(false);
      setSelectedUserIds([]);
      setIsSelectionModeActive(false);
      setCurrentMode("NONE");
      await fetchUsuarios();
    } catch (error) {
      console.error("Error al bloquear/desbloquear usuarios:", error);
      alert("Error de conexión.");
    } finally {
      setBlockActionLoading(false);
    }
  };

  const handleRowClick = async (user: UsuarioSistema) => {
    if (isSelectionModeActive) {
      toggleSelect(user.id);
      return;
    }

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
          (detailJson.user ||
            detailJson.usuario ||
            detailJson.data) as unknown as UserDetails | undefined;

        if (rawUser) {
          setUserDetails(rawUser);
        }
      }

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingModal(false);
    }
  };

  const handleParteClick = async (parteId: number) => {
    try {
      setParteDetailTab("INFO");
      const { resp, json } = await obtenerPartePorIdAdmin(parteId);

      if (!resp.ok) {
        alert(json.message || "Error al obtener detalle de parte.");
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

      const parteCruda = rawBase as unknown as ParteVirtual;

      const archivosCrudos: RawArchivoParte[] = json.archivos || [];
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

          return {
            id: a.id ?? idx + 1,
            tipo: esVideo ? "video" : "foto",
            ruta,
            nombre_original: nombre,
          };
        });

        parteCruda.fotos = mapeados.filter((m) => m.tipo === "foto");
        parteCruda.videos = mapeados.filter((m) => m.tipo === "video");
      }

      setSelectedParteDetail(parteCruda);
    } catch (error) {
      console.error("Error al cargar detalle de parte:", error);
      alert("Error de conexión al cargar detalle.");
    }
  };

  // --- RENDER TABLA DE USUARIOS ---
  const renderUserRow = (user: UsuarioSistema, index: number) => {
    const isSelected = selectedUserIds.includes(user.id);
    const isBlocked = user.estado === "BLOQUEADO";
    return (
      <tr
        key={user.id}
        style={{
          ...(index % 2 === 0 ? {} : { backgroundColor: "#f9f9f9" }),
          ...(isBlocked ? styles.blockedRow : {}),
          ...(isSelectionModeActive ? styles.rowHover : {}),
        }}
        onClick={() => handleRowClick(user)}
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
          {user.estado || "-"}
          {user.estado === "BLOQUEADO" && (
            <span style={styles.bloqueadoLabel}>
              {" "}
              (Motivo: {user.bloqueo_motivo || "No especificado"})
            </span>
          )}
        </td>
      </tr>
    );
  };

  // --- RENDER DETALLE DE USUARIO (CV) ---
  const renderUserDetails = () => {
    if (!userDetails) return null;

    const rawFoto =
      userDetails.foto_ruta ??
      userDetails.foto ??
      userDetails.fotoPerfil ??
      userDetails.foto_perfil ??
      "";

    const fotoUrl = rawFoto ? getFotoUrl(String(rawFoto)) : "";

    const nombreMostrado =
      userDetails.nombres || userDetails.nombre || userDetails.usuario || "";

    const rolMostrado = userDetails.rol || userDetails.cargo || "-";

    return (
      <div style={styles.detailsContainer}>
        <div style={styles.detailsHeader}>
          <div>
            <div style={styles.detailsHeaderName}>{nombreMostrado}</div>
            <div style={styles.detailsHeaderTag}>
              ID Usuario: <strong>{userDetails.id}</strong>
            </div>
          </div>

          <div style={styles.detailsHeaderChip}>
            {typeof rolMostrado === "string"
              ? rolMostrado.toUpperCase()
              : rolMostrado}
          </div>
        </div>

        <div style={styles.detailsBody}>
          <div style={styles.detailsLeft}>
            <div style={styles.detailsSection}>
              <div style={styles.detailsSectionTitle}>Identidad</div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Usuario:</span>
                <span>
                  {userDetails.nombre_usuario || userDetails.usuario || "-"}
                </span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>DNI:</span>
                <span>{userDetails.dni || "-"}</span>
              </div>
            </div>

            <div style={styles.detailsSection}>
              <div style={styles.detailsSectionTitle}>Contacto</div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Celular:</span>
                <span>{userDetails.celular || "-"}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Correo:</span>
                <span>{userDetails.correo || "-"}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Dirección:</span>
                <span>{userDetails.direccion || "-"}</span>
              </div>
            </div>

            <div style={styles.detailsSection}>
              <div style={styles.detailsSectionTitle}>Puesto</div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Cargo:</span>
                <span>{userDetails.cargo || rolMostrado || "-"}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Estado:</span>
                <span>{userDetails.estado || "-"}</span>
              </div>
              <div style={styles.detailsRow}>
                <span style={styles.detailsLabel}>Fecha creación:</span>
                <span>{userDetails.creado_en || "-"}</span>
              </div>
            </div>
          </div>

          <div style={styles.detailsPhotoWrapper}>
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={String(nombreMostrado)}
                style={styles.detailsAvatar}
              />
            ) : (
              <div style={styles.detailsAvatarPlaceholder}>Sin foto</div>
            )}
            <div style={styles.detailsPhotoLabel}>Foto de perfil</div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER DETALLE DE PARTE ---
  const renderParteDetail = () => {
    if (!selectedParteDetail) return null;

    const p = selectedParteDetail;

    const fechaMostrada = p.fecha || p.creado_en || "-";

  const incidenciaMostrada =
    p.sumilla ||               // <-- aquí la incidencia real
    p.incidencia ||
    p.incidencia_nombre ||
    p.incidencia_detalle ||
    p.tipo ||
    p.descripcion ||
    "-";

  const origenMostrado =
    p.asunto ||                // <-- aquí el origen de atención real
    p.origen_atencion ||
   p.origenAtencion ||
    p.origen_atencion_nombre ||
    "-";


    return (
      <div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>ID Parte:</span>
          <span>{p.id}</span>
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Fecha:</span>
          <span>{fechaMostrada}</span>
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
          <span>{p.lugar || p.ubicacion_exacta || "-"}</span>
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Hora inicio:</span>
          <span>{p.hora_inicio || "-"}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Hora fin:</span>
          <span>{p.hora_fin || "-"}</span>
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Unidad:</span>
          <span>
            {(p.unidad_tipo || "").toString()}{" "}
            {(p.unidad_numero || "").toString()}
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
          <span style={styles.detailsLabel}>Incidencia:</span>
          <span>{incidenciaMostrada}</span>
        </div>
        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Origen de atención:</span>
          <span>{origenMostrado}</span>
        </div>

        <div style={styles.detailsRow}>
          <span style={styles.detailsLabel}>Ocurrencia:</span>
          <span>{p.ocurrencia || p.parte_fisico || p.descripcion || "-"}</span>
        </div>

      <div style={styles.detailsRow}>
    <span style={styles.detailsLabel}>Supervisor Zonal:</span>
    <span>{p.supervisor_zonal || p.sup_zonal || "-"}</span>
  </div>
  <div style={styles.detailsRow}>
    <span style={styles.detailsLabel}>Supervisor General:</span>
    <span>{p.supervisor_general || p.sup_general || "-"}</span>

        </div>
      </div>
    );
  };

  const renderParteMultimedia = () => {
    if (!selectedParteDetail) return null;

    const fotos = selectedParteDetail.fotos || [];
    const videos = selectedParteDetail.videos || [];
    const tieneArchivos = fotos.length > 0 || videos.length > 0;

    if (!tieneArchivos) {
      return <p>Este parte no tiene archivos multimedia.</p>;
    }

    const todos: ParteArchivo[] = [
      ...fotos.map((f) => ({ ...f, tipo: "foto" as const })),
      ...videos.map((v) => ({ ...v, tipo: "video" as const })),
    ];

    return (
      <div style={styles.multimediaGrid}>
        {todos.map((archivo) => (
          <div key={archivo.id} style={styles.multimediaItem}>
            {archivo.tipo === "foto" ? (
              <img
                src={getFotoUrl(archivo.ruta)}
                alt={archivo.nombre_original}
                style={styles.multimediaImage}
              />
            ) : (
              <video
                controls
                src={getFotoUrl(archivo.ruta)}
                style={styles.multimediaVideo}
              />
            )}
            <div style={styles.multimediaName}>{archivo.nombre_original}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        Panel de Administración –{" "}
        <span style={styles.usernameHighlight}>{userName}</span>
      </h2>

      <ControlPanel
        userName={userName}
        selectedUserCount={selectedUserIds.length}
        isSelectionModeActive={isSelectionModeActive}
        currentMode={currentMode}
        currentUserTarget={vistaActual}
        onUserTargetChange={handleToggleVista}
        onSelectModeChange={handleModeChange}
        onDeleteUsers={handleDeleteSelected}
        onOpenBlockModal={handleOpenBlockModal}
        onLogout={handleLogout}
        onBack={handleBack}
      />

      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <button
            style={styles.filterButton}
            onClick={() => setVistaActual("APP")}
          >
            Usuarios APP
          </button>
          <button
            style={styles.filterButtonSecondary}
            onClick={() => setVistaActual("ADMIN")}
          >
            Usuarios ADMIN
          </button>
        </div>
        <div style={styles.filterGroup}>
          {isSelectionModeActive && (
            <span style={styles.selectionInfo}>
              Seleccionados: {selectedUserIds.length}
            </span>
          )}
          <button
            style={styles.secondaryButton}
            onClick={() =>
              handleModeChange(
                isSelectionModeActive ? "NONE" : currentMode || "DELETE"
              )
            }
          >
            {isSelectionModeActive ? "Salir modo selección" : "Modo selección"}
          </button>
          {currentMode === "DELETE" && (
            <button style={styles.dangerButton} onClick={handleDeleteSelected}>
              Eliminar seleccionados
            </button>
          )}
          {(currentMode === "BLOCK" || currentMode === "UNBLOCK") && (
            <button style={styles.blockButton} onClick={handleOpenBlockModal}>
              {currentMode === "BLOCK"
                ? "Bloquear seleccionados"
                : "Desbloquear seleccionados"}
            </button>
          )}
        </div>
      </div>

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
                  No hay usuarios para mostrar.
                </td>
              </tr>
            ) : (
              listaUsuarios.map((user, index) => renderUserRow(user, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalles usuario */}
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
                  setUserDetails(null);
                  setUsuarioPartes([]);
                  setSelectedParteDetail(null);
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
                  <>
                    <div style={styles.partesList}>
                      {usuarioPartes.length === 0 ? (
                        <p>Este usuario no tiene partes registrados.</p>
                      ) : (
                        usuarioPartes.map((parte) => {
  const resumenIncidencia =
    parte.sumilla ||                 // <-- Incidencia real
    parte.incidencia ||
    parte.incidencia_nombre ||
    parte.incidencia_detalle ||
    parte.tipo ||
    parte.descripcion ||
    "Sin tipo";

                          const resumenUbicacion = [
                            parte.sector && `Sector ${parte.sector}`,
                            parte.zona && `Zona ${parte.zona}`,
                            parte.turno && parte.turno,
                          ]
                            .filter(Boolean)
                            .join(" / ");

                          return (
                            <div
                              key={parte.id}
                              style={{
                                ...styles.parteItem,
                                ...(hoveredParteId === parte.id
                                  ? styles.parteItemHover
                                  : {}),
                              }}
                              onMouseEnter={() => setHoveredParteId(parte.id)}
                              onMouseLeave={() => setHoveredParteId(null)}
                              onClick={() => handleParteClick(parte.id)}
                            >
                              Parte ID: {parte.id} – {resumenIncidencia} –{" "}
                              {resumenUbicacion || "Sin ubicación"}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {selectedParteDetail && (
                      <>
                        {parteDetailTab === "INFO" && renderParteDetail()}
                        {parteDetailTab === "MULTIMEDIA" &&
                          renderParteMultimedia()}

                        {/* Botón para cambiar de vista Información <-> Multimedia */}
                        <div style={styles.modalButtonsRow}>
                          {parteDetailTab === "INFO" ? (
                            <button
                              style={styles.secondaryButton}
                              onClick={() => setParteDetailTab("MULTIMEDIA")}
                            >
                              Ver contenido multimedia
                            </button>
                          ) : (
                            <button
                              style={styles.secondaryButton}
                              onClick={() => setParteDetailTab("INFO")}
                            >
                              Volver a información
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <div style={styles.modalButtonsRow}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  setShowDetailsModal(false);
                  setUserDetails(null);
                  setUsuarioPartes([]);
                  setSelectedParteDetail(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de bloqueo */}
      {showBlockModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Bloquear / Desbloquear usuarios</h3>
              <button
                style={styles.closeButton}
                onClick={() => setShowBlockModal(false)}
              >
                ✕
              </button>
            </div>
            <p>
              Usuarios seleccionados: <strong>{selectedUserIds.length}</strong>
            </p>

            <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
              <label>
                Motivo (solo se requiere para bloqueo):
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: "60px",
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                  }}
                />
              </label>
            </div>

            <div style={styles.modalButtonsRow}>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowBlockModal(false)}
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
};

export default Profile;
