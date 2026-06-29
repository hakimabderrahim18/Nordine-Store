import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeynordinestore12345', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

export default generateToken;
