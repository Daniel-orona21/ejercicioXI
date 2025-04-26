const db = require('../database/db');

// Modelo para la tabla de opciones de respuesta
const OpcionRespuesta = {
  // Obtener todas las opciones de respuesta
  getAll: () => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM opciones_respuesta ORDER BY orden';
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Obtener una opción de respuesta por ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM opciones_respuesta WHERE id = ?';
      db.query(query, [id], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return resolve(null);
        resolve(result[0]);
      });
    });
  }
};

module.exports = OpcionRespuesta; 