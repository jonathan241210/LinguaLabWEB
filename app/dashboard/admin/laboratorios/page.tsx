'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'

interface PlantillaJuego {
  id_plantilla: number
  nombre: string
  tipo_juego: string
  descripcion: string
  icono: string
  palabras_minimas: number
  palabras_maximas: number
  nivel_dificultad_sugerido: string
}

interface Vocabulario {
  id_vocabulario: number
  nivel: string
  archivo_original: string
  fecha_subida: string
  contenido: Array<{ palabra: string; significado: string }>
}

interface Unidad {
  id_unidad: number
  numero_unidad: string
  nombre_unidad: string
  palabras_ids: number[]
}

interface Laboratorio {
  id_laboratorio: number // alias de id_actividad en query
  titulo: string
  tipo_juego: string
  tipo_juego_code: string
  icono: string
  nivel: string
  numero_palabras: number
  publicado: boolean
  experiencia_base: number
  experiencia_bonus_perfecto: number
  puntuacion_minima_aprobar: number
  tiempo_limite: number | null
  intentos_permitidos: number | null
  permitir_pistas: boolean
  grupos_asignados: number
  alumnos_participantes: number
  promedio_puntuacion: number | null
  completados: number
  fecha_creacion: string
}

export default function LaboratoriosPage() {
  const [activeMenu, setActiveMenu] = useState('labs')
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaJuego[]>([])
  const [vocabularios, setVocabularios] = useState<Vocabulario[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false)
  const [createExiting, setCreateExiting] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewLab, setPreviewLab] = useState<Laboratorio | null>(null)
  const [previewWords, setPreviewWords] = useState<any[]>([])
  
  // Estados del formulario de creación
  const [selectedPlantilla, setSelectedPlantilla] = useState<PlantillaJuego | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [selectedVocabulario, setSelectedVocabulario] = useState<number | null>(null)
  const [selectedUnidades, setSelectedUnidades] = useState<number[]>([])
  const [numeroPalabras, setNumeroPalabras] = useState(10)
  const [modoSeleccion, setModoSeleccion] = useState<'todas' | 'por_unidad' | 'random'>('por_unidad')
  
  // Estados de configuración avanzada
  const [experienciaBase, setExperienciaBase] = useState(100)
  const [experienciaBonus, setExperienciaBonus] = useState(50)
  const [puntuacionMinima, setPuntuacionMinima] = useState(70)
  const [tiempoLimite, setTiempoLimite] = useState<number | null>(null)
  const [intentosPermitidos, setIntentosPermitidos] = useState<number | null>(null)
  const [permitirPistas, setPermitirPistas] = useState(true)
  const [penalizacionPista, setPenalizacionPista] = useState(5)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshFrequency, setRefreshFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [refreshType, setRefreshType] = useState<'palabras' | 'dificultad' | 'ambos'>('palabras')
  
  // Estados para el juego interactivo en preview
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [selectedMatching, setSelectedMatching] = useState<{word?: number, meaning?: number}>({})
  const [matchedLines, setMatchedLines] = useState<Array<{wordIdx: number, meaningIdx: number}>>([])
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([])
  const [fillBlankResults, setFillBlankResults] = useState<boolean[]>([])
  
  // Estados para tracking de progreso en Hangman
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set())
  const [wordProgress, setWordProgress] = useState<Map<number, {guessed: string[], wrong: number}>>(new Map())
  const [gameTimer, setGameTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    onClose: () => void
  }>({ isOpen: false, message: '', onClose: () => {} })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [labsRes, plantillasRes, vocabRes] = await Promise.all([
        fetch('/api/laboratorios/list'),
        fetch('/api/laboratorios/plantillas'),
        fetch('/api/vocabulario/list')
      ])
      
      if (labsRes.ok) {
        const data = await labsRes.json()
        setLaboratorios(data.laboratorios || [])
      }
      
      if (plantillasRes.ok) {
        const data = await plantillasRes.json()
        setPlantillas(data.plantillas || [])
      }
      
      if (vocabRes.ok) {
        const data = await vocabRes.json()
        console.log('Vocabularios response:', data) // Debug log
        setVocabularios(data.vocabularios || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnidades = async (vocabId: number) => {
    try {
      const res = await fetch(`/api/vocabulario/get-unidades?id_vocabulario=${vocabId}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Unidades response:', data) // Debug log
        setUnidades(data.unidades || [])
      }
    } catch (error) {
      console.error('Error fetching unidades:', error)
    }
  }

  const handlePlantillaSelect = (plantilla: PlantillaJuego) => {
    setSelectedPlantilla(plantilla)
    setTitulo(plantilla.nombre)
    setNumeroPalabras(plantilla.palabras_minimas)
  }

  const handleVocabularioSelect = (vocabId: number) => {
    setSelectedVocabulario(vocabId)
    setSelectedUnidades([])
    fetchUnidades(vocabId)
  }

  const toggleUnidad = (unidadId: number) => {
    setSelectedUnidades(prev => 
      prev.includes(unidadId) 
        ? prev.filter(id => id !== unidadId)
        : [...prev, unidadId]
    )
  }

  const handleCreateLaboratorio = async () => {
    if (!selectedPlantilla || !selectedVocabulario) {
      setSuccessModal({
        isOpen: true,
        message: 'Please select a game template and vocabulary',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
      return
    }

    if (modoSeleccion === 'por_unidad' && selectedUnidades.length === 0) {
      setSuccessModal({
        isOpen: true,
        message: 'Please select at least one unit',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
      return
    }

    try {
      const res = await fetch('/api/laboratorios/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_plantilla: selectedPlantilla.id_plantilla,
          id_vocabulario: selectedVocabulario,
          titulo,
          descripcion,
          numero_palabras: numeroPalabras,
          unidades_seleccionadas: modoSeleccion === 'por_unidad' ? selectedUnidades : null,
          modo_seleccion: modoSeleccion,
          nivel: vocabularios.find(v => v.id_vocabulario === selectedVocabulario)?.nivel || 'A1',
          // Configuración avanzada
          experiencia_base: experienciaBase,
          experiencia_bonus_perfecto: experienciaBonus,
          puntuacion_minima_aprobar: puntuacionMinima,
          tiempo_limite: tiempoLimite,
          intentos_permitidos: intentosPermitidos,
          permitir_pistas: permitirPistas,
          penalizacion_por_pista: penalizacionPista,
          auto_refresh: autoRefresh,
          refresh_frequency: refreshFrequency,
          refresh_type: refreshType
        })
      })

      if (res.ok) {
        setSuccessModal({
          isOpen: true,
          message: 'Laboratory activity created successfully!',
          type: 'success',
          onClose: () => {
            setSuccessModal(prev => ({ ...prev, isOpen: false }))
            setCreateExiting(true)
            setTimeout(() => {
              setShowCreateModal(false)
              resetForm()
              setCreateExiting(false)
              fetchData()
            }, 250)
          }
        })
      } else {
        throw new Error('Failed to create laboratory')
      }
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        message: 'Error creating laboratory activity',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  const resetForm = () => {
    setSelectedPlantilla(null)
    setTitulo('')
    setDescripcion('')
    setSelectedVocabulario(null)
    setSelectedUnidades([])
    setNumeroPalabras(10)
    setModoSeleccion('por_unidad')
    setUnidades([])
    setShowAdvancedConfig(false)
    
    // Reset advanced config
    setExperienciaBase(100)
    setExperienciaBonus(50)
    setPuntuacionMinima(70)
    setTiempoLimite(null)
    setIntentosPermitidos(null)
    setPermitirPistas(true)
    setPenalizacionPista(5)
    setAutoRefresh(false)
    setRefreshFrequency('weekly')
    setRefreshType('palabras')
  }

  const handleTogglePublish = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/laboratorios/toggle-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_laboratorio: id, publicado: !currentStatus })
      })

      if (res.ok) {
        fetchData()
        setSuccessModal({
          isOpen: true,
          message: `Laboratory ${!currentStatus ? 'published' : 'unpublished'} successfully!`,
          type: 'success',
          onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
        })
      }
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        message: 'Error updating laboratory status',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  const handlePreviewGame = async (lab: Laboratorio) => {
    try {
      // Reiniciar estados del juego
      setCurrentWordIndex(0)
      setGuessedLetters([])
      setWrongGuesses(0)
      setFlippedCards([])
      setMatchedPairs([])
      setSelectedMatching({})
      setMatchedLines([])
      setFillBlankAnswers([])
      setFillBlankResults([])
      setCompletedWords(new Set())
      setWordProgress(new Map())
      setGameTimer(0)
      setGameStarted(false)
      if (timerInterval) clearInterval(timerInterval)
      
      // Obtener las palabras del laboratorio desde la base de datos
      const res = await fetch(`/api/laboratorios/preview?id=${lab.id_laboratorio}`)
      if (res.ok) {
        const data = await res.json()
        console.log('=== PREVIEW DEBUG ===')
        console.log('Full response:', data)
        console.log('Total words:', data.palabras?.length)
        console.log('First word:', JSON.stringify(data.palabras?.[0], null, 2))
        console.log('All word keys:', data.palabras?.[0] ? Object.keys(data.palabras[0]) : 'No words')
        setPreviewLab(lab)
        setPreviewWords(data.palabras || [])
        setShowPreviewModal(true)
      } else {
        setSuccessModal({
          isOpen: true,
          message: 'Error loading game preview',
          type: 'error',
          onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
        })
      }
    } catch (error) {
      console.error('Error previewing game:', error)
      setSuccessModal({
        isOpen: true,
        message: 'Error loading game preview',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  // Funciones del juego Hangman
  const currentWord = previewWords[currentWordIndex]
  const wordToGuess = currentWord?.palabra?.toLowerCase() || ''
  const maxWrongGuesses = previewLab?.intentos_permitidos || 6
  
  // Cargar progreso de la palabra actual
  useEffect(() => {
    const progress = wordProgress.get(currentWordIndex)
    if (progress) {
      setGuessedLetters(progress.guessed)
      setWrongGuesses(progress.wrong)
    } else {
      setGuessedLetters([])
      setWrongGuesses(0)
    }
  }, [currentWordIndex, wordProgress])
  
  const handleLetterGuess = (letter: string) => {
    if (!guessedLetters.includes(letter) && !completedWords.has(currentWordIndex)) {
      // Iniciar timer en primera letra si hay tiempo límite
      if (!gameStarted && previewLab?.tiempo_limite) {
        setGameStarted(true)
        const interval = setInterval(() => {
          setGameTimer(prev => prev + 1)
        }, 1000)
        setTimerInterval(interval)
      }
      
      const newGuessed = [...guessedLetters, letter]
      const newWrong = !wordToGuess.includes(letter) ? wrongGuesses + 1 : wrongGuesses
      
      setGuessedLetters(newGuessed)
      setWrongGuesses(newWrong)
      
      // Guardar progreso
      const newProgress = new Map(wordProgress)
      newProgress.set(currentWordIndex, { guessed: newGuessed, wrong: newWrong })
      setWordProgress(newProgress)
    }
  }
  
  // Listener para teclado físico
  useEffect(() => {
    if (!showPreviewModal || previewLab?.tipo_juego_code !== 'hangman') return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (/^[a-z]$/.test(key)) {
        handleLetterGuess(key)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showPreviewModal, previewLab, guessedLetters, currentWordIndex, completedWords])
  
  const isWordComplete = wordToGuess.split('').every((letter: string) => 
    guessedLetters.includes(letter) || letter === ' ' || !/[a-z]/.test(letter)
  )
  
  const isGameOver = wrongGuesses >= maxWrongGuesses
  
  // Marcar palabra como completada
  useEffect(() => {
    if (isWordComplete && !completedWords.has(currentWordIndex) && wordToGuess) {
      setCompletedWords(new Set([...completedWords, currentWordIndex]))
    }
  }, [isWordComplete, currentWordIndex, wordToGuess])
  
  const nextWord = () => {
    if (currentWordIndex < previewWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
    }
  }
  
  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
    }
  }
  
  const formatTime = (seconds: number, timeLimitMinutes: number) => {
    const currentMins = Math.floor(seconds / 60)
    const currentSecs = seconds % 60
    
    // Convertir el tiempo límite de segundos a minutos si es necesario
    const totalMins = timeLimitMinutes > 60 ? Math.floor(timeLimitMinutes / 60) : timeLimitMinutes
    
    // Formato: "X minutos Y segundos de Z minutos"
    let current = ''
    if (currentMins > 0) {
      current = `${currentMins} minuto${currentMins !== 1 ? 's' : ''}`
      if (currentSecs > 0) {
        current += ` ${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
      }
    } else {
      current = `${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
    }
    
    return `${current} de ${totalMins} minuto${totalMins !== 1 ? 's' : ''}`
  }
  
  const resetGame = () => {
    setCompletedWords(new Set())
    setWordProgress(new Map())
    setGameTimer(0)
    setGameStarted(false)
    setCurrentWordIndex(0)
    setGuessedLetters([])
    setWrongGuesses(0)
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  // Funciones del juego Memory
  const handleMemoryCardClick = (index: number) => {
    if (flippedCards.length === 2 || matchedPairs.includes(index) || flippedCards.includes(index)) return
    
    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped
      const cards = createMemoryCards()
      
      if (cards[first].id === cards[second].id) {
        // Coincidencia encontrada
        setTimeout(() => {
          setMatchedPairs([...matchedPairs, first, second])
          setFlippedCards([])
        }, 500)
      } else {
        // No coinciden
        setTimeout(() => {
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  const createMemoryCards = () => {
    const words = previewWords.slice(0, 8) // 8 pares = 16 cartas
    const cards = words.flatMap((w, i) => [
      { id: i, type: 'word', content: w.palabra, wordObj: w },
      { id: i, type: 'meaning', content: w.significado, wordObj: w }
    ])
    return cards.sort(() => Math.random() - 0.5)
  }

  // Funciones del juego Matching
  const handleMatchingClick = (index: number, type: 'word' | 'meaning') => {
    if (type === 'word') {
      if (selectedMatching.word === index) {
        setSelectedMatching({ ...selectedMatching, word: undefined })
      } else {
        setSelectedMatching({ ...selectedMatching, word: index })
        if (selectedMatching.meaning !== undefined) {
          checkMatch(index, selectedMatching.meaning)
        }
      }
    } else {
      if (selectedMatching.meaning === index) {
        setSelectedMatching({ ...selectedMatching, meaning: undefined })
      } else {
        setSelectedMatching({ ...selectedMatching, meaning: index })
        if (selectedMatching.word !== undefined) {
          checkMatch(selectedMatching.word, index)
        }
      }
    }
  }

  const checkMatch = (wordIdx: number, meaningIdx: number) => {
    if (wordIdx === meaningIdx) {
      setMatchedLines([...matchedLines, { wordIdx, meaningIdx }])
    }
    setTimeout(() => {
      setSelectedMatching({})
    }, 500)
  }

  // Funciones del juego Fill in the Blanks
  const checkFillBlanks = () => {
    const results = previewWords.slice(0, 10).map((word, idx) => {
      return fillBlankAnswers[idx]?.toLowerCase().trim() === word.palabra.toLowerCase().trim()
    })
    setFillBlankResults(results)
  }

  const resetFillBlanks = () => {
    setFillBlankAnswers([])
    setFillBlankResults([])
  }

  const handleDeleteLab = async (id: number) => {
    if (!confirm('⚠️ Are you sure you want to delete this laboratory?\n\nThis action cannot be undone and will remove all associated data.')) {
      return
    }

    try {
      const res = await fetch('/api/laboratorios/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_laboratorio: id })
      })

      const data = await res.json()

      if (res.ok) {
        fetchData()
        setSuccessModal({
          isOpen: true,
          message: 'Laboratory deleted successfully!',
          type: 'success',
          onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
        })
      } else {
        setSuccessModal({
          isOpen: true,
          message: data.error || 'Error deleting laboratory',
          type: 'error',
          onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
        })
      }
    } catch (error) {
      console.error('Error deleting laboratory:', error)
      setSuccessModal({
        isOpen: true,
        message: 'Error deleting laboratory',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes llw-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes llw-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes llw-pop-in {
          0% { opacity: 0; transform: translateY(15px) scale(0.94) rotate(1deg); }
          50% { opacity: 0.8; transform: translateY(-2px) scale(1.03) rotate(-0.5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes llw-pop-out {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(10px) scale(0.92) rotate(1deg); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .llw-modal-overlay-enter { animation: llw-fade-in 200ms ease-out forwards; }
        .llw-modal-overlay-exit { animation: llw-fade-out 200ms ease-in forwards; }
        .llw-modal-card-enter { animation: llw-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; will-change: transform, opacity; }
        .llw-modal-card-exit { animation: llw-pop-out 250ms ease-in forwards; will-change: transform, opacity; }
      `}</style>
      <DashboardLayout title="Laboratories Management" activeMenu={activeMenu} onMenuItemClick={setActiveMenu} roleType="administrador" successModal={successModal}>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
              🎮 Interactive Laboratories
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Create engaging activities based on vocabulary for students
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: 'var(--color-primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(46,168,83,0.3)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <span style={{ fontSize: '20px' }}></span>
            Create Laboratory
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
              {laboratorios.length}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Laboratories</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-dark-blue) 0%, var(--color-dark-blue-darker) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
              {laboratorios.filter(l => l.publicado).length}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Published</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-primary-green-light) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
              {laboratorios.reduce((sum, l) => sum + (l.completados || 0), 0)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Completed Activities</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary-green-medium) 0%, var(--color-primary-green) 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
              {laboratorios.reduce((sum, l) => sum + (l.alumnos_participantes || 0), 0)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Students Participating</div>
          </div>
        </div>

        {/* Lista de laboratorios */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(46,168,83,0.2)',
              borderTop: '4px solid var(--color-primary-green)',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            Loading laboratories...
          </div>
        ) : laboratorios.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px',
            textAlign: 'center',
            border: '2px dashed #e2e8f0'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
            <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No laboratories yet</h3>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              Create your first interactive laboratory for students
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 32px',
                backgroundColor: 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create First Laboratory
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {laboratorios.map((lab) => (
              <div
                key={lab.id_laboratorio}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(46,168,83,0.15)'
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  e.currentTarget.style.borderColor = '#e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      {lab.icono}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {lab.titulo}
                      </h3>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                        {new Date(lab.fecha_creacion).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {lab.nivel}
                        </span>
                        <span style={{
                          background: lab.publicado ? '#dcfce7' : '#fecaca',
                          color: lab.publicado ? 'var(--color-primary-green-dark)' : 'var(--color-error)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {lab.publicado ? '✓ Published' : '○ Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Información del vocabulario y unidades */}
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 12px',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                  borderRadius: '10px',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600', marginBottom: '4px' }}>
                    📖 {(lab as any).vocabulario_nombre || 'Unknown vocabulary'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16a34a' }}>
                    📚 {(() => {
                      const unidadesData = (lab as any).unidades_seleccionadas;
                      if (!unidadesData) return 'All units';
                      try {
                        const ids = JSON.parse(unidadesData);
                        return Array.isArray(ids) && ids.length > 0 ? `Units: ${ids.join(', ')}` : 'All units';
                      } catch {
                        return 'All units';
                      }
                    })()}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Words</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{lab.numero_palabras}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Groups</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{lab.grupos_asignados}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Completed</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>{lab.completados}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Avg Score</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                      {lab.promedio_puntuacion ? `${Math.round(lab.promedio_puntuacion)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreviewGame(lab)
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    Preview
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTogglePublish(lab.id_laboratorio, lab.publicado)
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: lab.publicado ? '#fef3c7' : 'var(--color-success)',
                      color: lab.publicado ? 'var(--color-warning)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {lab.publicado ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Implement assign to groups
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,31,58,0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'var(--color-dark-blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    Assign Groups
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteLab(lab.id_laboratorio)
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de creación */}
        {showCreateModal && (
          <div className={`llw-modal-overlay ${createExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} style={{
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
          }} onClick={() => {
            setCreateExiting(true)
            setTimeout(() => {
              setShowCreateModal(false)
              resetForm()
              setCreateExiting(false)
            }, 250)
          }}>
            <div className={`llw-modal-card ${createExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '95%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Botón X */}
              <button
                onClick={() => {
                  setCreateExiting(true)
                  setTimeout(() => {
                    setShowCreateModal(false)
                    resetForm()
                    setCreateExiting(false)
                  }, 250)
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
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
                }}
              >
                ✕
              </button>

              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 24px 0', paddingRight: '40px' }}>
                CREATE A LAB
              </h2>

              {/* Paso 1: Seleccionar plantilla */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Step 1: Select Game Type
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px'
                }}>
                  {plantillas.map((plantilla) => (
                    <div
                      key={plantilla.id_plantilla}
                      onClick={() => handlePlantillaSelect(plantilla)}
                      style={{
                        background: selectedPlantilla?.id_plantilla === plantilla.id_plantilla 
                          ? 'var(--color-primary-green)' 
                          : 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: selectedPlantilla?.id_plantilla === plantilla.id_plantilla
                          ? '2px solid white'
                          : '2px solid transparent'
                      }}
                      onMouseOver={(e) => {
                        if (selectedPlantilla?.id_plantilla !== plantilla.id_plantilla) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedPlantilla?.id_plantilla !== plantilla.id_plantilla) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{plantilla.icono}</div>
                      <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>
                        {plantilla.nombre}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paso 2: Información básica */}
              {selectedPlantilla && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Step 2: Basic Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="e.g., Hangman - Unit 1 Vocabulary"
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '2px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'white',
                          color: '#333',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        Description (Optional)
                      </label>
                      <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Brief description of the activity..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '12px',
                          border: '2px solid rgba(255,255,255,0.2)',
                          backgroundColor: 'white',
                          color: '#333',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Seleccionar vocabulario */}
              {selectedPlantilla && (
                <div style={{ marginBottom: '48px' }}>
                  <h3 style={{ color: 'white', fontSize: '19px', fontWeight: '700', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
                    <span style={{ fontSize: '24px' }}></span>
                    Step 3: Choose Vocabulary
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {vocabularios.map((vocab) => {
                      const isSelected = selectedVocabulario === vocab.id_vocabulario
                      return (
                        <div
                          key={vocab.id_vocabulario}
                          onClick={() => handleVocabularioSelect(vocab.id_vocabulario)}
                          style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)'
                              : 'rgba(255,255,255,0.06)',
                            borderRadius: '16px',
                            padding: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isSelected
                              ? '2px solid rgba(255,255,255,0.3)'
                              : '2px solid rgba(255,255,255,0.08)',
                            boxShadow: isSelected 
                              ? '0 8px 24px rgba(46,168,83,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset' 
                              : '0 2px 8px rgba(0,0,0,0.1)',
                            transform: isSelected ? 'translateY(-4px) scale(1.02)' : 'scale(1)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                              e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '16px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              background: isSelected 
                                ? 'rgba(255,255,255,0.2)' 
                                : 'linear-gradient(135deg, rgba(46,168,83,0.25), rgba(46,168,83,0.15))',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              flexShrink: 0,
                              border: isSelected ? '1px solid rgba(255,255,255,0.3)' : 'none'
                            }}>📖</div>
                            {isSelected && (
                              <div style={{ 
                                marginLeft: 'auto', 
                                width: '32px',
                                height: '32px',
                                background: 'rgba(255,255,255,0.25)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white', 
                                fontSize: '16px',
                                fontWeight: 'bold',
                                border: '2px solid rgba(255,255,255,0.4)'
                              }}>✓</div>
                            )}
                          </div>
                          <div style={{ 
                            color: 'white', 
                            fontWeight: '700', 
                            fontSize: '16px', 
                            marginBottom: '12px',
                            lineHeight: '1.4'
                          }}>
                            {vocab.archivo_original}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: isSelected 
                                ? 'rgba(255,255,255,0.2)' 
                                : 'rgba(255,255,255,0.12)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: isSelected ? '1px solid rgba(255,255,255,0.3)' : 'none'
                            }}>
                              ✨ {vocab.nivel}
                            </span>
                            <span style={{
                              background: isSelected 
                                ? 'rgba(255,255,255,0.2)' 
                                : 'rgba(255,255,255,0.12)',
                              color: 'white',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: isSelected ? '1px solid rgba(255,255,255,0.3)' : 'none'
                            }}>
                              {vocab.contenido.length} units
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Paso 4: Seleccionar unidades */}
              {selectedVocabulario && unidades.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                    <h3 style={{ color: 'white', fontSize: '19px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px', margin: 0 }}>
                      <span style={{ fontSize: '24px' }}>📚</span>
                      Step 4: Select Units
                    </h3>
                    <button
                      onClick={() => {
                        if (selectedUnidades.length === unidades.length) {
                          setSelectedUnidades([]);
                        } else {
                          setSelectedUnidades(unidades.map(u => u.id_unidad));
                        }
                      }}
                      style={{
                        background: selectedUnidades.length === unidades.length 
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(34, 197, 94, 0.2)',
                        color: selectedUnidades.length === unidades.length 
                          ? '#ef4444'
                          : '#22c55e',
                        border: selectedUnidades.length === unidades.length
                          ? '1px solid rgba(239, 68, 68, 0.3)'
                          : '1px solid rgba(34, 197, 94, 0.3)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {selectedUnidades.length === unidades.length ? '✖ Deselect All' : '✓ Select All Units'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {unidades.map((unidad) => {
                      const isSelected = selectedUnidades.includes(unidad.id_unidad)
                      return (
                        <div
                          key={unidad.id_unidad}
                          onClick={() => toggleUnidad(unidad.id_unidad)}
                          style={{
                            background: isSelected
                              ? 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)'
                              : 'rgba(255,255,255,0.06)',
                            borderRadius: '14px',
                            padding: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: isSelected
                              ? '2px solid rgba(255,255,255,0.3)'
                              : '2px solid rgba(255,255,255,0.08)',
                            boxShadow: isSelected
                              ? '0 6px 20px rgba(46,168,83,0.3)'
                              : '0 2px 6px rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                            minHeight: '110px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                              e.currentTarget.style.transform = 'translateY(-2px)'
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'
                            }
                          }}
                        >
                          {/* Indicador visual superior para seleccionados */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              height: '3px',
                              background: 'linear-gradient(90deg, rgba(255,255,255,0.6), rgba(255,255,255,0.3), rgba(255,255,255,0.6))',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 2s ease-in-out infinite'
                            }} />
                          )}
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
                              background: isSelected ? 'white' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s'
                            }}>
                              {isSelected && <span style={{ color: 'var(--color-primary-green)', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                            </div>
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <div style={{
                                background: isSelected 
                                  ? 'rgba(255,255,255,0.2)' 
                                  : 'linear-gradient(135deg, rgba(46,168,83,0.25), rgba(46,168,83,0.15))',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: isSelected ? '1px solid rgba(255,255,255,0.3)' : 'none',
                                letterSpacing: '0.5px'
                              }}>
                                UNIT {unidad.numero_unidad}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              color: 'white', 
                              fontWeight: '700', 
                              fontSize: '15px', 
                              lineHeight: '1.4',
                              marginBottom: '6px'
                            }}>
                              {unidad.nombre_unidad}
                            </div>
                            <div style={{ 
                              color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)', 
                              fontSize: '13px',
                              fontWeight: '500'
                            }}>
                              📝 {unidad.palabras_ids.length} words included
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Paso 5: Configuración */}
              {selectedPlantilla && selectedVocabulario && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Step 5: Configuration
                  </h3>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Number of Words: {numeroPalabras}
                    </label>
                    <input
                      type="range"
                      min={selectedPlantilla.palabras_minimas}
                      max={selectedPlantilla.palabras_maximas}
                      value={numeroPalabras}
                      onChange={(e) => setNumeroPalabras(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginTop: '4px' }}>
                      <span>Min: {selectedPlantilla.palabras_minimas}</span>
                      <span>Max: {selectedPlantilla.palabras_maximas}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Configuration Toggle */}
              {selectedPlantilla && selectedVocabulario && (
                <div style={{ marginBottom: '24px' }}>
                  <button
                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, rgba(46,168,83,0.1), rgba(46,168,83,0.05))',
                      border: '1px solid rgba(46,168,83,0.3)',
                      borderRadius: '12px',
                      color: 'var(--color-primary-green)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,168,83,0.15), rgba(46,168,83,0.08))'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46,168,83,0.1), rgba(46,168,83,0.05))'
                    }}
                  >
                    <span>{showAdvancedConfig ? '▼' : '▶'}</span>
                    <span> Advanced Configuration</span>
                  </button>
                </div>
              )}

              {/* Advanced Configuration Section */}
              {selectedPlantilla && selectedVocabulario && showAdvancedConfig && (
                <div className="llw-fade-in" style={{ 
                  marginBottom: '32px',
                  padding: '24px',
                  background: 'rgba(46,168,83,0.05)',
                  border: '1px solid rgba(46,168,83,0.2)',
                  borderRadius: '16px'
                }}>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     Advanced Settings
                  </h3>

                  {/* Experience & Scoring */}
                  <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      🏆 Experience & Scoring
                    </h4>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        Base Experience: {experienciaBase} XP
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={experienciaBase}
                        onChange={(e) => setExperienciaBase(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        Perfect Score Bonus: +{experienciaBonus} XP
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="5"
                        value={experienciaBonus}
                        onChange={(e) => setExperienciaBonus(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        Minimum Passing Score: {puntuacionMinima}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={puntuacionMinima}
                        onChange={(e) => setPuntuacionMinima(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Time Configuration */}
                  <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      ⏱️ Time Limit
                    </h4>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={tiempoLimite !== null}
                          onChange={(e) => setTiempoLimite(e.target.checked ? 300 : null)}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Enable time limit</span>
                      </label>
                    </div>

                    {tiempoLimite !== null && (
                      <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                          Time limit: {Math.floor(tiempoLimite / 60)}:{(tiempoLimite % 60).toString().padStart(2, '0')} minutes
                        </label>
                        <input
                          type="number"
                          min="60"
                          max="3600"
                          step="30"
                          value={tiempoLimite}
                          onChange={(e) => setTiempoLimite(parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#1e293b',
                            fontSize: '13px'
                          }}
                          placeholder="Seconds"
                        />
                      </div>
                    )}
                  </div>

                  {/* Attempts Configuration */}
                  <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      🔄 Attempts
                    </h4>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={intentosPermitidos !== null}
                          onChange={(e) => setIntentosPermitidos(e.target.checked ? 3 : null)}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Limit number of attempts</span>
                      </label>
                    </div>

                    {intentosPermitidos !== null && (
                      <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                          Maximum attempts: {intentosPermitidos}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={intentosPermitidos}
                          onChange={(e) => setIntentosPermitidos(parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: '#1e293b',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Hints Configuration */}
                  <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      💡 Hints System
                    </h4>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={permitirPistas}
                          onChange={(e) => setPermitirPistas(e.target.checked)}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Allow hints</span>
                      </label>
                    </div>

                    {permitirPistas && (
                      <div>
                        <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                          Score penalty per hint: -{penalizacionPista}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={penalizacionPista}
                          onChange={(e) => setPenalizacionPista(parseInt(e.target.value))}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Auto-Refresh Configuration */}
                  <div>
                    <h4 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      🔄 Auto-Refresh
                    </h4>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                          Automatically update words and difficulty
                        </span>
                      </label>
                    </div>

                    {autoRefresh && (
                      <>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                            Update frequency:
                          </label>
                          <select
                            value={refreshFrequency}
                            onChange={(e) => setRefreshFrequency(e.target.value as any)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'white',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              color: '#1e293b',
                              fontSize: '13px'
                            }}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Every 2 weeks</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                            What to update:
                          </label>
                          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="refreshType"
                                value="palabras"
                                checked={refreshType === 'palabras'}
                                onChange={(e) => setRefreshType(e.target.value as any)}
                              />
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Only words</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="refreshType"
                                value="dificultad"
                                checked={refreshType === 'dificultad'}
                                onChange={(e) => setRefreshType(e.target.value as any)}
                              />
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Only difficulty</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="refreshType"
                                value="ambos"
                                checked={refreshType === 'ambos'}
                                onChange={(e) => setRefreshType(e.target.value as any)}
                              />
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Both words and difficulty</span>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              {selectedPlantilla && selectedVocabulario && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={handleCreateLaboratorio}
                    style={{
                      flex: 2,
                      padding: '16px',
                      backgroundColor: 'var(--color-primary-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(46,168,83,0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                     Create Activity
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Vista Previa del Juego */}
      {showPreviewModal && previewLab && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
            padding: '20px'
          }}
          onClick={() => {
            setShowPreviewModal(false)
            if (timerInterval) clearInterval(timerInterval)
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1e2a3a 0%, #2d3748 100%)',
              borderRadius: '24px',
              padding: '0',
              width: '90%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #1e2a3a 0%, #111827 100%)',
              padding: '24px 32px',
              borderBottom: '2px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--color-primary-green)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 8px 16px rgba(46, 168, 83, 0.3)'
                  }}>
                    {previewLab.icono}
                  </div>
                  <div>
                    <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
                      {previewLab.titulo}
                    </h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        🎮 {previewLab.tipo_juego}
                      </span>
                      <span style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#c4b5fd',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        📊 {previewLab.nivel}
                      </span>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#86efac',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        📝 {previewWords.length} words
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    if (timerInterval) clearInterval(timerInterval)
                  }}
                  style={{
                    background: '#ff3b3b',
                    border: 'none',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '24px',
                    fontWeight: '300',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#ff4f4f'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#ff3b3b'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div style={{ padding: '32px', overflowY: 'auto' }}>

            {/* Game Configuration Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Game Configuration
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Base Experience
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {previewLab.experiencia_base} XP
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Perfect Bonus
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    +{previewLab.experiencia_bonus_perfecto} XP
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Min. Score to Pass
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {previewLab.puntuacion_minima_aprobar}%
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Time Limit
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {previewLab.tiempo_limite ? `${previewLab.tiempo_limite}s` : 'Unlimited'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Attempts Allowed
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {previewLab.intentos_permitidos || 'Unlimited'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                    Hints Enabled
                  </div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    {previewLab.permitir_pistas ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            {/* Game Visual Preview */}
            <div style={{
              marginBottom: '24px',
              padding: '32px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
                Play the Game
              </h3>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '16px',
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                minHeight: '400px',
                border: '2px solid rgba(255, 255, 255, 0.05)',
                width: '100%'
              }}>
                {previewWords.length === 0 ? (
                  <div style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                    No words available for this game
                  </div>
                ) : (
                  <>
                    {/* Hangman Game */}
                    {previewLab.tipo_juego_code === 'hangman' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
                        {/* Status mejorado */}
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#60a5fa',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            ✓ {completedWords.size}/{previewWords.length} Completed
                          </div>
                          <div style={{ color: 'white', fontSize: '16px' }}>
                            Word {currentWordIndex + 1} of {previewWords.length}
                          </div>
                          {previewLab?.tiempo_limite && (
                            <div style={{
                              background: gameTimer > (previewLab.tiempo_limite * 60 * 0.8) ? 'rgba(239, 68, 68, 0.2)' : gameStarted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                              border: `1px solid ${gameTimer > (previewLab.tiempo_limite * 60 * 0.8) ? 'rgba(239, 68, 68, 0.3)' : gameStarted ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                              borderRadius: '8px',
                              padding: '8px 16px',
                              color: gameTimer > (previewLab.tiempo_limite * 60 * 0.8) ? '#f87171' : gameStarted ? '#4ade80' : 'rgba(255, 255, 255, 0.6)',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {formatTime(gameTimer, previewLab.tiempo_limite)}
                            </div>
                          )}
                          <div style={{ color: wrongGuesses >= 4 ? '#ef4444' : 'var(--color-primary-green)', fontSize: '16px', fontWeight: '600' }}>
                            Errors: {wrongGuesses}/{maxWrongGuesses}
                          </div>
                          <button
                            onClick={resetGame}
                            style={{
                              background: 'rgba(239, 68, 68, 0.3)',
                              border: '2px solid rgba(239, 68, 68, 0.5)',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              color: '#ff6b6b',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e: any) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseOut={(e: any) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            Reset
                          </button>
                        </div>

                        {/* Hangman SVG - dinámico según errores */}
                        <svg width="160" height="180" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' }}>
                          {/* La horca se dibuja progresivamente según maxWrongGuesses */}
                          {/* Si maxWrongGuesses = 10: horca completa (4 partes) + cuerpo (6 partes) */}
                          {/* Si maxWrongGuesses = 6: solo cuerpo (sin horca) */}
                          
                          {/* Horca progresiva (solo si maxWrongGuesses > 6) */}
                          {maxWrongGuesses > 6 && wrongGuesses >= 1 && <line x1="20" y1="170" x2="80" y2="170" stroke="var(--color-primary-green)" strokeWidth="4" />}
                          {maxWrongGuesses > 6 && wrongGuesses >= 2 && <line x1="40" y1="170" x2="40" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />}
                          {maxWrongGuesses > 6 && wrongGuesses >= 3 && <line x1="40" y1="20" x2="100" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />}
                          {maxWrongGuesses > 6 && wrongGuesses >= 4 && <line x1="100" y1="20" x2="100" y2="40" stroke="var(--color-primary-green)" strokeWidth="3" />}
                          
                          {/* Horca fija (si maxWrongGuesses <= 6) */}
                          {maxWrongGuesses <= 6 && (
                            <>
                              <line x1="20" y1="170" x2="80" y2="170" stroke="var(--color-primary-green)" strokeWidth="4" />
                              <line x1="40" y1="170" x2="40" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />
                              <line x1="40" y1="20" x2="100" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />
                              <line x1="100" y1="20" x2="100" y2="40" stroke="var(--color-primary-green)" strokeWidth="3" />
                            </>
                          )}
                          
                          {/* Cuerpo - ajustado según si hay horca progresiva o no */}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 5 : 1) && <circle cx="100" cy="55" r="15" stroke="#ef4444" strokeWidth="3" fill="none" />}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 6 : 2) && <line x1="100" y1="70" x2="100" y2="120" stroke="#ef4444" strokeWidth="3" />}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 7 : 3) && <line x1="100" y1="85" x2="75" y2="100" stroke="#ef4444" strokeWidth="3" />}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 8 : 4) && <line x1="100" y1="85" x2="125" y2="100" stroke="#ef4444" strokeWidth="3" />}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 9 : 5) && <line x1="100" y1="120" x2="80" y2="150" stroke="#ef4444" strokeWidth="3" />}
                          {wrongGuesses >= (maxWrongGuesses > 6 ? 10 : 6) && <line x1="100" y1="120" x2="120" y2="150" stroke="#ef4444" strokeWidth="3" />}
                        </svg>

                        {/* Hint */}
                        <div style={{ 
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: '12px',
                          padding: '16px 24px',
                          color: '#93c5fd',
                          fontSize: '16px',
                          textAlign: 'center',
                          maxWidth: '500px'
                        }}>
                          {currentWord?.significado || 'No definition available'}
                        </div>

                        {/* Word Display */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px',
                          fontSize: '36px',
                          fontFamily: 'monospace',
                          fontWeight: '700',
                          letterSpacing: '4px'
                        }}>
                          {wordToGuess.split('').map((letter: string, i: number) => (
                            <div key={i} style={{
                              minWidth: letter === ' ' ? '20px' : '40px',
                              height: '50px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderBottom: letter === ' ' ? 'none' : '3px solid rgba(255, 255, 255, 0.3)',
                              color: 'white'
                            }}>
                              {letter === ' ' ? '' : (guessedLetters.includes(letter) || !/[a-z]/.test(letter) ? letter : '')}
                            </div>
                          ))}
                        </div>

                        {/* Game Over / Success Messages */}
                        {isGameOver && (
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '2px solid #ef4444',
                            borderRadius: '12px',
                            padding: '20px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            Game Over! The word was: <span style={{ color: '#fca5a5' }}>{wordToGuess}</span>
                          </div>
                        )}
                        
                        {isWordComplete && !isGameOver && (
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid var(--color-primary-green)',
                            borderRadius: '12px',
                            padding: '20px',
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            Correct! Well done!
                          </div>
                        )}

                        {/* Instrucción y navegación */}
                        {!isGameOver && !isWordComplete && !completedWords.has(currentWordIndex) && (
                          <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            color: '#93c5fd',
                            fontSize: '15px',
                            textAlign: 'center',
                            maxWidth: '500px'
                          }}>
                            💡 Use your keyboard to guess letters
                          </div>
                        )}

                        {completedWords.has(currentWordIndex) && (
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid var(--color-primary-green)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            color: '#4ade80',
                            fontSize: '16px',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            ✓ Word already completed!
                          </div>
                        )}

                        {/* Botones de navegación */}
                        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                          <button
                            onClick={prevWord}
                            disabled={currentWordIndex === 0}
                            style={{
                              padding: '12px 24px',
                              background: currentWordIndex === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.3)',
                              color: currentWordIndex === 0 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '12px',
                              fontSize: '15px',
                              fontWeight: '600',
                              cursor: currentWordIndex === 0 ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px', transform: 'rotate(180deg)' }}>
                              <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                            </svg>
                            Previous Word
                          </button>
                          
                          <button
                            onClick={nextWord}
                            disabled={currentWordIndex === previewWords.length - 1}
                            style={{
                              padding: '12px 24px',
                              background: currentWordIndex === previewWords.length - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(34, 197, 94, 0.3)',
                              color: currentWordIndex === previewWords.length - 1 ? 'rgba(255, 255, 255, 0.3)' : 'white',
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '12px',
                              fontSize: '15px',
                              fontWeight: '600',
                              cursor: currentWordIndex === previewWords.length - 1 ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            Next Word
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginLeft: '8px' }}>
                              <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
                            </svg>
                          </button>
                        </div>

                        {(isWordComplete || isGameOver) && currentWordIndex === previewWords.length - 1 && (
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '16px',
                            marginTop: '20px',
                            textAlign: 'center'
                          }}>
                            You've completed all words!
                          </div>
                        )}
                      </div>
                    )}

                    {/* Otros juegos */}
                    {previewLab.tipo_juego_code === 'memory' && (
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '12px',
                          marginBottom: '24px'
                        }}>
                          {createMemoryCards().map((card, index) => (
                            <div
                              key={index}
                              onClick={() => handleMemoryCardClick(index)}
                              style={{
                                aspectRatio: '1',
                                background: flippedCards.includes(index) || matchedPairs.includes(index)
                                  ? (card.type === 'word' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(139, 92, 246, 0.3)')
                                  : 'rgba(255, 255, 255, 0.1)',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: matchedPairs.includes(index) ? 'default' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: matchedPairs.includes(index) ? 0.5 : 1,
                                transform: flippedCards.includes(index) ? 'rotateY(180deg)' : 'rotateY(0)'
                              }}
                            >
                              {(flippedCards.includes(index) || matchedPairs.includes(index)) ? (
                                <div style={{
                                  color: 'white',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  textAlign: 'center',
                                  padding: '8px',
                                  transform: 'rotateY(180deg)'
                                }}>
                                  {card.content}
                                </div>
                              ) : (
                                <div style={{
                                  color: 'rgba(255, 255, 255, 0.4)',
                                  fontSize: '32px'
                                }}>
                                  ?
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {matchedPairs.length === 16 && (
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid rgba(34, 197, 94, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            color: '#22c55e',
                            fontSize: '18px',
                            fontWeight: '700'
                          }}>
                            🎉 ¡Felicidades! Encontraste todos los pares
                          </div>
                        )}
                      </div>
                    )}

                    {previewLab.tipo_juego_code === 'matching' && (
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '32px',
                          marginBottom: '24px'
                        }}>
                          {/* Columna de palabras */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {previewWords.slice(0, 10).map((word, idx) => {
                              const isMatched = matchedLines.some(m => m.wordIdx === idx)
                              const isSelected = selectedMatching.word === idx
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleMatchingClick(idx, 'word')}
                                  disabled={isMatched}
                                  style={{
                                    padding: '16px',
                                    background: isMatched
                                      ? 'rgba(34, 197, 94, 0.3)'
                                      : isSelected
                                      ? 'rgba(59, 130, 246, 0.5)'
                                      : 'rgba(255, 255, 255, 0.1)',
                                    border: '2px solid ' + (isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'),
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: isMatched ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {word.palabra}
                                </button>
                              )
                            })}
                          </div>

                          {/* Columna de significados */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {previewWords.slice(0, 10).sort(() => Math.random() - 0.5).map((word, idx) => {
                              const originalIdx = previewWords.indexOf(word)
                              const isMatched = matchedLines.some(m => m.meaningIdx === originalIdx)
                              const isSelected = selectedMatching.meaning === originalIdx
                              return (
                                <button
                                  key={originalIdx}
                                  onClick={() => handleMatchingClick(originalIdx, 'meaning')}
                                  disabled={isMatched}
                                  style={{
                                    padding: '16px',
                                    background: isMatched
                                      ? 'rgba(34, 197, 94, 0.3)'
                                      : isSelected
                                      ? 'rgba(139, 92, 246, 0.5)'
                                      : 'rgba(255, 255, 255, 0.1)',
                                    border: '2px solid ' + (isSelected ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)'),
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '16px',
                                    cursor: isMatched ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {word.significado}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {matchedLines.length === 10 && (
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid rgba(34, 197, 94, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            color: '#22c55e',
                            fontSize: '18px',
                            fontWeight: '700'
                          }}>
                            🎉 ¡Perfecto! Emparejaste todas las palabras
                          </div>
                        )}

                        <div style={{
                          marginTop: '16px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '14px',
                          textAlign: 'center'
                        }}>
                          Matches: {matchedLines.length} / 10
                        </div>
                      </div>
                    )}

                    {previewLab.tipo_juego_code === 'fill_blanks' && (
                      <div>
                        <div style={{ marginBottom: '24px' }}>
                          {previewWords.slice(0, 10).map((word, idx) => (
                            <div
                              key={idx}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                marginBottom: '12px'
                              }}
                            >
                              <div style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '14px',
                                marginBottom: '8px'
                              }}>
                                {word.significado}
                              </div>
                              <input
                                type="text"
                                value={fillBlankAnswers[idx] || ''}
                                onChange={(e) => {
                                  const newAnswers = [...fillBlankAnswers]
                                  newAnswers[idx] = e.target.value
                                  setFillBlankAnswers(newAnswers)
                                }}
                                disabled={fillBlankResults.length > 0}
                                placeholder="Type the word..."
                                style={{
                                  width: '100%',
                                  padding: '12px 16px',
                                  background: fillBlankResults[idx] !== undefined
                                    ? (fillBlankResults[idx] ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                    : 'rgba(255, 255, 255, 0.1)',
                                  border: '2px solid ' + (
                                    fillBlankResults[idx] !== undefined
                                      ? (fillBlankResults[idx] ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)')
                                      : 'rgba(255, 255, 255, 0.2)'
                                  ),
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '16px',
                                  fontWeight: '600'
                                }}
                              />
                              {fillBlankResults[idx] !== undefined && !fillBlankResults[idx] && (
                                <div style={{
                                  marginTop: '8px',
                                  color: '#22c55e',
                                  fontSize: '14px',
                                  fontWeight: '600'
                                }}>
                                  Correct answer: {word.palabra}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                          {fillBlankResults.length === 0 ? (
                            <button
                              onClick={checkFillBlanks}
                              style={{
                                padding: '12px 32px',
                                background: 'rgba(59, 130, 246, 0.3)',
                                border: '2px solid rgba(59, 130, 246, 0.5)',
                                borderRadius: '12px',
                                color: '#60a5fa',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Check Answers
                            </button>
                          ) : (
                            <>
                              <div style={{
                                padding: '16px 24px',
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '2px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700'
                              }}>
                                Score: {fillBlankResults.filter(r => r).length} / {fillBlankResults.length}
                              </div>
                              <button
                                onClick={resetFillBlanks}
                                style={{
                                  padding: '12px 32px',
                                  background: 'rgba(168, 85, 247, 0.3)',
                                  border: '2px solid rgba(168, 85, 247, 0.5)',
                                  borderRadius: '12px',
                                  color: '#c084fc',
                                  fontSize: '16px',
                                  fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                Try Again
                              </button>
                            </>
                          )}
                        </div>

                        {fillBlankResults.length > 0 && fillBlankResults.every(r => r) && (
                          <div style={{
                            background: 'rgba(34, 197, 94, 0.2)',
                            border: '2px solid rgba(34, 197, 94, 0.5)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            color: '#22c55e',
                            fontSize: '18px',
                            fontWeight: '700',
                            marginTop: '16px'
                          }}>
                            🎉 ¡Perfecto! Todas las respuestas son correctas
                          </div>
                        )}
                      </div>
                    )}

                    {!['hangman', 'memory', 'matching', 'fill_blanks'].includes(previewLab.tipo_juego_code) && (
                      <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{previewLab.icono}</div>
                        <div style={{ fontSize: '20px', marginBottom: '8px', color: 'white' }}>{previewLab.tipo_juego}</div>
                        <div>Interactive preview coming soon for this game type</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Words List */}
            <div>
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                Words in this Game ({previewWords.length})
              </h3>
              
              {previewWords.length === 0 ? (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#fca5a5'
                }}>
                  No words found for this game
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  padding: '4px'
                }}>
                  {previewWords.map((word: any, index: number) => {
                    // Manejar diferentes estructuras de palabras
                    const palabra = word.palabra || word.word || word.en || word.english || 'Unknown';
                    const significado = word.significado || word.meaning || word.es || word.spanish || word.translation || 'No definition';
                    const definicion = word.definition || word.def || null;
                    
                    return (
                      <div
                        key={index}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                          {palabra}
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                          {significado}
                        </div>
                        {definicion && (
                          <div style={{
                            marginTop: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}>
                            {definicion}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
    </>
  )
}
