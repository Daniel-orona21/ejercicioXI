const pool = require('../config/db.config');
const Cuestionario = require('../models/cuestionario.model');
const Respuesta = require('../models/respuesta.model');

// Obtener todos los cuestionarios
exports.getAllCuestionarios = async (req, res) => {
  try {
    const cuestionarios = await Cuestionario.getAll();
    res.status(200).json({
      success: true,
      data: cuestionarios
    });
  } catch (error) {
    console.error('Error al obtener cuestionarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuestionarios',
      error: error.message
    });
  }
};

// Obtener un cuestionario específico con sus preguntas
exports.getCuestionarioWithQuestions = async (req, res) => {
  try {
    const cuestionarioId = req.params.id;
    const cuestionario = await Cuestionario.getWithQuestions(cuestionarioId);
    
    if (!cuestionario) {
      return res.status(404).json({
        success: false,
        message: 'Cuestionario no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: cuestionario
    });
  } catch (error) {
    console.error('Error al obtener cuestionario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuestionario',
      error: error.message
    });
  }
};

// Obtener todos los cuestionarios con sus preguntas
exports.getAllCuestionariosWithQuestions = async (req, res) => {
  try {
    const cuestionarios = await Cuestionario.getAllWithQuestions();
    res.status(200).json({
      success: true,
      data: cuestionarios
    });
  } catch (error) {
    console.error('Error al obtener cuestionarios con preguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuestionarios con preguntas',
      error: error.message
    });
  }
};

// Obtener estado de cuestionarios para el usuario actual
exports.getEstadoCuestionarios = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    const estadoCuestionarios = await Respuesta.getEstadoCuestionariosUsuario(usuarioId);
    
    res.status(200).json({
      success: true,
      data: estadoCuestionarios
    });
  } catch (error) {
    console.error('Error al obtener estado de cuestionarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado de cuestionarios',
      error: error.message
    });
  }
};

// Obtener respuestas para un cuestionario específico del usuario actual
exports.getRespuestasCuestionario = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    const cuestionarioId = req.params.id;
    
    const respuestas = await Respuesta.getRespuestasCuestionario(usuarioId, cuestionarioId);
    
    // Verificar si hay respuestas
    if (!respuestas || respuestas.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay respuestas para este cuestionario',
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: respuestas
    });
  } catch (error) {
    console.error('Error al obtener respuestas del cuestionario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener respuestas del cuestionario',
      error: error.message
    });
  }
};

// Reiniciar todos los cuestionarios para el usuario actual
exports.reiniciarCuestionarios = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    
    await Respuesta.reiniciarCuestionarios(usuarioId);
    
    res.status(200).json({
      success: true,
      message: 'Cuestionarios reiniciados correctamente'
    });
  } catch (error) {
    console.error('Error al reiniciar cuestionarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar cuestionarios',
      error: error.message
    });
  }
};

// Obtener todas las respuestas de todos los cuestionarios del usuario actual
exports.getAllRespuestasUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    
    // Obtener todos los cuestionarios disponibles
    const cuestionarios = await Cuestionario.getAll();
    
    // Array para almacenar las respuestas de todos los cuestionarios
    const todasLasRespuestas = [];
    
    // Obtener respuestas para cada cuestionario
    for (const cuestionario of cuestionarios) {
      const respuestas = await Respuesta.getRespuestasCuestionario(usuarioId, cuestionario.id);
      
      // Solo agregar si hay al menos una respuesta con respuestaTexto
      const tieneRespuestas = respuestas.some(r => r.respuestaTexto && r.respuestaTexto !== 'Sin respuesta');
      
      if (respuestas && respuestas.length > 0) {
        todasLasRespuestas.push({
          cuestionarioId: cuestionario.id,
          nombre: cuestionario.nombre,
          codigo: cuestionario.codigo,
          descripcion: cuestionario.descripcion,
          tieneRespuestas: tieneRespuestas,
          respuestas: respuestas
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: todasLasRespuestas
    });
  } catch (error) {
    console.error('Error al obtener todas las respuestas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener todas las respuestas del usuario',
      error: error.message
    });
  }
};

// Obtener todas las respuestas detalladas del usuario actual usando el JOIN completo
exports.getAllRespuestasDetalladasUsuario = async (req, res) => {
  try {
    const usuarioId = req.user.id; // Asumiendo que el middleware de autenticación agrega el usuario a req
    
    // Usar el nuevo método con el JOIN completo
    const respuestasDetalladas = await Respuesta.getAllRespuestasDetalladasUsuario(usuarioId);
    
    res.status(200).json({
      success: true,
      data: respuestasDetalladas
    });
  } catch (error) {
    console.error('Error al obtener respuestas detalladas del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener respuestas detalladas del usuario',
      error: error.message
    });
  }
};

// Corregir respuestas asociadas incorrectamente a preguntas
exports.corregirRespuestasIncorrectas = async (req, res) => {
  try {
    const usuarioId = req.userId; // Usando req.userId como se define en authMiddleware
    
    // Llamar al método que corrige las respuestas
    const resultado = await Respuesta.corregirRespuestasIncorrectas(usuarioId);
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al corregir respuestas incorrectas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al corregir respuestas incorrectas',
      error: error.message
    });
  }
};

// Reiniciar y restaurar correctamente todas las respuestas
exports.reiniciarYRestaurarRespuestas = async (req, res) => {
  try {
    const usuarioId = req.userId; // Usando req.userId como se define en authMiddleware
    
    // Llamar al método que reinicia y restaura las respuestas
    const resultado = await Respuesta.reiniciarYRestaurarRespuestas(usuarioId);
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al reiniciar y restaurar respuestas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reiniciar y restaurar respuestas',
      error: error.message
    });
  }
}; 