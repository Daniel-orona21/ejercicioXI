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
  },

  // Obtener todas las respuestas de todos los usuarios
  getAllRespuestas: async () => {
    try {
      // Obtener la lista de usuarios con respuestas y su conteo
      const usersQuery = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(ru.id) AS total_respuestas
        FROM 
          usuarios u
        JOIN 
          respuestas_usuario ru ON u.id = ru.usuario_id
        GROUP BY 
          u.id, u.nombre, u.email
        ORDER BY 
          u.nombre ASC
      `;
      
      const [usuarios] = await db.query(usersQuery);
      
      // Para cada usuario, obtener sus respuestas detalladas
      const respuestasUsuarios = [];
      for (const usuario of usuarios) {
        const respuestasQuery = `
          SELECT 
            ru.*, 
            p.texto as pregunta_texto, 
            p.orden as pregunta_orden, 
            p.es_opcional, 
            op.texto as respuesta_texto, 
            op.valor as respuesta_valor
          FROM 
            respuestas_usuario ru
          JOIN 
            preguntas p ON ru.pregunta_id = p.id
          JOIN 
            opciones_respuesta op ON ru.opcion_respuesta_id = op.id
          WHERE 
            ru.usuario_id = ?
          ORDER BY 
            p.orden
        `;
        
        const [respuestas] = await db.query(respuestasQuery, [usuario.id]);
        const progreso = await RespuestaUsuario.getProgreso(usuario.id);
        
        respuestasUsuarios.push({
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            total_respuestas: usuario.total_respuestas
          },
          respuestas: respuestas,
          progreso: progreso
        });
      }
      
      return respuestasUsuarios;
    } catch (error) {
      throw error;
    }
  },

  // Función para determinar si una pregunta es inversa (valor invertido) basado en su número de orden
  esItemInverso: (ordenPregunta) => {
    // Lista de ítems que tienen valoración inversa según la imagen
    const itemsInversos = [1, 4, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 55, 56, 57];
    return itemsInversos.includes(ordenPregunta);
  },

  // Función para calcular el valor ajustado de la respuesta basado en el tipo de pregunta
  calcularValorAjustado: (valorOriginal, ordenPregunta) => {
    if (RespuestaUsuario.esItemInverso(ordenPregunta)) {
      // Para ítems inversos: se invierten los valores (4->0, 3->1, 2->2, 1->3, 0->4)
      return 4 - valorOriginal;
    } else {
      // Para ítems normales: se mantiene el valor original
      return valorOriginal;
    }
  },

  // Obtener respuestas de un usuario con valores ajustados
  getByUsuarioIdConValoresAjustados: async (usuarioId) => {
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
      
      // Calcular valor ajustado para cada respuesta
      const respuestasAjustadas = rows.map(respuesta => {
        const valorAjustado = RespuestaUsuario.calcularValorAjustado(
          respuesta.respuesta_valor,
          respuesta.pregunta_orden
        );
        
        return {
          ...respuesta,
          valor_ajustado: valorAjustado
        };
      });
      
      return respuestasAjustadas;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las respuestas de todos los usuarios con valores ajustados
  getAllRespuestasConValoresAjustados: async () => {
    try {
      // Obtener la lista de usuarios con respuestas y su conteo
      const usersQuery = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(ru.id) AS total_respuestas
        FROM 
          usuarios u
        JOIN 
          respuestas_usuario ru ON u.id = ru.usuario_id
        GROUP BY 
          u.id, u.nombre, u.email
        ORDER BY 
          u.nombre ASC
      `;
      
      const [usuarios] = await db.query(usersQuery);
      
      // Para cada usuario, obtener sus respuestas detalladas con valores ajustados
      const respuestasUsuarios = [];
      for (const usuario of usuarios) {
        const respuestasQuery = `
          SELECT 
            ru.*, 
            p.texto as pregunta_texto, 
            p.orden as pregunta_orden, 
            p.es_opcional, 
            op.texto as respuesta_texto, 
            op.valor as respuesta_valor
          FROM 
            respuestas_usuario ru
          JOIN 
            preguntas p ON ru.pregunta_id = p.id
          JOIN 
            opciones_respuesta op ON ru.opcion_respuesta_id = op.id
          WHERE 
            ru.usuario_id = ?
          ORDER BY 
            p.orden
        `;
        
        const [respuestas] = await db.query(respuestasQuery, [usuario.id]);
        
        // Calcular el valor ajustado para cada respuesta
        const respuestasAjustadas = respuestas.map(respuesta => {
          const valorAjustado = RespuestaUsuario.calcularValorAjustado(
            respuesta.respuesta_valor,
            respuesta.pregunta_orden
          );
          
          return {
            ...respuesta,
            valor_ajustado: valorAjustado
          };
        });
        
        const progreso = await RespuestaUsuario.getProgreso(usuario.id);
        
        // Calcular la suma total de los valores ajustados
        const sumaValoresAjustados = respuestasAjustadas.reduce((total, respuesta) => {
          return total + respuesta.valor_ajustado;
        }, 0);
        
        respuestasUsuarios.push({
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            total_respuestas: usuario.total_respuestas,
            suma_valores_ajustados: sumaValoresAjustados
          },
          respuestas: respuestasAjustadas,
          progreso: progreso
        });
      }
      
      return respuestasUsuarios;
    } catch (error) {
      throw error;
    }
  },

  // Función para determinar la categoría de una pregunta basado en su número de orden
  obtenerCategoriaPregunta: (ordenPregunta) => {
    // Definición de categorías según los rangos proporcionados
    const categorias = [
      {
        id: 1,
        nombre: 'Ambiente de trabajo',
        preguntas: [1, 2, 3, 4, 5]
      },
      {
        id: 2,
        nombre: 'Factores propios de la actividad',
        preguntas: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 35, 36, 66, 67, 68, 69]
      },
      {
        id: 3,
        nombre: 'Organización del tiempo de trabajo',
        preguntas: [17, 18, 19, 20, 21, 22]
      },
      {
        id: 4,
        nombre: 'Liderazgo y relaciones en el trabajo',
        preguntas: [31, 32, 33, 34, 39, 40, 42, 45, 46, 57, 58, 59, 60, 61, 62, 63, 64, 71, 72, 73, 74]
      },
      {
        id: 5,
        nombre: 'Entorno organizacional',
        preguntas: [47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
      }
    ];
    
    // Buscar la categoría a la que pertenece la pregunta
    const categoria = categorias.find(cat => cat.preguntas.includes(ordenPregunta));
    return categoria || { id: 0, nombre: 'Sin categoría', preguntas: [] };
  },

  // Obtener respuestas de un usuario con valores ajustados y categorías
  getByUsuarioIdConValoresAjustadosYCategorias: async (usuarioId) => {
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
      
      // Calcular valor ajustado y categoría para cada respuesta
      const respuestasAjustadas = rows.map(respuesta => {
        const valorAjustado = RespuestaUsuario.calcularValorAjustado(
          respuesta.respuesta_valor,
          respuesta.pregunta_orden
        );
        
        const categoria = RespuestaUsuario.obtenerCategoriaPregunta(respuesta.pregunta_orden);
        
        return {
          ...respuesta,
          valor_ajustado: valorAjustado,
          categoria: categoria.nombre,
          categoria_id: categoria.id
        };
      });
      
      return respuestasAjustadas;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las respuestas de todos los usuarios con valores ajustados y categorías
  getAllRespuestasConValoresAjustadosYCategorias: async () => {
    try {
      // Obtener la lista de usuarios con respuestas y su conteo
      const usersQuery = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(ru.id) AS total_respuestas
        FROM 
          usuarios u
        JOIN 
          respuestas_usuario ru ON u.id = ru.usuario_id
        GROUP BY 
          u.id, u.nombre, u.email
        ORDER BY 
          u.nombre ASC
      `;
      
      const [usuarios] = await db.query(usersQuery);
      
      // Para cada usuario, obtener sus respuestas detalladas con valores ajustados y categorías
      const respuestasUsuarios = [];
      for (const usuario of usuarios) {
        const respuestasQuery = `
          SELECT 
            ru.*, 
            p.texto as pregunta_texto, 
            p.orden as pregunta_orden, 
            p.es_opcional, 
            op.texto as respuesta_texto, 
            op.valor as respuesta_valor
          FROM 
            respuestas_usuario ru
          JOIN 
            preguntas p ON ru.pregunta_id = p.id
          JOIN 
            opciones_respuesta op ON ru.opcion_respuesta_id = op.id
          WHERE 
            ru.usuario_id = ?
          ORDER BY 
            p.orden
        `;
        
        const [respuestas] = await db.query(respuestasQuery, [usuario.id]);
        
        // Calcular el valor ajustado y la categoría para cada respuesta
        const respuestasAjustadas = respuestas.map(respuesta => {
          const valorAjustado = RespuestaUsuario.calcularValorAjustado(
            respuesta.respuesta_valor,
            respuesta.pregunta_orden
          );
          
          const categoria = RespuestaUsuario.obtenerCategoriaPregunta(respuesta.pregunta_orden);
          
          return {
            ...respuesta,
            valor_ajustado: valorAjustado,
            categoria: categoria.nombre,
            categoria_id: categoria.id
          };
        });
        
        const progreso = await RespuestaUsuario.getProgreso(usuario.id);
        
        // Calcular la suma total de los valores ajustados
        const sumaValoresAjustados = respuestasAjustadas.reduce((total, respuesta) => {
          return total + respuesta.valor_ajustado;
        }, 0);
        
        // Calcular la suma total por categoría
        const sumasPorCategoria = {};
        respuestasAjustadas.forEach(respuesta => {
          if (!sumasPorCategoria[respuesta.categoria_id]) {
            sumasPorCategoria[respuesta.categoria_id] = {
              categoria: respuesta.categoria,
              suma: 0,
              totalPreguntas: 0
            };
          }
          
          sumasPorCategoria[respuesta.categoria_id].suma += respuesta.valor_ajustado;
          sumasPorCategoria[respuesta.categoria_id].totalPreguntas += 1;
        });
        
        respuestasUsuarios.push({
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            total_respuestas: usuario.total_respuestas,
            suma_valores_ajustados: sumaValoresAjustados,
            sumasPorCategoria: Object.values(sumasPorCategoria)
          },
          respuestas: respuestasAjustadas,
          progreso: progreso
        });
      }
      
      return respuestasUsuarios;
    } catch (error) {
      throw error;
    }
  },

  // Función para determinar el nivel de riesgo según la categoría y la puntuación
  determinarNivelRiesgo: (categoriaId, puntuacion) => {
    const niveles = {
      NULO_DESPRECIABLE: 'Nulo o despreciable',
      BAJO: 'Bajo',
      MEDIO: 'Medio',
      ALTO: 'Alto',
      MUY_ALTO: 'Muy alto'
    };
    
    // Rangos de calificación según la categoría
    switch(categoriaId) {
      case 1: // Ambiente de trabajo
        if (puntuacion < 5) return { nivel: niveles.NULO_DESPRECIABLE, color: '#93c47d' };
        if (puntuacion < 9) return { nivel: niveles.BAJO, color: '#b6d7a8' };
        if (puntuacion < 11) return { nivel: niveles.MEDIO, color: '#ffe599' };
        if (puntuacion < 14) return { nivel: niveles.ALTO, color: '#f9cb9c' };
        return { nivel: niveles.MUY_ALTO, color: '#ea9999' };
        
      case 2: // Factores propios de la actividad
        if (puntuacion < 15) return { nivel: niveles.NULO_DESPRECIABLE, color: '#93c47d' };
        if (puntuacion < 30) return { nivel: niveles.BAJO, color: '#b6d7a8' };
        if (puntuacion < 45) return { nivel: niveles.MEDIO, color: '#ffe599' };
        if (puntuacion < 60) return { nivel: niveles.ALTO, color: '#f9cb9c' };
        return { nivel: niveles.MUY_ALTO, color: '#ea9999' };
        
      case 3: // Organización del tiempo de trabajo
        if (puntuacion < 5) return { nivel: niveles.NULO_DESPRECIABLE, color: '#93c47d' };
        if (puntuacion < 7) return { nivel: niveles.BAJO, color: '#b6d7a8' };
        if (puntuacion < 10) return { nivel: niveles.MEDIO, color: '#ffe599' };
        if (puntuacion < 13) return { nivel: niveles.ALTO, color: '#f9cb9c' };
        return { nivel: niveles.MUY_ALTO, color: '#ea9999' };
        
      case 4: // Liderazgo y relaciones en el trabajo
        if (puntuacion < 14) return { nivel: niveles.NULO_DESPRECIABLE, color: '#93c47d' };
        if (puntuacion < 29) return { nivel: niveles.BAJO, color: '#b6d7a8' };
        if (puntuacion < 42) return { nivel: niveles.MEDIO, color: '#ffe599' };
        if (puntuacion < 58) return { nivel: niveles.ALTO, color: '#f9cb9c' };
        return { nivel: niveles.MUY_ALTO, color: '#ea9999' };
        
      case 5: // Entorno organizacional
        if (puntuacion < 10) return { nivel: niveles.NULO_DESPRECIABLE, color: '#93c47d' };
        if (puntuacion < 14) return { nivel: niveles.BAJO, color: '#b6d7a8' };
        if (puntuacion < 18) return { nivel: niveles.MEDIO, color: '#ffe599' };
        if (puntuacion < 23) return { nivel: niveles.ALTO, color: '#f9cb9c' };
        return { nivel: niveles.MUY_ALTO, color: '#ea9999' };
        
      default:
        return { nivel: 'No clasificado', color: '#d9d9d9' };
    }
  },

  // Obtener respuestas de un usuario con valores ajustados, categorías y niveles de riesgo
  getByUsuarioIdConValoresAjustadosYCategoriasYRiesgo: async (usuarioId) => {
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
      
      // Calcular valor ajustado y categoría para cada respuesta
      const respuestasAjustadas = rows.map(respuesta => {
        const valorAjustado = RespuestaUsuario.calcularValorAjustado(
          respuesta.respuesta_valor,
          respuesta.pregunta_orden
        );
        
        const categoria = RespuestaUsuario.obtenerCategoriaPregunta(respuesta.pregunta_orden);
        
        return {
          ...respuesta,
          valor_ajustado: valorAjustado,
          categoria: categoria.nombre,
          categoria_id: categoria.id
        };
      });
      
      return respuestasAjustadas;
    } catch (error) {
      throw error;
    }
  },

  // Obtener todas las respuestas de todos los usuarios con valores ajustados, categorías y niveles de riesgo
  getAllRespuestasConValoresAjustadosYCategoriasYRiesgo: async () => {
    try {
      // Obtener la lista de usuarios con respuestas y su conteo
      const usersQuery = `
        SELECT 
          u.id,
          u.nombre,
          u.email,
          COUNT(ru.id) AS total_respuestas
        FROM 
          usuarios u
        JOIN 
          respuestas_usuario ru ON u.id = ru.usuario_id
        GROUP BY 
          u.id, u.nombre, u.email
        ORDER BY 
          u.nombre ASC
      `;
      
      const [usuarios] = await db.query(usersQuery);
      
      // Para cada usuario, obtener sus respuestas detalladas con valores ajustados y categorías
      const respuestasUsuarios = [];
      for (const usuario of usuarios) {
        const respuestasQuery = `
          SELECT 
            ru.*, 
            p.texto as pregunta_texto, 
            p.orden as pregunta_orden, 
            p.es_opcional, 
            op.texto as respuesta_texto, 
            op.valor as respuesta_valor
          FROM 
            respuestas_usuario ru
          JOIN 
            preguntas p ON ru.pregunta_id = p.id
          JOIN 
            opciones_respuesta op ON ru.opcion_respuesta_id = op.id
          WHERE 
            ru.usuario_id = ?
          ORDER BY 
            p.orden
        `;
        
        const [respuestas] = await db.query(respuestasQuery, [usuario.id]);
        
        // Calcular el valor ajustado y la categoría para cada respuesta
        const respuestasAjustadas = respuestas.map(respuesta => {
          const valorAjustado = RespuestaUsuario.calcularValorAjustado(
            respuesta.respuesta_valor,
            respuesta.pregunta_orden
          );
          
          const categoria = RespuestaUsuario.obtenerCategoriaPregunta(respuesta.pregunta_orden);
          
          return {
            ...respuesta,
            valor_ajustado: valorAjustado,
            categoria: categoria.nombre,
            categoria_id: categoria.id
          };
        });
        
        const progreso = await RespuestaUsuario.getProgreso(usuario.id);
        
        // Calcular la suma total de los valores ajustados
        const sumaValoresAjustados = respuestasAjustadas.reduce((total, respuesta) => {
          return total + respuesta.valor_ajustado;
        }, 0);
        
        // Calcular la suma total por categoría y determinar el nivel de riesgo
        const sumasPorCategoria = {};
        respuestasAjustadas.forEach(respuesta => {
          if (!sumasPorCategoria[respuesta.categoria_id]) {
            sumasPorCategoria[respuesta.categoria_id] = {
              categoria: respuesta.categoria,
              categoria_id: respuesta.categoria_id,
              suma: 0,
              totalPreguntas: 0
            };
          }
          
          sumasPorCategoria[respuesta.categoria_id].suma += respuesta.valor_ajustado;
          sumasPorCategoria[respuesta.categoria_id].totalPreguntas += 1;
        });
        
        // Añadir nivel de riesgo a cada categoría
        Object.values(sumasPorCategoria).forEach(categoria => {
          const riesgo = RespuestaUsuario.determinarNivelRiesgo(categoria.categoria_id, categoria.suma);
          categoria.nivel_riesgo = riesgo.nivel;
          categoria.color_riesgo = riesgo.color;
        });
        
        // Determinar el nivel de riesgo total
        const riesgoTotal = RespuestaUsuario.determinarNivelRiesgoTotal(sumaValoresAjustados);
        
        respuestasUsuarios.push({
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            total_respuestas: usuario.total_respuestas,
            suma_valores_ajustados: sumaValoresAjustados,
            sumasPorCategoria: Object.values(sumasPorCategoria),
            nivel_riesgo_total: riesgoTotal.nivel,
            color_riesgo_total: riesgoTotal.color
          },
          respuestas: respuestasAjustadas,
          progreso: progreso
        });
      }
      
      return respuestasUsuarios;
    } catch (error) {
      throw error;
    }
  },

  // Determinar nivel de riesgo total según la calificación del cuestionario
  determinarNivelRiesgoTotal: (puntuacionTotal) => {
    if (puntuacionTotal < 50) return { nivel: 'Nulo o despreciable', color: '#93c47d' };
    if (puntuacionTotal < 75) return { nivel: 'Bajo', color: '#b6d7a8' };
    if (puntuacionTotal < 99) return { nivel: 'Medio', color: '#ffe599' };
    if (puntuacionTotal < 140) return { nivel: 'Alto', color: '#f9cb9c' };
    return { nivel: 'Muy alto', color: '#ea9999' };
  }
};

module.exports = RespuestaUsuario; 