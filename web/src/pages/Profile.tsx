import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Componentes
import ControlPanel from "../components/ControlPanel";
import { UserDetailsModal } from "../components/UserDetailsModal";
import { InternalCenterLoginModal } from "../components/InternalCenterLoginModal";
import CallCenterDashboard from "../components/CallCenterDashboard";

// Tipos
import type { SelectionMode } from "../components/ControlPanel";
import { adminService } from "../services/adminService";
import type {
  UserTarget,
  UsuarioPayload,
  UsuarioSistema
} from "../services/adminService";

import { mapUsuarioDetalleToModal, mapUsuarioTablaToModal, type UsuarioApp } from "../utils/mapUsuarioModal";

// ==========================================
// 1. UTILS
// ==========================================

const isDev = import.meta.env?.DEV ?? false;

interface ILogger { error(msg: string, meta?: unknown): void; info(msg: string): void; }
interface IUIService { alert(msg: string): void; confirm(msg: string): boolean; prompt(msg: string, def?: string): string | null; }

interface HttpError { status?: number; response?: { status?: number }; message?: string; name?: string; }

const defaultLogger: ILogger = {
  error: (msg, meta) => { if (isDev) console.error(`[Profile] ❌ ${msg}`, meta); },
  info: (msg) => { if (isDev) console.info(`[Profile] ℹ️ ${msg}`); }
};

