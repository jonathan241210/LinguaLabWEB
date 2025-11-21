import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { query } from '@/lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // Obtener datos completos del usuario desde la base de datos
  try {
    const users = await query(
      'SELECT id_usuario, nombre, primer_apellido, segundo_apellido, correo, rol FROM usuarios WHERE id_usuario = ?',
      [req.user?.id_usuario]
    );

    if (!users || (users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userData = (users as any[])[0];

    return res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Error obteniendo datos del usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export default withAuth(handler);
