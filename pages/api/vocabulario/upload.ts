import { NextApiRequest, NextApiResponse } from 'next'
import { getPool } from '../../../lib/db'

// Accept JSON data with vocabulary entries array
// Structure: { nivel, archivo_original, contenido: [{palabra, significado, nivel}] }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { nivel, contenido, archivo_original } = req.body

    if (!nivel) {
      return res.status(400).json({ error: 'Missing required field: nivel' })
    }

    if (!contenido || !Array.isArray(contenido) || contenido.length === 0) {
      return res.status(400).json({ error: 'Contenido must be a non-empty array' })
    }

    const filename = archivo_original || 'vocabulary.pdf'

    const pool = getPool()
    const connection = await pool.getConnection()
    
    try {
      const [result] = await connection.query(
        `INSERT INTO vocabulario (nivel, contenido, archivo_original)
         VALUES (?, ?, ?)`,
        [nivel, JSON.stringify(contenido), filename]
      )

      res.status(200).json({
        message: 'Vocabulary saved successfully',
        id: (result as any).insertId,
        filename: filename,
        entries: contenido.length
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error saving vocabulary:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

