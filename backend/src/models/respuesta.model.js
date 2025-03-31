const db = require('../config/db.config');

class Respuesta {
  // Iniciar un nuevo cuestionario
  static async iniciarCuestionario(usuarioId, cuestionarioId) {
    const query = `
      INSERT INTO respuestas_cuestionarios (usuario_id, cuestionario_id, estado)
      VALUES (?, ?, 'iniciado')
      ON DUPLICATE KEY UPDATE 
        fecha_inicio = CURRENT_TIMESTAMP,
        estado = 'iniciado'
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId, cuestionarioId], (error, results) => {
        if (error) reject(error);
        
        if (results.insertId) {
          // Nueva inserción
          resolve(results.insertId);
        } else {
          // Actualización de existente, obtener el ID
          const queryGetId = 'SELECT id FROM respuestas_cuestionarios WHERE usuario_id = ? AND cuestionario_id = ?';
          db.query(queryGetId, [usuarioId, cuestionarioId], (error, selectResults) => {
            if (error) reject(error);
            resolve(selectResults[0].id);
          });
        }
      });
    });
  }

  // Guardar una respuesta individual
  static async guardarRespuesta(respuestaCuestionarioId, preguntaId, respuestaTexto) {
    const query = `
      INSERT INTO respuestas_preguntas (respuesta_cuestionario_id, pregunta_id, respuesta_texto)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        respuesta_texto = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [respuestaCuestionarioId, preguntaId, respuestaTexto, respuestaTexto], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  // Guardar múltiples respuestas en una sola operación
  static async guardarRespuestas(respuestaCuestionarioId, respuestas) {
    // respuestas es un array de objetos {pregunta_id, respuesta_texto}
    const promises = respuestas.map(resp => 
      this.guardarRespuesta(respuestaCuestionarioId, resp.pregunta_id, resp.respuesta_texto)
    );
    
    return Promise.all(promises);
  }

  // Completar un cuestionario (marcar como terminado)
  static async completarCuestionario(respuestaCuestionarioId) {
    const query = `
      UPDATE respuestas_cuestionarios 
      SET estado = 'completado', fecha_fin = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [respuestaCuestionarioId], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  // Verificar si un usuario ha completado un cuestionario
  static async verificarCuestionarioCompletado(usuarioId, cuestionarioId) {
    const query = `
      SELECT * FROM respuestas_cuestionarios 
      WHERE usuario_id = ? AND cuestionario_id = ? AND estado = 'completado'
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId, cuestionarioId], (error, results) => {
        if (error) reject(error);
        resolve(results.length > 0);
      });
    });
  }

  // Obtener estado de cuestionarios para un usuario
  static async getEstadoCuestionariosUsuario(usuarioId) {
    const query = `
      SELECT c.id, c.nombre, c.codigo, c.descripcion, 
        CASE WHEN rc.estado IS NULL THEN 'pendiente'
             ELSE rc.estado
        END AS estado,
        rc.fecha_inicio, rc.fecha_fin
      FROM cuestionarios c
      LEFT JOIN respuestas_cuestionarios rc ON c.id = rc.cuestionario_id AND rc.usuario_id = ?
      ORDER BY c.id
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }

  // Obtener todas las respuestas de un cuestionario específico para un usuario
  static async getRespuestasCuestionario(usuarioId, cuestionarioId) {
    const query = `
      SELECT p.id AS pregunta_id, p.texto, p.tipo, p.orden,
             rp.respuesta_texto, rp.created_at
      FROM preguntas p
      LEFT JOIN respuestas_cuestionarios rc ON rc.cuestionario_id = p.cuestionario_id AND rc.usuario_id = ?
      LEFT JOIN respuestas_preguntas rp ON rp.respuesta_cuestionario_id = rc.id AND rp.pregunta_id = p.id
      WHERE p.cuestionario_id = ?
      ORDER BY p.orden
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId, cuestionarioId], (error, results) => {
        if (error) reject(error);
        
        // Procesamos los resultados
        resolve(results);
      });
    });
  }

  // Reiniciar todos los cuestionarios de un usuario
  static async reiniciarCuestionarios(usuarioId) {
    try {
      // 1. Obtener los IDs de todas las respuestas_cuestionarios del usuario
      const respuestasIds = await new Promise((resolve, reject) => {
        db.query(
          'SELECT id FROM respuestas_cuestionarios WHERE usuario_id = ?',
          [usuarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results.map(row => row.id));
          }
        );
      });
      
      // 2. Eliminar todas las respuestas a preguntas asociadas a esos cuestionarios
      if (respuestasIds.length > 0) {
        await new Promise((resolve, reject) => {
          db.query(
            'DELETE FROM respuestas_preguntas WHERE respuesta_cuestionario_id IN (?)',
            [respuestasIds],
            (error) => {
              if (error) reject(error);
              resolve();
            }
          );
        });
      }
      
      // 3. Eliminar los registros de respuestas_cuestionarios
      await new Promise((resolve, reject) => {
        db.query(
          'DELETE FROM respuestas_cuestionarios WHERE usuario_id = ?',
          [usuarioId],
          (error) => {
            if (error) reject(error);
            resolve();
          }
        );
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Respuesta; 