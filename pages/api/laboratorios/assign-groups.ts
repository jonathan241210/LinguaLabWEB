import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id_laboratorio, cuatrimestres } = req.body

    if (!id_laboratorio || !cuatrimestres || !Array.isArray(cuatrimestres)) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get all grupos that belong to the selected cuatrimestres
    const gruposQuery = `
      SELECT DISTINCT g.id_grupo
      FROM grupos g
      WHERE g.id_cuatrimestre IN (${cuatrimestres.map(() => '?').join(',')})
    `

    const grupos = await query(gruposQuery, cuatrimestres) as any[]

    if (grupos.length === 0) {
      return res.status(404).json({ error: 'No groups found for selected cuatrimestres' })
    }

    // Insert into actividad_grupo for each grupo
    const insertPromises = grupos.map((grupo: any) => {
      return query(
        'INSERT IGNORE INTO actividad_grupo (id_actividad_ag_fk, id_grupo_ag_fk) VALUES (?, ?)',
        [id_laboratorio, grupo.id_grupo]
      )
    })

    await Promise.all(insertPromises)

    return res.status(200).json({
      success: true,
      message: `Assigned to ${grupos.length} groups`,
      groups_count: grupos.length
    })
  } catch (error) {
    console.error('Error assigning groups:', error)
    return res.status(500).json({ error: 'Error assigning groups' })
  }
}
