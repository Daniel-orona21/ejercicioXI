const Respuesta = require('../models/respuesta.model');
const Cuestionario = require('../models/cuestionario.model');

// Iniciar un cuestionario
exports.iniciarCuestionario = async (req, res) => {
  try {
    const { cuestionarioId } = req.body;
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    
    // Verificar que el cuestionario exista
    const cuestionario = await Cuestionario.getById(cuestionarioId);
    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado'
      });
    }
    
    const respuestaCuestionarioId = await Respuesta.iniciarCuestionario(usuarioId, cuestionarioId);
    
    res.status(200).json({
      success: true,
      data: {
        respuestaCuestionarioId,
        message: 'Cuestionario iniciado correctamente'
      }
    });
  } catch (error) {
    console.error('Error al iniciar cuestionario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar cuestionario',
      error: error.message
    });
  }
};

// Guardar respuesta individual
exports.guardarRespuesta = async (req, res) => {
  try {
    const { cuestionarioId, preguntaId, respuestaTexto } = req.body;
    const usuarioId = req.user.id;
    
    // Obtener o crear registro de respuestas_cuestionarios
    const respuestaCuestionarioId = await Respuesta.iniciarCuestionario(usuarioId, cuestionarioId);
    
    // Guardar la respuesta
    await Respuesta.guardarRespuesta(respuestaCuestionarioId, preguntaId, respuestaTexto);
    
    res.status(200).json({
      success: true,
      message: 'Respuesta guardada correctamente'
    });
  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar respuesta',
      error: error.message
    });
  }
};

// Guardar múltiples respuestas a la vez
exports.guardarRespuestas = async (req, res) => {
  try {
    const { cuestionarioId, respuestas } = req.body;
    const usuarioId = req.user.id;
    
    // Verificar que respuestas sea un array válido
    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El formato de las respuestas es inválido'
      });
    }
    
    // Obtener o crear registro de respuestas_cuestionarios
    const respuestaCuestionarioId = await Respuesta.iniciarCuestionario(usuarioId, cuestionarioId);
    
    // Guardar todas las respuestas
    await Respuesta.guardarRespuestas(respuestaCuestionarioId, respuestas);
    
    res.status(200).json({
      success: true,
      message: 'Respuestas guardadas correctamente'
    });
  } catch (error) {
    console.error('Error al guardar respuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar respuestas',
      error: error.message
    });
  }
};

// Completar un cuestionario
exports.completarCuestionario = async (req, res) => {
  try {
    const { cuestionarioId } = req.body;
    const usuarioId = req.user.id;
    
    // Verificar que el cuestionario exista
    const cuestionario = await Cuestionario.getById(cuestionarioId);
    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado'
      });
    }
    
    // Obtener ID de respuesta_cuestionario
    const queryGetId = 'SELECT id FROM respuestas_cuestionarios WHERE usuario_id = ? AND cuestionario_id = ?';
    const respuestaCuestionarioId = await new Promise((resolve, reject) => {
      require('../config/db.config').query(queryGetId, [usuarioId, cuestionarioId], (error, results) => {
        if (error) reject(error);
        if (results.length === 0) {
          reject(new Error('No se ha iniciado este cuestionario'));
        }
        resolve(results[0].id);
      });
    });
    
    // Completar el cuestionario
    await Respuesta.completarCuestionario(respuestaCuestionarioId);
    
    res.status(200).json({
      success: true,
      message: 'Cuestionario completado correctamente'
    });
  } catch (error) {
    console.error('Error al completar cuestionario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar cuestionario',
      error: error.message
    });
  }
}; 