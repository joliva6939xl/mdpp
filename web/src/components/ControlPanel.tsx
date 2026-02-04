import React, { useState } from "react";
import { adminService } from "../services/adminService";
import type { UserTarget, ServiceResponse } from "../services/adminService";

// ==========================================
// 1. CONSTANTES Y UTILS
// ==========================================

const DEFAULT_ADMIN_PASSWORD = "123456";
const DNI_REGEX = /^\d{8}$/;
const CEL_REGEX = /^\d{9}$/;

const generarUsuarioHelper = (nombre: string): string => {
  if (!nombre.trim()) return "";
  const partes = nombre.trim().split(/\s+/);
  const p1 = partes[0] || "";
  const p2 = partes[1] || "";
  return (p1.charAt(0) + p2).toLowerCase();
};

// ==========================================
// 2. DTOs Y MAPPERS
// ==========================================

export type SelectionMode = "DELETE" | "BLOCK" | "UNBLOCK" | "NONE";

interface CreateAdminUserDTO {
  nombre: string; usuario: string; contrasena: string; rol: string;
  puede_crear_parte: boolean; puede_borrar_parte: boolean;
  puede_cerrar_parte: boolean; puede_ver_estadisticas_descargar: boolean;
}

// ✅ MAPPER APP ACTUALIZADO CON NUEVOS CAMPOS
const buildAppFormData = (form: CreateFormState, generatedLogin: string): FormData => {
  const formData = new FormData();
  formData.append("nombre", form.nombre.toUpperCase());
  formData.append("usuario", form.usuario.trim() || generatedLogin);
  formData.append("dni", form.dni.trim());
  formData.append("celular", form.celular.trim());
  formData.append("cargo", form.cargo.toUpperCase());
  formData.append("contrasena", form.dni.trim()); // Pass por defecto es el DNI
  
  formData.append("direccion_actual", form.direccion_actual.toUpperCase());
  
  // 🔥 NUEVOS CAMPOS AGREGADOS 🔥
  formData.append("referencia", form.referencia.toUpperCase());
  formData.append("ubicacion_gps", form.ubicacion_gps.trim());

  formData.append("motorizado", String(form.motorizado));
  formData.append("conductor", String(form.conductor));
  
  // FOTOS
  if (form.foto_perfil) {
    formData.append("foto", form.foto_perfil);
  }
  if (form.foto_licencia) {
    formData.append("foto_licencia", form.foto_licencia);
  }

  return formData;
};

const buildAdminPayload = (form: CreateFormState, generatedLogin: string): CreateAdminUserDTO => ({
  nombre: form.nombre.toUpperCase(),
  usuario: form.usuario.trim() || generatedLogin,
  contrasena: form.password || DEFAULT_ADMIN_PASSWORD,
  rol: form.rolAdmin.toUpperCase(),
  puede_crear_parte: form.permisos.crear,
  puede_borrar_parte: form.permisos.borrar,
  puede_cerrar_parte: form.permisos.cerrar,
  puede_ver_estadisticas_descargar: form.permisos.stats
});

// ==========================================
// 3. ESTADO Y TIPOS
// ==========================================

export interface CreateFormState {
  tipo: UserTarget;
  nombre: string; usuario: string; dni: string; celular: string;
  cargo: string; password: string; rolAdmin: string;
  
  // CAMPOS APP
  direccion_actual: string;
  referencia: string;       // <--- NUEVO
  ubicacion_gps: string;    // <--- NUEVO
  
  motorizado: boolean;
  conductor: boolean;
  foto_perfil: File | null;
  foto_licencia: File | null;

  permisos: { crear: boolean; borrar: boolean; cerrar: boolean; stats: boolean; };
}

const INITIAL_FORM_STATE: CreateFormState = {
  tipo: "APP", nombre: "", usuario: "", dni: "", celular: "", cargo: "",
  password: "", rolAdmin: "ADMIN",
  
  direccion_actual: "",
  referencia: "",           // <--- INICIALIZAR
  ubicacion_gps: "",        // <--- INICIALIZAR
  
  motorizado: false,
  conductor: false,
  foto_perfil: null,
  foto_licencia: null,

  permisos: { crear: true, borrar: false, cerrar: false, stats: false }
};

type ValidationErrors = Partial<Record<keyof CreateFormState, string>>;

// ==========================================
// 4. INTERFACE DE PROPS
// ==========================================

