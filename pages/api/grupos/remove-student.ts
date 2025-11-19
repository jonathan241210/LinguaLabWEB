import type { NextApiRequest, NextApiResponse } from 'next';
import { GrupoController } from '@/src/controllers/GrupoController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id_grupo, id_alumno } = req.body;

  if (!id_grupo || !id_alumno) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: id_grupo, id_alumno'
    });
  }

  const result = await GrupoController.removerAlumno(id_grupo, id_alumno);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(404).json(result);
  }
}
