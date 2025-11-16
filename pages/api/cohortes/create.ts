import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const { anio_ingreso, cuatrimestre_inicial, id_programa_cohorte_fk, id_nivel_inicial_fk, etiqueta } = req.body;

    // Validar datos requeridos
    if (!anio_ingreso || !cuatrimestre_inicial || !id_programa_cohorte_fk || !id_nivel_inicial_fk || !etiqueta) {
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    }

    // Insertar cohorte
    const result: any = await query(
      `INSERT INTO cohortes (anio_ingreso, cuatrimestre_inicial, id_programa_cohorte_fk, id_nivel_inicial_fk, etiqueta, activo)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [anio_ingreso, cuatrimestre_inicial, id_programa_cohorte_fk, id_nivel_inicial_fk, etiqueta]
    );

    return res.status(201).json({
      success: true,
      message: 'Cohorte creado exitosamente',
      data: { id_cohorte: result.insertId },
    });
  } catch (error: any) {
    console.error('Error al crear cohorte:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Ya existe una cohorte con esa etiqueta' });
    }
    return res.status(500).json({ success: false, message: 'Error al crear cohorte' });
  }
}
