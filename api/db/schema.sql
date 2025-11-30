-- Archivo: db/schema.sql

-- Tabla de usuarios
DROP TABLE IF EXISTS parte_archivos CASCADE;
DROP TABLE IF EXISTS partes_virtuales CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  dni VARCHAR(20) NOT NULL UNIQUE,
  celular VARCHAR(20),
  cargo TEXT,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  -- OJO: sin ñ
  contrasena TEXT NOT NULL,
  foto_ruta TEXT,
  rol VARCHAR(20) NOT NULL DEFAULT 'agente',
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de partes virtuales
CREATE TABLE partes_virtuales (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  sector TEXT,
  parte_fisico VARCHAR(50),
  zona TEXT,
  turno TEXT,
  lugar TEXT,
  fecha TEXT,
  hora TEXT,
  unidad_tipo TEXT,
  unidad_numero TEXT,
  placa TEXT,
  conductor TEXT,
  dni_conductor TEXT,
  sumilla TEXT,
  asunto TEXT,
  ocurrencia TEXT,
  sup_zonal TEXT,
  sup_general TEXT,
  participantes JSONB,
  creado_en TIMESTAMP DEFAULT NOW()
);

-- Archivos (fotos y videos) asociados a un parte
CREATE TABLE parte_archivos (
  id SERIAL PRIMARY KEY,
  parte_id INTEGER REFERENCES partes_virtuales(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- 'foto' o 'video'
  ruta TEXT NOT NULL,
  nombre_original TEXT,
  creado_en TIMESTAMP DEFAULT NOW()
);
