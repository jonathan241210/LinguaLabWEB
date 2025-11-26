import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      id_laboratorio,
      experiencia_base,
      experiencia_bonus_perfecto,
      puntuacion_minima_aprobar,
      tiempo_limite,
      intentos_permitidos,
      permitir_pistas
    } = req.body

    if (!id_laboratorio) {
      return res.status(400).json({ error: 'Missing id_laboratorio' })
    }

    const sqlQuery = `
      UPDATE actividades 
      SET 
        experiencia_base = ?,
        experiencia_bonus_perfecto = ?,
        puntuacion_minima_aprobar = ?,
        tiempo_limite = ?,
        intentos_permitidos = ?,
        permitir_pistas = ?
      WHERE id_actividad = ?
    `

    await query(sqlQuery, [
      experiencia_base,
      experiencia_bonus_perfecto,
      puntuacion_minima_aprobar,
      tiempo_limite,
      intentos_permitidos,
      permitir_pistas,
      id_laboratorio
    ])

    return res.status(200).json({
      success: true,
      message: 'Configuration updated successfully'
    })
  } catch (error) {
    console.error('Error updating laboratory config:', error)
    return res.status(500).json({ error: 'Error updating configuration' })
  }
}
