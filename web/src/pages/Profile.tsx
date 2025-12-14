// web/src/pages/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ControlPanel from "../components/ControlPanel";
import { UserDetailsModal } from "../components/UserDetailsModal";
import { InternalCenterLoginModal } from "../components/InternalCenterLoginModal";
// IMPORTANTE: Asegúrate de que la ruta sea correcta para tu proyecto
import CallCenterDashboard from "../components/CallCenterDashboard";

import {
  obtenerUsuariosSistema,
  obtenerUsuarioDetallesAdmin,
} from "../services/adminService";

import { profileStyles as styles } from "./Profile.styles";
import type { UsuarioSistema } from "../types/admin";

import {
  mapUsuarioDetalleToModal,
  mapUsuarioTablaToModal,
  type UsuarioApp,
} from "../utils/mapUsuarioModal";

type InternalCenterInfo = {
  nombre: string;
  roperoCentralTurno: string;
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userName =
    location.state?.username ||
    localStorage.getItem("adminUser") ||
    "ADMIN";

  const userRole =
    (location.state?.role as string | undefined) ||
    localStorage.getItem("adminRole") ||
    "";

  const esCallCenter =
    String(userRole).toUpperCase().includes("CALL CENTER") ||
    String(userName).toUpperCase() === "CCENTER";

  const [vistaActual, setVistaActual] = useState<"APP" | "ADMIN">("APP");
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  const [cargandoTabla, setCargandoTabla] = useState(false);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioApp | null>(null);

  // Estado para controlar la apertura manual del modal interno
  const [showInternalCenterModal, setShowInternalCenterModal] = useState(false);

  const sessionKeyOk = "ccenter_internal_ok";
  const sessionKeyNombre = "ccenter_nombre";
  const sessionKeyRopero = "ccenter_ropero_turno";

  const [internalOK, setInternalOK] = useState<boolean>(() => {
    return sessionStorage.getItem(sessionKeyOk) === "1";
  });

  const [internalInfo, setInternalInfo] = useState<InternalCenterInfo | null>(
    () => {
      const ok = sessionStorage.getItem(sessionKeyOk) === "1";
      if (!ok) return null;

      const nombre = sessionStorage.getItem(sessionKeyNombre) || "";
      const roperoCentralTurno = sessionStorage.getItem(sessionKeyRopero) || "";

      if (!nombre || !roperoCentralTurno) return null;
      return { nombre, roperoCentralTurno };
    }
  );

  const fetchUsuarios = useCallback(async () => {
    if (esCallCenter) return;

    setCargandoTabla(true);
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
  }, [vistaActual, esCallCenter]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminId");

    sessionStorage.removeItem(sessionKeyOk);
    sessionStorage.removeItem(sessionKeyNombre);
    sessionStorage.removeItem(sessionKeyRopero);

    navigate("/");
  };

  const handleBack = () => navigate("/");

  const handleRowClick = async (user: UsuarioSistema) => {
    if (esCallCenter) return;

    setUsuarioModal(mapUsuarioTablaToModal(user));
    setShowDetailsModal(true);

    try {
      const { resp, json } = await obtenerUsuarioDetallesAdmin(user.id);
      if (!resp.ok) return;

      const raw = json.user || json.usuario || json.data || null;
      if (!raw) return;

      setUsuarioModal(mapUsuarioDetalleToModal(raw, user));
    } catch (error) {
      console.error(error);
    }
  };

  const renderUserRow = (user: UsuarioSistema, index: number) => {
    const isBlocked = user.estado === "BLOQUEADO";
    return (
      <tr
        key={user.id}
        style={{
          ...(index % 2 === 0 ? {} : { backgroundColor: "#f9f9f9" }),
          ...(isBlocked ? styles.blockedRow : {}),
          cursor: "pointer",
        }}
        onClick={() => handleRowClick(user)}
      >
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

  const handleConfirmInternal = (data: InternalCenterInfo) => {
    sessionStorage.setItem(sessionKeyOk, "1");
    sessionStorage.setItem(sessionKeyNombre, data.nombre);
    sessionStorage.setItem(sessionKeyRopero, data.roperoCentralTurno);

    setInternalInfo(data);
    setInternalOK(true);
    // Cerramos el modal en caso de que se haya abierto manualmente
    setShowInternalCenterModal(false);
  };

  const renderBottomRightLabel = () => {
    if (!esCallCenter || !internalOK || !internalInfo) return null;

    return (
      <div
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,.12)",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 10px 24px rgba(0,0,0,.12)",
          zIndex: 9998,
          minWidth: 260,
        }}
      >
        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
          Datos internos (CALL CENTER)
        </div>

        <div style={{ fontSize: 13, marginBottom: 4 }}>
          <strong>Nombre:</strong> {internalInfo.nombre}
        </div>

        <div style={{ fontSize: 13 }}>
          <strong>Ropero Turno:</strong> {internalInfo.roperoCentralTurno}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>
        Panel de Administración –{" "}
        <span style={styles.usernameHighlight}>{userName}</span>
      </h2>

      {/* ADMIN normal */}
      {!esCallCenter && (
        <>
          <ControlPanel
            userName={userName}
            selectedUserCount={0}
            isSelectionModeActive={false}
            currentMode={"NONE"}
            currentUserTarget={vistaActual}
            onUserTargetChange={setVistaActual}
            onSelectModeChange={() => {}}
            onDeleteUsers={() => {}}
            onOpenBlockModal={() => {}}
            onLogout={handleLogout}
            onBack={handleBack}
          />

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
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
                    <td colSpan={7} style={styles.td}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : listaUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={styles.td}>
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                ) : (
                  listaUsuarios.map((u, i) => renderUserRow(u, i))
                )}
              </tbody>
            </table>
          </div>

          <UserDetailsModal
            open={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            usuario={usuarioModal}
          />
        </>
      )}

      {/* CALL CENTER */}
      {esCallCenter && (
        <>
          {/* El modal se abre si no hay login OK O si se pide explícitamente */}
          <InternalCenterLoginModal
            open={!internalOK || showInternalCenterModal}
            onConfirm={handleConfirmInternal}
            onLogout={handleLogout}
          />

          {internalOK && (
            <div style={{ marginTop: 18 }}>
              {/* Aquí renderizamos tu nuevo componente Dashboard */}
              <CallCenterDashboard
                userName={userName}
                onBack={handleBack}
                onLogout={handleLogout}
                internoNombre={internalInfo?.nombre || ""}
                internoRoperoTurno={internalInfo?.roperoCentralTurno || ""}
                onOpenInternalLogin={() => setShowInternalCenterModal(true)}
              />
            </div>
          )}
        </>
      )}

      {renderBottomRightLabel()}
    </div>
  );
};

export default Profile;