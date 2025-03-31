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