export interface ControlPanelProps {
  userName: string;
  selectedUserCount: number;
  isSelectionModeActive: boolean;
  currentMode: SelectionMode;
  currentUserTarget: UserTarget;
  isGlobalBusy?: boolean; 
  onUserTargetChange: (value: UserTarget) => void;
  onSelectModeChange: (mode: SelectionMode) => void;
  onExecuteAction: () => void;
  onLogout: () => void;
  onBack: () => void;
  onUserCreated: () => void;
  onCreateError?: (msg: string) => void;
}

interface PresenterProps extends ControlPanelProps {
  showCreateUser: boolean;
  onToggleCreateUser: () => void;
  formState: CreateFormState;
  setFormState: React.Dispatch<React.SetStateAction<CreateFormState>>;
  errors: ValidationErrors;
  submissionStatus: 'idle' | 'loading' | 'success' | 'error';
  serverMessage: string | null;
  onSubmitCreate: () => void;
  onConfirmMassAction: () => void; 
}

// ==========================================
// 5. PRESENTER (UI Pura)
// ==========================================

const ControlPanelContent: React.FC<PresenterProps> = ({
  userName, selectedUserCount, isSelectionModeActive, currentMode, currentUserTarget, isGlobalBusy,
  onUserTargetChange, onSelectModeChange, onLogout, onBack,
  showCreateUser, onToggleCreateUser, formState, setFormState,
  errors, submissionStatus, serverMessage, onSubmitCreate, onConfirmMassAction
}) => {

  const update = (field: keyof CreateFormState, value: string | boolean | File | null) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const updatePermiso = (key: keyof CreateFormState['permisos'], val: boolean) => {
    setFormState(prev => ({ ...prev, permisos: { ...prev.permisos, [key]: val } }));
  };

  const isUIBlocked = isGlobalBusy || submissionStatus === 'loading';

  const s = {
    card: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 15 },
    toolbar: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const },
    tabGroup: { display: 'flex', background: '#f8fafc', padding: 4, borderRadius: 8, border: '1px solid #e2e8f0' },
    tab: (active: boolean) => ({
      padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
      background: active ? 'white' : 'transparent', color: active ? '#1e3a8a' : '#64748b', transition: 'all 0.2s',
      opacity: isUIBlocked ? 0.6 : 1
    }),
    btnMode: (mode: SelectionMode) => ({
      padding: '10px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700,
      background: currentMode === mode ? (mode === 'DELETE' ? '#ef4444' : mode === 'BLOCK' ? '#f59e0b' : '#10b981') : 'white',
      color: currentMode === mode ? 'white' : '#475569', border: currentMode === mode ? 'none' : '1px solid #cbd5e1',
      display: 'flex', alignItems: 'center', gap: 6, opacity: isUIBlocked ? 0.6 : 1
    }),
    btnPrimary: { background: '#1e3a8a', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: 'pointer', opacity: isUIBlocked ? 0.6 : 1 },
    btnExecute: { 
      background: currentMode === 'DELETE' ? '#ef4444' : currentMode === 'BLOCK' ? '#f59e0b' : '#10b981', 
      color: 'white', padding: '10px 25px', borderRadius: 8, border: 'none', fontWeight: 800, cursor: 'pointer', marginLeft: 'auto',
      opacity: isUIBlocked ? 0.6 : 1
    },
    errorText: { color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' },
    input: (hasError: boolean) => ({
      width: '100%', padding: 12, borderRadius: 8, 
      border: hasError ? '2px solid #fecaca' : '1px solid #cbd5e1',
      background: hasError ? '#fff7f7' : 'white',
      outline: 'none'
    }),
    fileInput: {
        width: '100%', padding: '10px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: '13px'
    },
    checkboxLabel: {
        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer',
        background: '#f1f5f9', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0'
    },
    feedbackBox: (type: 'success' | 'error') => ({
      marginTop: 15, padding: 12, borderRadius: 8, fontSize: 13, fontWeight: 500,
      background: type === 'success' ? '#f0fdf4' : '#fef2f2',
      color: type === 'success' ? '#15803d' : '#b91c1c',
      border: `1px solid ${type === 'success' ? '#bbf7d0' : '#fecaca'}`
    })
  };

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={{display:'flex', alignItems:'center', gap:15}}>
          <button onClick={onBack} disabled={isUIBlocked} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'50%', width:36, height:36, cursor:'pointer'}}>←</button>
          <div><h2 style={{margin:0, fontSize:20, color:'#1e293b'}}>Panel Admin</h2><p style={{margin:0, fontSize:12, color:'#64748b'}}>{userName}</p></div>
        </div>
        <button onClick={onLogout} disabled={isUIBlocked} style={{background:'#fee2e2', color:'#991b1b', border:'1px solid #fca5a5', padding:'8px 15px', borderRadius:6, cursor:'pointer', fontWeight:700}}>Cerrar Sesión</button>
      </div>

      <div style={s.toolbar}>
        <div style={s.tabGroup}>
          <button disabled={isUIBlocked} style={s.tab(currentUserTarget === 'APP')} onClick={() => onUserTargetChange('APP')}>👥 Usuarios APP</button>
          <button disabled={isUIBlocked} style={s.tab(currentUserTarget === 'ADMIN')} onClick={() => onUserTargetChange('ADMIN')}>🛡️ Administradores</button>
        </div>
        <div style={{width: 1, height: 25, background: '#e2e8f0', margin: '0 5px'}}></div>
        
        <button disabled={isUIBlocked} style={s.btnPrimary} onClick={onToggleCreateUser}>
          {showCreateUser ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>

        {!showCreateUser && (
          <>
            <button disabled={isUIBlocked} style={s.btnMode('DELETE')} onClick={() => onSelectModeChange(currentMode === 'DELETE' ? 'NONE' : 'DELETE')}>🗑 Eliminar</button>
            <button disabled={isUIBlocked} style={s.btnMode('BLOCK')} onClick={() => onSelectModeChange(currentMode === 'BLOCK' ? 'NONE' : 'BLOCK')}>🔒 Bloquear</button>
            <button disabled={isUIBlocked} style={s.btnMode('UNBLOCK')} onClick={() => onSelectModeChange(currentMode === 'UNBLOCK' ? 'NONE' : 'UNBLOCK')}>🔓 Desbloquear</button>
          </>
        )}

        {isSelectionModeActive && selectedUserCount > 0 && (
          <button disabled={isUIBlocked} style={s.btnExecute} onClick={onConfirmMassAction}>
             {isUIBlocked ? 'Procesando...' : `CONFIRMAR ${currentMode} (${selectedUserCount})`}
          </button>
        )}
      </div>

      {showCreateUser && (
        <div style={{marginTop: 20, padding: 25, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0'}}>
          <h4 style={{marginTop:0, color:'#1e3a8a'}}>Registrar Nuevo Usuario {formState.tipo}</h4>
          
          <div style={{display:'flex', gap:10, marginBottom:15}}>
            <button disabled={isUIBlocked} style={s.tab(formState.tipo === 'APP')} onClick={() => update('tipo', 'APP')}>App Móvil</button>
            <button disabled={isUIBlocked} style={s.tab(formState.tipo === 'ADMIN')} onClick={() => update('tipo', 'ADMIN')}>Panel Web</button>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))', gap: 15}}>
            
            {/* CAMPOS COMUNES */}
            <div>
              <input disabled={isUIBlocked} placeholder="Nombre Completo" value={formState.nombre} onChange={e=>update('nombre', e.target.value)} style={s.input(!!errors.nombre)} />
              {errors.nombre && <div style={s.errorText}>⚠ {errors.nombre}</div>}
            </div>
            
            <div>
              <input disabled={isUIBlocked} placeholder="Usuario (Auto si vacío)" value={formState.usuario} onChange={e=>update('usuario', e.target.value)} style={s.input(!!errors.usuario)} />
              {errors.usuario && <div style={s.errorText}>⚠ {errors.usuario}</div>}
            </div>

            {/* CAMPOS ESPECÍFICOS APP */}
            {formState.tipo === 'APP' ? (
              <>
                {/* FOTO DE PERFIL */}
                <div style={{gridColumn: '1 / -1', background:'#fff', padding:15, borderRadius:8, border:'1px solid #cbd5e1'}}>
                    <label style={{display:'block', marginBottom:5, fontSize:12, fontWeight:700, color:'#1e3a8a'}}>📸 FOTO DE PERFIL (OBLIGATORIO)</label>
                    <input 
                        type="file" 
                        accept="image/*"
                        disabled={isUIBlocked}
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                update('foto_perfil', e.target.files[0]);
                            }
                        }}
                        style={s.fileInput}
                    />
                    <div style={{fontSize:11, color:'#64748b', marginTop:4}}>
                        {formState.foto_perfil ? `✅ Archivo seleccionado: ${formState.foto_perfil.name}` : "Ningún archivo seleccionado"}
                    </div>
                </div>

                <div>
                   <input disabled={isUIBlocked} placeholder="DNI (8 dígitos)" maxLength={8} value={formState.dni} onChange={e=>update('dni', e.target.value)} style={s.input(!!errors.dni)} />
                   {errors.dni && <div style={s.errorText}>⚠ {errors.dni}</div>}
                </div>
                <div>
                   <input disabled={isUIBlocked} placeholder="Celular (9 dígitos)" maxLength={9} value={formState.celular} onChange={e=>update('celular', e.target.value)} style={s.input(!!errors.celular)} />
                   {errors.celular && <div style={s.errorText}>⚠ {errors.celular}</div>}
                </div>
                <div>
                   <input disabled={isUIBlocked} placeholder="Cargo" value={formState.cargo} onChange={e=>update('cargo', e.target.value)} style={s.input(!!errors.cargo)} />
                   {errors.cargo && <div style={s.errorText}>⚠ {errors.cargo}</div>}
                </div>
                
                {/* UBICACIÓN */}
                <div>
                   <input disabled={isUIBlocked} placeholder="Dirección Actual" value={formState.direccion_actual} onChange={e=>update('direccion_actual', e.target.value)} style={s.input(false)} />
                </div>
                {/* 🔥 NUEVOS CAMPOS */}
                <div>
                   <input disabled={isUIBlocked} placeholder="Referencia" value={formState.referencia} onChange={e=>update('referencia', e.target.value)} style={s.input(false)} />
                </div>
                <div>
                   <input disabled={isUIBlocked} placeholder="Ubicación GPS (Lat, Long)" value={formState.ubicacion_gps} onChange={e=>update('ubicacion_gps', e.target.value)} style={s.input(false)} />
                </div>
                
                {/* Checkboxes Motorizado / Conductor */}
                <div style={{gridColumn:'1 / -1', display:'flex', gap:'15px', flexWrap:'wrap'}}>
                    <label style={s.checkboxLabel}>
                        <input type="checkbox" checked={formState.motorizado} onChange={e=>update('motorizado', e.target.checked)} disabled={isUIBlocked} />
                        🛵 Motorizado
                    </label>
                    <label style={s.checkboxLabel}>
                        <input type="checkbox" checked={formState.conductor} onChange={e=>update('conductor', e.target.checked)} disabled={isUIBlocked} />
                        🚙 Conductor
                    </label>
                </div>

                {/* Subida de Licencia */}
                {(formState.conductor || formState.motorizado) && (
                    <div style={{gridColumn:'1 / -1', background:'#fff', padding:15, borderRadius:8, border:'1px solid #cbd5e1'}}>
                        <label style={{display:'block', marginBottom:5, fontSize:12, fontWeight:700, color:'#475569'}}>🚙 FOTO LICENCIA DE CONDUCIR</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            disabled={isUIBlocked}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    update('foto_licencia', e.target.files[0]);
                                }
                            }}
                            style={s.fileInput}
                        />
                        <div style={{fontSize:11, color:'#64748b', marginTop:4}}>
                            {formState.foto_licencia ? `✅ Archivo seleccionado: ${formState.foto_licencia.name}` : "Ningún archivo seleccionado"}
                        </div>
                    </div>
                )}
              </>
            ) : (
              // CAMPOS ADMIN
              <>
                <div><input disabled={isUIBlocked} type="password" placeholder={`Pass (Def: ${DEFAULT_ADMIN_PASSWORD})`} value={formState.password} onChange={e=>update('password', e.target.value)} style={s.input(false)} /></div>
                <div><input disabled={isUIBlocked} placeholder="Rol" value={formState.rolAdmin} onChange={e=>update('rolAdmin', e.target.value)} style={s.input(false)} /></div>
              </>
            )}
          </div>

          {/* PERMISOS ADMIN */}
          {formState.tipo === 'ADMIN' && (
            <div style={{marginTop:15, background:'white', padding:15, borderRadius:8, border:'1px solid #e2e8f0', display:'flex', gap:20, flexWrap:'wrap', fontSize:13}}>
              <label><input disabled={isUIBlocked} type="checkbox" checked={formState.permisos.crear} onChange={e=>updatePermiso('crear', e.target.checked)}/> Crear Parte</label>
              <label><input disabled={isUIBlocked} type="checkbox" checked={formState.permisos.borrar} onChange={e=>updatePermiso('borrar', e.target.checked)}/> Borrar Parte</label>
              <label><input disabled={isUIBlocked} type="checkbox" checked={formState.permisos.cerrar} onChange={e=>updatePermiso('cerrar', e.target.checked)}/> Cerrar Parte</label>
              <label><input disabled={isUIBlocked} type="checkbox" checked={formState.permisos.stats} onChange={e=>updatePermiso('stats', e.target.checked)}/> Ver Estadísticas</label>
            </div>
          )}

          {submissionStatus === 'error' && serverMessage && (
             <div style={s.feedbackBox('error')}>
                <strong>Error al crear:</strong> {serverMessage}
             </div>
          )}
          {submissionStatus === 'success' && (
             <div style={s.feedbackBox('success')}>✅ {serverMessage || "Usuario creado exitosamente"}</div>
          )}

          <div style={{marginTop:20, textAlign:'right'}}>
            <button onClick={onSubmitCreate} disabled={isUIBlocked} style={{...s.btnPrimary, opacity: isUIBlocked ? 0.7 : 1}}>
              {submissionStatus === 'loading' ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 6. CONTAINER
// ==========================================

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [formState, setFormState] = useState<CreateFormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  const [submissionStatus, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const toggleCreateUser = () => {
    if (props.isGlobalBusy) return;
    setShowCreateUser(!showCreateUser);
    setFormState(INITIAL_FORM_STATE);
    setErrors({});
    setStatus('idle');
    setServerMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!formState.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    
    if (formState.tipo === "APP") {
      if (!formState.dni.trim()) {
          newErrors.dni = "DNI obligatorio";
      } else if (!DNI_REGEX.test(formState.dni.trim())) {
          newErrors.dni = "DNI inválido: Debe tener 8 dígitos numéricos";
      }

      if (formState.celular.trim() && !CEL_REGEX.test(formState.celular.trim())) {
          newErrors.celular = "Celular inválido: Se esperan 9 dígitos";
      }
      
      if (!formState.cargo.trim()) newErrors.cargo = "Cargo obligatorio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const mapServerErrorToField = (msg: string) => {
      const lowerMsg = msg.toLowerCase();
      if (lowerMsg.includes("dni")) setErrors(prev => ({ ...prev, dni: "Este DNI ya está registrado" }));
      else if (lowerMsg.includes("usuario") || lowerMsg.includes("user")) setErrors(prev => ({ ...prev, usuario: "Este usuario ya existe" }));
      else setErrors(prev => ({ ...prev, nombre: "Error genérico: " + msg })); 
  };

  const handleSubmitCreate = async () => {
    if (!validateForm()) return;

    setStatus('loading');
    setServerMessage(null);

    const generatedLogin = generarUsuarioHelper(formState.nombre);

    try {
      const payload = formState.tipo === "APP" 
        ? buildAppFormData(formState, generatedLogin)
        : buildAdminPayload(formState, generatedLogin);

      const result: ServiceResponse = await adminService.crearUsuarioSistema(payload, formState.tipo);

      if (result.success) {
        setStatus('success');
        const loginUsed = formState.usuario.trim() || generatedLogin;
        setServerMessage(`Usuario ${loginUsed} creado.`);
        if (props.onUserCreated) props.onUserCreated();
        
        setTimeout(() => {
           setFormState(INITIAL_FORM_STATE);
           setStatus('idle');
           setServerMessage(null);
        }, 2000);
      } else {
        setStatus('error');
        const msg = result.json.message || "Error desconocido";
        setServerMessage(msg);
        mapServerErrorToField(msg);
        if (props.onCreateError) props.onCreateError(msg);
      }

    } catch (error) {
      console.error(error);
      setStatus('error');
      setServerMessage("Error crítico de conexión.");
    } finally {
      setStatus(prev => prev === 'loading' ? 'idle' : prev);
    }
  };

  const handleConfirmMassAction = () => {
      if (props.isGlobalBusy) return;
      
      const actionMap = { 'DELETE': 'ELIMINAR', 'BLOCK': 'BLOQUEAR', 'UNBLOCK': 'DESBLOQUEAR', 'NONE': '' };
      const actionName = actionMap[props.currentMode];
      
      if (window.confirm(`⚠️ ¿Estás seguro que deseas ${actionName} ${props.selectedUserCount} usuarios?\nEsta acción no se puede deshacer inmediatamente.`)) {
          props.onExecuteAction();
      }
  };

  return (
    <ControlPanelContent 
      {...props}
      showCreateUser={showCreateUser}
      onToggleCreateUser={toggleCreateUser}
      formState={formState}
      setFormState={setFormState}
      errors={errors}
      submissionStatus={submissionStatus}
      serverMessage={serverMessage}
      onSubmitCreate={handleSubmitCreate}
      onConfirmMassAction={handleConfirmMassAction}
    />
  );
};

export default ControlPanel;