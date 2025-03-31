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

// Rutas para respuestas
router.post('/iniciar-cuestionario', authMiddleware, respuestaController.iniciarCuestionario);
router.post('/guardar-respuesta', authMiddleware, respuestaController.guardarRespuesta);
router.post('/guardar-respuestas', authMiddleware, respuestaController.guardarRespuestas);
router.post('/completar-cuestionario', authMiddleware, respuestaController.completarCuestionario);
router.post('/reiniciar-cuestionarios', authMiddleware, cuestionarioController.reiniciarCuestionarios);

module.exports = router; 