const db = require('../database/db');

// Modelo para la tabla de preguntas
const Pregunta = {
  // Obtener todas las preguntas
  getAll: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM preguntas ORDER BY orden';
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener preguntas obligatorias (no opcionales)
  getObligatorias: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM preguntas WHERE es_opcional = FALSE ORDER BY orden';
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener preguntas opcionales (solo para jefes)
  getOpcionales: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM preguntas WHERE es_opcional = TRUE ORDER BY orden';
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener una pregunta por ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM preguntas WHERE id = ?';
      db.query(query, [id], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return resolve(null);
        resolve(result[0]);
      });
    });
  },

  // Verificar si una pregunta es la que pregunta si es jefe
  esJefePregunta: (id) => {
    return new Promise((resolve, reject) => {
      // La pregunta 68 es "Soy jefe de otros trabajadores"
      const query = 'SELECT * FROM preguntas WHERE orden = 68';
      db.query(query, (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return resolve(false);
        resolve(result[0].id === parseInt(id));
      });
    });
  }
};

module.exports = Pregunta; 