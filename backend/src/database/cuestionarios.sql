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

-- Insertar las preguntas (68 principales + 4 opcionales)
INSERT INTO preguntas (texto, es_opcional, orden) VALUES
('Mi trabajo me exige hacer mucho esfuerzo físico.', FALSE, 1),
('Me preocupa sufrir un accidente en mi trabajo.', FALSE, 2),
('Considero que las actividades que realizo son peligrosas.', FALSE, 3),
('Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno.', FALSE, 4),
('Por la cantidad de trabajo que tengo debo laborar sin parar o con pocos descansos.', FALSE, 5),
('Considero que es necesario mantener un ritmo de trabajo acelerado.', FALSE, 6),
('Mi trabajo exige que esté muy concentrado.', FALSE, 7),
('Mi trabajo requiere que memorice mucha información.', FALSE, 8),
('Mi trabajo exige que atienda varios asuntos al mismo tiempo.', FALSE, 9),
('En mi trabajo soy responsable de cosas de mucho valor.', FALSE, 10),
('Respondo ante mi jefe por los resultados de toda mi área de trabajo.', FALSE, 11),
('En mi trabajo me dan órdenes contradictorias.', FALSE, 12),
('Considero que en mi trabajo se cometen muchos errores.', FALSE, 13),
('Las actividades que realizo son muy complejas.', FALSE, 14),
('En mi trabajo tengo que tomar decisiones difíciles muy rápido.', FALSE, 15),
('Mi trabajo exige que atienda personas muy necesitadas de ayuda o enfermas.', FALSE, 16),
('Mi trabajo exige atender situaciones de violencia.', FALSE, 17),
('En mi trabajo me dan información insuficiente sobre cómo hacer mi trabajo.', FALSE, 18),
('Me explican claramente los resultados que debo obtener en mi trabajo.', FALSE, 19),
('Me informan con claridad cuáles son mis funciones.', FALSE, 20),
('Me explican claramente los objetivos de mi trabajo.', FALSE, 21),
('Mi trabajo permite que desarrolle nuevas habilidades.', FALSE, 22),
('En mi trabajo puedo aspirar a un mejor puesto.', FALSE, 23),
('En mi trabajo me permiten asistir a capacitaciones relacionadas con mi trabajo.', FALSE, 24),
('Mi trabajo me exige laborar en horarios inconvenientes.', FALSE, 25),
('Trabajo en horarios que dificultan convivir con mi familia y amigos.', FALSE, 26),
('Debo trasladarme más de dos horas diarias para ir y volver de mi trabajo.', FALSE, 27),
('Mi trabajo me exige hacer cosas en contra de mis valores.', FALSE, 28),
('En mi trabajo me discriminan por mi manera de pensar o por tener creencias diferentes.', FALSE, 29),
('En mi trabajo me insultan.', FALSE, 30),
('En mi trabajo me acosan o hostigan.', FALSE, 31),
('En mi trabajo existe el riesgo de que pueda sufrir violencia física.', FALSE, 32),
('En mi trabajo recibo apoyo de mis compañeros.', FALSE, 33),
('En mi trabajo puedo expresar libremente mis ideas.', FALSE, 34),
('Recibo críticas constantes a mi persona o a mi trabajo.', FALSE, 35),
('En mi trabajo me respetan los jefes.', FALSE, 36),
('Mis compañeros me ayudan cuando tengo dificultades.', FALSE, 37),
('En mi trabajo puedo confiar en mis compañeros.', FALSE, 38),
('En mi trabajo me reconocen cuando logro los resultados esperados.', FALSE, 39),
('Mi jefe ayuda a organizar mejor el trabajo.', FALSE, 40),
('Mi jefe me da libertad para que realice mi trabajo.', FALSE, 41),
('Mi jefe toma en cuenta mis puntos de vista y opiniones.', FALSE, 42),
('Mi jefe me ayuda a obtener los resultados del trabajo.', FALSE, 43),
('Contribuyo a que mi trabajo se logre.', FALSE, 44),
('Soy una persona en la que se puede confiar.', FALSE, 45),
('En mi trabajo me siento comprometido.', FALSE, 46),
('En mi trabajo me siento satisfecho.', FALSE, 47),
('Siento orgullo de laborar en este centro de trabajo.', FALSE, 48),
('Me siento feliz cuando estoy en mi trabajo.', FALSE, 49),
('Durante mi jornada de trabajo siento que el tiempo pasa volando.', FALSE, 50),
('Mi trabajo me resulta aburrido.', FALSE, 51),
('En mi trabajo tengo que esconder mis emociones.', FALSE, 52),
('En mi trabajo puedo expresar mis sentimientos.', FALSE, 53),
('En mi trabajo tengo la oportunidad de aprender cosas nuevas.', FALSE, 54),
('Me siento cansado(a) al final de mi jornada laboral.', FALSE, 55),
('Siento que mi trabajo me agota emocionalmente.', FALSE, 56),
('Me siento frustrado(a) en mi trabajo.', FALSE, 57),
('Siento que mi trabajo me consume.', FALSE, 58),
('Cuando me levanto para ir a trabajar siento desgano.', FALSE, 59),
('Me cuesta mucho iniciar mis actividades laborales.', FALSE, 60),
('Siento que algo malo puede pasarme en el trabajo.', FALSE, 61),
('Siento que mi trabajo afecta mi vida familiar.', FALSE, 62),
('En mi trabajo puedo tomar decisiones que afectan a otras personas.', FALSE, 63),
('Me esfuerzo por lograr los objetivos de mi trabajo.', FALSE, 64),
('Me involucro en las decisiones importantes de mi trabajo.', FALSE, 65),
('Me siento presionado por el tiempo para cumplir con mis tareas.', FALSE, 66),
('Me exigen resultados que no dependen completamente de mí.', FALSE, 67),
('Soy jefe de otros trabajadores.', FALSE, 68),
('Comunican tarde los asuntos de trabajo.', TRUE, 69),
('Dificultan el logro de los resultados del trabajo.', TRUE, 70),
('Cooperan poco cuando se necesita.', TRUE, 71),
('Ignoran las sugerencias para mejorar su trabajo.', TRUE, 72);

-- Índices adicionales para mejorar el rendimiento
CREATE INDEX idx_pregunta_orden ON preguntas(orden);
CREATE INDEX idx_respuesta_fecha ON respuestas_usuario(fecha_respuesta); 