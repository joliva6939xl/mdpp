import React from "react";
import type { ParteVirtual } from "../../types/partes";
import { getIncidenciaMostrada } from "../../utils/parteView";
import { profileStyles as styles } from "../../pages/Profile.styles";

type Props = {
  partes: ParteVirtual[];
  hoveredParteId: number | null;
  setHoveredParteId: (id: number | null) => void;
  onParteClick: (parteId: number) => void;
};

const PartesList: React.FC<Props> = ({
  partes,
  hoveredParteId,
  setHoveredParteId,
  onParteClick,
}) => {
  if (!partes || partes.length === 0) {
    return <p>Este usuario no tiene partes registrados.</p>;
  }

  return (
    <div style={styles.partesList}>
      {partes.map((parte) => {
        const resumenIncidencia = getIncidenciaMostrada(parte, "Sin tipo");

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
              ...(hoveredParteId === parte.id ? styles.parteItemHover : {}),
            }}
            onMouseEnter={() => setHoveredParteId(parte.id)}
            onMouseLeave={() => setHoveredParteId(null)}
            onClick={() => onParteClick(parte.id)}
          >
            Parte ID: {parte.id} – {resumenIncidencia} –{" "}
            {resumenUbicacion || "Sin ubicación"}
          </div>
        );
      })}
    </div>
  );
};

export default PartesList;
