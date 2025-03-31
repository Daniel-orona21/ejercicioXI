const express = require('express');
const router = express.Router();
const cuestionarioController = require('../controllers/cuestionario.controller');
const respuestaController = require('../controllers/respuesta.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas
router.get('/cuestionarios', cuestionarioController.getAllCuestionarios);
router.get('/cuestionarios/:id', cuestionarioController.getCuestionarioWithQuestions);
router.get('/cuestionarios-with-questions', cuestionarioController.getAllCuestionariosWithQuestions);

// Rutas protegidas (requieren autenticación)
router.get('/mis-cuestionarios', authMiddleware, cuestionarioController.getEstadoCuestionarios);
router.get('/mis-cuestionarios/:id/respuestas', authMiddleware, cuestionarioController.getRespuestasCuestionario);
router.get('/mis-respuestas', authMiddleware, cuestionarioController.getAllRespuestasUsuario);
router.get('/mis-respuestas-detalladas', authMiddleware, cuestionarioController.getAllRespuestasDetalladasUsuario);

// Rutas para respuestas
router.post('/iniciar-cuestionario', authMiddleware, respuestaController.iniciarCuestionario);
router.post('/guardar-respuesta', authMiddleware, respuestaController.guardarRespuesta);
router.post('/guardar-respuestas', authMiddleware, respuestaController.guardarRespuestas);
router.post('/completar-cuestionario', authMiddleware, respuestaController.completarCuestionario);
router.post('/reiniciar-cuestionarios', authMiddleware, cuestionarioController.reiniciarCuestionarios);

// Ruta para corregir respuestas incorrectas
router.post('/corregir-respuestas', authMiddleware, cuestionarioController.corregirRespuestasIncorrectas);

// Ruta para reiniciar y restaurar todas las respuestas
router.post('/restaurar-respuestas', authMiddleware, cuestionarioController.reiniciarYRestaurarRespuestas);

// Ruta para obtener todas las respuestas de todos los usuarios (para estadísticas globales)
// Nota: En un entorno de producción, esta ruta debería estar protegida por un middleware de admin
router.get('/todas-respuestas', authMiddleware, cuestionarioController.getAllRespuestasUsuarios);

module.exports = router; 