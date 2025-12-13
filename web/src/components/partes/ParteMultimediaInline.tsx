import React from "react";
import type { ParteArchivo, ParteVirtual } from "../../types/partes";
import { getFotoUrl } from "../../utils/fileUrl";
import { profileStyles as styles } from "../../pages/Profile.styles";

type Props = {
  parte: ParteVirtual;
};

const ParteMultimediaInline: React.FC<Props> = ({ parte }) => {
  const fotos = parte.fotos || [];
  const videos = parte.videos || [];
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

export default ParteMultimediaInline;
