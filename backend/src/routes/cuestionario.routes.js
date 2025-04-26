const express = require('express');
const router = express.Router();
const cuestionarioController = require('../controllers/cuestionario.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas (sin autenticación)
router.get('/preguntas', cuestionarioController.getPreguntas);
router.get('/opciones-respuesta', cuestionarioController.getOpcionesRespuesta);

// Rutas protegidas (requieren autenticación)
router.get('/mis-preguntas', authMiddleware, cuestionarioController.getPreguntasSegunPerfil);
router.post('/guardar-respuesta', authMiddleware, cuestionarioController.guardarRespuesta);
router.post('/guardar-respuestas', authMiddleware, cuestionarioController.guardarMultiplesRespuestas);
router.get('/mis-respuestas', authMiddleware, cuestionarioController.getRespuestasUsuario);
router.get('/mi-progreso', authMiddleware, cuestionarioController.getProgresoUsuario);

// Rutas para administradores (podrían requerir un middleware adicional)
router.get('/estadisticas', authMiddleware, cuestionarioController.getEstadisticas);

module.exports = router; 