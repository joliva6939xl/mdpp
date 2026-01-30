import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Componentes
import ControlPanel from "../components/ControlPanel";
import { UserDetailsModal } from "../components/UserDetailsModal";
import { InternalCenterLoginModal } from "../components/InternalCenterLoginModal";
import CallCenterDashboard from "../components/CallCenterDashboard";

// Importar Tipos explícitamente
import type { SelectionMode } from "../components/ControlPanel";
import { adminService } from "../services/adminService";
import type {
  UserTarget,
  UsuarioPayload,
  UsuarioSistema,
  ServiceResponse
} from "../services/adminService";

import { mapUsuarioDetalleToModal, mapUsuarioTablaToModal, type UsuarioApp } from "../utils/mapUsuarioModal";

// ==========================================
// 1. DEFINICIONES DE CONTRATOS
// ==========================================

interface IUIService {
  alert(msg: string): void;
  confirm(msg: string): boolean;
}

interface ILogger {
  error(msg: string, meta?: unknown): void;
  info(msg: string): void;
}

interface IAdminService {
  obtenerUsuariosSistema(target: UserTarget, signal?: AbortSignal): Promise<ServiceResponse<UsuarioSistema[]>>;
  obtenerUsuarioDetallesAdmin(id: number, signal?: AbortSignal): Promise<ServiceResponse<unknown>>;
  eliminarUsuariosSeleccionados(payload: UsuarioPayload[]): Promise<ServiceResponse<unknown>>;
  bloqueoUsuarios(ids: number[], action: "BLOCK" | "UNBLOCK", motivo?: string): Promise<ServiceResponse<unknown>>;
}

interface HttpError {
  status?: number;
  response?: { status?: number };
  message?: string;
}

// ==========================================
// 2. UTILS
// ==========================================

const isDev = import.meta.env?.DEV ?? false;

const defaultLogger: ILogger = {
  error: (msg, meta) => { if (isDev) console.error(`[Profile] ❌ ${msg}`, meta); },
  info: (msg) => { if (isDev) console.info(`[Profile] ℹ️ ${msg}`); }
};

const defaultUIService: IUIService = {
  alert: (msg) => window.alert(msg),
  confirm: (msg) => window.confirm(msg),
};

