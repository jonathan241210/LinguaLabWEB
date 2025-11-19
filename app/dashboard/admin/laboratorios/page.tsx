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
        setVocabularios(data.vocabulario || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnidades = async (vocabId: number) => {
    try {
      const res = await fetch(`/api/vocabulario/unidades?id_vocabulario=${vocabId}`)
      if (res.ok) {
        const data = await res.json()
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
            <span style={{ fontSize: '20px' }}>➕</span>
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
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        {lab.titulo}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                ⚙️ CREATE A LAB
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
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Step 3: Choose Vocabulary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {vocabularios.map((vocab) => (
                      <div
                        key={vocab.id_vocabulario}
                        onClick={() => handleVocabularioSelect(vocab.id_vocabulario)}
                        style={{
                          background: selectedVocabulario === vocab.id_vocabulario
                            ? 'var(--color-primary-green)'
                            : 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedVocabulario === vocab.id_vocabulario
                            ? '2px solid white'
                            : '2px solid transparent'
                        }}
                      >
                        <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                          {vocab.archivo_original}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                          Level: {vocab.nivel} • {vocab.contenido.length} words
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 4: Seleccionar unidades */}
              {selectedVocabulario && unidades.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Step 4: Select Units
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {unidades.map((unidad) => (
                      <div
                        key={unidad.id_unidad}
                        onClick={() => toggleUnidad(unidad.id_unidad)}
                        style={{
                          background: selectedUnidades.includes(unidad.id_unidad)
                            ? 'var(--color-primary-green)'
                            : 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: selectedUnidades.includes(unidad.id_unidad)
                            ? '2px solid white'
                            : '2px solid rgba(255,255,255,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnidades.includes(unidad.id_unidad)}
                          onChange={() => {}}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
                            Unit {unidad.numero_unidad}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                            {unidad.nombre_unidad} ({unidad.palabras_ids.length} words)
                          </div>
                        </div>
                      </div>
                    ))}
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
                    <span>⚙️ Advanced Configuration</span>
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
                    ⚙️ Advanced Settings
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
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
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
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
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
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '8px',
                              color: 'white',
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
                    ✅ Create Activity
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
    </>
  )
}
