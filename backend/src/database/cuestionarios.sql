-- Desactivar temporalmente verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas si existen (en orden inverso de dependencias)
DROP TABLE IF EXISTS respuestas_usuario;
DROP TABLE IF EXISTS opciones_respuesta;
DROP TABLE IF EXISTS preguntas;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Mantener la tabla de usuarios (solo incluimos la declaración por referencia)
-- La tabla usuarios ya existe con la siguiente estructura:
-- CREATE TABLE IF NOT EXISTS usuarios (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   nombre VARCHAR(255) NOT NULL,
--   email VARCHAR(255) NOT NULL UNIQUE,
--   password VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- Crear tabla de preguntas
CREATE TABLE preguntas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  texto TEXT NOT NULL,
  es_opcional BOOLEAN DEFAULT FALSE COMMENT 'TRUE para preguntas que solo responden jefes',
  orden INT NOT NULL COMMENT 'Número de la pregunta en el cuestionario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de opciones de respuesta
CREATE TABLE opciones_respuesta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  texto VARCHAR(50) NOT NULL,
  valor INT NOT NULL COMMENT 'Valor numérico para cálculos',
  orden INT NOT NULL COMMENT 'Orden de presentación de las opciones',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla para respuestas de usuarios
CREATE TABLE respuestas_usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  pregunta_id INT NOT NULL,
  opcion_respuesta_id INT NOT NULL,
  fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (pregunta_id) REFERENCES preguntas(id) ON DELETE CASCADE,
  FOREIGN KEY (opcion_respuesta_id) REFERENCES opciones_respuesta(id) ON DELETE CASCADE,
  UNIQUE KEY usuario_pregunta (usuario_id, pregunta_id) COMMENT 'Un usuario solo puede responder una vez a cada pregunta'
);

-- Insertar las opciones de respuesta
INSERT INTO opciones_respuesta (texto, valor, orden) VALUES
('Siempre', 4, 1),
('Casi siempre', 3, 2),
('Algunas veces', 2, 3),
('Casi nunca', 1, 4),
('Nunca', 0, 5);

