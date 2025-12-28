import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createAccessToken = (userId, role) => {
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '30m';
  return jwt.sign({ userId, role }, process.env.SECRET_KEY, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return null;
  }
};

