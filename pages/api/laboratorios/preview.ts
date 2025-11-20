import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

/**
 * API para obtener la vista previa de las palabras de un laboratorio
 * GET /api/laboratorios/preview?id={id_actividad}
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Laboratory ID is required' });
    }

    // Obtener la actividad con sus palabras seleccionadas
    const actividadQuery = `
      SELECT 
        id_actividad,
        titulo,
        palabras_seleccionadas,
        numero_palabras
      FROM actividades
      WHERE id_actividad = ?
    `;

    const actividades = await query(actividadQuery, [id]);

    if (!actividades || (actividades as any[]).length === 0) {
      return res.status(404).json({ error: 'Laboratory not found' });
    }

    const actividad = (actividades as any[])[0];
    
    // Parsear las palabras seleccionadas
    let palabras = [];
    try {
      if (actividad.palabras_seleccionadas) {
        const parsed = typeof actividad.palabras_seleccionadas === 'string'
          ? JSON.parse(actividad.palabras_seleccionadas)
          : actividad.palabras_seleccionadas;
        
        console.log('Parsed palabras_seleccionadas:', JSON.stringify(parsed).substring(0, 200));
        
        // Si es un array
        if (Array.isArray(parsed)) {
          // Caso 1: Array con objetos que tienen subunits [{ nombre, numero, subunits: [...] }]
          if (parsed.length > 0 && parsed[0].subunits && Array.isArray(parsed[0].subunits)) {
            palabras = parsed.flatMap((item: any) => 
              (item.subunits || []).flatMap((subunit: any) => subunit.palabras || [])
            );
            console.log('Extracted from array with subunits:', palabras.length, 'words');
          }
          // Caso 2: Array directo de palabras [{ palabra, significado, nivel }]
          else if (parsed.length > 0 && parsed[0].palabra) {
            palabras = parsed;
            console.log('Extracted from direct word array:', palabras.length, 'words');
          }
          // Caso 3: Array de unidades [{ words: [...] }]
          else if (parsed.length > 0 && parsed[0].words) {
            palabras = parsed.flatMap((unidad: any) => unidad.words || []);
            console.log('Extracted from array with words property:', palabras.length, 'words');
          }
          else {
            console.log('Array structure not recognized, length:', parsed.length);
          }
        }
        // Si tiene estructura con subunits directamente (objeto)
        else if (parsed.subunits && Array.isArray(parsed.subunits)) {
          palabras = parsed.subunits.flatMap((subunit: any) => subunit.palabras || []);
          console.log('Extracted from object with subunits:', palabras.length, 'words');
        } 
        // Si es un objeto con palabras directamente
        else if (parsed.palabras && Array.isArray(parsed.palabras)) {
          palabras = parsed.palabras;
          console.log('Extracted from palabras property:', palabras.length, 'words');
        }
        // Si es un objeto con la estructura completa del vocabulario (tiene nombre, numero, subunits)
        else if (parsed.nombre && parsed.subunits) {
          palabras = parsed.subunits.flatMap((subunit: any) => subunit.palabras || []);
          console.log('Extracted from full vocab structure:', palabras.length, 'words');
        }
      }
    } catch (parseError) {
      console.error('Error parsing palabras_seleccionadas:', parseError);
      palabras = [];
    }

    return res.status(200).json({
      id_actividad: actividad.id_actividad,
      titulo: actividad.titulo,
      numero_palabras: actividad.numero_palabras,
      palabras: palabras.slice(0, actividad.numero_palabras || palabras.length)
    });

  } catch (error) {
    console.error('Error getting laboratory preview:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
