const Pregunta = require('../models/pregunta.model');
const OpcionRespuesta = require('../models/opcion-respuesta.model');
const RespuestaUsuario = require('../models/respuesta-usuario.model');

// Controlador para el cuestionario
const CuestionarioController = {
  // Obtener todas las preguntas
  getPreguntas: async (req, res) => {
    try {
      const preguntas = await Pregunta.getAll();
      res.json({
        success: true,
        data: preguntas
      });
    } catch (error) {
      console.error('Error al obtener preguntas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las preguntas',
        error: error.message
      });
    }
  },

  // Obtener preguntas según si el usuario es jefe o no
  getPreguntasSegunPerfil: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      // Obtener todas las preguntas sin filtrar por es_opcional
      const preguntas = await Pregunta.getAll();
      
      res.json({
        success: true,
        data: preguntas,
        metadata: {
          totalPreguntas: preguntas.length
        }
      });
    } catch (error) {
      console.error('Error al obtener preguntas según perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las preguntas según perfil',
        error: error.message
      });
    }
  },

  // Obtener todas las opciones de respuesta
  getOpcionesRespuesta: async (req, res) => {
    try {
      const opciones = await OpcionRespuesta.getAll();
      res.json({
        success: true,
        data: opciones
      });
    } catch (error) {
      console.error('Error al obtener opciones de respuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las opciones de respuesta',
        error: error.message
      });
    }
  },

  // Guardar una respuesta individual
  guardarRespuesta: async (req, res) => {
    try {
      const { preguntaId, opcionRespuestaId } = req.body;
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      // Validar que la pregunta y opción de respuesta existan
      const pregunta = await Pregunta.getById(preguntaId);
      if (!pregunta) {
        return res.status(404).json({
          success: false,
          message: 'La pregunta especificada no existe'
        });
      }
      
      const opcionRespuesta = await OpcionRespuesta.getById(opcionRespuestaId);
      if (!opcionRespuesta) {
        return res.status(404).json({
          success: false,
          message: 'La opción de respuesta especificada no existe'
        });
      }
      
      // Verificar si la pregunta que se está respondiendo es la de "Soy jefe"
      const esJefePregunta = await Pregunta.esJefePregunta(preguntaId);
      
      // Guardar la respuesta
      await RespuestaUsuario.guardarRespuesta(usuarioId, preguntaId, opcionRespuestaId);
      
      let metadata = {};
      
      // Si la pregunta es la de "Soy jefe", verificar si debe mostrar preguntas adicionales
      if (esJefePregunta) {
        const esJefe = opcionRespuesta.valor >= 3; // Valores 3 y 4 corresponden a "Casi siempre" y "Siempre"
        const preguntasOpcionales = esJefe ? await Pregunta.getOpcionales() : [];
        
        metadata = {
          esJefe,
          mostrarPreguntasAdicionales: esJefe,
          preguntasAdicionales: preguntasOpcionales
        };
      }
      
      // Obtener el progreso actual
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        message: 'Respuesta guardada correctamente',
        metadata: {
          ...metadata,
          progreso
        }
      });
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar la respuesta',
        error: error.message
      });
    }
  },

  // Guardar una respuesta individual con ID de usuario manual (para pruebas)
  guardarRespuestaManual: async (req, res) => {
    try {
      const { preguntaId, opcionRespuestaId, usuarioId } = req.body;
      
      // Validar que se proporcionó un ID de usuario
      if (!usuarioId) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un ID de usuario'
        });
      }
      
      // Validar que la pregunta y opción de respuesta existan
      const pregunta = await Pregunta.getById(preguntaId);
      if (!pregunta) {
        return res.status(404).json({
          success: false,
          message: 'La pregunta especificada no existe'
        });
      }
      
      const opcionRespuesta = await OpcionRespuesta.getById(opcionRespuestaId);
      if (!opcionRespuesta) {
        return res.status(404).json({
          success: false,
          message: 'La opción de respuesta especificada no existe'
        });
      }
      
      // Verificar si la pregunta que se está respondiendo es la de "Soy jefe"
      const esJefePregunta = await Pregunta.esJefePregunta(preguntaId);
      
      // Guardar la respuesta
      await RespuestaUsuario.guardarRespuesta(usuarioId, preguntaId, opcionRespuestaId);
      
      let metadata = {};
      
      // Si la pregunta es la de "Soy jefe", verificar si debe mostrar preguntas adicionales
      if (esJefePregunta) {
        const esJefe = opcionRespuesta.valor >= 3; // Valores 3 y 4 corresponden a "Casi siempre" y "Siempre"
        const preguntasOpcionales = esJefe ? await Pregunta.getOpcionales() : [];
        
        metadata = {
          esJefe,
          mostrarPreguntasAdicionales: esJefe,
          preguntasAdicionales: preguntasOpcionales
        };
      }
      
      // Obtener el progreso actual
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        message: 'Respuesta guardada correctamente',
        metadata: {
          ...metadata,
          progreso
        }
      });
    } catch (error) {
      console.error('Error al guardar respuesta manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar la respuesta',
        error: error.message
      });
    }
  },

  // Guardar múltiples respuestas en una sola petición
  guardarMultiplesRespuestas: async (req, res) => {
    try {
      const { respuestas } = req.body;
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de respuestas'
        });
      }
      
      // Transformar las respuestas al formato esperado por el modelo
      const respuestasFormateadas = respuestas.map(r => ({
        usuarioId,
        preguntaId: r.preguntaId,
        opcionRespuestaId: r.opcionRespuestaId
      }));
      
      // Guardar las respuestas
      await RespuestaUsuario.guardarMultiplesRespuestas(respuestasFormateadas);
      
      // Obtener el progreso actual
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        message: 'Respuestas guardadas correctamente',
        data: {
          totalGuardadas: respuestas.length,
          progreso
        }
      });
    } catch (error) {
      console.error('Error al guardar múltiples respuestas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar las respuestas',
        error: error.message
      });
    }
  },
  
  // Guardar múltiples respuestas en una sola petición con ID de usuario manual (para pruebas)
  guardarMultiplesRespuestasManual: async (req, res) => {
    try {
      const { respuestas } = req.body;
      
      if (!respuestas || !Array.isArray(respuestas) || respuestas.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar un array de respuestas'
        });
      }
      
      // Verificar que cada respuesta tenga un ID de usuario
      const todasTienenUsuario = respuestas.every(r => r.usuarioId);
      if (!todasTienenUsuario) {
        return res.status(400).json({
          success: false,
          message: 'Todas las respuestas deben tener un ID de usuario'
        });
      }
      
      // Guardar las respuestas
      await RespuestaUsuario.guardarMultiplesRespuestas(respuestas);
      
      // Obtener el progreso del primer usuario (asumimos que todas son del mismo usuario)
      const usuarioId = respuestas[0].usuarioId;
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        message: 'Respuestas guardadas correctamente',
        data: {
          totalGuardadas: respuestas.length,
          progreso
        }
      });
    } catch (error) {
      console.error('Error al guardar múltiples respuestas manual:', error);
      res.status(500).json({
        success: false,
        message: 'Error al guardar las respuestas',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de un usuario
  getRespuestasUsuario: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      const respuestas = await RespuestaUsuario.getByUsuarioId(usuarioId);
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        data: respuestas,
        metadata: {
          progreso
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas del usuario',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de un usuario con valores ajustados
  getRespuestasUsuarioConValoresAjustados: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      const respuestas = await RespuestaUsuario.getByUsuarioIdConValoresAjustados(usuarioId);
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      // Calcular la suma total de los valores ajustados
      const sumaValoresAjustados = respuestas.reduce((total, respuesta) => {
        return total + respuesta.valor_ajustado;
      }, 0);
      
      res.json({
        success: true,
        data: respuestas,
        metadata: {
          progreso,
          sumaValoresAjustados
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas del usuario con valores ajustados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas del usuario con valores ajustados',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de un usuario con valores ajustados, categorías y niveles de riesgo
  getRespuestasUsuarioConRiesgo: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      const respuestas = await RespuestaUsuario.getByUsuarioIdConValoresAjustadosYCategoriasYRiesgo(usuarioId);
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      // Calcular la suma total de los valores ajustados
      const sumaValoresAjustados = respuestas.reduce((total, respuesta) => {
        return total + respuesta.valor_ajustado;
      }, 0);
      
      // Calcular la suma total por categoría y determinar el nivel de riesgo
      const sumasPorCategoria = {};
      respuestas.forEach(respuesta => {
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
      
      res.json({
        success: true,
        data: respuestas,
        metadata: {
          progreso,
          sumaValoresAjustados,
          sumasPorCategoria: Object.values(sumasPorCategoria)
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas del usuario con niveles de riesgo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas del usuario con niveles de riesgo',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de todos los usuarios
  getAllRespuestasUsuarios: async (req, res) => {
    try {
      const respuestasUsuarios = await RespuestaUsuario.getAllRespuestas();
      
      res.json({
        success: true,
        data: respuestasUsuarios,
        metadata: {
          totalUsuarios: respuestasUsuarios.length
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas de todos los usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas de los usuarios',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de todos los usuarios con valores ajustados
  getAllRespuestasUsuariosConValoresAjustados: async (req, res) => {
    try {
      const respuestasUsuarios = await RespuestaUsuario.getAllRespuestasConValoresAjustados();
      
      res.json({
        success: true,
        data: respuestasUsuarios,
        metadata: {
          totalUsuarios: respuestasUsuarios.length
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas de todos los usuarios con valores ajustados:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas de los usuarios con valores ajustados',
        error: error.message
      });
    }
  },

  // Obtener las respuestas de todos los usuarios con valores ajustados, categorías y niveles de riesgo
  getAllRespuestasUsuariosConRiesgo: async (req, res) => {
    try {
      const respuestasUsuarios = await RespuestaUsuario.getAllRespuestasConValoresAjustadosYCategoriasYRiesgo();
      
      res.json({
        success: true,
        data: respuestasUsuarios,
        metadata: {
          totalUsuarios: respuestasUsuarios.length
        }
      });
    } catch (error) {
      console.error('Error al obtener respuestas de todos los usuarios con niveles de riesgo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las respuestas de los usuarios con niveles de riesgo',
        error: error.message
      });
    }
  },

  // Borrar todas las respuestas de un usuario
  borrarRespuestasUsuario: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      // Borrar todas las respuestas del usuario
      const resultado = await RespuestaUsuario.borrarPorUsuarioId(usuarioId);
      
      res.json({
        success: true,
        message: 'Respuestas borradas correctamente',
        data: {
          totalBorradas: resultado.affectedRows || 0
        }
      });
    } catch (error) {
      console.error('Error al borrar respuestas del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al borrar las respuestas del usuario',
        error: error.message
      });
    }
  },

  // Obtener el progreso del usuario en el cuestionario
  getProgresoUsuario: async (req, res) => {
    try {
      const usuarioId = req.userId; // Obtenido del middleware de autenticación
      
      const progreso = await RespuestaUsuario.getProgreso(usuarioId);
      
      res.json({
        success: true,
        data: progreso
      });
    } catch (error) {
      console.error('Error al obtener progreso del usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el progreso del usuario',
        error: error.message
      });
    }
  },

  // Obtener estadísticas generales
  getEstadisticas: async (req, res) => {
    try {
      const estadisticas = await RespuestaUsuario.getEstadisticas();
      
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas',
        error: error.message
      });
    }
  },

  // Obtener las categorías de preguntas
  getCategoriasPregunta: async (req, res) => {
    try {
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
      
      res.json({
        success: true,
        data: categorias
      });
    } catch (error) {
      console.error('Error al obtener categorías de preguntas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las categorías de preguntas',
        error: error.message
      });
    }
  },

  // Obtener tabla de calificación de nivel de riesgo
  getTablaCalificacionRiesgo: async (req, res) => {
    try {
      const tablaCalificacion = [
        {
          categoria: 'Ambiente de trabajo',
          categoria_id: 1,
          niveles: [
            { nivel: 'Nulo o despreciable', rango: 'Ccat < 5', color: '#93c47d' },
            { nivel: 'Bajo', rango: '5 ≤ Ccat < 9', color: '#b6d7a8' },
            { nivel: 'Medio', rango: '9 ≤ Ccat < 11', color: '#ffe599' },
            { nivel: 'Alto', rango: '11 ≤ Ccat < 14', color: '#f9cb9c' },
            { nivel: 'Muy alto', rango: 'Ccat ≥ 14', color: '#ea9999' }
          ]
        },
        {
          categoria: 'Factores propios de la actividad',
          categoria_id: 2,
          niveles: [
            { nivel: 'Nulo o despreciable', rango: 'Ccat < 15', color: '#93c47d' },
            { nivel: 'Bajo', rango: '15 ≤ Ccat < 30', color: '#b6d7a8' },
            { nivel: 'Medio', rango: '30 ≤ Ccat < 45', color: '#ffe599' },
            { nivel: 'Alto', rango: '45 ≤ Ccat < 60', color: '#f9cb9c' },
            { nivel: 'Muy alto', rango: 'Ccat ≥ 60', color: '#ea9999' }
          ]
        },
        {
          categoria: 'Organización del tiempo de trabajo',
          categoria_id: 3,
          niveles: [
            { nivel: 'Nulo o despreciable', rango: 'Ccat < 5', color: '#93c47d' },
            { nivel: 'Bajo', rango: '5 ≤ Ccat < 7', color: '#b6d7a8' },
            { nivel: 'Medio', rango: '7 ≤ Ccat < 10', color: '#ffe599' },
            { nivel: 'Alto', rango: '10 ≤ Ccat < 13', color: '#f9cb9c' },
            { nivel: 'Muy alto', rango: 'Ccat ≥ 13', color: '#ea9999' }
          ]
        },
        {
          categoria: 'Liderazgo y relaciones en el trabajo',
          categoria_id: 4,
          niveles: [
            { nivel: 'Nulo o despreciable', rango: 'Ccat < 14', color: '#93c47d' },
            { nivel: 'Bajo', rango: '14 ≤ Ccat < 29', color: '#b6d7a8' },
            { nivel: 'Medio', rango: '29 ≤ Ccat < 42', color: '#ffe599' },
            { nivel: 'Alto', rango: '42 ≤ Ccat < 58', color: '#f9cb9c' },
            { nivel: 'Muy alto', rango: 'Ccat ≥ 58', color: '#ea9999' }
          ]
        },
        {
          categoria: 'Entorno organizacional',
          categoria_id: 5,
          niveles: [
            { nivel: 'Nulo o despreciable', rango: 'Ccat < 10', color: '#93c47d' },
            { nivel: 'Bajo', rango: '10 ≤ Ccat < 14', color: '#b6d7a8' },
            { nivel: 'Medio', rango: '14 ≤ Ccat < 18', color: '#ffe599' },
            { nivel: 'Alto', rango: '18 ≤ Ccat < 23', color: '#f9cb9c' },
            { nivel: 'Muy alto', rango: 'Ccat ≥ 23', color: '#ea9999' }
          ]
        }
      ];
      
      res.json({
        success: true,
        data: tablaCalificacion
      });
    } catch (error) {
      console.error('Error al obtener tabla de calificación de riesgo:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la tabla de calificación de riesgo',
        error: error.message
      });
    }
  }
};

module.exports = CuestionarioController; 