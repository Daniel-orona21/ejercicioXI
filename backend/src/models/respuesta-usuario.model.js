const db = require('../database/db');

// Modelo para la tabla de respuestas de usuario
const RespuestaUsuario = {
  // Guardar respuesta de un usuario a una pregunta
  guardarRespuesta: async (usuarioId, preguntaId, opcionRespuestaId) => {
    try {
      const query = `
        INSERT INTO respuestas_usuario (usuario_id, pregunta_id, opcion_respuesta_id) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE opcion_respuesta_id = ?
      `;
      const [result] = await db.query(query, [usuarioId, preguntaId, opcionRespuestaId, opcionRespuestaId]);
      return result;
    } catch (error) {
      throw error;
    }
  },

  // Guardar múltiples respuestas de un usuario
  guardarMultiplesRespuestas: async (respuestas) => {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();
      
      for (const respuesta of respuestas) {
        const query = `
          INSERT INTO respuestas_usuario (usuario_id, pregunta_id, opcion_respuesta_id) 
          VALUES (?, ?, ?) 
          ON DUPLICATE KEY UPDATE opcion_respuesta_id = ?
        `;
        await connection.query(
          query, 
          [respuesta.usuarioId, respuesta.preguntaId, respuesta.opcionRespuestaId, respuesta.opcionRespuestaId]
        );
      }
      
      await connection.commit();
      return { success: true, message: 'Todas las respuestas fueron guardadas correctamente' };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  // Obtener todas las respuestas de un usuario
  getByUsuarioId: async (usuarioId) => {
    try {
      const query = `
        SELECT ru.*, p.texto as pregunta_texto, p.orden as pregunta_orden, p.es_opcional, 
               op.texto as respuesta_texto, op.valor as respuesta_valor
        FROM respuestas_usuario ru
        JOIN preguntas p ON ru.pregunta_id = p.id
        JOIN opciones_respuesta op ON ru.opcion_respuesta_id = op.id
        WHERE ru.usuario_id = ?
        ORDER BY p.orden
      `;
      const [rows] = await db.query(query, [usuarioId]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  // Verificar si un usuario ha respondido que es jefe
  esUsuarioJefe: async (usuarioId) => {
    try {
      // Consulta para obtener la respuesta a la pregunta 70 (¿Soy jefe de otros trabajadores?)
      const query = `
        SELECT ru.*, op.texto as respuesta_texto, op.valor as respuesta_valor
        FROM respuestas_usuario ru
        JOIN preguntas p ON ru.pregunta_id = p.id
        JOIN opciones_respuesta op ON ru.opcion_respuesta_id = op.id
        WHERE ru.usuario_id = ? AND p.orden = 70
      `;
      const [rows] = await db.query(query, [usuarioId]);
      if (rows.length === 0) return false;
      
      // Si la respuesta es "Siempre" o "Casi siempre", se considera que es jefe
      // Estos valores corresponden a los valores 4 y 3 en la tabla opciones_respuesta
      const esJefe = rows[0].respuesta_valor >= 3;
      return esJefe;
    } catch (error) {
      throw error;
    }
  },

  // Obtener el progreso de un usuario en el cuestionario
  getProgreso: async (usuarioId) => {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM preguntas WHERE es_opcional = FALSE) as total_obligatorias,
          (SELECT COUNT(*) FROM preguntas WHERE es_opcional = TRUE) as total_opcionales,
          (SELECT COUNT(*) FROM respuestas_usuario ru 
           JOIN preguntas p ON ru.pregunta_id = p.id 
           WHERE ru.usuario_id = ? AND p.es_opcional = FALSE) as respondidas_obligatorias,
          (SELECT COUNT(*) FROM respuestas_usuario ru 
           JOIN preguntas p ON ru.pregunta_id = p.id 
           WHERE ru.usuario_id = ? AND p.es_opcional = TRUE) as respondidas_opcionales
      `;
      const [rows] = await db.query(query, [usuarioId, usuarioId]);
      
      if (rows.length === 0) return {
        totalObligatorias: 0,
        totalOpcionales: 0,
        respondidasObligatorias: 0,
        respondidasOpcionales: 0,
        porcentajeTotal: 0
      };
      
      const data = rows[0];
      const totalObligatorias = parseInt(data.total_obligatorias) || 0;
      const totalOpcionales = parseInt(data.total_opcionales) || 0;
      const respondidasObligatorias = parseInt(data.respondidas_obligatorias) || 0;
      const respondidasOpcionales = parseInt(data.respondidas_opcionales) || 0;
      
      // Calcular si el usuario es jefe para determinar el total que debe responder
      const query2 = `
        SELECT ru.*, op.valor as respuesta_valor
        FROM respuestas_usuario ru
        JOIN preguntas p ON ru.pregunta_id = p.id
        JOIN opciones_respuesta op ON ru.opcion_respuesta_id = op.id
        WHERE ru.usuario_id = ? AND p.orden = 70
      `;
      
      const [rows2] = await db.query(query2, [usuarioId]);
      
      // Determinar si el usuario es jefe basado en su respuesta a la pregunta 70
      let esJefe = false;
      if (rows2.length > 0) {
        esJefe = rows2[0].respuesta_valor >= 3; // Valores 3 y 4 corresponden a "Casi siempre" y "Siempre"
      }
      
      // Calcular total que debe responder y porcentaje
      const totalAResponder = esJefe ? totalObligatorias + totalOpcionales : totalObligatorias;
      const totalRespondidas = respondidasObligatorias + (esJefe ? respondidasOpcionales : 0);
      const porcentajeTotal = totalAResponder > 0 ? Math.round((totalRespondidas / totalAResponder) * 100) : 0;
      
      return {
        totalObligatorias,
        totalOpcionales,
        respondidasObligatorias,
        respondidasOpcionales,
        esJefe,
        totalAResponder,
        totalRespondidas,
        porcentajeTotal
      };
    } catch (error) {
      throw error;
    }
  },

  // Obtener estadísticas generales de respuestas
  getEstadisticas: async () => {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT usuario_id) as total_usuarios,
          COUNT(*) as total_respuestas,
          (SELECT COUNT(*) FROM usuarios) as usuarios_registrados
      `;
      const [rows] = await db.query(query);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  // Borrar todas las respuestas de un usuario por su ID
  borrarPorUsuarioId: async (usuarioId) => {
    try {
      const query = `DELETE FROM respuestas_usuario WHERE usuario_id = ?`;
      const [result] = await db.query(query, [usuarioId]);
      return result;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = RespuestaUsuario; 