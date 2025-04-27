const express = require('express');
const router = express.Router();
const cuestionarioController = require('../controllers/cuestionario.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas (sin autenticación)
router.get('/preguntas', cuestionarioController.getPreguntas);
router.get('/opciones-respuesta', cuestionarioController.getOpcionesRespuesta);
router.get('/categorias-pregunta', cuestionarioController.getCategoriasPregunta);
router.get('/tabla-calificacion-riesgo', cuestionarioController.getTablaCalificacionRiesgo);
router.post('/guardar-respuesta-manual', cuestionarioController.guardarRespuestaManual);
router.post('/guardar-respuestas-manual', cuestionarioController.guardarMultiplesRespuestasManual);

// Rutas protegidas (requieren autenticación)
router.get('/mis-preguntas', authMiddleware, cuestionarioController.getPreguntasSegunPerfil);
router.post('/guardar-respuesta', authMiddleware, cuestionarioController.guardarRespuesta);
router.post('/guardar-respuestas', authMiddleware, cuestionarioController.guardarMultiplesRespuestas);
router.get('/mis-respuestas', authMiddleware, cuestionarioController.getRespuestasUsuario);
router.get('/mis-respuestas-ajustadas', authMiddleware, cuestionarioController.getRespuestasUsuarioConValoresAjustados);
// router.get('/mis-respuestas-categorias', authMiddleware, cuestionarioController.getRespuestasUsuarioConCategorias);
router.get('/mis-respuestas-riesgo', authMiddleware, cuestionarioController.getRespuestasUsuarioConRiesgo);
router.get('/todas-respuestas', authMiddleware, cuestionarioController.getAllRespuestasUsuarios);
router.get('/todas-respuestas-ajustadas', authMiddleware, cuestionarioController.getAllRespuestasUsuariosConValoresAjustados);
// router.get('/todas-respuestas-categorias', authMiddleware, cuestionarioController.getAllRespuestasUsuariosConCategorias);
router.get('/todas-respuestas-riesgo', authMiddleware, cuestionarioController.getAllRespuestasUsuariosConRiesgo);
router.delete('/mis-respuestas', authMiddleware, cuestionarioController.borrarRespuestasUsuario);
router.get('/mi-progreso', authMiddleware, cuestionarioController.getProgresoUsuario);

// Rutas para administradores (podrían requerir un middleware adicional)
router.get('/estadisticas', authMiddleware, cuestionarioController.getEstadisticas);

module.exports = router; 