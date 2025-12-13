import React from "react";
import type { ParteVirtual } from "../../types/partes";
import { getIncidenciaMostrada, getOrigenMostrado } from "../../utils/parteView";
import { profileStyles as styles } from "../../pages/Profile.styles";

type Props = {
  parte: ParteVirtual;
};

const ParteDetail: React.FC<Props> = ({ parte }) => {
  const fechaMostrada = parte.fecha || parte.creado_en || "-";
  const incidenciaMostrada = getIncidenciaMostrada(parte);
  const origenMostrado = getOrigenMostrado(parte);

  return (
    <div>
      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>ID Parte:</span>
        <span>{parte.id}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Fecha:</span>
        <span>{fechaMostrada}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Sector:</span>
        <span>{parte.sector || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Zona:</span>
        <span>{parte.zona || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Turno:</span>
        <span>{parte.turno || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Lugar:</span>
        <span>{parte.lugar || parte.ubicacion_exacta || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Hora inicio:</span>
        <span>{parte.hora_inicio || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Hora fin:</span>
        <span>{parte.hora_fin || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Unidad:</span>
        <span>
          {(parte.unidad_tipo || "").toString()}{" "}
          {(parte.unidad_numero || "").toString()}
        </span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Placa:</span>
        <span>{parte.placa || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Conductor:</span>
        <span>{parte.conductor || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>DNI Conductor:</span>
        <span>{parte.dni_conductor || "-"}</span>
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
        <span>
          {parte.ocurrencia || parte.parte_fisico || parte.descripcion || "-"}
        </span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Supervisor Zonal:</span>
        <span>{parte.supervisor_zonal || parte.sup_zonal || "-"}</span>
      </div>

      <div style={styles.detailsRow}>
        <span style={styles.detailsLabel}>Supervisor General:</span>
        <span>{parte.supervisor_general || parte.sup_general || "-"}</span>
      </div>
    </div>
  );
};

export default ParteDetail;
