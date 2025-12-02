'use client'

import { useState, useEffect } from 'react'
import { withAuthProtection } from '@/lib/withAuth'
import DashboardLayout from '@/app/components/DashboardLayout'
import { 
  ProgressByGameTypeChart, 
  ScoreDistributionChart, 
  MonthlyProgressChart,
  StudentPerformanceChart,
  TimePerformanceChart,
  WeeklyProgressChart
} from '@/app/components/StatsCharts'

interface Grupo {
  id_grupo: number
  grupo_nombre: string
  cuatrimestre: string
  cohorte: string
  programa: string
  total_alumnos: number
  actividades_publicadas: number
  promedio_grupo: number | null
}

interface Alumno {
  id_alumno: number
  matricula: string
  nombre_completo: string
  labs_completed: number
  average_score: number
  total_experience: number
}

interface Laboratorio {
  id_laboratorio: number
  titulo: string
  descripcion: string
  tipo_juego: string
  tipo_juego_code: string
  icono: string
  nivel: string
  numero_palabras: number
  vocabulario_nombre: string
  unidades: string
  grupos_usando: number
}

interface GrupoStats {
  groupInfo: any
  groupStats: any
  topStudents: Alumno[]
  studentsNeedingHelp: Alumno[]
  allStudents: any[]
  progressByGameType: any[]
  scoreDistribution: any[]
  monthlyProgress: any[]
  assignedLabs: any[]
  avgTimeByGameType: any[]
  studentStats: any[]
  weeklyProgress: any[]
}