const normalizeUsers = (data: unknown[], target: UserTarget): UsuarioSistema[] => {
  if (!Array.isArray(data)) return [];
  
  return data.map((item) => {
    const u = item as Record<string, unknown>;
    return {
      id: Number(u.id),
      usuario: String(u.usuario || u.nombre_usuario || ""),
      nombre: String(u.nombre || u.nombres || ""),
      rol: String(u.rol || "AGENTE"),
      dni: u.dni ? String(u.dni) : undefined,
      estado: (u.estado as "ACTIVO" | "BLOQUEADO") || "ACTIVO",
      tipo_tabla: target,
      creado_en: u.creado_en ? String(u.creado_en) : undefined
    };
  });
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================

interface ProfileProps {
  service?: IAdminService; 
  ui?: IUIService;
  logger?: ILogger;
}

type InternalCenterInfo = { nombre: string; roperoCentralTurno: string; };

interface LocationState {
  username?: string;
  role?: string;
}

const Profile: React.FC<ProfileProps> = ({
  service = adminService as unknown as IAdminService,
  ui = defaultUIService,
  logger = defaultLogger
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // --- Refs ---
  const activeRequestRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // --- Estado de Sesión ---
  const userName = state?.username || localStorage.getItem("adminUser") || "ADMIN";
  const userRole = state?.role || localStorage.getItem("adminRole") || "";
  const esCallCenter = String(userRole).toUpperCase().includes("CALL CENTER") || String(userName).toUpperCase() === "CCENTER";

  // --- Estados de Datos ---
  const [vistaActual, setVistaActual] = useState<UserTarget>("APP");
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  
  // Estado UI
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // 🔥 Trigger manual para recargar sin dependencias circulares
  const [reloadKey, setReloadKey] = useState(0);

  // --- Estados de Acción Masiva ---
  const [currentMode, setCurrentMode] = useState<SelectionMode>("NONE");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isGlobalBusy, setIsGlobalBusy] = useState(false);

  // --- Modales ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioApp | null>(null);
  const [showInternalCenterModal, setShowInternalCenterModal] = useState(false);

  // --- Persistencia Call Center ---
  const sessionKeyOk = "ccenter_internal_ok";
  const [internalOK, setInternalOK] = useState<boolean>(() => sessionStorage.getItem(sessionKeyOk) === "1");
  const [internalInfo, setInternalInfo] = useState<InternalCenterInfo | null>(() => {
    const ok = sessionStorage.getItem(sessionKeyOk) === "1";
    if (!ok) return null;
    return {
      nombre: sessionStorage.getItem("ccenter_nombre") || "",
      roperoCentralTurno: sessionStorage.getItem("ccenter_ropero_turno") || ""
    };
  });

  // ==========================================
  // MANEJO DE ERRORES TIPADO
  // ==========================================
  const handleAuthError = useCallback(() => {
    ui.alert("Tu sesión ha expirado.");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  }, [navigate, ui]);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof Error && err.name === 'AbortError') return;
    logger.error("Error operativo", err);
    
    const httpErr = err as HttpError;
    const statusVal = httpErr.status || httpErr.response?.status;

    if (statusVal === 401 || statusVal === 403) {
      handleAuthError();
    } else {
      setErrorMsg("No se pudieron cargar los datos. Intenta nuevamente.");
      setStatus('error');
    }
  }, [handleAuthError, logger]);

  // ==========================================
  // CARGA DE DATOS (CORREGIDA SIN BUCLE)
  // ==========================================
  
  const fetchUsuarios = useCallback(async () => {
    if (esCallCenter) return;

    // Cancelar petición anterior
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }
    
    const controller = new AbortController();
    activeRequestRef.current = controller;

    setStatus('loading');
    setErrorMsg(null);

    try {
      const { resp, json, success } = await service.obtenerUsuariosSistema(vistaActual, controller.signal);

      if (!isMountedRef.current) return;
      if (controller.signal.aborted) return;

      if (success && resp?.ok) {
        const raw = (json.usuarios || json.data || []) as unknown[];
        const normalized = normalizeUsers(raw, vistaActual);
        setListaUsuarios(normalized);
        setStatus('success');
      } else {
        if (resp?.status === 401) handleAuthError();
        else {
          setErrorMsg(json.message || "Error al obtener datos");
          setStatus('error');
        }
      }
    } catch (error) {
      if (isMountedRef.current) handleError(error);
    } finally {
      if (isMountedRef.current && activeRequestRef.current === controller) {
         // No seteamos status aquí para evitar parpadeos o bucles secundarios
         activeRequestRef.current = null;
      }
    }
    
    // 🛑 CORRECTO: 'status' NO está en las dependencias. ¡Adiós Bucle!
  }, [vistaActual, esCallCenter, service, handleAuthError, handleError]); 

  // ==========================================
  // EFECTO PRINCIPAL (TRIGGERS)
  // ==========================================
  
  useEffect(() => {
    isMountedRef.current = true;
    fetchUsuarios();
    
    return () => { 
      isMountedRef.current = false;
      if (activeRequestRef.current) activeRequestRef.current.abort();
    };
    
    // 🛑 CORRECTO: Solo reacciona si cambia la vista ('APP'/'ADMIN') o si forzamos recarga (reloadKey)
    // fetchUsuarios es estable gracias al useCallback corregido
  }, [fetchUsuarios, reloadKey]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const toggleUserSelection = useCallback((id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleRowClick = useCallback(async (user: UsuarioSistema) => {
    if (currentMode !== "NONE") {
      toggleUserSelection(user.id);
      return;
    }
    
    if (esCallCenter) return;

    setUsuarioModal(mapUsuarioTablaToModal(user)); 
    setShowDetailsModal(true);

    try {
      const { success, json } = await service.obtenerUsuarioDetallesAdmin(user.id);
      if (success) {
        const jsonTyped = json as { data?: unknown; user?: unknown };
        const raw = jsonTyped.data || jsonTyped.user;
        
        if (raw && isMountedRef.current) {
          setUsuarioModal(mapUsuarioDetalleToModal(raw as Record<string, unknown>, user));
        }
      }
    } catch (error) {
      logger.error("Fallo carga detalle", error);
    }
  }, [currentMode, esCallCenter, toggleUserSelection, service, logger]);

  const handleExecuteMassAction = useCallback(async () => {
    if (selectedUserIds.length === 0) return;
    
    setIsGlobalBusy(true);
    try {
      let result;
      if (currentMode === "DELETE") {
        const payload: UsuarioPayload[] = selectedUserIds.map(id => {
            const u = listaUsuarios.find(user => user.id === id);
            return { id, tipo: u?.tipo_tabla || vistaActual };
        });
        result = await service.eliminarUsuariosSeleccionados(payload);
      } else {
        const action = currentMode === "BLOCK" ? "BLOCK" : "UNBLOCK";
        result = await service.bloqueoUsuarios(selectedUserIds, action);
      }

      if (result?.success) {
        ui.alert("Acción realizada con éxito");
        setSelectedUserIds([]);
        setCurrentMode("NONE");
        setReloadKey(prev => prev + 1); // ✅ Recarga segura usando el key
      } else {
        ui.alert(`Error: ${result?.json.message}`);
      }
    } catch (error) {
      logger.error("Error masivo", error);
      ui.alert("Hubo un error de conexión.");
    } finally {
      if (isMountedRef.current) setIsGlobalBusy(false);
    }
  }, [selectedUserIds, currentMode, listaUsuarios, vistaActual, service, ui, logger]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/");
  }, [navigate]);

  const handleConfirmInternal = (data: InternalCenterInfo) => {
    sessionStorage.setItem(sessionKeyOk, "1");
    sessionStorage.setItem("ccenter_nombre", data.nombre);
    sessionStorage.setItem("ccenter_ropero_turno", data.roperoCentralTurno);
    setInternalInfo(data);
    setInternalOK(true);
    setShowInternalCenterModal(false);
  };

  const handleUserCreated = useCallback(() => {
      setReloadKey(prev => prev + 1); // ✅ Callback estable para ControlPanel
  }, []);

  // ==========================================
  // RENDERIZADO
  // ==========================================
  const styles = {
    container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
    tableCard: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: { background: '#f1f5f9', color: '#475569', fontWeight: '700', padding: '15px', textAlign: 'left' as const, fontSize: '12px', textTransform: 'uppercase' as const, borderBottom: '1px solid #e2e8f0' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '14px' },
    row: { cursor: 'pointer', transition: 'background 0.2s' },
    badge: (estado: string) => ({
      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
      background: estado === 'ACTIVO' ? '#dcfce7' : '#fee2e2',
      color: estado === 'ACTIVO' ? '#166534' : '#991b1b'
    }),
    loadingContainer: { padding: 40, textAlign: 'center' as const, color: '#64748b' },
    errorContainer: { padding: 40, textAlign: 'center' as const, color: '#ef4444', fontWeight: 600 },
    retryBtn: { marginTop: 10, padding: '8px 16px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }
  };

  return (
    <div style={styles.container}>
      {!esCallCenter && (
        <>
          <ControlPanel
            userName={userName}
            selectedUserCount={selectedUserIds.length}
            isSelectionModeActive={currentMode !== "NONE"}
            currentMode={currentMode}
            currentUserTarget={vistaActual}
            isGlobalBusy={isGlobalBusy}
            
            onUserTargetChange={(t) => { setVistaActual(t); setCurrentMode("NONE"); setSelectedUserIds([]); }}
            onSelectModeChange={(m) => { setCurrentMode(m); setSelectedUserIds([]); }}
            onExecuteAction={handleExecuteMassAction}
            onLogout={handleLogout}
            onBack={() => navigate("/")}
            onUserCreated={handleUserCreated}
          />

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {currentMode !== "NONE" && <th style={{...styles.th, width: 40, textAlign:'center'}}>✔</th>}
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>DNI</th>
                  <th style={styles.th}>Creado</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {status === 'loading' && listaUsuarios.length === 0 ? (
                  <tr><td colSpan={8} style={styles.loadingContainer}>Cargando datos...</td></tr>
                ) : status === 'error' ? (
                  <tr>
                    <td colSpan={8} style={styles.errorContainer}>
                      {errorMsg}
                      <br/>
                      <button style={styles.retryBtn} onClick={() => setReloadKey(p => p + 1)}>Reintentar</button>
                    </td>
                  </tr>
                ) : listaUsuarios.length === 0 ? (
                  <tr><td colSpan={8} style={styles.loadingContainer}>No hay usuarios.</td></tr>
                ) : (
                  listaUsuarios.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <tr 
                        key={u.id} 
                        style={{...styles.row, background: isSelected ? '#eff6ff' : 'white'}}
                        onClick={() => handleRowClick(u)}
                      >
                        {currentMode !== "NONE" && (
                          <td style={{...styles.td, textAlign:'center'}}>
                            <input type="checkbox" checked={isSelected} readOnly style={{cursor:'pointer'}} />
                          </td>
                        )}
                        <td style={{...styles.td, fontWeight:'bold', color: '#1e3a8a'}}>#{u.id}</td>
                        <td style={styles.td}>{u.usuario}</td>
                        <td style={styles.td}>{u.rol}</td>
                        <td style={styles.td}>{u.nombre}</td>
                        <td style={styles.td}>{u.dni || "-"}</td>
                        <td style={styles.td}>{u.creado_en ? new Date(u.creado_en).toLocaleDateString() : "-"}</td>
                        <td style={styles.td}><span style={styles.badge(u.estado)}>{u.estado}</span></td>
                      </tr>
                    );
                  })
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

      {esCallCenter && (
        <>
          <InternalCenterLoginModal
            open={!internalOK || showInternalCenterModal}
            onConfirm={handleConfirmInternal}
            onLogout={handleLogout}
          />
          {internalOK && (
            <div style={{marginTop: 20}}>
              <CallCenterDashboard
                userName={userName}
                onBack={() => navigate("/")}
                onLogout={handleLogout}
                internoNombre={internalInfo?.nombre || ""}
                internoRoperoTurno={internalInfo?.roperoCentralTurno || ""}
                onOpenInternalLogin={() => setShowInternalCenterModal(true)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;