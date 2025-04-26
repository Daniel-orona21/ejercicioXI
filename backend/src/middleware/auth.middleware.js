const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt');
    req.user = verified;
    
    // Extraer el ID del usuario decodificado y guardarlo en req.userId
    req.userId = verified.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = verifyToken; 