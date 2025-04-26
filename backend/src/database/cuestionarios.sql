-- Eliminar tablas si existen (en orden inverso debido a las restricciones de clave foránea)
DROP TABLE IF EXISTS respuestas_preguntas;
DROP TABLE IF EXISTS opciones_preguntas;
DROP TABLE IF EXISTS respuestas_cuestionarios;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS cuestionarios;

-- Crear tabla de cuestionarios
CREATE TABLE cuestionarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de preguntas
CREATE TABLE preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cuestionario_id INT NOT NULL,
  texto TEXT NOT NULL,
  tipo ENUM('si_no', 'likert', 'opcion_multiple') NOT NULL,
  orden INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cuestionario_id) REFERENCES cuestionarios(id) ON DELETE CASCADE
);

-- Crear tabla para el estado de los cuestionarios por usuario
CREATE TABLE respuestas_cuestionarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  cuestionario_id INT NOT NULL,
  estado ENUM('pendiente', 'iniciado', 'completado') DEFAULT 'pendiente',
  fecha_inicio TIMESTAMP NULL,
  fecha_fin TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cuestionario_id) REFERENCES cuestionarios(id) ON DELETE CASCADE,
  UNIQUE KEY usuario_cuestionario (usuario_id, cuestionario_id)
);

-- Crear tabla para las respuestas de las preguntas
CREATE TABLE respuestas_preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  respuesta_cuestionario_id INT NOT NULL,
  pregunta_id INT NOT NULL,
  respuesta_texto VARCHAR(255),
  respuesta_valor INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (respuesta_cuestionario_id) REFERENCES respuestas_cuestionarios(id) ON DELETE CASCADE,
  FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
  UNIQUE KEY respuesta_pregunta (respuesta_cuestionario_id, pregunta_id)
);

-- Insertar datos del cuestionario
INSERT INTO cuestionarios (nombre, codigo, descripcion) VALUES
('Factores de Riesgo Psicosocial', 'factores', 'Evaluación de los factores de riesgo psicosocial en el trabajo');

-- Insertar preguntas para el cuestionario de Factores de Riesgo Psicosocial
INSERT INTO preguntas (cuestionario_id, texto, tipo, orden) VALUES
(1, '¿Siente presión excesiva en el trabajo debido a la carga laboral?', 'likert', 1),
(1, '¿Considera que su horario laboral afecta su calidad de vida?', 'likert', 2),
(1, '¿Ha experimentado acoso o maltrato en su trabajo?', 'likert', 3),
(1, '¿Siente que la organización no valora su esfuerzo?', 'likert', 4),
(1, '¿Se siente constantemente fatigado o estresado por el trabajo?', 'likert', 5); 