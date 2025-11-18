import { NextApiRequest, NextApiResponse } from 'next'

// Simple endpoint to extract vocabulary from plain text
// Can be used if PDF extraction fails
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, nivel } = req.body

    if (!text || !nivel) {
      return res.status(400).json({ error: 'Missing text or nivel' })
    }

    // Extract vocabulary from text with unit detection
    const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0)
    
    const units: any[] = []
    let currentMainUnit: any = null
    let currentSubUnit: any = null
    let currentSubUnitWords: any[] = []
    
    for (const line of lines) {
      // Check for unit headers: UNIDAD 5: Wild animals
      const unitMatch = line.match(/^UNIDAD\s+(\d+)\s*:\s*(.+)$/i)
      
      // Check for sub-unit headers: 5a Birds of a feather, 5b Grammar in Use
      const subUnitMatch = line.match(/^(\d+)([a-z])\s+(.+)$/i)
      
      if (unitMatch) {
        // Save previous sub-unit if exists
        if (currentMainUnit && currentSubUnit && currentSubUnitWords.length > 0) {
          if (!currentMainUnit.subunits) currentMainUnit.subunits = []
          currentMainUnit.subunits.push({
            numero: currentSubUnit.numero,
            nombre: currentSubUnit.nombre,
            palabras: currentSubUnitWords
          })
        }
        
        // Save previous main unit if exists
        if (currentMainUnit) {
          units.push(currentMainUnit)
        }
        
        // Start new main unit
        currentMainUnit = {
          numero: parseInt(unitMatch[1]),
          nombre: unitMatch[2].trim(),
          subunits: []
        }
        currentSubUnit = null
        currentSubUnitWords = []
        continue
      } else if (subUnitMatch) {
        // Save previous sub-unit if exists
        if (currentSubUnit && currentSubUnitWords.length > 0) {
          if (!currentMainUnit) {
            currentMainUnit = { numero: null, nombre: 'Unorganized', subunits: [] }
          }
          if (!currentMainUnit.subunits) currentMainUnit.subunits = []
          currentMainUnit.subunits.push({
            numero: currentSubUnit.numero,
            nombre: currentSubUnit.nombre,
            palabras: currentSubUnitWords
          })
        }
        
        // Start new sub-unit
        currentSubUnit = {
          numero: subUnitMatch[1] + subUnitMatch[2], // e.g., "5a", "5b"
          nombre: subUnitMatch[3].trim()
        }
        currentSubUnitWords = []
        continue
      }
      
      // Skip header lines
      if (line.match(/^(page|lesson|chapter|\d+\.?\s|copyright|isbn|all rights|---)/i)) {
        continue
      }
      
      let palabra = ''
      let significado = ''
      
      // Pattern 1: word - translation or word = translation or word : translation or word / translation
      const match1 = line.match(/^([^-=:\/]+?)\s*[-=:\/]\s*(.+)$/)
      if (match1) {
        palabra = match1[1].trim()
        significado = match1[2].trim()
      }
      
      // Pattern 2: word (translation)
      if (!significado) {
        const match2 = line.match(/^([A-Za-z\s]+?)\s*\((.+?)\)/)
        if (match2) {
          palabra = match2[1].trim()
          significado = match2[2].trim()
        }
      }
      
      // Validate extracted words
      if (palabra && significado) {
        // Remove grammatical categories like (n), (v), (adj), (adv), (phr), (phr v), (idm), (abbr), (pl n)
        palabra = palabra.replace(/\s*\([a-z\s]+\)\s*$/i, '').trim()
        
        // Clean up extra characters from significado
        significado = significado.replace(/[\[\]]/g, '').trim()
        
        if (palabra.length >= 2 && palabra.length < 100 && 
            significado.length >= 2 && significado.length < 200) {
          
          const wordCharRatio = (palabra.match(/[a-zA-Záéíóúñü\s]/gi) || []).length / palabra.length
          if (wordCharRatio >= 0.7) {
            const vocabEntry = {
              palabra: palabra,
              significado: significado,
              nivel: nivel
            }
            
            // Add to current sub-unit or main unit
            if (currentSubUnit) {
              currentSubUnitWords.push(vocabEntry)
            } else if (currentMainUnit) {
              // No sub-unit, add directly to main unit
              if (!currentMainUnit.palabras) currentMainUnit.palabras = []
              currentMainUnit.palabras.push(vocabEntry)
            } else {
              // If no unit is defined, add to a default unit
              if (units.length === 0) {
                units.push({
                  numero: null,
                  nombre: 'Unorganized',
                  palabras: [vocabEntry],
                  subunits: []
                })
              } else {
                if (!units[units.length - 1].palabras) units[units.length - 1].palabras = []
                units[units.length - 1].palabras.push(vocabEntry)
              }
            }
          }
        }
      }
    }
    
    // Save last sub-unit if exists
    if (currentMainUnit && currentSubUnit && currentSubUnitWords.length > 0) {
      if (!currentMainUnit.subunits) currentMainUnit.subunits = []
      currentMainUnit.subunits.push({
        numero: currentSubUnit.numero,
        nombre: currentSubUnit.nombre,
        palabras: currentSubUnitWords
      })
    }
    
    // Save last main unit
    if (currentMainUnit) {
      units.push(currentMainUnit)
    }
    
    if (units.length === 0) {
      return res.status(400).json({ 
        error: 'No vocabulary found. Check the text format.',
        hint: 'Expected format: word - meaning (one per line)'
      })
    }

    // Calculate total word count
    const totalWords = units.reduce((sum: number, unit: any) => {
      if (unit.subunits && unit.subunits.length > 0) {
        return sum + unit.subunits.reduce((subSum: number, sub: any) => subSum + (sub.palabras?.length || 0), 0)
      }
      return sum + (unit.palabras?.length || 0)
    }, 0)

    res.status(200).json({
      success: true,
      units: units,
      totalWords: totalWords,
      unitsCount: units.length
    })
  } catch (error) {
    console.error('Error extracting vocabulary:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
