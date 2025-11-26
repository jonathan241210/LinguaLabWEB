'use client'

import { useState, useEffect } from 'react'
import { withAuthProtection } from '@/lib/withAuth'
import DashboardLayout from '@/app/components/DashboardLayout'

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
  progressByGameType: any[]
  scoreDistribution: any[]
  monthlyProgress: any[]
  assignedLabs: any[]
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
      console.error('Error fetching groups:', error)
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
    await fetchGrupoStats(grupo.id_grupo)
    setShowGroupModal(true)
    setGroupModalExiting(false)
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
                  onClick={() => handleGroupClick(grupo)}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Details Modal - PLACEHOLDER for now, click groups to test */}
        {showGroupModal && selectedGrupo && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowGroupModal(false)}
          >
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <h2>{selectedGrupo.grupo_nombre}</h2>
              <p>Detailed view coming soon...</p>
              <button onClick={() => setShowGroupModal(false)}>Close</button>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  )
}

export default withAuthProtection(DocenteDashboard, 'docente')
