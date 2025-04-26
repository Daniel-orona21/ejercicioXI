const db = require('../database/db');

// Modelo para la tabla de preguntas
const Pregunta = {
  // Obtener todas las preguntas
  getAll: async () => {
    try {
      const query = 'SELECT * FROM preguntas ORDER BY orden';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener preguntas obligatorias (no opcionales)
  getObligatorias: async () => {
    try {
      const query = 'SELECT * FROM preguntas WHERE es_opcional = FALSE ORDER BY orden';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener preguntas opcionales (solo para jefes)
  getOpcionales: async () => {
    try {
      const query = 'SELECT * FROM preguntas WHERE es_opcional = TRUE ORDER BY orden';
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener una pregunta por ID
  getById: async (id) => {
    try {
      const query = 'SELECT * FROM preguntas WHERE id = ?';
      const [rows] = await db.query(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si una pregunta es la que pregunta si es jefe
  esJefePregunta: async (id) => {
    try {
      // La pregunta 70 es "Soy jefe de otros trabajadores:"
      const query = 'SELECT * FROM preguntas WHERE orden = 70';
      const [rows] = await db.query(query);
      return rows.length ? rows[0].id === parseInt(id) : false;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = Pregunta; 