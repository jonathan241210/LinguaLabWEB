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

  const result = await GrupoController.asignarAlumnoIndividual(id_grupo, id_alumno);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    // Si el mensaje contiene "ya está asignado", es un conflicto (409)
    const statusCode = result.message?.includes('ya está asignado') ? 409 : 400;
    return res.status(statusCode).json(result);
  }
}
