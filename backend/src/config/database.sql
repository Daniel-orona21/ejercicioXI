CREATE DATABASE IF NOT EXISTS factores_riesgo_psicosocial;
USE factores_riesgo_psicosocial;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para almacenar los cuestionarios
CREATE TABLE IF NOT EXISTS cuestionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para almacenar las preguntas de los cuestionarios
CREATE TABLE IF NOT EXISTS preguntas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cuestionario_id INT NOT NULL,
    texto TEXT NOT NULL,
    tipo ENUM('si_no', 'likert', 'opcion_multiple') NOT NULL,
    opciones JSON NULL,
    orden INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cuestionario_id) REFERENCES cuestionarios(id)
);

-- Tabla para almacenar las respuestas de los usuarios
CREATE TABLE IF NOT EXISTS respuestas_cuestionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    cuestionario_id INT NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    estado ENUM('iniciado', 'completado') DEFAULT 'iniciado',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cuestionario_id) REFERENCES cuestionarios(id),
    UNIQUE KEY(usuario_id, cuestionario_id)
);

-- Tabla para almacenar los detalles de las respuestas
CREATE TABLE IF NOT EXISTS respuestas_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    respuesta_cuestionario_id INT NOT NULL,
    pregunta_id INT NOT NULL,
    respuesta_texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (respuesta_cuestionario_id) REFERENCES respuestas_cuestionarios(id),
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id),
    UNIQUE KEY(respuesta_cuestionario_id, pregunta_id)
);

-- Datos iniciales para la tabla de cuestionarios
INSERT INTO cuestionarios (nombre, codigo, descripcion) VALUES 
('Cuestionario de Traumáticos Severos', 'traumaticos', 'Identificación de eventos traumáticos en el entorno laboral'),
('Evaluación de los Factores de Riesgo Psicosocial', 'factores', 'Identificación de factores de riesgo psicosocial en el entorno laboral'),
('Evaluación del Entorno Organizacional', 'entorno', 'Evaluación de diferentes aspectos del entorno organizacional');

-- Datos iniciales para las preguntas del cuestionario de traumáticos severos
INSERT INTO preguntas (cuestionario_id, texto, tipo, opciones, orden) VALUES
(1, '¿Ha presenciado o sufrido alguna amenaza directa a su vida o salud en su lugar de trabajo?', 'si_no', NULL, 1),
(1, '¿Ha experimentado violencia física, agresiones o amenazas graves en su entorno laboral?', 'si_no', NULL, 2),
(1, '¿Ha estado involucrado en accidentes graves o situaciones de emergencia dentro de la empresa?', 'si_no', NULL, 3),
(1, '¿Ha sido testigo de eventos que hayan puesto en riesgo la integridad de un compañero de trabajo?', 'si_no', NULL, 4),
(1, '¿Ha recibido apoyo adecuado de la organización tras un acontecimiento traumático?', 'si_no', NULL, 5),
(1, '¿Siente que su salud emocional ha sido afectada por algún evento ocurrido en su trabajo?', 'si_no', NULL, 6);

-- Datos iniciales para las preguntas del cuestionario de factores de riesgo psicosocial
INSERT INTO preguntas (cuestionario_id, texto, tipo, opciones, orden) VALUES
(2, '¿Siente presión excesiva en el trabajo debido a la carga laboral?', 'likert', '["1", "2", "3", "4", "5"]', 1),
(2, '¿Considera que su horario laboral afecta su calidad de vida?', 'likert', '["1", "2", "3", "4", "5"]', 2),
(2, '¿Ha experimentado acoso o maltrato en su trabajo?', 'likert', '["1", "2", "3", "4", "5"]', 3),
(2, '¿Siente que la organización no valora su esfuerzo?', 'likert', '["1", "2", "3", "4", "5"]', 4),
(2, '¿Se siente constantemente fatigado o estresado por el trabajo?', 'likert', '["1", "2", "3", "4", "5"]', 5);

-- Datos iniciales para las preguntas del cuestionario de entorno organizacional
INSERT INTO preguntas (cuestionario_id, texto, tipo, opciones, orden) VALUES
(3, '¿Recibe apoyo de sus superiores en la realización de su trabajo?', 'opcion_multiple', '["Siempre", "A veces", "Nunca"]', 1),
(3, '¿Existe comunicación efectiva entre los empleados y la dirección?', 'opcion_multiple', '["Buena", "Regular", "Mala"]', 2),
(3, '¿Recibe capacitación adecuada para desempeñar sus funciones?', 'opcion_multiple', '["Sí", "No", "A Veces"]', 3),
(3, '¿Considera que el ambiente laboral es saludable y colaborativo?', 'opcion_multiple', '["Sí", "No", "En Ocasiones"]', 4); 