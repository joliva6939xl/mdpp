// web/src/components/UserDetailsModal.tsx
import React, { useEffect, useState } from "react";
import "./UserDetailsModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ──────────────────────── Tipos ────────────────────────

type Participante = {
  nombre?: string;
  dni?: string;
};

type UsuarioApp = {
  id: number;
  nombre: string;
  cargo: string;
  usuario: string;
  dni: string;
  celular: string;
  foto_ruta?: string | null;
};

type ParteArchivo = {
  id: number;
  tipo: "foto" | "video";
  ruta: string;
  nombre_original: string;
};

type ParteVirtual = {
  id: number;
  parte_fisico: string;
  fecha: string;
  hora: string | null;
  hora_fin: string | null;
  sector: string | null;
  zona: string | null;
  turno: string | null;
  lugar: string | null;
  unidad_tipo: string | null;
  unidad_numero: string | null;
  placa: string | null;
  conductor: string | null;
  dni_conductor: string | null;
  sumilla: string | null;
  asunto: string | null;
  ocurrencia: string | null;
  supervisor_zonal?: string | null;
  supervisor_general?: string | null;
  participantes?: Participante[] | string | null;
  fotos?: ParteArchivo[];
  videos?: ParteArchivo[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  usuario: UsuarioApp | null;
};

// Normalizamos lo que venga de BD/JSON a un array de Participante
const normalizarParticipantes = (raw: unknown): Participante[] => {
  try {
    if (!raw) return [];

    // Si ya es array
    if (Array.isArray(raw)) {
      return raw
        .filter((p) => typeof p === "object" && p !== null)
        .map((p) => p as Participante);
    }

    // Si viene como string JSON
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => typeof p === "object" && p !== null)
          .map((p) => p as Participante);
      }
    }

    return [];
  } catch {
    return [];
  }
};

