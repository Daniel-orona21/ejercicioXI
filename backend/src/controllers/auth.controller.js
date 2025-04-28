const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const userId = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol
    });

    // Enviar correo de invitación
    try {
      // LOGS TEMPORALES PARA DEPURACIÓN
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : '(vacío)');
      console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
      // FIN LOGS
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      const mailOptions = {
        from: `"NOM-035" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Invitación para responder la encuesta NOM-035',
        html: `
          <h2>¡Bienvenido a la plataforma NOM-035!</h2>
          <p>Has sido registrado en el sistema para responder la encuesta de factores de riesgo psicosocial.</p>
          <p><b>Accede a la plataforma aquí:</b> <a href="${process.env.FRONTEND_URL || 'http://localhost:4200/login'}">${process.env.FRONTEND_URL || 'http://localhost:4200/login'}</a></p>
          <p><b>Tu usuario:</b> ${email}<br>
          <b>Tu contraseña:</b> ${password}</p>
          <p>Por favor, inicia sesión y responde la encuesta lo antes posible.</p>
          <br>
          <p>¡Gracias!</p>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.error('Error enviando correo de invitación:', mailError);
      // No es crítico, solo loguear
    }

    // Generar token
    const token = jwt.sign(
      { id: userId, email, rol },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: userId, nombre, email, rol }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'tu_secreto_jwt',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
}; 