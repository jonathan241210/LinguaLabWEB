import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Limpiar cookie del token
  res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');

  return res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });
}
