import { NextApiRequest, NextApiResponse } from 'next'
import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'

// Import pdf-parse
const pdfParse = require('pdf-parse')

export const config = {
  api: {
    bodyParser: false,
  },
}

// Extract vocabulary from PDF text with unit detection
// Looks for patterns like: "word - translation" or "word = translation"
// Also detects units: "UNIDAD 5: Wild animals"
const extractVocabularyFromText = (text: string, nivel: string) => {
  const units: any[] = []
  let currentMainUnit: any = null
  let currentSubUnit: any = null
  let currentSubUnitWords: any[] = []
  
  // Split text into lines
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  for (const line of lines) {
    // Check for unit headers: UNIDAD 5: Wild animals, parts of animals' bodies, farm animals
    const unitMatch = line.match(/^UNIDAD\s+(\d+)\s*:\s*(.+)$/i)
    
    // Check for sub-unit headers: 5a Birds of a feather, 5b Grammar in Use, etc.
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
    
    // Skip lines that are clearly not vocabulary
    if (line.match(/^(page|lesson|chapter|\d+\.?\s|copyright|isbn|all rights|---)/i)) {
      continue
    }
    
    // Try to match vocabulary patterns:
    // "word - translation"
    // "word = translation"
    // "word : translation"
    // "word / translation"
    
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
    
    // Validate and clean the extracted words
    if (palabra && significado) {
      // Remove grammatical categories like (n), (v), (adj), (adv), (phr), (phr v), (idm), (abbr), (pl n)
      palabra = palabra.replace(/\s*\([a-z\s]+\)\s*$/i, '').trim()
      
      // Clean up extra characters from significado
      significado = significado.replace(/[\[\]]/g, '').trim()
      
      // Check if both have reasonable length and contain valid characters
      if (palabra.length >= 2 && palabra.length < 100 && 
          significado.length >= 2 && significado.length < 200) {
        
        // Additional validation - must be actual words
        // Check that it's not mostly numbers or special characters
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
  
  // Return structure with units
  return units
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = new IncomingForm({
      uploadDir: path.join(process.cwd(), 'tmp'),
      keepExtensions: true,
    })

    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form' })
      }

      try {
        const file = Array.isArray(files.file) ? files.file[0] : files.file
        const nivel = Array.isArray(fields.nivel) ? fields.nivel[0] : fields.nivel

        if (!file || !nivel) {
          return res.status(400).json({ error: 'Missing file or nivel' })
        }

        // Read PDF file
        const fileBuffer = fs.readFileSync(file.filepath)
        
        // Parse PDF with proper callback
        const data = await new Promise((resolve, reject) => {
          pdfParse(fileBuffer).then((result: any) => {
            resolve(result)
          }).catch((err: any) => {
            reject(err)
          })
        }) as any
        
        const text = data.text
        
        // Extract vocabulary from PDF text with units
        const units = extractVocabularyFromText(text, nivel)

        // Clean up temp file
        fs.unlinkSync(file.filepath)

        if (units.length === 0) {
          return res.status(400).json({ 
            error: 'No vocabulary found in PDF. Please check the file format.',
            preview: text.substring(0, 500) // Send preview for debugging
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
          filename: file.originalFilename,
          totalWords: totalWords,
          unitsCount: units.length,
          preview: text.substring(0, 200) // Show first 200 chars for confirmation
        })
      } catch (parseError) {
        console.error('Error processing PDF:', parseError)
        // Clean up temp file on error
        if (Array.isArray(files.file)) {
          fs.unlinkSync(files.file[0].filepath)
        } else if (files.file) {
          fs.unlinkSync(files.file.filepath)
        }
        res.status(500).json({ error: 'Error processing PDF file. Make sure it is a valid PDF.' })
      }
    })
  } catch (error) {
    console.error('Error handling upload:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
