import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_vocabulario, numero_unidad, nombre_unidad, palabras_ids } = req.body

    if (!id_vocabulario || !numero_unidad) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!Array.isArray(palabras_ids) || palabras_ids.length === 0) {
      return res.status(400).json({ error: 'palabras_ids must be a non-empty array' })
    }

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      // Check if unit already exists
      const [existing] = await connection.query(
        `SELECT id_unidad FROM vocabulario_unidades 
         WHERE id_vocabulario_fk = ? AND numero_unidad = ?`,
        [id_vocabulario, numero_unidad]
      )

      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(400).json({ error: `Unit ${numero_unidad} already exists for this vocabulary` })
      }

      const [result] = await connection.query(
        `INSERT INTO vocabulario_unidades 
         (id_vocabulario_fk, numero_unidad, nombre_unidad, palabras_ids)
         VALUES (?, ?, ?, ?)`,
        [id_vocabulario, numero_unidad, nombre_unidad || `Unit ${numero_unidad}`, JSON.stringify(palabras_ids)]
      )

      res.status(200).json({
        message: 'Unit created successfully',
        id_unidad: (result as any).insertId,
        numero_unidad: numero_unidad,
        palabras_count: palabras_ids.length
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error creating unit:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
