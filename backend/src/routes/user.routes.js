const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');

// Ruta protegida que requiere autenticación
router.get('/profile', verifyToken, (req, res) => {
  res.json({ message: 'Perfil de usuario', user: req.user });
});

module.exports = router; 