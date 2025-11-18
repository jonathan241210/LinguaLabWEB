'use client'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'

interface VocabularyEntry {
  palabra: string
  significado: string
  nivel: string
}

interface VocabularioItem {
  id_vocabulario: number
  nivel: string
  contenido: VocabularyEntry[]
  archivo_original: string
  fecha_creacion: string
  activo: boolean
}

interface VocabUnit {
  id_unidad: number
  numero_unidad: number
  nombre_unidad: string
  palabras_ids: number[]
  fecha_creacion: string
  activo: boolean
}

export default function VocabularioPage() {
  const [vocabularios, setVocabularios] = useState<VocabularioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [nivel, setNivel] = useState('A1')
  const [extractedVocabulary, setExtractedVocabulary] = useState<VocabularyEntry[]>([])
  const [selectedVocab, setSelectedVocab] = useState<VocabularioItem | null>(null)
  const [showUnitsModal, setShowUnitsModal] = useState(false)
  const [unidades, setUnidades] = useState<VocabUnit[]>([])
  const [newUnitName, setNewUnitName] = useState('')
  const [selectedWords, setSelectedWords] = useState<number[]>([])
  const [showManualTextModal, setShowManualTextModal] = useState(false)
  const [manualText, setManualText] = useState('')
  const [extractedUnits, setExtractedUnits] = useState<any[]>([])
  const [successModal, setSuccessModal] = useState<{isOpen: boolean; message: string; type?: 'success' | 'error' | 'warning' | 'info'; onClose: () => void}>({isOpen: false, message: '', onClose: () => {}})
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())
  const [expandedVocabUnits, setExpandedVocabUnits] = useState<{[key: number]: Set<number>}>({})
  const [expandedModalUnits, setExpandedModalUnits] = useState<Set<number>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{id: number, countdown: number, type: 'unit' | 'word', wordIndex?: number} | null>(null)
  const [allUnitsExpanded, setAllUnitsExpanded] = useState(false)

  useEffect(() => {
    fetchVocabularios()
  }, [])

  // Countdown for delete confirmation
  useEffect(() => {
    if (deleteConfirm && deleteConfirm.countdown > 0) {
      const timer = setTimeout(() => {
        setDeleteConfirm(prev => prev ? {...prev, countdown: prev.countdown - 1} : null)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [deleteConfirm])

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setSuccessModal({
      isOpen: true,
      message,
      type,
      onClose: () => setSuccessModal({isOpen: false, message: '', onClose: () => {}})
    })
  }

  const fetchVocabularios = async () => {
    try {
      const response = await fetch('/api/vocabulario/list')
      const data = await response.json()
      if (data.vocabularios) {
        setVocabularios(data.vocabularios)
      }
    } catch (error) {
      console.error('Error loading vocabularies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a PDF file')
      return
    }

    setProcessing(true)
    setShowUploadModal(false)

    try {
      // Create FormData to send PDF file
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('nivel', nivel)

      const response = await fetch('/api/vocabulario/extract-pdf', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.units && result.units.length > 0) {
        // Flatten all words from all units (including subunits) for the confirmation modal
        const allWords: any[] = []
        result.units.forEach((unit: any) => {
          if (unit.subunits && unit.subunits.length > 0) {
            unit.subunits.forEach((sub: any) => {
              allWords.push(...sub.palabras)
            })
          } else if (unit.palabras) {
            allWords.push(...unit.palabras)
          }
        })
        setExtractedVocabulary(allWords)
        setExtractedUnits(result.units)
        
        // Expand all units by default to show organization
        const allIndices = new Set<number>(result.units.map((_: any, idx: number) => idx))
        setExpandedUnits(allIndices)
        
        setProcessing(false)
        setShowConfirmModal(true)
      } else {
        setProcessing(false)
        const errorMsg = result.error || 'No vocabulary found in PDF'
        showNotification('error', `${errorMsg}. You can check the PDF format or paste the text manually`)
        setShowUploadModal(true)
      }
    } catch (error) {
      console.error('Error processing vocabulary:', error)
      setProcessing(false)
      showNotification('error', 'Error processing file')
      setShowUploadModal(true)
    }
  }

  const handleConfirmSave = async () => {
    try {
      // Close confirm modal and show saving modal
      setShowConfirmModal(false)
      setSaving(true)
      
      console.log('Saving vocabulary...', { extractedVocabulary, extractedUnits })
      
      // Save both the flattened vocabulary and the units structure
      const response = await fetch('/api/vocabulario/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivel: nivel,
          archivo_original: selectedFile?.name || (manualText ? 'manual_text.txt' : 'vocabulary.pdf'),
          contenido: extractedVocabulary,
          units_structure: extractedUnits // Save the complete structure
        })
      })

      const result = await response.json()
      console.log('Upload result:', result)
      
      if (response.ok && result.vocabulario) {
        const vocabularioId = result.vocabulario.id_vocabulario
        
        // If we have units, create them automatically
        if (extractedUnits.length > 0) {
          let unitsCreated = 0
          let currentWordIndex = 0
          
          for (const unit of extractedUnits) {
            // Skip if no unit number (unorganized words)
            if (!unit.numero) continue
            
            // If unit has subunits, create a unit for each subunit
            if (unit.subunits && unit.subunits.length > 0) {
              for (const subunit of unit.subunits) {
                const wordIndices: number[] = []
                
                // Add indices for all words in this subunit
                for (let i = 0; i < subunit.palabras.length; i++) {
                  wordIndices.push(currentWordIndex + i)
                }
                currentWordIndex += subunit.palabras.length
                
                try {
                  const unitResponse = await fetch('/api/vocabulario/crear-unidad', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id_vocabulario: vocabularioId,
                      numero_unidad: subunit.numero,
                      nombre_unidad: subunit.nombre,
                      palabras_ids: wordIndices
                    })
                  })
                  
                  if (unitResponse.ok) {
                    unitsCreated++
                  }
                } catch (err) {
                  console.error('Error creating subunit:', err)
                }
              }
            } else if (unit.palabras && unit.palabras.length > 0) {
              // Unit has direct palabras (no subunits)
              const wordIndices: number[] = []
              
              for (let i = 0; i < unit.palabras.length; i++) {
                wordIndices.push(currentWordIndex + i)
              }
              currentWordIndex += unit.palabras.length
              
              try {
                const unitResponse = await fetch('/api/vocabulario/crear-unidad', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id_vocabulario: vocabularioId,
                    numero_unidad: unit.numero,
                    nombre_unidad: unit.nombre,
                    palabras_ids: wordIndices
                  })
                })
                
                if (unitResponse.ok) {
                  unitsCreated++
                }
              } catch (err) {
                console.error('Error creating unit:', err)
              }
            }
          }
          
          // Close saving modal first
          setSaving(false)
          
          // Then show success notification
          showNotification('success', `✓ Vocabulary saved successfully! ${unitsCreated} units created with ${extractedVocabulary.length} words`)
        } else {
          setSaving(false)
          showNotification('success', `✓ Vocabulary saved successfully with ${extractedVocabulary.length} words`)
        }
        
        // Close all modals and reset states
        setShowUploadModal(false)
        setShowManualTextModal(false)
        setSelectedFile(null)
        setNivel('A1')
        setExtractedVocabulary([])
        setExtractedUnits([])
        setManualText('')
        setExpandedUnits(new Set())
        
        // Refresh the list
        fetchVocabularios()
      } else {
        setSaving(false)
        showNotification('error', result.error || 'Error saving vocabulary')
      }
    } catch (error) {
      console.error('Error saving vocabulary:', error)
      setSaving(false)
      showNotification('error', 'Error saving vocabulary')
    }
  }

  const handleAddEntry = () => {
    setExtractedVocabulary([...extractedVocabulary, { palabra: '', significado: '', nivel: nivel }])
  }

  const handleDeleteEntry = (index: number) => {
    setExtractedVocabulary(extractedVocabulary.filter((_, i) => i !== index))
  }

  const handleUpdateEntry = (index: number, field: keyof VocabularyEntry, value: string) => {
    const updated = [...extractedVocabulary]
    updated[index][field] = value
    setExtractedVocabulary(updated)
  }

  const handleOpenUnitsModal = async (vocab: VocabularioItem) => {
    setSelectedVocab(vocab)
    setSelectedWords([])
    setNewUnitName('')
    
    try {
      const response = await fetch(`/api/vocabulario/get-unidades?id_vocabulario=${vocab.id_vocabulario}`)
      const data = await response.json()
      setUnidades(data.unidades || [])
    } catch (error) {
      console.error('Error loading units:', error)
    }
    
    setShowUnitsModal(true)
  }

  const handleCreateUnit = async () => {
    if (!selectedVocab || selectedWords.length === 0) {
      showNotification('error', 'Please select at least one word')
      return
    }

    if (!newUnitName.trim()) {
      showNotification('error', 'Please enter a unit name')
      return
    }

    try {
      const response = await fetch('/api/vocabulario/crear-unidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_vocabulario: selectedVocab.id_vocabulario,
          numero_unidad: unidades.length + 1,
          nombre_unidad: newUnitName,
          palabras_ids: selectedWords
        })
      })

      if (response.ok) {
        showNotification('success', `Unit created successfully with ${selectedWords.length} words`)
        setNewUnitName('')
        setSelectedWords([])
        
        // Refresh units
        const unitsResponse = await fetch(`/api/vocabulario/get-unidades?id_vocabulario=${selectedVocab.id_vocabulario}`)
        const unitsData = await unitsResponse.json()
        setUnidades(unitsData.unidades || [])
      } else {
        const error = await response.json()
        showNotification('error', error.error || 'Error creating unit')
      }
    } catch (error) {
      console.error('Error creating unit:', error)
      showNotification('error', 'Error creating unit')
    }
  }

  const handleDeleteUnit = async (id_unidad: number) => {
    setDeleteConfirm({ id: id_unidad, countdown: 5, type: 'unit' })
  }

  const handleDeleteWord = async (unitId: number, wordIndex: number) => {
    setDeleteConfirm({ id: unitId, countdown: 5, type: 'word', wordIndex })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm || deleteConfirm.countdown > 0) return

    try {
      if (deleteConfirm.type === 'unit') {
        const response = await fetch(`/api/vocabulario/eliminar-unidad?id_unidad=${deleteConfirm.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setUnidades(unidades.filter(u => u.id_unidad !== deleteConfirm.id))
          showNotification('success', 'Unit deleted successfully')
        } else {
          showNotification('error', 'Error deleting unit')
        }
      } else if (deleteConfirm.type === 'word' && deleteConfirm.wordIndex !== undefined) {
        // Here you would implement word deletion logic
        // For now, just show a success message
        showNotification('success', 'Word deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      showNotification('error', `Error deleting ${deleteConfirm.type}`)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const toggleModalUnit = (unitIndex: number) => {
    setExpandedModalUnits(prev => {
      const newSet = new Set(prev)
      if (newSet.has(unitIndex)) {
        newSet.delete(unitIndex)
      } else {
        newSet.add(unitIndex)
      }
      return newSet
    })
  }

  const toggleVocabUnit = (vocabId: number, unitIndex: number) => {
    setExpandedVocabUnits(prev => {
      const vocabUnits = prev[vocabId] || new Set()
      const newVocabUnits = new Set(vocabUnits)
      
      if (newVocabUnits.has(unitIndex)) {
        newVocabUnits.delete(unitIndex)
      } else {
        newVocabUnits.add(unitIndex)
      }
      
      return { ...prev, [vocabId]: newVocabUnits }
    })
  }

  const toggleAllVocabUnits = (vocabId: number, totalUnits: number) => {
    setExpandedVocabUnits(prev => {
      const vocabUnits = prev[vocabId] || new Set()
      const allExpanded = vocabUnits.size === totalUnits
      
      if (allExpanded) {
        // Collapse all
        return { ...prev, [vocabId]: new Set() }
      } else {
        // Expand all
        const allIndices = new Set(Array.from({ length: totalUnits }, (_, i) => i))
        return { ...prev, [vocabId]: allIndices }
      }
    })
  }

  const toggleWordSelection = (index: number) => {
    setSelectedWords(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleExtractFromText = async () => {
    if (!manualText.trim()) {
      showNotification('error', 'Please paste the vocabulary text')
      return
    }

    setProcessing(true)
    setShowManualTextModal(false)

    try {
      const response = await fetch('/api/vocabulario/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: manualText,
          nivel: nivel
        })
      })

      const result = await response.json()

      if (response.ok && result.units && result.units.length > 0) {
        // Flatten all words from all units (including subunits)
        const allWords: any[] = []
        result.units.forEach((unit: any) => {
          if (unit.subunits && unit.subunits.length > 0) {
            unit.subunits.forEach((sub: any) => {
              allWords.push(...sub.palabras)
            })
          } else if (unit.palabras) {
            allWords.push(...unit.palabras)
          }
        })
        setExtractedVocabulary(allWords)
        setExtractedUnits(result.units)
        
        // Expand all units by default to show organization
        const allIndices = new Set<number>(result.units.map((_: any, idx: number) => idx))
        setExpandedUnits(allIndices)
        
        setProcessing(false)
        setShowConfirmModal(true)
      } else {
        setProcessing(false)
        showNotification('error', result.error || 'No vocabulary found')
        setShowManualTextModal(true)
      }
    } catch (error) {
      console.error('Error extracting vocabulary:', error)
      setProcessing(false)
      showNotification('error', 'Error processing text')
      setShowManualTextModal(true)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/vocabulario/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_vocabulario: id })
      })

      if (response.ok) {
        showNotification('success', `Vocabulary ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchVocabularios()
      } else {
        showNotification('error', 'Error updating status')
      }
    } catch (error) {
      console.error('Error toggling status:', error)
      showNotification('error', 'Error updating vocabulary status')
    }
  }

  const handleOrganizeVocabulary = async (vocab: VocabularioItem) => {
    setSelectedVocab(vocab)
    setSelectedWords([])
    setNewUnitName('')
    
    // Load existing units from database
    try {
      const response = await fetch(`/api/vocabulario/get-unidades?id_vocabulario=${vocab.id_vocabulario}`)
      const data = await response.json()
      setUnidades(data.unidades || [])
    } catch (error) {
      console.error('Error loading units:', error)
      setUnidades([])
    }
    
    setShowUnitsModal(true)
  }

  return (
    <DashboardLayout title="Vocabulary Management" successModal={successModal}>
      <div className="vocabulario-container">
        <div className="header">
          <h1>📚 Vocabulary Management</h1>
          <button 
            className="upload-btn"
            onClick={() => setShowUploadModal(true)}
          >
            ➕ Upload PDF
          </button>
        </div>

        {loading ? (
          <p>Loading vocabularies...</p>
        ) : vocabularios.length === 0 ? (
          <p className="no-data">No vocabularies uploaded yet</p>
        ) : (
          <div className="vocabulary-sections">
            {/* Group vocabularies by nivel */}
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => {
              const vocabsForLevel = vocabularios.filter(v => v.nivel === level)
              if (vocabsForLevel.length === 0) return null
              
              return (
                <div key={level} className="level-section">
                  <div className="level-header">
                    <h2>{level} Level</h2>
                    <span className="level-count">{vocabsForLevel.length} vocabulary set{vocabsForLevel.length > 1 ? 's' : ''}</span>
                  </div>
                  
                  {vocabsForLevel.map((vocab) => {
                    // Check if vocabulary has units structure
                    const hasUnits = Array.isArray(vocab.contenido) && 
                                    vocab.contenido.length > 0 && 
                                    (vocab.contenido[0] as any).subunits
                    
                    return (
                      <div key={vocab.id_vocabulario} className="vocab-item-expanded">
                        <div className="vocab-item-header">
                          <div className="vocab-title">
                            <span className="vocab-icon">📚</span>
                            <span className="vocab-name">{vocab.archivo_original}</span>
                            <span className="vocab-date">
                              {new Date(vocab.fecha_creacion).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="vocab-actions">
                            <button 
                              className={`status-btn-sm ${vocab.activo ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleStatus(vocab.id_vocabulario, vocab.activo)}
                            >
                              {vocab.activo ? '✓' : '✗'}
                            </button>
                            <button 
                              className="btn-organize-sm"
                              onClick={() => handleOrganizeVocabulary(vocab)}
                            >
                              Manage Units
                            </button>
                          </div>
                        </div>
                        
                        {/* Show organized units with words */}
                        {hasUnits ? (
                          <>
                            <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '0.5rem'}}>
                              <button
                                onClick={() => toggleAllVocabUnits(vocab.id_vocabulario, vocab.contenido.length)}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.5rem 1rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  transition: 'all 0.2s'
                                }}
                              >
                                {(expandedVocabUnits[vocab.id_vocabulario]?.size || 0) === vocab.contenido.length 
                                  ? '▲ Collapse All Units' 
                                  : '▼ Expand All Units'}
                              </button>
                            </div>
                            <div className="units-display">
                              {vocab.contenido.map((unit: any, unitIdx: number) => {
                                const isExpanded = expandedVocabUnits[vocab.id_vocabulario]?.has(unitIdx) || false
                                
                                return (
                                  <div key={unitIdx} className="main-unit-display">
                                    <div 
                                      className="main-unit-header clickable"
                                      onClick={() => toggleVocabUnit(vocab.id_vocabulario, unitIdx)}
                                      style={{cursor: 'pointer'}}
                                    >
                                      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1}}>
                                        <span className="unit-badge">Unit {unit.numero}</span>
                                        <span className="unit-title">{unit.nombre}</span>
                                      </div>
                                      <span style={{fontSize: '1.2rem', color: '#3b82f6', fontWeight: 'bold'}}>
                                        {isExpanded ? '▼' : '▶'}
                                      </span>
                                    </div>
                                    
                                    {isExpanded && (
                                      <>
                                        {unit.subunits && unit.subunits.length > 0 ? (
                                          <div className="subunits-display">
                                            {unit.subunits.map((subunit: any, subIdx: number) => (
                                              <div key={subIdx} className="subunit-display">
                                                <div className="subunit-header">
                                                  <span className="subunit-badge">{subunit.numero}</span>
                                                  <span className="subunit-title">{subunit.nombre}</span>
                                                  <span className="word-count-badge">{subunit.palabras?.length || 0} words</span>
                                                </div>
                                                <div className="words-list">
                                                  {subunit.palabras?.map((word: any, wordIdx: number) => (
                                                    <div key={wordIdx} className="word-item-display">
                                                      <span className="word-term">{word.palabra}</span>
                                                      <span className="word-separator">→</span>
                                                      <span className="word-meaning">{word.significado}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="words-list">
                                            {unit.palabras?.map((word: any, wordIdx: number) => (
                                              <div key={wordIdx} className="word-item-display">
                                                <span className="word-term">{word.palabra}</span>
                                                <span className="word-separator">→</span>
                                                <span className="word-meaning">{word.significado}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="no-units-message">
                            <p>📋 This vocabulary is not organized into units yet</p>
                            <p style={{fontSize: '0.85rem', color: '#6b7280'}}>
                              {Array.isArray(vocab.contenido) ? `${vocab.contenido.length} words available` : 'No words found'}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {showUploadModal && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={() => setShowUploadModal(false)}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '400px',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Botón cerrar X */}
              <button
                onClick={() => {
                  setShowUploadModal(false)
                  setSelectedFile(null)
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b3b',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
                  e.currentTarget.style.backgroundColor = '#ff4f4f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = '#ff3b3b'
                }}
              >
                ✕
              </button>

              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 24px 0',
                paddingRight: '40px',
              }}>Upload Vocabulary PDF</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>Level:</label>
                  <select 
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#333',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    display: 'block'
                  }}>PDF File:</label>
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      color: '#333',
                      width: '100%'
                    }}
                  />
                  {selectedFile && (
                    <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginTop: '8px'}}>✓ Selected: {selectedFile.name}</p>
                  )}
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (uploading || !selectedFile) ? 'not-allowed' : 'pointer',
                    marginTop: '8px',
                    opacity: (uploading || !selectedFile) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!uploading && selectedFile) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Process PDF'}
                </button>
                
                <button 
                  onClick={() => setShowManualTextModal(true)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Or Paste Text
                </button>
              </div>
            </div>
          </div>
        )}

        {showManualTextModal && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={() => setShowManualTextModal(false)}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '550px',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Botón cerrar X */}
              <button
                onClick={() => {
                  setShowManualTextModal(false)
                  setManualText('')
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b3b',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
                  e.currentTarget.style.backgroundColor = '#ff4f4f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = '#ff3b3b'
                }}
              >
                ✕
              </button>

              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 16px 0',
                paddingRight: '40px',
              }}>Paste Vocabulary Text</h2>
              
              <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginBottom: '12px'}}>
                Copy and paste the vocabulary from your PDF or document. Expected format:
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '12px',
                borderRadius: '12px',
                marginBottom: '16px',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)',
                fontFamily: 'monospace'
              }}>
                hello - hola<br/>
                goodbye - adiós<br/>
                thank you - gracias
              </div>
              
              <textarea 
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste vocabulary text here (one entry per line)..."
                style={{
                  width: '100%',
                  height: '280px',
                  padding: '12px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'vertical',
                  backgroundColor: 'white',
                  color: '#333'
                }}
              />

              <div style={{display: 'flex', gap: '12px', marginTop: '20px'}}>
                <button 
                  onClick={handleExtractFromText}
                  disabled={!manualText.trim()}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: !manualText.trim() ? 'not-allowed' : 'pointer',
                    opacity: !manualText.trim() ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (manualText.trim()) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Extract Vocabulary
                </button>
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '40px',
              width: '90%',
              maxWidth: '350px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255,255,255,0.2)',
                borderTop: '4px solid var(--color-primary-green)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite'
              }} />
              <h2 style={{color: 'white', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0'}}>Processing...</h2>
              <p style={{color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0}}>Extracting vocabulary from the document</p>
            </div>
          </div>
        )}

        {saving && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '40px',
              width: '90%',
              maxWidth: '380px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(255,255,255,0.2)',
                borderTop: '4px solid var(--color-primary-green)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                animation: 'spin 1s linear infinite'
              }} />
              <h2 style={{color: 'white', fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px 0'}}>💾 Saving Vocabulary...</h2>
              <p style={{color: 'rgba(255,255,255,0.9)', fontSize: '14px', margin: '0 0 8px 0'}}>Organizing units and saving to database</p>
              <p style={{fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0}}>
                This may take a few moments...
              </p>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={() => setShowConfirmModal(false)}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'auto',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Botón cerrar X */}
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setExtractedVocabulary([])
                  setExtractedUnits([])
                  setExpandedUnits(new Set())
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b3b',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
                  e.currentTarget.style.backgroundColor = '#ff4f4f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = '#ff3b3b'
                }}
              >
                ✕
              </button>

              <div style={{marginBottom: '24px', paddingRight: '40px'}}>
                <h2 style={{color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px 0'}}>📋 Confirm Vocabulary Import</h2>
                <div style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                  <span style={{
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>{extractedUnits.length} Units</span>
                  <span style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>{extractedVocabulary.length} Words</span>
                </div>
              </div>
              
              <p style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '15px',
                marginBottom: '24px',
                padding: '12px 16px',
                background: 'rgba(59,130,246,0.15)',
                borderRadius: '12px',
                borderLeft: '4px solid #3b82f6'
              }}>
                ✓ Vocabulary organized automatically into {extractedUnits.length} unit{extractedUnits.length > 1 ? 's' : ''} with {extractedUnits.reduce((sum, u) => sum + (u.subunits?.length || 0), 0)} sub-units
              </p>
              
              {extractedUnits.length > 0 ? (
                <div className="units-container">
                  {extractedUnits.map((unit, unitIndex) => {
                    const isExpanded = expandedUnits.has(unitIndex)
                    const hasSubunits = unit.subunits && unit.subunits.length > 0
                    const totalWords = hasSubunits 
                      ? unit.subunits.reduce((sum: number, sub: any) => sum + sub.palabras.length, 0)
                      : (unit.palabras?.length || 0)
                    
                    return (
                      <div key={unitIndex} className="unit-section">
                        <div 
                          className="unit-header"
                          onClick={() => {
                            const newExpanded = new Set(expandedUnits)
                            if (isExpanded) {
                              newExpanded.delete(unitIndex)
                            } else {
                              newExpanded.add(unitIndex)
                            }
                            setExpandedUnits(newExpanded)
                          }}
                        >
                          <div className="unit-info">
                            <span className="unit-number">Unit {unit.numero || '?'}</span>
                            <span className="unit-name">{unit.nombre}</span>
                          </div>
                          <div className="unit-meta">
                            <span className="word-count">{totalWords} words</span>
                            {hasSubunits && <span className="subunit-badge">{unit.subunits.length} sections</span>}
                            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="unit-content">
                            {hasSubunits ? (
                              unit.subunits.map((subunit: any, subIndex: number) => (
                                <div key={subIndex} className="subunit-section">
                                  <div className="subunit-header">
                                    <span className="subunit-number">{subunit.numero}</span>
                                    <span className="subunit-name">{subunit.nombre}</span>
                                    <span className="subunit-count">({subunit.palabras.length} words)</span>
                                  </div>
                                  <div className="words-grid">
                                    {subunit.palabras.map((word: any, idx: number) => (
                                      <div key={idx} className="word-card">
                                        <div className="word-term">{word.palabra}</div>
                                        <div className="word-meaning">{word.significado}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="unit-words">
                                <div className="words-grid">
                                  {unit.palabras?.map((word: any, idx: number) => (
                                    <div key={idx} className="word-card">
                                      <div className="word-term">{word.palabra}</div>
                                      <div className="word-meaning">{word.significado}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="vocab-table-container">
                  <table className="vocab-table">
                    <thead>
                      <tr>
                        <th style={{width: '40%'}}>Word</th>
                        <th style={{width: '60%'}}>Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extractedVocabulary.slice(0, 50).map((entry, index) => (
                        <tr key={index}>
                          <td>{entry.palabra}</td>
                          <td>{entry.significado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {extractedVocabulary.length > 50 && (
                    <p style={{textAlign: 'center', color: '#6b7280', marginTop: '1rem'}}>
                      +{extractedVocabulary.length - 50} more words...
                    </p>
                  )}
                </div>
              )}

              <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button 
                  onClick={handleConfirmSave}
                  disabled={extractedVocabulary.length === 0}
                  style={{
                    flex: 2,
                    padding: '16px 32px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: extractedVocabulary.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: extractedVocabulary.length === 0 ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (extractedVocabulary.length > 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  💾 Save & Organize ({extractedVocabulary.length} words in {extractedUnits.length} units)
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmModal(false)
                    setExtractedVocabulary([])
                    setExtractedUnits([])
                    setExpandedUnits(new Set())
                  }}
                  style={{
                    flex: 1,
                    padding: '16px 32px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnitsModal && selectedVocab && (
          <div className="llw-modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={() => setShowUnitsModal(false)}>
            <div className="llw-modal-card" style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '900px',
              maxHeight: '85vh',
              overflow: 'auto',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{marginBottom: '24px', paddingRight: '40px'}}>
                <h2 style={{color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px 0'}}>📂 Units - {selectedVocab.archivo_original}</h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span style={{
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>{unidades.length} Units</span>
                </div>
              </div>

              {/* Botón cerrar X - estilo FormModal */}
              <button
                onClick={() => setShowUnitsModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b3b',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
                  e.currentTarget.style.backgroundColor = '#ff4f4f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = '#ff3b3b'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                }}
              >
                ✕
              </button>

              {unidades.length === 0 ? (
                <div style={{textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.7)'}}>
                  <p style={{fontSize: '18px', marginBottom: '8px', color: 'white'}}>No units created yet</p>
                  <p style={{fontSize: '14px'}}>Units will appear here once vocabulary is organized</p>
                </div>
              ) : (
                <div className="units-list" style={{maxHeight: '600px', overflowY: 'auto', marginBottom: '1.5rem'}}>
                  {unidades.map((unit, unitIndex) => {
                    const isExpanded = expandedModalUnits.has(unitIndex)
                    const unitWords = selectedVocab?.contenido.filter((_, idx) => unit.palabras_ids.includes(idx)) || []
                    
                    return (
                      <div key={unit.id_unidad} className="unit-item" style={{
                        background: 'rgba(255,255,255,0.08)',
                        padding: '16px',
                        marginBottom: '12px',
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--color-primary-green)'
                      }}>
                        <div 
                          style={{
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleModalUnit(unitIndex)}
                        >
                          <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: 1}}>
                            <span style={{fontSize: '18px', color: 'var(--color-primary-green)', fontWeight: 'bold'}}>
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span style={{
                              background: 'rgba(16,185,129,0.2)',
                              color: '#10b981',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '13px'
                            }}>
                              {unit.numero_unidad}
                            </span>
                            <span style={{fontWeight: '600', color: 'white', fontSize: '15px'}}>{unit.nombre_unidad}</span>
                            <span style={{color: 'rgba(255,255,255,0.7)', fontSize: '13px'}}>
                              ({unit.palabras_ids.length} words)
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteUnit(unit.id_unidad)
                            }}
                            style={{
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#ef4444'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#dc2626'
                            }}
                          >
                            Delete Unit
                          </button>
                        </div>

                        {isExpanded && unitWords.length > 0 && (
                          <div style={{
                            marginTop: '16px',
                            paddingTop: '16px',
                            borderTop: '2px solid rgba(255,255,255,0.1)'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                              gap: '12px'
                            }}>
                              {unitWords.map((word, wordIdx) => (
                                <div key={wordIdx} style={{
                                  background: 'rgba(255,255,255,0.95)',
                                  padding: '12px',
                                  borderRadius: '10px',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <div style={{flex: 1, minWidth: 0}}>
                                    <div style={{fontWeight: '700', color: '#0f172a', fontSize: '14px', marginBottom: '4px'}}>
                                      {word.palabra}
                                    </div>
                                    <div style={{color: '#475569', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                      {word.significado}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteWord(unit.id_unidad, unit.palabras_ids[wordIdx])}
                                    style={{
                                      background: '#dc2626',
                                      color: 'white',
                                      border: 'none',
                                      padding: '6px 10px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.background = '#ef4444'
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.background = '#dc2626'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="modal-actions" style={{marginTop: '1.5rem'}}>
                <button
                  onClick={() => setShowUnitsModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div 
            className="llw-modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
          >
            <div
              className="llw-modal-card"
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                width: '90%',
                maxWidth: '450px',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar X */}
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#ff3b3b',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
                  e.currentTarget.style.backgroundColor = '#ff4f4f'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.backgroundColor = '#ff3b3b'
                }}
              >
                ✕
              </button>

              {/* Título */}
              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 24px 0',
                paddingRight: '40px',
              }}>
                ⚠️ Confirm Deletion
              </h2>

              {/* Mensaje */}
              <p style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '14px',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                Are you sure you want to delete this {deleteConfirm.type === 'unit' ? 'unit' : 'word'}? This action cannot be undone.
              </p>
              
              {/* Countdown box */}
              <div style={{
                backgroundColor: 'rgba(255, 193, 7, 0.15)',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <p style={{
                  color: '#ffc107',
                  fontWeight: '600',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Please wait {deleteConfirm.countdown} second{deleteConfirm.countdown !== 1 ? 's' : ''}
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  height: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    background: '#ffc107',
                    height: '100%',
                    width: `${((5 - deleteConfirm.countdown) / 5) * 100}%`,
                    transition: 'width 1s linear'
                  }}></div>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '2px solid white',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteConfirm.countdown > 0}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: deleteConfirm.countdown > 0 ? 'rgba(220, 38, 38, 0.5)' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: deleteConfirm.countdown > 0 ? 'not-allowed' : 'pointer',
                    opacity: deleteConfirm.countdown > 0 ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (deleteConfirm.countdown === 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {deleteConfirm.countdown > 0 ? `Wait ${deleteConfirm.countdown}s` : `Delete ${deleteConfirm.type === 'unit' ? 'Unit' : 'Word'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .vocabulario-container {
            padding: 2rem;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }

          h1 {
            color: #2d3748;
            font-size: 2rem;
            margin: 0;
          }

          .upload-btn {
            background: #10b981;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
          }

          .upload-btn:hover {
            background: #059669;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }

          .no-data {
            text-align: center;
            color: #718096;
            padding: 3rem;
            font-size: 1.1rem;
          }

          .vocabulary-sections {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }

          .level-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .level-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 0.75rem;
            border-bottom: 3px solid #3b82f6;
          }

          .level-header h2 {
            color: #1e40af;
            font-size: 1.5rem;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .level-count {
            background: #dbeafe;
            color: #1e40af;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .vocab-item {
            background: #f9fafb;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border-left: 4px solid #10b981;
            transition: all 0.2s;
          }

          .vocab-item:hover {
            background: #f3f4f6;
            transform: translateX(4px);
          }

          .vocab-item:last-child {
            margin-bottom: 0;
          }

          .vocab-item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .vocab-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
          }

          .vocab-icon {
            font-size: 1.2rem;
          }

          .vocab-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 1rem;
          }

          .vocab-date {
            color: #9ca3af;
            font-size: 0.85rem;
          }

          .vocab-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }

          .status-btn-sm {
            border: none;
            padding: 0.3rem 0.6rem;
            border-radius: 4px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 600;
          }

          .status-btn-sm.active {
            background: #d1fae5;
            color: #065f46;
          }

          .status-btn-sm.inactive {
            background: #fee2e2;
            color: #991b1b;
          }

          .btn-organize-sm {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
          }

          .btn-organize-sm:hover {
            background: #2563eb;
          }

          .vocab-stats {
            margin-top: 0.75rem;
            display: flex;
            gap: 0.75rem;
          }

          .stat-badge {
            background: #ede9fe;
            color: #6b21a8;
            padding: 0.3rem 0.6rem;
            border-radius: 6px;
            font-size: 0.85rem;
          }

          .stat-badge strong {
            font-weight: 700;
          }

          .vocab-item-expanded {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border-left: 5px solid #3b82f6;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          }

          .units-display {
            margin-top: 1.5rem;
          }

          .main-unit-display {
            background: #f9fafb;
            border-radius: 10px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            border-left: 4px solid #8b5cf6;
          }

          .main-unit-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid #e5e7eb;
          }

          .unit-badge {
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            color: white;
            padding: 0.4rem 0.9rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.85rem;
            box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
          }

          .unit-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
          }

          .subunits-display {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .subunit-display {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            border-left: 3px solid #3b82f6;
          }

          .subunit-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .subunit-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 0.25rem 0.7rem;
            border-radius: 15px;
            font-weight: 700;
            font-size: 0.8rem;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          }

          .subunit-title {
            font-size: 0.95rem;
            font-weight: 600;
            color: #374151;
            flex: 1;
          }

          .word-count-badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
          }

          .words-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 0.75rem;
          }

          .word-item-display {
            background: #f8fafc;
            padding: 0.65rem 0.85rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-left: 3px solid #10b981;
            transition: all 0.2s;
          }

          .word-item-display:hover {
            background: #f1f5f9;
            transform: translateX(3px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }

          .word-term {
            font-weight: 700;
            color: #0f172a;
            font-size: 0.9rem;
            min-width: fit-content;
          }

          .word-separator {
            color: #10b981;
            font-weight: 700;
            font-size: 1rem;
          }

          .word-meaning {
            color: #475569;
            font-size: 0.85rem;
            flex: 1;
          }

          .no-units-message {
            text-align: center;
            padding: 3rem 1rem;
            color: #6b7280;
            background: #f9fafb;
            border-radius: 8px;
            margin-top: 1rem;
          }

          .no-units-message p:first-child {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }

          .vocabulario-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }

          .vocab-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s;
          }

          .vocab-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .vocab-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .nivel-badge {
            background: #3b82f6;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
          }

          .status-btn {
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
          }

          .status-btn.active {
            background: #d1fae5;
            color: #065f46;
          }

          .status-btn.inactive {
            background: #fee2e2;
            color: #991b1b;
          }

          .vocab-card h3 {
            color: #1e40af;
            margin: 0.5rem 0;
            font-size: 1.1rem;
            word-break: break-word;
          }

          .fecha {
            color: #9ca3af;
            font-size: 0.85rem;
            margin: 0.5rem 0;
          }

          .vocab-preview {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            color: #374151;
            font-size: 0.9rem;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.2s;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s;
          }

          .modal-content-large {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            width: 95%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideUp 0.3s;
          }

          .processing-modal {
            text-align: center;
            padding: 3rem;
          }

          .spinner {
            width: 60px;
            height: 60px;
            margin: 0 auto 2rem;
            border: 5px solid #e5e7eb;
            border-top: 5px solid #10b981;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }

          .modal-content h2,
          .modal-content-large h2 {
            color: #1e293b;
            margin: 0;
          }

          .btn-organize {
            width: 100%;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            margin-top: 1rem;
            transition: all 0.2s;
          }

          .btn-organize:hover {
            background: #2563eb;
          }

          .units-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin: 1.5rem 0;
          }

          .create-unit-section,
          .existing-units-section {
            background: #f9fafb;
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }

          .create-unit-section h3,
          .existing-units-section h3 {
            margin: 0 0 1rem 0;
            color: #1e293b;
            font-size: 1.1rem;
          }

          .words-selector {
            margin: 1.5rem 0;
          }

          .words-selector label {
            display: block;
            margin-bottom: 0.75rem;
            color: #374151;
            font-weight: 500;
          }

          .words-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 0.5rem;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #d1d5db;
            padding: 0.75rem;
            border-radius: 8px;
            background: white;
          }

          .word-checkbox {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            padding: 0.5rem;
            cursor: pointer;
            border-radius: 6px;
            transition: background 0.2s;
          }

          .word-checkbox:hover {
            background: #f0f9ff;
          }

          .word-checkbox input {
            margin-top: 0.25rem;
            cursor: pointer;
          }

          .word-text {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;
          }

          .word-text strong {
            color: #1f2937;
            font-size: 0.95rem;
          }

          .word-text small {
            color: #6b7280;
            font-size: 0.85rem;
          }

          .units-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .unit-card {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 1rem;
          }

          .unit-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.75rem;
          }

          .unit-header h4 {
            margin: 0;
            color: #1e40af;
            font-size: 0.95rem;
          }

          .btn-delete-unit {
            background: #fee2e2;
            color: #991b1b;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          }

          .btn-delete-unit:hover {
            background: #fecaca;
          }

          .unit-words {
            margin: 0 0 0.5rem 0;
            color: #4b5563;
            font-size: 0.9rem;
          }

          .unit-words-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .word-tag {
            display: inline-block;
            background: #dbeafe;
            color: #0c4a6e;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
          }

          .btn-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
          }

          .btn-close:hover {
            color: #1f2937;
          }
            background: #10b981;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
          }

          .btn-add:hover {
            background: #059669;
          }

          .vocab-table-container {
            max-height: 400px;
            overflow-y: auto;
            margin: 1.5rem 0;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }

          .vocab-table {
            width: 100%;
            border-collapse: collapse;
          }

          .vocab-table thead {
            background: #f3f4f6;
            position: sticky;
            top: 0;
            z-index: 10;
          }

          .vocab-table th {
            padding: 0.75rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }

          .vocab-table td {
            padding: 0.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .vocab-table input,
          .vocab-table select {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            font-size: 0.9rem;
          }

          .vocab-table input:focus,
          .vocab-table select:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .btn-delete {
            background: #fee2e2;
            color: #991b1b;
            border: none;
            padding: 0.4rem 0.6rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
          }

          .btn-delete:hover {
            background: #fecaca;
          }

          .vocab-summary {
            padding: 1rem;
            background: #f0fdf4;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            color: #166534;
            text-align: center;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            color: #374151;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .file-info {
            margin-top: 0.5rem;
            color: #10b981;
            font-size: 0.9rem;
          }

          .summary-badges {
            display: flex;
            gap: 0.5rem;
          }

          .badge {
            padding: 0.4rem 0.9rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
          }

          .badge-primary {
            background: #dbeafe;
            color: #1e40af;
          }

          .badge-success {
            background: #d1fae5;
            color: #065f46;
          }

          .units-container {
            max-height: 500px;
            overflow-y: auto;
            margin-bottom: 1.5rem;
          }

          .unit-section {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
          }

          .unit-header {
            background: #f9fafb;
            padding: 1rem 1.25rem;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
          }

          .unit-header:hover {
            background: #f3f4f6;
          }

          .unit-info {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .unit-number {
            background: #3b82f6;
            color: white;
            padding: 0.3rem 0.8rem;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.85rem;
          }

          .unit-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 1rem;
          }

          .unit-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .word-count {
            color: #6b7280;
            font-size: 0.9rem;
          }

          .subunit-badge {
            background: #e0e7ff;
            color: #4338ca;
            padding: 0.25rem 0.6rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .expand-icon {
            color: #9ca3af;
            font-size: 0.8rem;
          }

          .unit-content {
            background: #f9fafb;
          }

          .subunit-section {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
          }

          .subunit-section:last-child {
            border-bottom: none;
          }

          .subunit-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
          }

          .subunit-number {
            background: #6366f1;
            color: white;
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            font-weight: 700;
            font-size: 0.8rem;
          }

          .subunit-name {
            font-weight: 600;
            color: #374151;
            font-size: 0.95rem;
            flex: 1;
          }

          .subunit-count {
            color: #9ca3af;
            font-size: 0.85rem;
          }

          .unit-words {
            padding: 1.25rem;
            background: white;
            border-top: 1px solid #e5e7eb;
            max-height: 500px;
            overflow-y: auto;
          }

          .words-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 0.75rem;
          }

          .word-card {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 6px;
            border-left: 3px solid #10b981;
          }

          .word-term {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.25rem;
            font-size: 0.95rem;
          }

          .word-meaning {
            color: #6b7280;
            font-size: 0.85rem;
            line-height: 1.4;
          }

          .more-indicator {
            background: #e5e7eb;
            border-left: 3px solid #9ca3af;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-weight: 500;
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }

          .btn-primary {
            flex: 1;
            background: #10b981;
            color: white;
            border: none;
            padding: 0.875rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover:not(:disabled) {
            background: #059669;
          }

          .btn-primary:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .btn-secondary {
            flex: 1;
            background: #f3f4f6;
            color: #374151;
            border: none;
            padding: 0.875rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background: #e5e7eb;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* FormModal-style animations for consistency */
          @keyframes llw-fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes llw-pop-in {
            0% { opacity: 0; transform: translateY(15px) scale(0.94) rotate(1deg); }
            50% { opacity: 0.8; transform: translateY(-2px) scale(1.03) rotate(-0.5deg); }
            100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          }
          .llw-modal-overlay { animation: llw-fade-in 200ms ease-out forwards; }
          .llw-modal-card { animation: llw-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

          @media (max-width: 1024px) {
            .units-container {
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 768px) {
            .vocabulario-container {
              padding: 1rem;
            }

            .header {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }

            .vocabulario-grid {
              grid-template-columns: 1fr;
            }

            .modal-content,
            .modal-content-large {
              width: 95%;
              padding: 1.5rem;
            }

            .modal-header {
              flex-direction: column;
              gap: 1rem;
            }

            .vocab-table-container {
              max-height: 300px;
            }

            .vocab-table th,
            .vocab-table td {
              padding: 0.4rem;
              font-size: 0.85rem;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  )
}
