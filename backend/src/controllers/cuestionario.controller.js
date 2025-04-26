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
      
      // Obtener todas las preguntas obligatorias
      const preguntasObligatorias = await Pregunta.getObligatorias();
      
      // Verificar si el usuario ha respondido que es jefe
      const esJefe = await RespuestaUsuario.esUsuarioJefe(usuarioId);
      
      let preguntas = preguntasObligatorias;
      
      // Si el usuario es jefe, agregar las preguntas opcionales
      if (esJefe) {
        const preguntasOpcionales = await Pregunta.getOpcionales();
        preguntas = [...preguntasObligatorias, ...preguntasOpcionales];
      }
      
      res.json({
        success: true,
        data: preguntas,
        metadata: {
          esJefe: esJefe,
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
  }
};

module.exports = CuestionarioController; 