const defaultUIService: IUIService = {
  alert: (msg) => window.alert(msg),
  confirm: (msg) => window.confirm(msg),
  prompt: (msg, def) => window.prompt(msg, def)
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
// 2. COMPONENTE PRINCIPAL
// ==========================================

interface ProfileProps { service?: unknown; ui?: IUIService; logger?: ILogger; }
type InternalCenterInfo = { nombre: string; roperoCentralTurno: string; };
interface LocationState { username?: string; role?: string; }

const Profile: React.FC<ProfileProps> = ({ ui = defaultUIService, logger = defaultLogger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const isMountedRef = useRef(true);
  const activeRequestRef = useRef<AbortController | null>(null);

  // --- Session ---
  const userName = state?.username || localStorage.getItem("adminUser") || "ADMIN";
  const userRole = state?.role || localStorage.getItem("adminRole") || "";
  const esCallCenter = String(userRole).toUpperCase().includes("CALL CENTER") || String(userName).toUpperCase() === "CCENTER";

  // --- Data State ---
  const [vistaActual, setVistaActual] = useState<UserTarget>("APP");
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioSistema[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // --- Selection State ---
  const [currentMode, setCurrentMode] = useState<SelectionMode>("NONE");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isGlobalBusy, setIsGlobalBusy] = useState(false);

  // --- Modals ---
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [usuarioModal, setUsuarioModal] = useState<UsuarioApp | null>(null);
  const [showInternalCenterModal, setShowInternalCenterModal] = useState(false);
  const [internalOK, setInternalOK] = useState<boolean>(() => sessionStorage.getItem("ccenter_internal_ok") === "1");
  const [internalInfo, setInternalInfo] = useState<InternalCenterInfo | null>(() => {
    return sessionStorage.getItem("ccenter_internal_ok") === "1" ? {
      nombre: sessionStorage.getItem("ccenter_nombre") || "",
      roperoCentralTurno: sessionStorage.getItem("ccenter_ropero_turno") || ""
    } : null;
  });

  const triggerReload = useCallback(() => setReloadKey(p => p + 1), []);

  // ==========================================
  // DATA FETCHING (NO LOOP)
  // ==========================================
  useEffect(() => {
    if (esCallCenter) return;
    if (activeRequestRef.current) activeRequestRef.current.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    const fetchData = async () => {
      setStatus('loading');
      setErrorMsg(null);
      try {
        const { resp, json, success } = await adminService.obtenerUsuariosSistema(vistaActual, controller.signal);
        if (!isMountedRef.current || controller.signal.aborted) return;

        if (success && resp?.ok) {
           const raw = (json.usuarios || json.data || []) as unknown[];
           setListaUsuarios(normalizeUsers(raw, vistaActual));
           setStatus('success');
        } else {
           if (resp?.status === 401) { ui.alert("Sesión expirada"); localStorage.clear(); navigate("/"); }
           else { setErrorMsg(json.message || "Error"); setStatus('error'); }
        }
      } catch (err: unknown) { 
        if (!isMountedRef.current) return;
        const error = err as HttpError;
        if (error.name !== 'AbortError') {
             logger.error("Fetch error", error); 
             setErrorMsg("Error de conexión"); 
             setStatus('error');
        }
      } finally {
        if (isMountedRef.current && activeRequestRef.current === controller) activeRequestRef.current = null;
      }
    };
    fetchData();
    return () => { if (activeRequestRef.current) activeRequestRef.current.abort(); };
  }, [vistaActual, reloadKey, esCallCenter, navigate, ui, logger]); 

  // ==========================================
  // HANDLERS
  // ==========================================
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const toggleUserSelection = useCallback((id: number) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const handleRowClick = useCallback(async (user: UsuarioSistema) => {
    if (currentMode !== "NONE") return toggleUserSelection(user.id);
    if (esCallCenter) return;

    setUsuarioModal(mapUsuarioTablaToModal(user)); 
    setShowDetailsModal(true);
    try {
      const { success, json } = await adminService.obtenerUsuarioDetallesAdmin(user.id);
      if (success && isMountedRef.current) {
        const jsonTyped = json as { data?: unknown; user?: unknown };
        const raw = jsonTyped.data || jsonTyped.user;
        if (raw) setUsuarioModal(mapUsuarioDetalleToModal(raw as Record<string, unknown>, user));
      }
    } catch (e) { logger.error("Detalle error", e); }
  }, [currentMode, esCallCenter, toggleUserSelection, logger]);

  // 🔥 LÓGICA DE ACCIÓN MASIVA CORREGIDA 🔥
  const handleExecuteMassAction = useCallback(async () => {
    if (selectedUserIds.length === 0) {
        return ui.alert("⚠️ Por favor selecciona al menos un usuario de la lista.");
    }

    // 1. PREPARAR EL PAYLOAD (Array de Objetos {id, tipo})
    // Esto es vital porque el backend filtra por u.tipo === 'APP'
    const payload: UsuarioPayload[] = selectedUserIds.map(id => {
        const u = listaUsuarios.find(user => user.id === id);
        return { id, tipo: u?.tipo_tabla || vistaActual };
    });
    
    let motivo = "";
    
    if (currentMode === "BLOCK") {
        const input = ui.prompt("📝 Ingrese el motivo del bloqueo:", "Gestión administrativa");
        if (input === null) return;
        if (!input.trim()) return ui.alert("El motivo no puede estar vacío.");
        motivo = input;
    }

    if (currentMode === "DELETE") {
        const confirm = ui.confirm(`⚠️ ¿Estás seguro de ELIMINAR ${selectedUserIds.length} usuarios? Esta acción es irreversible.`);
        if (!confirm) return;
    }

    setIsGlobalBusy(true);
    try {
      let res;
      if (currentMode === "DELETE") {
        res = await adminService.eliminarUsuariosSeleccionados(payload);
      } else {
        const act = currentMode === "BLOCK" ? "BLOCK" : "UNBLOCK";
        // ✅ CORRECCIÓN: Enviamos el payload (objetos) en lugar de solo IDs
        res = await adminService.bloqueoUsuarios(payload, act, motivo);
      }

      if (res?.success) {
        ui.alert("✅ Operación exitosa.");
        setSelectedUserIds([]);
        setCurrentMode("NONE");
        triggerReload();
      } else {
        ui.alert(`❌ Error: ${res?.json.message || "Fallo en el servidor"}`);
      }
    } catch (e) { 
        logger.error("Mass action error", e);
        ui.alert("Error de red"); 
    } 
    finally { if (isMountedRef.current) setIsGlobalBusy(false); }
  }, [selectedUserIds, currentMode, listaUsuarios, vistaActual, ui, triggerReload, logger]);

  const handleLogout = () => { localStorage.clear(); sessionStorage.clear(); navigate("/"); };
  
  const handleConfirmInternal = (data: InternalCenterInfo) => {
    sessionStorage.setItem("ccenter_internal_ok", "1");
    sessionStorage.setItem("ccenter_nombre", data.nombre);
    sessionStorage.setItem("ccenter_ropero_turno", data.roperoCentralTurno);
    setInternalInfo(data); setInternalOK(true); setShowInternalCenterModal(false);
  };

  const s = {
    cont: { padding: '30px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Segoe UI' },
    card: { background: 'white', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e2e8f0' },
    th: { background: '#f1f5f9', color: '#475569', fontWeight: 700, padding: 15, textAlign: 'left' as const, fontSize: 12, borderBottom: '1px solid #e2e8f0' },
    td: { padding: 15, borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: 14 },
    row: { cursor: 'pointer', transition: 'background 0.2s' },
    badge: (st: string) => ({ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st === 'ACTIVO' ? '#dcfce7' : '#fee2e2', color: st === 'ACTIVO' ? '#166534' : '#991b1b' }),
    msg: { padding: 40, textAlign: 'center' as const, color: '#64748b' }
  };

  return (
    <div style={s.cont}>
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
            onSelectModeChange={(m) => { setCurrentMode(m); }}
            onExecuteAction={handleExecuteMassAction}
            onLogout={handleLogout}
            onBack={() => navigate("/")}
            onUserCreated={triggerReload}
          />
          <div style={s.card}>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {currentMode !== "NONE" && <th style={{...s.th, width:40, textAlign:'center'}}>✔</th>}
                  <th style={s.th}>ID</th><th style={s.th}>USUARIO</th><th style={s.th}>ROL</th>
                  <th style={s.th}>NOMBRE</th><th style={s.th}>DNI</th><th style={s.th}>CREADO</th><th style={s.th}>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {status === 'loading' && listaUsuarios.length === 0 ? ( <tr><td colSpan={8} style={s.msg}>Cargando...</td></tr> ) :
                 status === 'error' ? ( <tr><td colSpan={8} style={{...s.msg, color:'#ef4444'}}>{errorMsg} <button onClick={triggerReload}>Reintentar</button></td></tr> ) :
                 listaUsuarios.length === 0 ? ( <tr><td colSpan={8} style={s.msg}>No hay datos.</td></tr> ) :
                 listaUsuarios.map(u => {
                    const sel = selectedUserIds.includes(u.id);
                    return (
                      <tr key={u.id} style={{...s.row, background: sel ? '#eff6ff' : 'white'}} onClick={() => handleRowClick(u)}>
                        {currentMode !== "NONE" && <td style={{...s.td, textAlign:'center'}}><input type="checkbox" checked={sel} readOnly style={{cursor:'pointer'}}/></td>}
                        <td style={{...s.td, fontWeight:'bold', color:'#1e3a8a'}}>#{u.id}</td>
                        <td style={s.td}>{u.usuario}</td><td style={s.td}>{u.rol}</td>
                        <td style={s.td}>{u.nombre}</td><td style={s.td}>{u.dni || "-"}</td>
                        <td style={s.td}>{u.creado_en ? new Date(u.creado_en).toLocaleDateString() : "-"}</td>
                        <td style={s.td}><span style={s.badge(u.estado)}>{u.estado}</span></td>
                      </tr>
                    )
                 })}
              </tbody>
            </table>
          </div>
          <UserDetailsModal open={showDetailsModal} onClose={() => setShowDetailsModal(false)} usuario={usuarioModal} />
        </>
      )}
      {esCallCenter && (
        <>
          <InternalCenterLoginModal open={!internalOK || showInternalCenterModal} onConfirm={handleConfirmInternal} onLogout={handleLogout} />
          {internalOK && <div style={{marginTop:20}}><CallCenterDashboard userName={userName} onBack={() => navigate("/")} onLogout={handleLogout} internoNombre={internalInfo?.nombre||""} internoRoperoTurno={internalInfo?.roperoCentralTurno||""} onOpenInternalLogin={() => setShowInternalCenterModal(true)} /></div>}
        </>
      )}
    </div>
  );
};

export default Profile;