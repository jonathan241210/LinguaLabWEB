import { NextApiRequest, NextApiResponse } from 'next';
import { handleLogin } from '@/controllers/authController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { userIdentifier, password } = req.body;

  if (!userIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Usuario y contraseña son requeridos',
    });
  }

  // No enviamos rol: dejamos que el servidor detecte si es docente o admin
  const result = await handleLogin({ userIdentifier, password });

  if (result.success) {
    // Guardar refresh token en httpOnly cookie (más seguro)
    res.setHeader('Set-Cookie', `refreshToken=${result.refreshToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    
    return res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    });
  } else {
    return res.status(401).json(result);
  }
}
