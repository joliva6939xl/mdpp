import React, { useEffect, useState } from "react";
import "./UserDetailsModal.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

const normalizarParticipantes = (raw: unknown): Participante[] => {
  try {
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw
        .filter((p) => typeof p === "object" && p !== null)
        .map((p) => p as Participante);
    }

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

export const UserDetailsModal: React.FC<Props> = ({ open, onClose, usuario }) => {
  const [tab, setTab] = useState<"info" | "partes">("info");
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [detalleUsuario, setDetalleUsuario] = useState<UsuarioApp | null>(null);

  const [loadingPartes, setLoadingPartes] = useState(false);
  const [partes, setPartes] = useState<ParteVirtual[]>([]);
  const [parteSeleccionado, setParteSeleccionado] = useState<ParteVirtual | null>(
    null
  );

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

      // ✅ SIN TOKEN
      const res = await fetch(`${API_URL}/api/admin/usuario-details/${id}`);
      const data = await res.json();

      if (res.ok) {
        setDetalleUsuario((data as { user?: UsuarioApp; usuario?: UsuarioApp }).user
          ?? (data as { usuario?: UsuarioApp }).usuario
          ?? (data as UsuarioApp));
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

      // ✅ SIN TOKEN
      const res = await fetch(`${API_URL}/api/admin/usuario-partes/${id}`);
      const data = await res.json();

      if (res.ok) {
        const lista = (data as { partes?: ParteVirtual[] }).partes ?? (data as ParteVirtual[]);
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
      // ✅ SIN TOKEN
      const res = await fetch(`${API_URL}/api/partes/${idParte}`);
      const data = await res.json();

      if (res.ok) {
        const base =
          (data as { parte?: ParteVirtual }).parte ??
          (data as { data?: ParteVirtual }).data ??
          (data as ParteVirtual);

        const parteBase: ParteVirtual = {
          ...base,
          fotos: base.fotos ?? [],
          videos: base.videos ?? [],
        };

        const participantesNorm = normalizarParticipantes(base.participantes ?? null);

        setParteSeleccionado({
          ...parteBase,
          participantes: participantesNorm,
        });
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
        <div className="udm-header">
          <div className="udm-title">
            <strong>{u.nombre}</strong>
          </div>
          <button className="udm-close" onClick={onClose}>
            ×
          </button>
        </div>

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

        {tab === "info" && (
          <div className="udm-content">
            <div className="udm-info-left">
              <div className="udm-row">
                <span className="udm-label">Cargo:</span>
                <span>{u.cargo || "-"}</span>
              </div>
              <div className="udm-row">
                <span className="udm-label">Usuario:</span>
                <span>{u.usuario || "-"}</span>
              </div>
              <div className="udm-row">
                <span className="udm-label">DNI:</span>
                <span>{u.dni || "-"}</span>
              </div>
              <div className="udm-row">
                <span className="udm-label">Celular:</span>
                <span>{u.celular || "-"}</span>
              </div>

              {loadingUsuario && <p style={{ marginTop: 10 }}>Cargando...</p>}
            </div>

            <div className="udm-photo">
              {fotoUrl ? (
                <img src={fotoUrl} alt={u.nombre} />
              ) : (
                <div className="udm-no-photo">Sin foto</div>
              )}
            </div>
          </div>
        )}

        {tab === "partes" && (
          <div className="udm-content">
            {loadingPartes ? (
              <p>Cargando partes...</p>
            ) : partes.length === 0 ? (
              <p>Este usuario no tiene partes.</p>
            ) : (
              <div className="udm-partes-wrap">
                <div className="udm-partes-list">
                  {partes.map((p) => (
                    <div
                      key={p.id}
                      className="udm-parte-item"
                      onClick={() => cargarDetalleParte(p.id)}
                    >
                      Parte ID: {p.id} — {p.sumilla || "Sin tipo"}
                    </div>
                  ))}
                </div>

                {parteSeleccionado && (
                  <div className="udm-parte-detail">
                    <div><strong>ID:</strong> {parteSeleccionado.id}</div>
                    <div><strong>Incidencia:</strong> {parteSeleccionado.sumilla || "-"}</div>
                    <div><strong>Origen:</strong> {parteSeleccionado.asunto || "-"}</div>
                    <div><strong>Ocurrencia:</strong> {parteSeleccionado.ocurrencia || "-"}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