-- Insertar las preguntas
INSERT INTO preguntas (texto, es_opcional, orden) VALUES
('El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica', 0, 1),
('Mi trabajo me exige hacer mucho esfuerzo físico', 0, 2),
('Me preocupa sufrir un accidente en mi trabajo', 0, 3),
('Considero que en mi trabajo se aplican las normas de seguridad y salud en el trabajo', 0, 4),
('Considero que las actividades que realizo son peligrosas', 0, 5),
('Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno', 0, 6),
('Por la cantidad de trabajo que tengo debo trabajar sin parar', 0, 7),
('Considero que es necesario mantener un ritmo de trabajo acelerado', 0, 8),
('Mi trabajo exige que esté muy concentrado', 0, 9),
('Mi trabajo requiere que memorice mucha información', 0, 10),
('En mi trabajo tengo que tomar decisiones difíciles muy rápido', 0, 11),
('Mi trabajo exige que atienda varios asuntos al mismo tiempo', 0, 12),
('En mi trabajo soy responsable de cosas de mucho valor', 0, 13),
('Respondo ante mi jefe por los resultados de toda mi área de trabajo', 0, 14),
('En el trabajo me dan órdenes contradictorias', 0, 15),
('Considero que en mi trabajo me piden hacer cosas innecesarias', 0, 16),
('Trabajo horas extras más de tres veces a la semana', 0, 17),
('Mi trabajo me exige laborar en días de descanso, festivos o fines de semana', 0, 18),
('Considero que el tiempo en el trabajo es mucho y perjudica mis actividades familiares o personales', 0, 19),
('Debo atender asuntos de trabajo cuando estoy en casa', 0, 20),
('Pienso en las actividades familiares o personales cuando estoy en mi trabajo', 0, 21),
('Pienso que mis responsabilidades familiares afectan mi trabajo', 0, 22),
('Mi trabajo permite que desarrolle nuevas habilidades', 0, 23),
('En mi trabajo puedo aspirar a un mejor puesto', 0, 24),
('Durante mi jornada de trabajo puedo tomar pausas cuando las necesito', 0, 25),
('Puedo decidir cuánto trabajo realizo durante la jornada laboral', 0, 26),
('Puedo decidir la velocidad a la que realizo mis actividades en mi trabajo', 0, 27),
('Puedo cambiar el orden de las actividades que realizo en mi trabajo', 0, 28),
('Los cambios que se presentan en mi trabajo dificultan mi labor', 0, 29),
('Cuando se presentan cambios en mi trabajo se tienen en cuenta mis ideas o aportaciones', 0, 30),
('Me informan con claridad cuáles son mis funciones', 0, 31),
('Me explican claramente los resultados que debo obtener en mi trabajo', 0, 32),
('Me explican claramente los objetivos de mi trabajo', 0, 33),
('Me informan con quién puedo resolver problemas o asuntos de trabajo', 0, 34),
('Me permiten asistir a capacitaciones relacionadas con mi trabajo', 0, 35),
('Recibo capacitación útil para hacer mi trabajo', 0, 36),
('Mi jefe ayuda a organizar mejor el trabajo', 0, 37),
('Mi jefe tiene en cuenta mis puntos de vista y opiniones', 0, 38),
('Mi jefe me comunica a tiempo la información relacionada con el trabajo', 0, 39),
('La orientación que me da mi jefe me ayuda a realizar mejor mi trabajo', 0, 40),
('Mi jefe ayuda a solucionar los problemas que se presentan en el trabajo', 0, 41),
('Puedo confiar en mis compañeros de trabajo', 0, 42),
('Entre compañeros solucionamos los problemas de trabajo de forma respetuosa', 0, 43),
('En mi trabajo me hacen sentir parte del grupo', 0, 44),
('Cuando tenemos que realizar trabajo de equipo los compañeros colaboran', 0, 45),
('Mis compañeros de trabajo me ayudan cuando tengo dificultades', 0, 46),
('Me informan sobre lo que hago bien en mi trabajo', 0, 47),
('La forma como evalúan mi trabajo en mi centro de trabajo me ayuda a mejorar mi desempeño', 0, 48),
('En mi centro de trabajo me pagan a tiempo mi salario', 0, 49),
('El pago que recibo es el que merezco por el trabajo que realizo', 0, 50),
('Si obtengo los resultados esperados en mi trabajo me recompensan o reconocen', 0, 51),
('Las personas que hacen bien el trabajo pueden crecer laboralmente', 0, 52),
('Considero que mi trabajo es estable', 0, 53),
('En mi trabajo existe continua rotación de personal', 0, 54),
('Siento orgullo de laborar en este centro de trabajo', 0, 55),
('Me siento comprometido con mi trabajo', 0, 56),
('En mi trabajo puedo expresarme libremente sin interrupciones', 0, 57),
('Recibo críticas constantes a mi persona y/o trabajo', 0, 58),
('Recibo burlas, calumnias, difamaciones, humillaciones o ridiculizaciones', 0, 59),
('Se ignora mi presencia o se me excluye de las reuniones de trabajo y en la toma de decisiones', 0, 60),
('Se manipulan las situaciones de trabajo para hacerme parecer un mal trabajador', 0, 61),
('Se ignoran mis éxitos laborales y se atribuyen a otros trabajadores', 0, 62),
('Me bloquean o impiden las oportunidades que tengo para obtener ascenso o mejora en mi trabajo', 0, 63),
('He presenciado actos de violencia en mi centro de trabajo', 0, 64),
('En mi trabajo debo brindar servicio a clientes o usuarios:', 0, 65),
('Atiendo clientes o usuarios muy enojados', 1, 66),
('Mi trabajo me exige atender personas muy necesitadas de ayuda o enfermas', 1, 67),
('Para hacer mi trabajo debo demostrar sentimientos distintos a los míos', 1, 68),
('Mi trabajo me exige atender situaciones de violencia', 1, 69),
('Soy jefe de otros trabajadores:', 0, 70),
('Comunican tarde los asuntos de trabajo', 1, 71),
('Dificultan el logro de los resultados del trabajo', 1, 72),
('Cooperan poco cuando se necesita', 1, 73),
('Ignoran las sugerencias para mejorar su trabajo', 1, 74);

-- Índices adicionales para mejorar el rendimiento
CREATE INDEX idx_pregunta_orden ON preguntas(orden);
CREATE INDEX idx_respuesta_fecha ON respuestas_usuario(fecha_respuesta); 