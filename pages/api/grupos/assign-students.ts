import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id_grupo, id_alumnos, id_programa, id_nivel } = req.body;

    // Validaciones
    if (!id_grupo || !id_alumnos || !Array.isArray(id_alumnos) || id_alumnos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos: id_grupo y array id_alumnos requeridos',
      });
    }

    // Verificar que grupo existe
    const grupo = await query('SELECT id_grupo FROM grupos WHERE id_grupo = ?', [id_grupo]);
    if (!grupo || grupo.length === 0) {
      return res.status(400).json({ success: false, message: 'Grupo no encontrado' });
    }

    // Si se proporciona programa y nivel, actualizar alumnos
    if (id_programa && id_nivel) {
      const updatePromises = id_alumnos.map((id_alumno) =>
        query(
          'UPDATE alumnos SET id_programa_alumno_fk = ?, id_nivel_alumno_fk = ? WHERE id_alumno = ?',
          [id_programa, id_nivel, id_alumno]
        )
      );
      await Promise.all(updatePromises);
    }

    // Insertar múltiples alumnos en alumno_grupo
    const values = id_alumnos.map((id_alumno) => [id_grupo, id_alumno]);
    const placeholders = values.map(() => '(?, ?)').join(', ');
    const flatValues = values.flat();

    await query(
      `INSERT INTO alumno_grupo (id_grupo_ag_fk, id_alumno_ag_fk, fecha_ingreso, activo)
       VALUES ${placeholders}`,
      flatValues
    );

    res.status(201).json({
      success: true,
      message: `${id_alumnos.length} alumno(s) asignado(s) exitosamente${id_programa && id_nivel ? ' con programa y nivel actualizados' : ''}`,
    });
  } catch (error: any) {
    console.error('Error al asignar alumnos:', error);
    res.status(500).json({ success: false, message: 'Error al asignar alumnos', error: error.message });
  }
}