export const UserDetailsModal: React.FC<Props> = ({
  open,
  onClose,
  usuario,
}) => {
  const [tab, setTab] = useState<"info" | "partes">("info");
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioApp | null>(null);

  const [loadingPartes, setLoadingPartes] = useState(false);
  const [partes, setPartes] = useState<ParteVirtual[]>([]);
  const [parteSeleccionado, setParteSeleccionado] =
    useState<ParteVirtual | null>(null);

  useEffect(() => {
    if (!open || !usuario) return;

    setTab("info");
    setParteSeleccionado(null);
    cargarUsuario(usuario.id);
    cargarPartes(usuario.id);
  }, [open, usuario]);

  const cargarUsuario = async (id: number) => {
    try {
      setLoadingUsuario(true);
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API_URL}/api/admin/usuario-details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDetalleUsuario((data as { usuario?: UsuarioApp }).usuario ?? data);
      }
    } catch (e) {
      console.error("Error cargando usuario:", e);
    } finally {
      setLoadingUsuario(false);
    }
  };

  const cargarPartes = async (id: number) => {
    try {
      setLoadingPartes(true);
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API_URL}/api/admin/usuario-partes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const lista = (data as { partes?: ParteVirtual[] }).partes ?? data;
        setPartes(lista as ParteVirtual[]);
      }
    } catch (e) {
      console.error("Error cargando partes:", e);
    } finally {
      setLoadingPartes(false);
    }
  };

  const cargarDetalleParte = async (idParte: number) => {
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`${API_URL}/api/partes/${idParte}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const base = (data as { parte?: ParteVirtual; data?: ParteVirtual })
          .parte
          ?? (data as { data?: ParteVirtual }).data
          ?? (data as ParteVirtual);

        const parteBase: ParteVirtual = {
          ...base,
          fotos: base.fotos ?? [],
          videos: base.videos ?? [],
        };

        const participantesNorm = normalizarParticipantes(
          base.participantes ?? null
        );
        const parteCompleta: ParteVirtual = {
          ...parteBase,
          participantes: participantesNorm,
        };

        setParteSeleccionado(parteCompleta);
      }
    } catch (e) {
      console.error("Error cargando detalle de parte:", e);
    }
  };

  if (!open || !usuario) return null;

  const u = detalleUsuario || usuario;

  const fotoUrl =
    u.foto_ruta && u.foto_ruta !== ""
      ? `${API_URL}/${u.foto_ruta.replace(/^\/+/, "")}`
      : null;

  return (
    <div className="udm-backdrop">
      <div className="udm-modal">
        {/* HEADER */}
        <div className="udm-header">
          <div className="udm-title">
            <strong>{u.nombre}</strong>
          </div>
          <button className="udm-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* TABS */}
        <div className="udm-tabs">
          <button
            className={`udm-tab ${tab === "info" ? "active" : ""}`}
            onClick={() => setTab("info")}
          >
            Información
          </button>
          <button
            className={`udm-tab ${tab === "partes" ? "active" : ""}`}
            onClick={() => setTab("partes")}
          >
            Partes ({partes.length})
          </button>
        </div>

        {/* BODY */}
        <div className="udm-body">
          {tab === "info" && (
            <div className="udm-info">
              {loadingUsuario ? (
                <div className="udm-loading">Cargando información...</div>
              ) : (
                <div className="udm-info-grid">
                  <div className="udm-info-text">
                    <div className="udm-row">
                      <span className="udm-label">Cargo:</span>
                      <span className="udm-value">{u.cargo || "-"}</span>
                    </div>
                    <div className="udm-row">
                      <span className="udm-label">Usuario:</span>
                      <span className="udm-value">{u.usuario || "-"}</span>
                    </div>
                    <div className="udm-row">
                      <span className="udm-label">DNI:</span>
                      <span className="udm-value">{u.dni || "-"}</span>
                    </div>
                    <div className="udm-row">
                      <span className="udm-label">Celular:</span>
                      <span className="udm-value">{u.celular || "-"}</span>
                    </div>
                  </div>
                  <div className="udm-info-photo">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={u.nombre}
                        className="udm-avatar"
                      />
                    ) : (
                      <div className="udm-avatar-placeholder">Sin foto</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "partes" && (
            <div className="udm-partes">
              <div className="udm-partes-list">
                {loadingPartes ? (
                  <div className="udm-loading">Cargando partes...</div>
                ) : partes.length === 0 ? (
                  <div className="udm-empty">
                    No hay partes para este usuario.
                  </div>
                ) : (
                  <ul>
                    {partes.map((p) => (
                      <li
                        key={p.id}
                        className={`udm-parte-item ${
                          parteSeleccionado && parteSeleccionado.id === p.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => cargarDetalleParte(p.id)}
                      >
                        <div>
                          <strong>Parte N° {p.id}</strong>
                        </div>
                        <div className="udm-parte-sub">
                          {p.fecha} · {p.sumilla || "-"}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="udm-parte-detalle">
                {parteSeleccionado ? (
                  <ParteDetalleView parte={parteSeleccionado} />
                ) : (
                  <div className="udm-empty">
                    Selecciona un parte para ver el detalle.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

type ParteViewProps = { parte: ParteVirtual };

const ParteDetalleView: React.FC<ParteViewProps> = ({ parte }) => {
  const participantes = normalizarParticipantes(parte.participantes ?? null);

  return (
    <div className="udm-parte-wrapper">
      <div className="udm-parte-header-row">
        <h3>Detalle Parte N° {parte.id}</h3>
        <button className="udm-download-btn" type="button">
          📥 Descargar
        </button>
      </div>

      {/* SUMILLA / OCURRENCIA */}
      <section className="udm-section">
        <h4>Sumilla / Asunto</h4>
        <p className="udm-strong">
          {parte.sumilla || "-"}{" "}
          {parte.asunto ? `/ ${parte.asunto}` : ""}
        </p>

        <h4>Ocurrencia</h4>
        <p>{parte.ocurrencia || "-"}</p>
      </section>

      {/* GENERAL + UNIDAD */}
      <section className="udm-section udm-grid-2">
        <div>
          <h4>General</h4>
          <p>
            <span className="udm-label">Físico:</span>{" "}
            <span>{parte.parte_fisico || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Fecha:</span>{" "}
            <span>{parte.fecha || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Hora inicio:</span>{" "}
            <span>{parte.hora || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Hora fin:</span>{" "}
            <span>{parte.hora_fin || "-"}</span>
          </p>
        </div>
        <div>
          <h4>Unidad</h4>
          <p>
            <span className="udm-label">Unidad / Tipo:</span>{" "}
            <span>{parte.unidad_tipo || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Unidad N°:</span>{" "}
            <span>{parte.unidad_numero || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Placa:</span>{" "}
            <span>{parte.placa || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Conductor:</span>{" "}
            <span>{parte.conductor || "-"}</span>
          </p>
          <p>
            <span className="udm-label">DNI Conductor:</span>{" "}
            <span>{parte.dni_conductor || "-"}</span>
          </p>
        </div>
      </section>

      {/* PARTICIPANTES */}
      {participantes.length > 0 && (
        <section className="udm-section">
          <h4>Sereno Operador Participante</h4>
          <ul className="udm-participantes-list">
            {participantes.map((pt, idx) => (
              <li key={idx}>
                <strong>{pt.nombre || "-"}</strong>{" "}
                {pt.dni && <span>(DNI: {pt.dni})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* UBICACIÓN / TURNO / SUPERVISIÓN */}
      <section className="udm-section udm-grid-2">
        <div>
          <h4>Ubicación</h4>
          <p>
            <span className="udm-label">Sector:</span>{" "}
            <span>{parte.sector || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Zona:</span>{" "}
            <span>{parte.zona || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Lugar:</span>{" "}
            <span>{parte.lugar || "-"}</span>
          </p>
        </div>
        <div>
          <h4>Turno & Supervisión</h4>
          <p>
            <span className="udm-label">Turno:</span>{" "}
            <span>{parte.turno || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Supervisor Zonal:</span>{" "}
            <span>{parte.supervisor_zonal || "-"}</span>
          </p>
          <p>
            <span className="udm-label">Supervisor General:</span>{" "}
            <span>{parte.supervisor_general || "-"}</span>
          </p>
        </div>
      </section>

      {/* MULTIMEDIA PREVIEW */}
      <section className="udm-section">
        <h4>Contenido Multimedia</h4>
        {(!parte.fotos || parte.fotos.length === 0) &&
        (!parte.videos || parte.videos.length === 0) ? (
          <p>No hay archivos multimedia registrados.</p>
        ) : (
          <div className="udm-media-grid">
            {parte.fotos?.map((f) => (
              <div key={f.id} className="udm-media-item">
                <div className="udm-media-thumb">
                  <img
                    src={`${API_URL}/${f.ruta}`.replace(
                      /\/uploads\/uploads/g,
                      "/uploads"
                    )}
                    alt={f.nombre_original}
                  />
                </div>
                <div className="udm-media-caption">
                  📷 {f.nombre_original}
                </div>
              </div>
            ))}

            {parte.videos?.map((v) => (
              <div key={v.id} className="udm-media-item">
                <div className="udm-media-thumb video">🎬</div>
                <div className="udm-media-caption">{v.nombre_original}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
