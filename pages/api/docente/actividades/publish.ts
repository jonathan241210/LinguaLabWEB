import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verificar token de autenticación
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (!decoded || !decoded.id_usuario) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { id_actividad_plantilla, id_grupo, visible_from, visible_to } = req.body;

    // Validar datos requeridos
    if (!id_actividad_plantilla || !id_grupo) {
      return res.status(400).json({ 
        success: false, 
        message: 'id_actividad_plantilla and id_grupo are required' 
      });
    }

    // Obtener id_docente
    const docenteResult: any = await query(
      'SELECT id_docente FROM docentes WHERE id_usuario_docente_fk = ?',
      [decoded.id_usuario]
    );

    if (!docenteResult || docenteResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const id_docente = docenteResult[0].id_docente;

    // Verificar que el docente está asignado al grupo
    const grupoAsignado: any = await query(
      'SELECT * FROM docente_grupo WHERE id_docente_dg_fk = ? AND id_grupo_dg_fk = ? AND activo = 1',
      [id_docente, id_grupo]
    );

    if (!grupoAsignado || grupoAsignado.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: 'Teacher is not assigned to this group' 
      });
    }

    // Verificar que la actividad existe y está publicada para teachers
    const plantilla: any = await query(
      `SELECT * FROM actividades 
       WHERE id_actividad = ? 
       AND publicado = 1 
       AND published_scope IN ('teachers', 'all')`,
      [id_actividad_plantilla]
    );

    if (!plantilla || plantilla.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activity template not found or not available' 
      });
    }

    // Verificar si ya existe una asignación activa
    const existente: any = await query(
      'SELECT * FROM actividad_grupo WHERE id_actividad_ag_fk = ? AND id_grupo_ag_fk = ?',
      [id_actividad_plantilla, id_grupo]
    );

    if (existente && existente.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'This activity is already assigned to the group' 
      });
    }

    // Crear registro en actividad_grupo
    await query(
      `INSERT INTO actividad_grupo 
       (id_actividad_ag_fk, id_grupo_ag_fk, publicado, fecha_asignacion, visible_desde, visible_hasta) 
       VALUES (?, ?, 1, NOW(), ?, ?)`,
      [
        id_actividad_plantilla, 
        id_grupo, 
        visible_from || null, 
        visible_to || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Activity successfully published to group'
    });
  } catch (error: any) {
    console.error('Error publishing activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Error publishing activity to group',
      error: error.message
    });
  }
}
