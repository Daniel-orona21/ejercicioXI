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

-- Crear tabla de opciones para preguntas de opción múltiple
CREATE TABLE opciones_preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pregunta_id INT NOT NULL,
  texto VARCHAR(255) NOT NULL,
  valor INT NOT NULL,
  orden INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE
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

-- Insertar datos iniciales de los cuestionarios
INSERT INTO cuestionarios (nombre, codigo, descripcion) VALUES
('Traumáticos Severos', 'traumaticos', 'Evaluación de acontecimientos traumáticos severos en el entorno laboral'),
('Factores de Riesgo Psicosocial', 'factores', 'Evaluación de los factores de riesgo psicosocial en el trabajo'),
('Entorno Organizacional', 'entorno', 'Evaluación del entorno organizacional favorable en el trabajo');

-- Insertar preguntas para el cuestionario de Traumáticos Severos
INSERT INTO preguntas (cuestionario_id, texto, tipo, orden) VALUES
(1, '¿Ha presenciado o sufrido alguna amenaza directa a su vida o salud en su lugar de trabajo?', 'si_no', 1),
(1, '¿Ha experimentado violencia física, agresiones o amenazas graves en su entorno laboral?', 'si_no', 2),
(1, '¿Ha estado involucrado en accidentes graves o situaciones de emergencia dentro de la empresa?', 'si_no', 3),
(1, '¿Ha sido testigo de eventos que hayan puesto en riesgo la integridad de un compañero de trabajo?', 'si_no', 4),
(1, '¿Ha recibido apoyo adecuado de la organización tras un acontecimiento traumático?', 'si_no', 5),
(1, '¿Siente que su salud emocional ha sido afectada por algún evento ocurrido en su trabajo?', 'si_no', 6);

-- Insertar preguntas para el cuestionario de Factores de Riesgo Psicosocial
INSERT INTO preguntas (cuestionario_id, texto, tipo, orden) VALUES
(2, '¿Siente presión excesiva en el trabajo debido a la carga laboral?', 'likert', 1),
(2, '¿Considera que su horario laboral afecta su calidad de vida?', 'likert', 2),
(2, '¿Ha experimentado acoso o maltrato en su trabajo?', 'likert', 3),
(2, '¿Siente que la organización no valora su esfuerzo?', 'likert', 4),
(2, '¿Se siente constantemente fatigado o estresado por el trabajo?', 'likert', 5);

-- Insertar preguntas para el cuestionario de Entorno Organizacional
INSERT INTO preguntas (cuestionario_id, texto, tipo, orden) VALUES
(3, '¿Recibe apoyo de sus superiores en la realización de su trabajo?', 'opcion_multiple', 1),
(3, '¿Existe comunicación efectiva entre los empleados y la dirección?', 'opcion_multiple', 2),
(3, '¿Recibe capacitación adecuada para desempeñar sus funciones?', 'opcion_multiple', 3),
(3, '¿Considera que el ambiente laboral es saludable y colaborativo?', 'opcion_multiple', 4);

-- Obtener los IDs de las preguntas de opción múltiple para poder crear sus opciones
SET @pregunta1_id = (SELECT id FROM preguntas WHERE cuestionario_id = 3 AND orden = 1);
SET @pregunta2_id = (SELECT id FROM preguntas WHERE cuestionario_id = 3 AND orden = 2);
SET @pregunta3_id = (SELECT id FROM preguntas WHERE cuestionario_id = 3 AND orden = 3);
SET @pregunta4_id = (SELECT id FROM preguntas WHERE cuestionario_id = 3 AND orden = 4);

-- Insertar opciones para las preguntas de opción múltiple
INSERT INTO opciones_preguntas (pregunta_id, texto, valor, orden) VALUES
(@pregunta1_id, 'Siempre', 3, 1),
(@pregunta1_id, 'A veces', 2, 2),
(@pregunta1_id, 'Nunca', 1, 3),
(@pregunta2_id, 'Buena', 3, 1),
(@pregunta2_id, 'Regular', 2, 2),
(@pregunta2_id, 'Mala', 1, 3),
(@pregunta3_id, 'Sí', 3, 1),
(@pregunta3_id, 'No', 1, 2),
(@pregunta3_id, 'A Veces', 2, 3),
(@pregunta4_id, 'Sí', 3, 1),
(@pregunta4_id, 'No', 1, 2),
(@pregunta4_id, 'En Ocasiones', 2, 3); 