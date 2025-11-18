import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_unidad, nombre_unidad, palabras_ids } = req.body

    if (!id_unidad) {
      return res.status(400).json({ error: 'Missing id_unidad' })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      await connection.query(
        `UPDATE vocabulario_unidades 
         SET nombre_unidad = ?, palabras_ids = ?
         WHERE id_unidad = ?`,
        [nombre_unidad, JSON.stringify(palabras_ids), id_unidad]
      )

      res.status(200).json({
        message: 'Unit updated successfully'
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error updating unit:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
