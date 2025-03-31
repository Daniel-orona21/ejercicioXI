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
    try {
      // 1. Primero verificamos que la pregunta corresponda al cuestionario correcto
      const respuestaCuestionario = await new Promise((resolve, reject) => {
        db.query(
          'SELECT rc.cuestionario_id FROM respuestas_cuestionarios rc WHERE rc.id = ?',
          [respuestaCuestionarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results[0]);
          }
        );
      });
      
      if (!respuestaCuestionario) {
        throw new Error(`No se encontró el registro de respuesta con id ${respuestaCuestionarioId}`);
      }
      
      const cuestionarioId = respuestaCuestionario.cuestionario_id;
      
      // 2. Verificamos que la pregunta pertenece al cuestionario
      const preguntaInfo = await new Promise((resolve, reject) => {
        db.query(
          'SELECT p.* FROM preguntas p WHERE p.id = ? AND p.cuestionario_id = ?',
          [preguntaId, cuestionarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results[0]);
          }
        );
      });
      
      // Si la pregunta no pertenece a este cuestionario, buscamos una pregunta equivalente que sí pertenezca
      if (!preguntaInfo) {
        console.warn(`Pregunta ${preguntaId} no pertenece al cuestionario ${cuestionarioId}. Buscando equivalente...`);
        
        // 3. Obtenemos información de la pregunta original para buscar su orden
        const preguntaOriginal = await new Promise((resolve, reject) => {
          db.query(
            'SELECT p.* FROM preguntas p WHERE p.id = ?',
            [preguntaId],
            (error, results) => {
              if (error) reject(error);
              resolve(results[0]);
            }
          );
        });
        
        if (!preguntaOriginal) {
          throw new Error(`No se encontró la pregunta con id ${preguntaId}`);
        }
        
        // 4. Buscamos una pregunta con el mismo orden en el cuestionario correcto
        const preguntaCorrecta = await new Promise((resolve, reject) => {
          db.query(
            'SELECT p.* FROM preguntas p WHERE p.cuestionario_id = ? AND p.orden = ?',
            [cuestionarioId, preguntaOriginal.orden],
            (error, results) => {
              if (error) reject(error);
              resolve(results[0]);
            }
          );
        });
        
        if (!preguntaCorrecta) {
          throw new Error(`No se encontró una pregunta equivalente en el cuestionario ${cuestionarioId}`);
        }
        
        // Usamos el ID de la pregunta correcta
        preguntaId = preguntaCorrecta.id;
        console.log(`Corregido: Usando pregunta ${preguntaId} del cuestionario ${cuestionarioId}`);
      }
      
      // 5. Ahora guardamos la respuesta con la pregunta correcta
      const query = `
        INSERT INTO respuestas_preguntas (respuesta_cuestionario_id, pregunta_id, respuesta_texto)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          respuesta_texto = ?
      `;
      
      return new Promise((resolve, reject) => {
        db.query(query, [respuestaCuestionarioId, preguntaId, respuestaTexto, respuestaTexto], (error, results) => {
          if (error) reject(error);
          resolve({
            success: true,
            message: 'Respuesta guardada correctamente',
            preguntaId,
            cuestionarioId
          });
        });
      });
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
      throw error;
    }
  }

  // Guardar múltiples respuestas en una sola operación
  static async guardarRespuestas(respuestaCuestionarioId, respuestas) {
    try {
      // 1. Obtenemos el ID del cuestionario
      const respuestaCuestionario = await new Promise((resolve, reject) => {
        db.query(
          'SELECT rc.cuestionario_id FROM respuestas_cuestionarios rc WHERE rc.id = ?',
          [respuestaCuestionarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results[0]);
          }
        );
      });
      
      if (!respuestaCuestionario) {
        throw new Error(`No se encontró el registro de respuesta con id ${respuestaCuestionarioId}`);
      }
      
      const cuestionarioId = respuestaCuestionario.cuestionario_id;
      
      // 2. Obtenemos todas las preguntas del cuestionario
      const preguntasDelCuestionario = await new Promise((resolve, reject) => {
        db.query(
          'SELECT * FROM preguntas WHERE cuestionario_id = ? ORDER BY orden',
          [cuestionarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results);
          }
        );
      });
      
      // Crear un mapa de orden -> id_pregunta para este cuestionario
      const mapaPreguntasPorOrden = new Map();
      preguntasDelCuestionario.forEach(pregunta => {
        mapaPreguntasPorOrden.set(pregunta.orden, pregunta.id);
      });
      
      // 3. Para cada respuesta, verificamos que corresponda a una pregunta de este cuestionario
      const respuestasCorregidas = [];
      let numCorrecciones = 0;
      
      for (const respuesta of respuestas) {
        // Obtenemos la información de la pregunta original
        const preguntaOriginal = await new Promise((resolve, reject) => {
          db.query(
            'SELECT * FROM preguntas WHERE id = ?',
            [respuesta.pregunta_id],
            (error, results) => {
              if (error) reject(error);
              resolve(results[0]);
            }
          );
        });
        
        if (!preguntaOriginal) {
          console.warn(`No se encontró la pregunta con id ${respuesta.pregunta_id}. Omitiendo respuesta.`);
          continue;
        }
        
        // Verificamos si la pregunta pertenece al cuestionario correcto
        if (preguntaOriginal.cuestionario_id !== cuestionarioId) {
          // Buscamos una pregunta equivalente usando el orden
          const idPreguntaCorrecta = mapaPreguntasPorOrden.get(preguntaOriginal.orden);
          
          if (!idPreguntaCorrecta) {
            console.warn(`No se encontró una pregunta equivalente en el cuestionario ${cuestionarioId}. Omitiendo respuesta.`);
            continue;
          }
          
          console.log(`Corrigiendo respuesta: Pregunta ${respuesta.pregunta_id} cambiada por ${idPreguntaCorrecta}`);
          respuestasCorregidas.push({
            pregunta_id: idPreguntaCorrecta,
            respuesta_texto: respuesta.respuesta_texto
          });
          numCorrecciones++;
        } else {
          // Si la pregunta es correcta, la añadimos sin cambios
          respuestasCorregidas.push(respuesta);
        }
      }
      
      console.log(`Guardando ${respuestasCorregidas.length} respuestas (${numCorrecciones} corregidas)`);
      
      // 4. Guardamos las respuestas corregidas
      const promises = respuestasCorregidas.map(resp => 
        this.guardarRespuesta(respuestaCuestionarioId, resp.pregunta_id, resp.respuesta_texto)
      );
      
      const resultados = await Promise.all(promises);
      
      return {
        success: true,
        message: `Guardadas ${respuestasCorregidas.length} respuestas correctamente (${numCorrecciones} corregidas)`,
        resultados
      };
    } catch (error) {
      console.error('Error al guardar múltiples respuestas:', error);
      throw error;
    }
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
      SELECT 
        p.id AS preguntaId, 
        p.texto AS preguntaTexto, 
        p.tipo, 
        p.orden,
        rp.respuesta_texto AS respuestaTexto, 
        rp.created_at AS fechaRespuesta,
        rc.estado AS estadoCuestionario
      FROM preguntas p
      LEFT JOIN respuestas_cuestionarios rc ON rc.cuestionario_id = p.cuestionario_id AND rc.usuario_id = ?
      LEFT JOIN respuestas_preguntas rp ON rp.respuesta_cuestionario_id = rc.id AND rp.pregunta_id = p.id
      WHERE p.cuestionario_id = ?
      ORDER BY p.orden
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId, cuestionarioId], (error, results) => {
        if (error) reject(error);
        
        // Procesamos los resultados para que sean más fáciles de usar en el frontend
        const respuestasFormateadas = results.map(row => ({
          preguntaId: row.preguntaId,
          preguntaTexto: row.preguntaTexto,
          tipo: row.tipo,
          orden: row.orden,
          respuestaTexto: row.respuestaTexto || 'Sin respuesta',
          fechaRespuesta: row.fechaRespuesta ? new Date(row.fechaRespuesta).toISOString() : null,
          estadoCuestionario: row.estadoCuestionario || 'pendiente'
        }));
        
        resolve(respuestasFormateadas);
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

  // Obtener todas las respuestas de un usuario incluyendo detalles de usuarios, cuestionarios y preguntas
  static async getAllRespuestasDetalladasUsuario(usuarioId) {
    // Usamos una única consulta que obtiene directamente las respuestas con joins a todas las tablas necesarias
    const query = `
      SELECT 
        u.id AS usuario_id,
        u.nombre AS usuario_nombre,
        c.id AS cuestionario_id,
        c.nombre AS cuestionario_nombre,
        c.codigo AS cuestionario_codigo,
        c.descripcion AS cuestionario_descripcion,
        p.id AS pregunta_id,
        p.texto AS pregunta_texto,
        p.tipo AS pregunta_tipo,
        p.orden AS pregunta_orden,
        p.cuestionario_id AS pregunta_cuestionario_id,
        rp.respuesta_texto,
        rp.respuesta_valor,
        rp.created_at AS fecha_respuesta,
        rc.estado AS estado_cuestionario
      FROM 
        usuarios u
      JOIN 
        respuestas_cuestionarios rc ON u.id = rc.usuario_id
      JOIN 
        cuestionarios c ON rc.cuestionario_id = c.id
      JOIN 
        respuestas_preguntas rp ON rc.id = rp.respuesta_cuestionario_id
      JOIN 
        preguntas p ON rp.pregunta_id = p.id
      WHERE 
        u.id = ?
      ORDER BY 
        c.id, p.orden
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [usuarioId], (error, results) => {
        if (error) reject(error);
        
        if (!results || results.length === 0) {
          resolve([]);
          return;
        }
        
        // Procesamos los resultados para organizarlos por cuestionario
        const cuestionariosMap = new Map();
        
        // Agrupar por cuestionario
        results.forEach(row => {
          // Si no existe el cuestionario en el mapa, lo agregamos
          if (!cuestionariosMap.has(row.cuestionario_id)) {
            cuestionariosMap.set(row.cuestionario_id, {
              id: row.cuestionario_id,
              nombre: row.cuestionario_nombre,
              codigo: row.cuestionario_codigo,
              descripcion: row.cuestionario_descripcion,
              respuestas: []
            });
          }
          
          // Solo agregamos la respuesta si la pregunta pertenece realmente a este cuestionario
          if (row.pregunta_cuestionario_id === row.cuestionario_id) {
            // Agregamos la respuesta al cuestionario correspondiente
            cuestionariosMap.get(row.cuestionario_id).respuestas.push({
              preguntaId: row.pregunta_id,
              preguntaTexto: row.pregunta_texto,
              preguntaTipo: row.pregunta_tipo,
              preguntaOrden: row.pregunta_orden,
              preguntaCuestionarioId: row.pregunta_cuestionario_id,
              respuestaTexto: row.respuesta_texto,
              respuestaValor: row.respuesta_valor,
              fechaRespuesta: row.fecha_respuesta
            });
          } else {
            console.warn(`Inconsistencia: La pregunta ${row.pregunta_id} está asociada al cuestionario ${row.pregunta_cuestionario_id} pero respondida en el cuestionario ${row.cuestionario_id}`);
          }
        });
        
        // Convertimos el mapa a un array de cuestionarios
        const cuestionariosConRespuestas = Array.from(cuestionariosMap.values());
        
        // Para cada cuestionario, determinamos si tiene respuestas válidas
        cuestionariosConRespuestas.forEach(cuestionario => {
          cuestionario.tieneRespuestas = cuestionario.respuestas.some(
            resp => resp.respuestaTexto && resp.respuestaTexto !== 'Sin respuesta'
          );
        });
        
        resolve(cuestionariosConRespuestas);
      });
    });
  }

  // Obtener todas las preguntas de un cuestionario específico
  static async getPreguntasPorCuestionario(cuestionarioId) {
    const query = `
      SELECT 
        id,
        texto,
        tipo,
        orden,
        cuestionario_id
      FROM 
        preguntas
      WHERE 
        cuestionario_id = ?
      ORDER BY 
        orden
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [cuestionarioId], (error, results) => {
        if (error) reject(error);
        resolve(results);
      });
    });
  }
  
  // Corregir respuestas asociadas incorrectamente a preguntas
  static async corregirRespuestasIncorrectas(usuarioId) {
    try {
      // Obtener los cuestionarios que el usuario ha respondido
      const cuestionariosRespondidos = await new Promise((resolve, reject) => {
        db.query(
          `SELECT DISTINCT c.id, c.codigo
           FROM cuestionarios c
           JOIN respuestas_cuestionarios rc ON rc.cuestionario_id = c.id
           WHERE rc.usuario_id = ?`,
          [usuarioId],
          (error, results) => {
            if (error) reject(error);
            resolve(results);
          }
        );
      });

      // Si no hay cuestionarios respondidos, no hay nada que corregir
      if (!cuestionariosRespondidos.length) {
        return { success: true, message: 'No hay respuestas que corregir', correccionesRealizadas: 0 };
      }

      let totalCorrecciones = 0;

      // Para cada cuestionario respondido
      for (const cuestionario of cuestionariosRespondidos) {
        // Obtener las preguntas correctas para este cuestionario
        const preguntasCorrectas = await this.getPreguntasPorCuestionario(cuestionario.id);
        
        // Obtener las respuestas para este cuestionario
        const respuestasInfo = await new Promise((resolve, reject) => {
          db.query(
            `SELECT rc.id as respuesta_cuestionario_id
             FROM respuestas_cuestionarios rc
             WHERE rc.usuario_id = ? AND rc.cuestionario_id = ?`,
            [usuarioId, cuestionario.id],
            (error, results) => {
              if (error) reject(error);
              resolve(results);
            }
          );
        });
        
        if (!respuestasInfo.length) continue;
        
        const respuestaCuestionarioId = respuestasInfo[0].respuesta_cuestionario_id;
        
        // Obtener las respuestas a preguntas
        const respuestasPreguntas = await new Promise((resolve, reject) => {
          db.query(
            `SELECT rp.id, rp.pregunta_id, rp.respuesta_texto, p.orden
             FROM respuestas_preguntas rp
             JOIN preguntas p ON rp.pregunta_id = p.id
             WHERE rp.respuesta_cuestionario_id = ?`,
            [respuestaCuestionarioId],
            (error, results) => {
              if (error) reject(error);
              resolve(results);
            }
          );
        });

        // Corregir cada respuesta si es necesario
        for (const respuesta of respuestasPreguntas) {
          // Buscar la pregunta correcta con el mismo orden
          const preguntaCorrecta = preguntasCorrectas.find(p => p.orden === respuesta.orden);
          
          // Si la pregunta encontrada es diferente a la asignada actualmente
          if (preguntaCorrecta && preguntaCorrecta.id !== respuesta.pregunta_id) {
            // Actualizar la respuesta para apuntar a la pregunta correcta
            await new Promise((resolve, reject) => {
              db.query(
                'UPDATE respuestas_preguntas SET pregunta_id = ? WHERE id = ?',
                [preguntaCorrecta.id, respuesta.id],
                (error, results) => {
                  if (error) reject(error);
                  resolve(results);
                }
              );
            });
            totalCorrecciones++;
          }
        }
      }

      return { 
        success: true, 
        message: `Se han corregido ${totalCorrecciones} respuestas incorrectamente asociadas.`,
        correccionesRealizadas: totalCorrecciones
      };
    } catch (error) {
      console.error('Error al corregir respuestas incorrectas:', error);
      throw error;
    }
  }

  // Reiniciar y restaurar correctamente las relaciones
  static async reiniciarYRestaurarRespuestas(usuarioId) {
    try {
      // Primero, vamos a eliminar todas las respuestas existentes
      await this.reiniciarCuestionarios(usuarioId);
      
      // Ahora obtenemos todos los cuestionarios
      const cuestionarios = await new Promise((resolve, reject) => {
        db.query(
          `SELECT id, nombre, codigo FROM cuestionarios ORDER BY id`,
          (error, results) => {
            if (error) reject(error);
            resolve(results);
          }
        );
      });
      
      const resultados = [];
      
      // Para cada cuestionario, vamos a crear respuestas temporales con las preguntas correctas
      for (const cuestionario of cuestionarios) {
        // Obtener preguntas de este cuestionario
        const preguntas = await this.getPreguntasPorCuestionario(cuestionario.id);
        
        if (preguntas.length === 0) continue;
        
        // Crear un nuevo registro de respuesta para este cuestionario
        const respuestaCuestionarioId = await this.iniciarCuestionario(usuarioId, cuestionario.id);
        
        // Crear respuestas temporales para cada pregunta
        const respuestasDefault = [];
        
        for (const pregunta of preguntas) {
          let respuestaTexto = 'Sin respuesta';
          
          // Aquí podemos establecer valores por defecto según el tipo de cuestionario
          if (cuestionario.id === 1) { // Traumáticos Severos (sí/no)
            respuestaTexto = 'no';
          } else if (cuestionario.id === 2) { // Factores de Riesgo (escala 1-5)
            respuestaTexto = '3';
          } else if (cuestionario.id === 3) { // Entorno Organizacional (múltiple opción)
            respuestaTexto = 'Nunca';
          }
          
          respuestasDefault.push({
            pregunta_id: pregunta.id,
            respuesta_texto: respuestaTexto
          });
        }
        
        // Guardar las respuestas por defecto
        await this.guardarRespuestas(respuestaCuestionarioId, respuestasDefault);
        
        // Completar el cuestionario
        await this.completarCuestionario(respuestaCuestionarioId);
        
        resultados.push({
          cuestionarioId: cuestionario.id,
          nombre: cuestionario.nombre,
          preguntas: preguntas.length,
          respuestas: respuestasDefault.length
        });
      }
      
      return {
        success: true,
        message: `Se han restaurado correctamente las respuestas para ${resultados.length} cuestionarios`,
        cuestionariosRestaurados: resultados
      };
    } catch (error) {
      console.error('Error al restaurar respuestas:', error);
      throw error;
    }
  }

  // Obtener todas las respuestas de todos los usuarios (para estadísticas globales)
  static async getAllRespuestasUsuarios() {
    const query = `
      SELECT 
        rp.id as respuesta_id,
        rp.respuesta_texto,
        rp.created_at as fecha_respuesta,
        rp.pregunta_id,
        p.texto as pregunta_texto,
        p.orden as pregunta_orden,
        p.tipo as pregunta_tipo,
        p.cuestionario_id,
        c.nombre as cuestionario_nombre,
        c.codigo as cuestionario_codigo,
        c.descripcion as cuestionario_descripcion,
        rc.id as respuesta_cuestionario_id,
        rc.usuario_id,
        rc.estado as cuestionario_estado,
        rc.fecha_inicio,
        rc.fecha_fin,
        u.nombre as usuario_nombre,
        u.email as usuario_email
      FROM respuestas_preguntas rp
      JOIN respuestas_cuestionarios rc ON rp.respuesta_cuestionario_id = rc.id
      JOIN preguntas p ON rp.pregunta_id = p.id
      JOIN cuestionarios c ON rc.cuestionario_id = c.id  -- Usando rc.cuestionario_id para garantizar que obtenemos el cuestionario correcto
      JOIN usuarios u ON rc.usuario_id = u.id
      WHERE c.id = p.cuestionario_id  -- Asegurarnos que la pregunta pertenece al cuestionario correcto
      ORDER BY rc.usuario_id, c.id, p.orden
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [], (error, results) => {
        if (error) reject(error);
        
        // Log para debugging
        console.log(`Se encontraron ${results.length} respuestas en total`);
        
        // Verificar cuestionarios completados
        const cuestionariosCompletados = new Set();
        results.forEach(r => {
          if (r.cuestionario_estado === 'completado') {
            cuestionariosCompletados.add(`${r.usuario_id}-${r.cuestionario_id}-${r.cuestionario_nombre}`);
          }
        });
        
        console.log(`Cuestionarios completados: ${Array.from(cuestionariosCompletados).join(', ')}`);
        
        // Agrupar por nombre de cuestionario para verificar la distribución
        const porCuestionario = {};
        results.forEach(r => {
          if (!porCuestionario[r.cuestionario_nombre]) {
            porCuestionario[r.cuestionario_nombre] = 0;
          }
          porCuestionario[r.cuestionario_nombre]++;
        });
        
        console.log('Distribución por cuestionario:', porCuestionario);
        
        resolve(results);
      });
    });
  }
}

module.exports = Respuesta; 