const db = require('../database/db');

// Modelo para la tabla de opciones de respuesta
const OpcionRespuesta = {
  // Obtener todas las opciones de respuesta
  getAll: async () => {
    try {
      const query = 'SELECT * FROM opciones_respuesta ORDER BY orden';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener una opción de respuesta por ID
  getById: async (id) => {
    try {
      const query = 'SELECT * FROM opciones_respuesta WHERE id = ?';
      const [rows] = await db.query(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = OpcionRespuesta; 