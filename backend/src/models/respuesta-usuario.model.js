const db = require('../database/db');

// Modelo para la tabla de respuestas de usuario
const RespuestaUsuario = {
  // Guardar respuesta de un usuario a una pregunta
  guardarRespuesta: (usuarioId, preguntaId, opcionRespuestaId) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO respuestas_usuario (usuario_id, pregunta_id, opcion_respuesta_id) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE opcion_respuesta_id = ?
      `;
      db.query(query, [usuarioId, preguntaId, opcionRespuestaId, opcionRespuestaId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Guardar múltiples respuestas de un usuario
  guardarMultiplesRespuestas: (respuestas) => {
    return new Promise((resolve, reject) => {
      // Crear una transacción para garantizar que todas las respuestas se guardan o ninguna
      db.beginTransaction(err => {
        if (err) return reject(err);

        const promises = respuestas.map(respuesta => {
          return new Promise((resolve, reject) => {
            const query = `
              INSERT INTO respuestas_usuario (usuario_id, pregunta_id, opcion_respuesta_id) 
              VALUES (?, ?, ?) 
              ON DUPLICATE KEY UPDATE opcion_respuesta_id = ?
            `;
            db.query(
              query, 
              [respuesta.usuarioId, respuesta.preguntaId, respuesta.opcionRespuestaId, respuesta.opcionRespuestaId], 
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
          });
        });

        Promise.all(promises)
          .then(() => {
            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  reject(err);
                });
              }
              resolve({ success: true, message: 'Todas las respuestas fueron guardadas correctamente' });
            });
          })
          .catch(err => {
            db.rollback(() => {
              reject(err);
            });
          });
      });
    });
  },

  // Obtener todas las respuestas de un usuario
  getByUsuarioId: (usuarioId) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT ru.*, p.texto as pregunta_texto, p.orden as pregunta_orden, p.es_opcional, 
               op.texto as respuesta_texto, op.valor as respuesta_valor
        FROM respuestas_usuario ru
        JOIN preguntas p ON ru.pregunta_id = p.id
        JOIN opciones_respuesta op ON ru.opcion_respuesta_id = op.id
        WHERE ru.usuario_id = ?
        ORDER BY p.orden
      `;
      db.query(query, [usuarioId], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  // Verificar si un usuario ha respondido que es jefe
  esUsuarioJefe: (usuarioId) => {
    return new Promise((resolve, reject) => {
      // Consulta para obtener la respuesta a la pregunta 68 (¿Soy jefe de otros trabajadores?)
      const query = `
        SELECT ru.*, op.texto as respuesta_texto, op.valor as respuesta_valor
        FROM respuestas_usuario ru
        JOIN preguntas p ON ru.pregunta_id = p.id
        JOIN opciones_respuesta op ON ru.opcion_respuesta_id = op.id
        WHERE ru.usuario_id = ? AND p.orden = 68
      `;
      db.query(query, [usuarioId], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return resolve(false);
        
        // Si la respuesta es "Siempre" o "Casi siempre", se considera que es jefe
        // Estos valores corresponden a los valores 4 y 3 en la tabla opciones_respuesta
        const esJefe = result[0].respuesta_valor >= 3;
        resolve(esJefe);
      });
    });
  },

  // Obtener el progreso de un usuario en el cuestionario
  getProgreso: (usuarioId) => {
    return new Promise((resolve, reject) => {
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
      db.query(query, [usuarioId, usuarioId], (err, result) => {
        if (err) return reject(err);
        if (result.length === 0) return resolve({
          totalObligatorias: 0,
          totalOpcionales: 0,
          respondidasObligatorias: 0,
          respondidasOpcionales: 0,
          porcentajeTotal: 0
        });
        
        const data = result[0];
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
          WHERE ru.usuario_id = ? AND p.orden = 68
        `;
        
        db.query(query2, [usuarioId], (err, result2) => {
          if (err) return reject(err);
          
          // Determinar si el usuario es jefe basado en su respuesta a la pregunta 68
          let esJefe = false;
          if (result2.length > 0) {
            esJefe = result2[0].respuesta_valor >= 3; // Valores 3 y 4 corresponden a "Casi siempre" y "Siempre"
          }
          
          // Calcular total que debe responder y porcentaje
          const totalAResponder = esJefe ? totalObligatorias + totalOpcionales : totalObligatorias;
          const totalRespondidas = respondidasObligatorias + (esJefe ? respondidasOpcionales : 0);
          const porcentajeTotal = totalAResponder > 0 ? Math.round((totalRespondidas / totalAResponder) * 100) : 0;
          
          resolve({
            totalObligatorias,
            totalOpcionales,
            respondidasObligatorias,
            respondidasOpcionales,
            esJefe,
            totalAResponder,
            totalRespondidas,
            porcentajeTotal
          });
        });
      });
    });
  },

  // Obtener estadísticas generales de respuestas
  getEstadisticas: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(DISTINCT usuario_id) as total_usuarios,
          COUNT(*) as total_respuestas,
          (SELECT COUNT(*) FROM usuarios) as usuarios_registrados
      `;
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });
  }
};

module.exports = RespuestaUsuario; 