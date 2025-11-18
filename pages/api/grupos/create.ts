import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, en_practicas = 0 } = req.body;

    // Validaciones
    if (!nombre || !id_cuatrimestre_grupo_fk || !id_cohorte_grupo_fk) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk',
      });
    }

    // Verificar que cuatrimestre existe
    const cuatrimestre = await query(
      'SELECT id_cuatrimestre FROM cuatrimestres WHERE id_cuatrimestre = ? AND activo = 1',
      [id_cuatrimestre_grupo_fk]
    );
    if (!cuatrimestre || cuatrimestre.length === 0) {
      return res.status(400).json({ success: false, message: 'Cuatrimestre no válido o inactivo' });
    }

    // Verificar que cohorte existe
    const cohorte = await query(
      'SELECT id_cohorte FROM cohortes WHERE id_cohorte = ? AND activo = 1',
      [id_cohorte_grupo_fk]
    );
    if (!cohorte || cohorte.length === 0) {
      return res.status(400).json({ success: false, message: 'Cohorte no válida o inactiva' });
    }

    // Insertar grupo
    const result: any = await query(
      `INSERT INTO grupos (nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, estado_practicas)
       VALUES (?, ?, ?, ?)`,
      [nombre, id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, en_practicas]
    );

    res.status(201).json({
      success: true,
      message: 'Grupo creado exitosamente',
      data: { id_grupo: result.insertId },
    });
  } catch (error: any) {
    console.error('Error al crear grupo:', error);
    res.status(500).json({ success: false, message: 'Error al crear grupo', error: error.message });
  }
}
