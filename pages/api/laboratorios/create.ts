import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      id_plantilla,
      id_vocabulario,
      titulo,
      descripcion,
      numero_palabras,
      unidades_seleccionadas,
      modo_seleccion,
      nivel,
      creado_por = 1, // TODO: Get from session
      tipo_creador = 'admin',
      // Advanced configuration
      experiencia_base = 100,
      experiencia_bonus_perfecto = 50,
      puntuacion_minima_aprobar = 70,
      tiempo_limite = null,
      intentos_permitidos = null,
      permitir_pistas = true,
      penalizacion_por_pista = 5,
      auto_refresh = false,
      refresh_frequency = 'weekly',
      refresh_type = 'palabras'
    } = req.body

    // Validaciones
    if (!id_plantilla || !id_vocabulario || !titulo) {
      return res.status(400).json({ 
        error: 'Missing required fields: id_plantilla, id_vocabulario, titulo' 
      })
    }

    // Obtener palabras del vocabulario según el modo de selección
    let palabrasQuery = `
      SELECT palabra, significado 
      FROM vocabulario 
      WHERE id_vocabulario = ?
    `
    const palabrasParams: any[] = [id_vocabulario]

    // Si se especificaron unidades, obtener solo esas palabras
    if (modo_seleccion === 'por_unidad' && unidades_seleccionadas && unidades_seleccionadas.length > 0) {
      const unidadesQuery = `
        SELECT palabras_ids 
        FROM vocabulario_unidades 
        WHERE id_unidad IN (${unidades_seleccionadas.map(() => '?').join(',')})
      `
      const unidadesResult = await query(unidadesQuery, unidades_seleccionadas)
      
      // Aquí necesitarías procesar los índices de palabras_ids
      // Por ahora, lo dejamos como está para obtener todas las palabras
    }

    const todasLasPalabras = await query(palabrasQuery, palabrasParams)
    
    // Seleccionar palabras aleatoriamente si es necesario
    let palabrasSeleccionadas = todasLasPalabras
    if (modo_seleccion === 'random' && todasLasPalabras.length > numero_palabras) {
      palabrasSeleccionadas = todasLasPalabras
        .sort(() => 0.5 - Math.random())
        .slice(0, numero_palabras)
    } else if (todasLasPalabras.length > numero_palabras) {
      palabrasSeleccionadas = todasLasPalabras.slice(0, numero_palabras)
    }

    // Insertar la actividad (laboratorio)
    const insertQuery = `
      INSERT INTO actividades (
        id_juego_fk,
        id_vocabulario_fk,
        titulo,
        descripcion,
        nivel,
        numero_palabras,
        unidades_seleccionadas,
        palabras_seleccionadas,
        modo_seleccion,
        creado_por,
        tipo_creador,
        publicado,
        experiencia_base,
        experiencia_bonus_perfecto,
        puntuacion_minima_aprobar,
        tiempo_limite,
        mostrar_temporizador,
        intentos_permitidos,
        permitir_reintentos,
        mostrar_definiciones,
        permitir_pistas,
        penalizacion_por_pista,
        auto_refresh,
        refresh_frequency,
        refresh_type,
        ultima_actualizacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, NOW())
    `

    const result = await query(insertQuery, [
      id_plantilla,
      id_vocabulario,
      titulo,
      descripcion || null,
      nivel,
      palabrasSeleccionadas.length,
      unidades_seleccionadas ? JSON.stringify(unidades_seleccionadas) : null,
      JSON.stringify(palabrasSeleccionadas),
      modo_seleccion,
      creado_por,
      tipo_creador,
      experiencia_base,
      experiencia_bonus_perfecto,
      puntuacion_minima_aprobar,
      tiempo_limite,
      tiempo_limite ? true : false,
      intentos_permitidos,
      intentos_permitidos ? true : false,
      permitir_pistas,
      penalizacion_por_pista,
      auto_refresh,
      refresh_frequency,
      refresh_type
    ])

    return res.status(201).json({ 
      success: true,
      message: 'Laboratory created successfully',
      id_actividad: result.insertId
    })
  } catch (error) {
    console.error('Error creating laboratory:', error)
    return res.status(500).json({ error: 'Error creating laboratory' })
  }
}
