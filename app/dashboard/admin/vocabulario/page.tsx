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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchVocabularios()
  }, [])

  // Auto-hide notifications after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
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

    setShowUploadModal(false)
    setProcessing(true)

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
        // Flatten all words from all units for the confirmation modal
        const allWords = result.units.flatMap((unit: any) => unit.palabras)
        setExtractedVocabulary(allWords)
        setExtractedUnits(result.units)
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
      // First, save the vocabulary
      const response = await fetch('/api/vocabulario/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nivel: nivel,
          archivo_original: selectedFile?.name || manualText ? 'manual_text.txt' : 'vocabulary.pdf',
          contenido: extractedVocabulary
        })
      })

      const result = await response.json()
      
      if (response.ok && result.vocabulario) {
        const vocabularioId = result.vocabulario.id_vocabulario
        
        // If we have units, create them automatically
        if (extractedUnits.length > 0) {
          let unitsCreated = 0
          for (const unit of extractedUnits) {
            // Skip if no unit number (unorganized words)
            if (!unit.numero) continue
            
            // Get the indices of words in this unit from the flattened array
            const wordIndices: number[] = []
            let currentIndex = 0
            
            for (const u of extractedUnits) {
              if (u.numero === unit.numero) {
                // Add indices for all words in this unit
                for (let i = 0; i < u.palabras.length; i++) {
                  wordIndices.push(currentIndex + i)
                }
                break
              }
              currentIndex += u.palabras.length
            }
            
            try {
              await fetch('/api/vocabulario/crear-unidad', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id_vocabulario: vocabularioId,
                  numero_unidad: unit.numero,
                  nombre_unidad: unit.nombre,
                  palabras_ids: wordIndices
                })
              })
              unitsCreated++
            } catch (err) {
              console.error('Error creating unit:', err)
            }
          }
          
          showNotification('success', `Vocabulary saved successfully! ${unitsCreated} units created automatically with ${extractedVocabulary.length} words`)
        } else {
          showNotification('success', `Vocabulary saved successfully with ${extractedVocabulary.length} words`)
        }
        
        setShowConfirmModal(false)
        setSelectedFile(null)
        setNivel('A1')
        setExtractedVocabulary([])
        setExtractedUnits([])
        setManualText('')
        fetchVocabularios()
      } else {
        showNotification('error', result.error || 'Error saving vocabulary')
      }
    } catch (error) {
      console.error('Error saving vocabulary:', error)
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
      alert('Please select at least one word')
      return
    }

    if (!newUnitName.trim()) {
      alert('Please enter a unit name')
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
        alert('Unit created successfully')
        setNewUnitName('')
        setSelectedWords([])
        
        // Refresh units
        const unitsResponse = await fetch(`/api/vocabulario/get-unidades?id_vocabulario=${selectedVocab.id_vocabulario}`)
        const unitsData = await unitsResponse.json()
        setUnidades(unitsData.unidades || [])
      } else {
        const error = await response.json()
        alert(error.error || 'Error creating unit')
      }
    } catch (error) {
      console.error('Error creating unit:', error)
      alert('Error creating unit')
    }
  }

  const handleDeleteUnit = async (id_unidad: number) => {
    if (!confirm('Are you sure you want to delete this unit?')) return

    try {
      const response = await fetch(`/api/vocabulario/eliminar-unidad?id_unidad=${id_unidad}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUnidades(unidades.filter(u => u.id_unidad !== id_unidad))
        alert('Unit deleted successfully')
      } else {
        alert('Error deleting unit')
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
    }
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

    setShowManualTextModal(false)
    setProcessing(true)

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
        // Flatten all words from all units
        const allWords = result.units.flatMap((unit: any) => unit.palabras)
        setExtractedVocabulary(allWords)
        setExtractedUnits(result.units)
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

  return (
    <DashboardLayout title="Vocabulary Management">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '⚠'} {notification.message}
        </div>
      )}
      
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
          <div className="vocabulario-grid">
            {vocabularios.map((vocab) => (
              <div key={vocab.id_vocabulario} className="vocab-card">
                <div className="vocab-header">
                  <span className="nivel-badge">{vocab.nivel}</span>
                  <button 
                    className={`status-btn ${vocab.activo ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(vocab.id_vocabulario, vocab.activo)}
                  >
                    {vocab.activo ? '✓ Active' : '✗ Inactive'}
                  </button>
                </div>
                <h3>📄 {vocab.archivo_original}</h3>
                <p className="fecha">
                  Uploaded: {new Date(vocab.fecha_creacion).toLocaleDateString()}
                </p>
                {vocab.contenido && Array.isArray(vocab.contenido) && (
                  <div className="vocab-preview">
                    <strong>Entries:</strong> {vocab.contenido.length} words
                  </div>
                )}
                <button 
                  className="btn-organize"
                  onClick={() => handleOpenUnitsModal(vocab)}
                >
                  📚 Organize Units
                </button>
              </div>
            ))}
          </div>
        )}

        {showUploadModal && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Upload Vocabulary PDF</h2>
              
              <div className="form-group">
                <label>Level:</label>
                <select 
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              <div className="form-group">
                <label>PDF File:</label>
                <input 
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="file-info">✓ Selected: {selectedFile.name}</p>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Process PDF'}
                </button>
                <button 
                  onClick={() => setShowManualTextModal(true)}
                  className="btn-secondary"
                >
                  Or Paste Text
                </button>
                <button 
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showManualTextModal && (
          <div className="modal-overlay" onClick={() => setShowManualTextModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Paste Vocabulary Text</h2>
              <p style={{color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem'}}>
                Copy and paste the vocabulary from your PDF or document. Expected format:
              </p>
              <div style={{background: '#f3f4f6', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', color: '#4b5563'}}>
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
                  height: '300px',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />

              <div className="modal-actions" style={{marginTop: '1.5rem'}}>
                <button 
                  onClick={handleExtractFromText}
                  disabled={!manualText.trim()}
                  className="btn-primary"
                >
                  Extract Vocabulary
                </button>
                <button 
                  onClick={() => setShowManualTextModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div className="modal-overlay">
            <div className="modal-content processing-modal">
              <div className="spinner"></div>
              <h2>Processing PDF...</h2>
              <p>Extracting vocabulary from the document</p>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📋 Review Extracted Vocabulary</h2>
                <div className="summary-badges">
                  <span className="badge badge-primary">{extractedUnits.length} Units</span>
                  <span className="badge badge-success">{extractedVocabulary.length} Words</span>
                </div>
              </div>
              
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

              <div className="modal-actions">
                <button 
                  onClick={handleConfirmSave}
                  className="btn-primary"
                  disabled={extractedVocabulary.length === 0}
                >
                  ✓ Save All ({extractedVocabulary.length} words, {extractedUnits.length} units)
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .notification.success {
            background: #10b981;
            color: white;
          }

          .notification.error {
            background: #ef4444;
            color: white;
          }

          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

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
