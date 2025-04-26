-- Eliminar tablas anteriores relacionadas con cuestionarios
DROP TABLE IF EXISTS respuestas_preguntas;
DROP TABLE IF EXISTS opciones_preguntas;
DROP TABLE IF EXISTS respuestas_cuestionarios;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS cuestionarios;

-- Crear o asegurar que exista la tabla de usuarios (si no existiera)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'admin') DEFAULT 'usuario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nota: Todo el contenido relacionado con cuestionarios ha sido eliminado
-- Este archivo solo mantiene la estructura básica para la autenticación de usuarios 