import type { NextApiRequest, NextApiResponse } from 'next';
import { GrupoController } from '@/src/controllers/GrupoController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const result = await GrupoController.asignarAlumnos(req.body);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(400).json(result);
  }
}
