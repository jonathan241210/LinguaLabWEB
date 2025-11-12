import { NextApiRequest, NextApiResponse } from 'next';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Obtener refresh token de la cookie
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token provided',
    });
  }

  // Verificar el refresh token
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }

  // Generar nuevo access token
  const newAccessToken = generateAccessToken({
    id_usuario: payload.id_usuario,
    rol: payload.rol,
    nombre: payload.nombre,
  });

  return res.status(200).json({
    success: true,
    accessToken: newAccessToken,
  });
}
