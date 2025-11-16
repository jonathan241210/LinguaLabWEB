import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_grupo, id_docente } = req.body;

    // Validaciones
    if (!id_grupo || !id_docente) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: id_grupo, id_docente',
      });
    }

    // Verificar que grupo existe
    const grupo = await query('SELECT id_grupo FROM grupos WHERE id_grupo = ?', [id_grupo]);
    if (!grupo || grupo.length === 0) {
      return res.status(400).json({ success: false, message: 'Grupo no encontrado' });
    }

    // Verificar que docente existe y está activo
    const docente = await query(
      'SELECT id_docente FROM docentes WHERE id_docente = ? AND activo = 1',
      [id_docente]
    );
    if (!docente || docente.length === 0) {
      return res.status(400).json({ success: false, message: 'Docente no encontrado o inactivo' });
    }

    // Verificar si ya hay un docente activo asignado a este grupo
    const docenteActual = await query(
      'SELECT id_docente_grupo FROM docente_grupo WHERE id_grupo_dg_fk = ? AND activo = 1',
      [id_grupo]
    );

    if (docenteActual && docenteActual.length > 0) {
      // Cerrar asignación anterior
      await query(
        'UPDATE docente_grupo SET activo = 0, fecha_fin = CURRENT_TIMESTAMP WHERE id_grupo_dg_fk = ? AND activo = 1',
        [id_grupo]
      );
    }

    // Insertar nueva asignación
    await query(
      `INSERT INTO docente_grupo (id_docente_dg_fk, id_grupo_dg_fk, fecha_inicio, activo)
       VALUES (?, ?, CURRENT_TIMESTAMP, 1)`,
      [id_docente, id_grupo]
    );

    res.status(201).json({
      success: true,
      message: 'Docente asignado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al asignar docente:', error);
    res.status(500).json({ success: false, message: 'Error al asignar docente', error: error.message });
  }
}
