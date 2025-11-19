import type { NextApiRequest, NextApiResponse } from 'next';
import { GrupoController } from '@/src/controllers/GrupoController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const result = await GrupoController.asignarDocente(req.body);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    // If the message contains "already assigned", it's a conflict (409)
    const statusCode = result.message?.includes('already assigned') ? 409 : 400;
    return res.status(statusCode).json(result);
  }
}
