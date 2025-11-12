import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // req.user está disponible gracias al middleware withAuth
  return res.status(200).json({
    success: true,
    user: req.user,
  });
}

export default withAuth(handler);