function DocenteDashboard() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null)
  const [grupoStats, setGrupoStats] = useState<GrupoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState('groups')
  const [laboratoriosDisponibles, setLaboratoriosDisponibles] = useState<Laboratorio[]>([])
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [selectedLab, setSelectedLab] = useState<Laboratorio | null>(null)
  const [publishExiting, setPublishExiting] = useState(false)
  const [groupModalExiting, setGroupModalExiting] = useState(false)
  const [renderGroupModal, setRenderGroupModal] = useState(false)
  const [renderPublishModal, setRenderPublishModal] = useState(false)
  
  // Estados para preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewLab, setPreviewLab] = useState<Laboratorio | null>(null)
  const [previewWords, setPreviewWords] = useState<any[]>([])
  const [previewExiting, setPreviewExiting] = useState(false)
  const [renderPreviewModal, setRenderPreviewModal] = useState(false)
  
  // Estados para tabs de estadísticas
  const [activeStatsTab, setActiveStatsTab] = useState<'students' | 'stats'>('students')
  
  // Estados para modal de estadísticas individuales
  const [showStudentStatsModal, setShowStudentStatsModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [studentStatsExiting, setStudentStatsExiting] = useState(false)
  const [renderStudentStatsModal, setRenderStudentStatsModal] = useState(false)
  
  // Estados para el juego en preview
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameTimer, setGameTimer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    onClose: () => void
  }>({ isOpen: false, message: '', onClose: () => {} })

  useEffect(() => {
    fetchGrupos()
    fetchLaboratoriosDisponibles()
  }, [])

  // Control de montaje del modal de grupo
  useEffect(() => {
    if (showGroupModal) {
      setRenderGroupModal(true)
      setGroupModalExiting(false)
    } else if (renderGroupModal) {
      setGroupModalExiting(true)
      const t = setTimeout(() => setRenderGroupModal(false), 260)
      return () => clearTimeout(t)
    }
  }, [showGroupModal, renderGroupModal])

  // Control de montaje del modal de publicar
  useEffect(() => {
    if (showPublishModal) {
      setRenderPublishModal(true)
      setPublishExiting(false)
    } else if (renderPublishModal) {
      setPublishExiting(true)
      const t = setTimeout(() => setRenderPublishModal(false), 260)
      return () => clearTimeout(t)
    }
  }, [showPublishModal, renderPublishModal])

  // Control de montaje del modal de preview
  useEffect(() => {
    if (showPreviewModal) {
      setRenderPreviewModal(true)
      setPreviewExiting(false)
    } else if (renderPreviewModal) {
      setPreviewExiting(true)
      const t = setTimeout(() => setRenderPreviewModal(false), 260)
      return () => clearTimeout(t)
    }
  }, [showPreviewModal, renderPreviewModal])

  // Control de montaje del modal de estadísticas de estudiante
  useEffect(() => {
    if (showStudentStatsModal) {
      setRenderStudentStatsModal(true)
      setStudentStatsExiting(false)
    } else if (renderStudentStatsModal) {
      setStudentStatsExiting(true)
      const t = setTimeout(() => setRenderStudentStatsModal(false), 260)
      return () => clearTimeout(t)
    }
  }, [showStudentStatsModal, renderStudentStatsModal])

  const fetchGrupos = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/docente/grupos', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setGrupos(data.grupos || [])
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false)
    }
  }

  const fetchLaboratoriosDisponibles = async () => {
    try {
      const res = await fetch('/api/laboratorios/published?scope=teachers')
      if (res.ok) {
        const data = await res.json()
        setLaboratoriosDisponibles(data.laboratorios || [])
      }
    } catch (error) {
      console.error('Error fetching available labs:', error)
    }
  }

  const fetchGrupoStats = async (id_grupo: number) => {
    try {
      const res = await fetch(`/api/grupos/statistics?id=${id_grupo}`)
      if (res.ok) {
        const data = await res.json()
        setGrupoStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching group stats:', error)
    }
  }

  const handleGroupClick = async (grupo: Grupo) => {
    setSelectedGrupo(grupo)
    setActiveStatsTab('students') // Reset al tab de estudiantes
    await fetchGrupoStats(grupo.id_grupo)
    setShowGroupModal(true)
  }

  const closeGroupModal = () => {
    setGroupModalExiting(true)
    setTimeout(() => {
      setShowGroupModal(false)
      setGroupModalExiting(false)
    }, 250)
  }

  const closePublishModal = () => {
    setPublishExiting(true)
    setTimeout(() => {
      setShowPublishModal(false)
      setPublishExiting(false)
      setSelectedLab(null)
    }, 250)
  }

  const closePreviewModal = () => {
    setPreviewExiting(true)
    setTimeout(() => {
      setShowPreviewModal(false)
      setPreviewExiting(false)
      setPreviewLab(null)
      setPreviewWords([])
      setCurrentWordIndex(0)
      setGuessedLetters([])
      setWrongGuesses(0)
      setGameTimer(0)
      setGameStarted(false)
      if (timerInterval) clearInterval(timerInterval)
    }, 250)
  }

  const openStudentStats = (student: any) => {
    // Merge allStudents data with studentStats to get complete info
    const studentWithStats = {
      ...student,
      ...(grupoStats?.studentStats?.find((s: any) => s.id_alumno === student.id_alumno) || {})
    }
    setSelectedStudent(studentWithStats)
    setShowStudentStatsModal(true)
  }

  const closeStudentStatsModal = () => {
    setStudentStatsExiting(true)
    setTimeout(() => {
      setShowStudentStatsModal(false)
      setStudentStatsExiting(false)
      setSelectedStudent(null)
    }, 250)
  }

  const openPreview = async (lab: Laboratorio) => {
    try {
      // Reiniciar estados del juego
      setCurrentWordIndex(0)
      setGuessedLetters([])
      setWrongGuesses(0)
      setGameTimer(0)
      setGameStarted(false)
      if (timerInterval) clearInterval(timerInterval)
      
      // Obtener las palabras del laboratorio
      const res = await fetch(`/api/laboratorios/preview?id=${lab.id_laboratorio}`)
      if (res.ok) {
        const data = await res.json()
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
      console.error('Error loading preview:', error)
      setSuccessModal({
        isOpen: true,
        message: 'Error loading game preview',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  const handlePublishLab = async () => {
    if (!selectedLab || !selectedGrupo) return

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch('/api/docente/actividades/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_actividad_plantilla: selectedLab.id_laboratorio,
          id_grupo: selectedGrupo.id_grupo
        })
      })

      if (res.ok) {
        setSuccessModal({
          isOpen: true,
          message: 'Activity published successfully to group!',
          type: 'success',
          onClose: () => {
            setSuccessModal(prev => ({ ...prev, isOpen: false }))
            setPublishExiting(true)
            setTimeout(() => {
              setShowPublishModal(false)
              setSelectedLab(null)
              setPublishExiting(false)
            }, 250)
            fetchGrupos()
            if (selectedGrupo) {
              fetchGrupoStats(selectedGrupo.id_grupo)
            }
          }
        })
      } else {
        const data = await res.json()
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error publishing activity',
          type: 'error',
          onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
        })
      }
    } catch (error) {
      setSuccessModal({
        isOpen: true,
        message: 'Error publishing activity to group',
        type: 'error',
        onClose: () => setSuccessModal(prev => ({ ...prev, isOpen: false }))
      })
    }
  }

  // Funciones del juego Hangman para preview
  const currentWord = previewWords[currentWordIndex]
  const wordToGuess = currentWord?.palabra?.toLowerCase() || ''
  const maxWrongGuesses = 6
  
  const handleLetterGuess = (letter: string) => {
    if (!guessedLetters.includes(letter)) {
      // Iniciar timer en primera letra (siempre inicia, tenga o no límite)
      if (!gameStarted) {
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
    }
  }
  
  // Listener para teclado físico
  useEffect(() => {
    if (!showPreviewModal) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (/^[a-z]$/.test(key)) {
        handleLetterGuess(key)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showPreviewModal, guessedLetters, wordToGuess])
  
  const isWordComplete = wordToGuess.split('').every((letter: string) => 
    guessedLetters.includes(letter) || letter === ' ' || !/[a-z]/.test(letter)
  )
  
  const isGameOver = wrongGuesses >= maxWrongGuesses
  
  const nextWord = () => {
    if (currentWordIndex < previewWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setGuessedLetters([])
      setWrongGuesses(0)
    }
  }
  
  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1)
      setGuessedLetters([])
      setWrongGuesses(0)
    }
  }
  
  const resetGame = () => {
    setCurrentWordIndex(0)
    setGuessedLetters([])
    setWrongGuesses(0)
    setGameTimer(0)
    setGameStarted(false)
    if (timerInterval) clearInterval(timerInterval)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimeLimitDisplay = () => {
    if (!previewLab?.tiempo_limite || previewLab.tiempo_limite === 0) {
      // Sin límite - mostrar tiempo transcurrido
      const currentMins = Math.floor(gameTimer / 60)
      const currentSecs = gameTimer % 60
      
      let timeStr = ''
      if (currentMins > 0) {
        timeStr = `${currentMins} minuto${currentMins !== 1 ? 's' : ''}`
        if (currentSecs > 0) {
          timeStr += ` ${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
        }
      } else {
        timeStr = `${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
      }
      
      return `⏱️ ${timeStr} (No limit)`
    }
    
    // Con límite - tiempo_limite está en segundos, convertir a minutos
    const totalMins = Math.floor(previewLab.tiempo_limite / 60)
    const limitSeconds = previewLab.tiempo_limite
    const isOverLimit = gameTimer > limitSeconds
    
    const currentMins = Math.floor(gameTimer / 60)
    const currentSecs = gameTimer % 60
    
    let current = ''
    if (currentMins > 0) {
      current = `${currentMins} minuto${currentMins !== 1 ? 's' : ''}`
      if (currentSecs > 0) {
        current += ` ${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
      }
    } else {
      current = `${currentSecs} segundo${currentSecs !== 1 ? 's' : ''}`
    }
    
    return (
      <>
        <span style={{ color: isOverLimit ? '#ef4444' : 'inherit' }}>
          ⏱️ {current}
        </span>
        <span style={{ opacity: 0.7 }}> de </span>
        <span>{totalMins} minuto{totalMins !== 1 ? 's' : ''}</span>
        {isOverLimit && <span style={{ marginLeft: '4px' }}>⚠️</span>}
      </>
    )
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
          0% { opacity: 0; transform: translateY(15px) scale(0.94); }
          50% { opacity: 0.8; transform: translateY(-2px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes llw-pop-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(10px) scale(0.92); }
        }
        .llw-modal-overlay-enter { animation: llw-fade-in 200ms ease-out forwards; }
        .llw-modal-overlay-exit { animation: llw-fade-out 200ms ease-in forwards; }
        .llw-modal-card-enter { animation: llw-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .llw-modal-card-exit { animation: llw-pop-out 250ms ease-in forwards; }
      `}</style>
      
      <DashboardLayout 
        title="Docentes" 
        activeMenu={activeMenu} 
        onMenuItemClick={setActiveMenu} 
        roleType="docente"
        successModal={successModal}
      >
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
              <i className="bi bi-people-fill"></i> My Groups
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Manage your assigned groups and publish activities
            </p>
          </div>

          {/* Stats Cards */}
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
                {grupos.length}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Assigned Groups</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-dark-blue) 0%, var(--color-dark-blue-darker) 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                {grupos.reduce((sum, g) => sum + g.total_alumnos, 0)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Students</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-success) 0%, var(--color-primary-green-light) 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                {grupos.reduce((sum, g) => sum + g.actividades_publicadas, 0)}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Published Activities</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--color-primary-green-medium) 0%, var(--color-primary-green) 100%)',
              borderRadius: '16px',
              padding: '24px',
              color: 'white',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px' }}>
                {grupos.filter(g => g.promedio_grupo !== null && g.promedio_grupo >= 70).length}
              </div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Groups Above 70%</div>
            </div>
          </div>

          {/* Groups Grid */}
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
              Loading groups...
            </div>
          ) : grupos.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '60px',
              textAlign: 'center',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
              <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No groups assigned</h3>
              <p style={{ color: '#64748b' }}>
                Contact your administrator to get assigned to groups
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {grupos.map((grupo) => (
                <div
                  key={grupo.id_grupo}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
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
                      👥
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                        {grupo.grupo_nombre}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {grupo.programa}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {grupo.cuatrimestre}
                    </span>
                    <span style={{
                      background: '#dcfce7',
                      color: 'var(--color-primary-green-dark)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {grupo.cohorte}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Students</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>{grupo.total_alumnos}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Activities</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>{grupo.actividades_publicadas}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>Average Score</div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: grupo.promedio_grupo && grupo.promedio_grupo >= 70 ? 'var(--color-success)' : grupo.promedio_grupo ? 'var(--color-warning)' : '#94a3b8' }}>
                        {grupo.promedio_grupo ? `${Math.round(grupo.promedio_grupo)}%` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* View Info Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupClick(grupo);
                    }}
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '12px',
                      background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(46,168,83,0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <i className="bi bi-info-circle"></i>
                    View Info
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Details Modal */}
        {renderGroupModal && selectedGrupo && (
          <div 
            className={`llw-modal-overlay ${groupModalExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
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
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={closeGroupModal}
          >
            <div 
              className={`llw-modal-card ${groupModalExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeGroupModal}
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
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
                  e.currentTarget.style.backgroundColor = '#ff4f4f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#ff3b3b';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                }}
              >
                ✕
              </button>

              {/* Header */}
              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 24px 0',
                paddingRight: '40px'
              }}>
                {selectedGrupo.grupo_nombre}
              </h2>

              {/* Badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedGrupo.cuatrimestre}
                </span>
                <span style={{
                  background: 'rgba(46,168,83,0.2)',
                  color: 'var(--color-primary-green-light)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedGrupo.cohorte}
                </span>
                <span style={{
                  background: 'rgba(59,130,246,0.2)',
                  color: '#60a5fa',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedGrupo.programa}
                </span>
              </div>

              {grupoStats ? (
                <>
                  {/* Summary Stats - Enhanced */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(46,168,83,0.15) 0%, rgba(59,130,246,0.15) 100%)',
                    border: '2px solid rgba(46,168,83,0.3)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <i className="bi bi-graph-up-arrow"></i>
                      General Group Statistics
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '16px'
                    }}>
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Students
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-primary-green-light)' }}>
                          {grupoStats.allStudents?.length || grupoStats.groupInfo?.total_students || 0}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Group Average
                        </div>
                        <div style={{ 
                          fontSize: '28px', 
                          fontWeight: '700', 
                          color: grupoStats.groupStats?.average_score >= 70 ? '#4ade80' : grupoStats.groupStats?.average_score >= 60 ? '#fbbf24' : '#f87171'
                        }}>
                          {grupoStats.groupStats?.average_score ? `${Math.round(grupoStats.groupStats.average_score)}%` : 'N/A'}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Labs Completed
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#60a5fa' }}>
                          {grupoStats.groupStats?.total_labs_completed || 0}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Labs Passed
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>
                          {grupoStats.groupStats?.total_labs_passed || 0}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Experience
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#c084fc' }}>
                          {grupoStats.groupStats?.total_xp ? Math.round(grupoStats.groupStats.total_xp).toLocaleString() : '0'}
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Assigned Activities
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#fb923c' }}>
                          {grupoStats.assignedLabs?.length || 0}
                        </div>
                      </div>

                      <div style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Pass Rate
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#22d3ee' }}>
                          {grupoStats.groupStats?.total_labs_attempted > 0 
                            ? `${Math.round((grupoStats.groupStats.total_labs_passed / grupoStats.groupStats.total_labs_attempted) * 100)}%`
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  {/* Students List */}
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="bi bi-people-fill"></i>
                      Students
                    </h3>
                    
                    {grupoStats.allStudents && grupoStats.allStudents.length > 0 ? (
                      <div style={{ 
                        display: 'grid', 
                        gap: '8px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '4px'
                      }}>
                        {grupoStats.allStudents.map((student: any) => (
                          <div key={student.id_alumno} style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '16px',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
                            e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                          }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '600',
                                fontSize: '14px'
                              }}>
                                {student.nombre_completo?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                                  {student.nombre_completo}
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                                  {student.matricula || 'No ID'}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: student.promedio >= 70 ? 'var(--color-success)' : student.promedio >= 60 ? 'var(--color-warning)' : 'var(--color-error)'
                                }}>
                                  {student.promedio ? `${Math.round(student.promedio)}%` : 'N/A'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                                  {student.labs_completados || 0} labs
                                </div>
                              </div>
                              <button
                                onClick={() => openStudentStats(student)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '1px solid rgba(59, 130, 246, 0.4)',
                                  borderRadius: '8px',
                                  color: '#60a5fa',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                                  e.currentTarget.style.transform = 'translateY(-2px)'
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                                  e.currentTarget.style.transform = 'translateY(0)'
                                }}
                              >
                                <i className="bi bi-graph-up"></i>
                                Stats
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        color: 'rgba(255,255,255,0.7)'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>👥</div>
                        <div>No students in this group yet</div>
                      </div>
                    )}
                  </div>

                  {/* Assign Activity Button */}
                  <button
                    onClick={() => setShowPublishModal(true)}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      backgroundColor: 'var(--color-primary-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all var(--transition-normal)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Assign New Activity to Group
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.7)' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(46,168,83,0.2)',
                    borderTop: '4px solid var(--color-primary-green)',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Loading students...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Publish Lab Modal */}
        {renderPublishModal && (
          <div
            className={`llw-modal-overlay ${publishExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
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
              zIndex: 1001,
              padding: '20px'
            }}
            onClick={closePublishModal}
          >
            <div
              className={`llw-modal-card ${publishExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closePublishModal}
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
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
                  e.currentTarget.style.backgroundColor = '#ff4f4f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#ff3b3b';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                }}
              >
                ✕
              </button>

              {/* Title */}
              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 24px 0',
                paddingRight: '40px'
              }}>
                Select Activity to Assign
              </h2>

              {selectedGrupo && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="bi bi-people-fill" style={{ color: 'var(--color-primary-green-light)' }}></i>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                    Assigning to: <strong style={{ color: 'white' }}>{selectedGrupo.grupo_nombre}</strong>
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {laboratoriosDisponibles.length > 0 ? (
                  laboratoriosDisponibles.map((lab) => (
                    <div
                      key={lab.id_laboratorio}
                      style={{
                        background: selectedLab?.id_laboratorio === lab.id_laboratorio ? 'rgba(46,168,83,0.2)' : 'rgba(255,255,255,0.1)',
                        border: selectedLab?.id_laboratorio === lab.id_laboratorio ? '2px solid var(--color-primary-green)' : '1px solid rgba(255,255,255,0.2)',
                        padding: '16px',
                        borderRadius: '12px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div 
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => setSelectedLab(lab)}
                        >
                          <div style={{ fontSize: '15px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                            {lab.titulo}
                          </div>
                          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                            {lab.descripcion || 'No description'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: 'rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.9)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {lab.tipo_juego}
                            </span>
                            <span style={{
                              background: 'rgba(59,130,246,0.3)',
                              color: '#93c5fd',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {lab.nivel}
                            </span>
                            <span style={{
                              background: 'rgba(245,158,11,0.3)',
                              color: '#fcd34d',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}>
                              {lab.numero_palabras} words
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '12px' }}>
                          {selectedLab?.id_laboratorio === lab.id_laboratorio && (
                            <i className="bi bi-check-circle-fill" style={{ color: 'var(--color-primary-green-light)', fontSize: '24px' }}></i>
                          )}
                        </div>
                      </div>
                      
                      {/* Preview Button */}
                      <button
                        onClick={() => openPreview(lab)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          background: 'rgba(59,130,246,0.2)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.4)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(59,130,246,0.3)';
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.6)';
                          e.currentTarget.style.color = '#93c5fd';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(59,130,246,0.2)';
                          e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                          e.currentTarget.style.color = '#60a5fa';
                        }}
                      >
                        <i className="bi bi-eye"></i>
                        Preview Activity
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                    <div>No published activities available</div>
                  </div>
                )}
              </div>

              {selectedLab && (
                <button
                  onClick={handlePublishLab}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px 24px',
                    backgroundColor: 'var(--color-primary-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="bi bi-check2-circle"></i>
                  Assign Selected Activity
                </button>
              )}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {renderPreviewModal && previewLab && (
          <div
            className={`llw-modal-overlay ${previewExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
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
              zIndex: 1002,
              padding: '20px'
            }}
            onClick={closePreviewModal}
          >
            <div
              className={`llw-modal-card ${previewExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closePreviewModal}
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
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
                  e.currentTarget.style.backgroundColor = '#ff4f4f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#ff3b3b';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                }}
              >
                ✕
              </button>

              {/* Title */}
              <h2 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 24px 0',
                paddingRight: '40px'
              }}>
                Preview: {previewLab.titulo}
              </h2>

              {/* Hangman Game */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', width: '100%' }}>
                {/* Status */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ color: 'white', fontSize: '16px' }}>
                    Word {currentWordIndex + 1} of {previewWords.length}
                  </div>
                  {previewLab?.tiempo_limite !== undefined && (
                    <div style={{
                      background: gameTimer > previewLab.tiempo_limite && previewLab.tiempo_limite > 0 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : gameStarted 
                          ? 'rgba(34, 197, 94, 0.2)' 
                          : 'rgba(255, 255, 255, 0.1)',
                      border: `1px solid ${
                        gameTimer > previewLab.tiempo_limite && previewLab.tiempo_limite > 0
                          ? 'rgba(239, 68, 68, 0.3)'
                          : gameStarted 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'rgba(255, 255, 255, 0.2)'
                      }`,
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: gameTimer > previewLab.tiempo_limite && previewLab.tiempo_limite > 0
                        ? '#f87171'
                        : gameStarted 
                          ? '#4ade80' 
                          : 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {getTimeLimitDisplay()}
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
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    Reset
                  </button>
                </div>

                {/* Hangman SVG */}
                <svg width="160" height="180" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))' }}>
                  <line x1="20" y1="170" x2="80" y2="170" stroke="var(--color-primary-green)" strokeWidth="4" />
                  <line x1="40" y1="170" x2="40" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />
                  <line x1="40" y1="20" x2="100" y2="20" stroke="var(--color-primary-green)" strokeWidth="4" />
                  <line x1="100" y1="20" x2="100" y2="40" stroke="var(--color-primary-green)" strokeWidth="3" />
                  
                  {wrongGuesses >= 1 && <circle cx="100" cy="55" r="15" stroke="#ef4444" strokeWidth="3" fill="none" />}
                  {wrongGuesses >= 2 && <line x1="100" y1="70" x2="100" y2="120" stroke="#ef4444" strokeWidth="3" />}
                  {wrongGuesses >= 3 && <line x1="100" y1="85" x2="75" y2="100" stroke="#ef4444" strokeWidth="3" />}
                  {wrongGuesses >= 4 && <line x1="100" y1="85" x2="125" y2="100" stroke="#ef4444" strokeWidth="3" />}
                  {wrongGuesses >= 5 && <line x1="100" y1="120" x2="80" y2="150" stroke="#ef4444" strokeWidth="3" />}
                  {wrongGuesses >= 6 && <line x1="100" y1="120" x2="120" y2="150" stroke="#ef4444" strokeWidth="3" />}
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

                {/* Instrucción */}
                {!isGameOver && !isWordComplete && (
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
                    <i className="bi bi-lightbulb-fill"></i> Use your keyboard to guess letters
                  </div>
                )}

                {/* Navigation Buttons */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button
                    onClick={prevWord}
                    disabled={currentWordIndex === 0}
                    style={{
                      padding: '12px 24px',
                      background: currentWordIndex === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.3)',
                      border: `2px solid ${currentWordIndex === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.5)'}`,
                      borderRadius: '8px',
                      color: currentWordIndex === 0 ? 'rgba(255, 255, 255, 0.4)' : '#60a5fa',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: currentWordIndex === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                    Previous
                  </button>
                  <button
                    onClick={nextWord}
                    disabled={currentWordIndex === previewWords.length - 1}
                    style={{
                      padding: '12px 24px',
                      background: currentWordIndex === previewWords.length - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.3)',
                      border: `2px solid ${currentWordIndex === previewWords.length - 1 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.5)'}`,
                      borderRadius: '8px',
                      color: currentWordIndex === previewWords.length - 1 ? 'rgba(255, 255, 255, 0.4)' : '#60a5fa',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: currentWordIndex === previewWords.length - 1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    Next
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Statistics Modal */}
        {renderStudentStatsModal && selectedStudent && (
          <div 
            className={`llw-modal-overlay ${studentStatsExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
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
              zIndex: 1100,
              padding: '20px'
            }}
            onClick={closeStudentStatsModal}
          >
            <div 
              className={`llw-modal-card ${studentStatsExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeStudentStatsModal}
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
                  e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
                  e.currentTarget.style.backgroundColor = '#ff4f4f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = '#ff3b3b';
                }}
              >
                ×
              </button>

              {/* Header */}
              <div style={{ marginBottom: '32px', paddingRight: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '24px'
                  }}>
                    {selectedStudent.nombre_completo?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', margin: '0 0 4px 0' }}>
                      {selectedStudent.nombre_completo}
                    </h2>
                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                      {selectedStudent.matricula || 'No ID'}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px',
                  background: 'linear-gradient(135deg, rgba(46,168,83,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Labs Completed
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-primary-green-light)' }}>
                      {selectedStudent.labs_completados || 0}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Average
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: selectedStudent.promedio >= 70 ? 'var(--color-success)' : selectedStudent.promedio >= 60 ? 'var(--color-warning)' : 'var(--color-error)'
                    }}>
                      {selectedStudent.promedio ? `${Math.round(selectedStudent.promedio)}%` : 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Total Experience
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#c084fc' }}>
                      {selectedStudent.exp_total ? Math.round(selectedStudent.exp_total).toLocaleString() : '0'}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Average Time
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#fb923c' }}>
                      {selectedStudent.tiempo_promedio 
                        ? `${Math.round(selectedStudent.tiempo_promedio / 60)}m` 
                        : 'N/A'}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Labs Passed
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>
                      {selectedStudent.labs_aprobados || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="bi bi-graph-up"></i>
                  Student Progress
                </h3>
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '24px',
                  borderRadius: '12px'
                }}>
                  <StudentPerformanceChart data={{
                    nombre_completo: selectedStudent.nombre_completo,
                    labs_completed: selectedStudent.labs_completados || 0,
                    average_score: selectedStudent.promedio || 0,
                    labs_publicados: selectedStudent.labs_publicados || 0
                  }} />
                </div>
              </div>

              {/* Additional Info */}
              {(selectedStudent.labs_completados > 0 || selectedStudent.promedio > 0) && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <i className="bi bi-info-circle" style={{ fontSize: '24px', color: '#60a5fa' }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '4px' }}>
                      Student Status
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                      {selectedStudent.promedio >= 70 
                        ? '✅ Excellent performance. Keep it up!'
                        : selectedStudent.promedio >= 60
                        ? '⚠️ Good progress, but can improve.'
                        : '❌ Needs additional support to improve.'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  )
}

export default withAuthProtection(DocenteDashboard, 'docente')
