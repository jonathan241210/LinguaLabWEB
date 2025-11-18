'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';
import FormModal from '@/app/components/FormModal';

interface Alumno {
  id_alumno: number;
  matricula: string;
  nombre_completo: string;
  correo: string;
  programa: string;
  nivel: string;
  usuario_activo: number;
  estado: 'disponible' | 'asignado' | 'inactivo';
  grupo_actual?: string;
  cohorte_etiqueta?: string;
  programa_grupo?: string;
  docente_nombre?: string;
  docente_correo?: string;
  en_practicas: string;
}

function AlumnosPage() {
  const [activeMenu, setActiveMenu] = useState('students');
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }>({ 
    isOpen: false, 
    message: '', 
    onClose: () => {} 
  });

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'disponible' | 'asignado' | 'inactivo'>('todos');
  const [programaFilter, setProgramaFilter] = useState<string>('todos');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [confirmToggleModal, setConfirmToggleModal] = useState<{
    isOpen: boolean;
    studentId: number;
    studentName: string;
    currentActive: number;
    action: 'activate' | 'deactivate';
  } | null>(null);

  const studentFields: any = [
    { name: 'nombre', label: 'Name(s)', type: 'text', required: true, placeholder: 'E.g.: Juan' },
    { name: 'primer_apellido', label: 'First Last Name', type: 'text', required: true, placeholder: 'E.g.: Pérez' },
    { name: 'segundo_apellido', label: 'Second Last Name', type: 'text', required: false, placeholder: 'Optional' },
    { name: 'matricula', label: 'Student ID', type: 'text', required: true, placeholder: 'E.g.: A12345' },
    { name: 'correo', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'contrasena', label: 'Password', type: 'password', required: true, autoFillFrom: 'matricula', placeholder: 'Auto = student ID', showInfo: true, infoMessage: 'Student must change their password in profile' },
  ];

  const loadAlumnos = async () => {
    try {
      const res = await fetch('/api/alumnos/detailed');
      const data = await res.json();
      if (data.success) setAlumnos(data.data);
    } catch (e) {
      console.error('Error al cargar alumnos', e);
    }
  };

  useEffect(() => {
    loadAlumnos();
  }, []);

  const handleAddStudentModal = async (formData: Record<string, string>) => {
    try {
      const res = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          matricula: formData.matricula,
          correo: formData.correo,
          contrasena: formData.contrasena,
          rol: 'alumno'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSuccessModal({
          isOpen: true,
          message: data.error || 'Error registering student',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        throw new Error(data.error || 'Error registering student');
      }
      await loadAlumnos();
      setSuccessModal({
        isOpen: true,
        message: 'Student registered successfully',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setShowStudentModal(false);
    } catch (e) {
      console.error('Error registering student', e);
      throw e;
    }
  };

  const handleToggleStatus = async (id_alumno: number, currentActive: number) => {
    if (isToggling) return;
    
    setIsToggling(id_alumno);
    try {
      const newStatus = currentActive === 1 ? false : true;
      const res = await fetch('/api/alumnos/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_alumno, activo: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error changing student status',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }

      setSuccessModal({
        isOpen: true,
        message: `Student ${newStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      await loadAlumnos();
    } catch (e) {
      console.error('Error toggling status', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error changing student status',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    } finally {
      setIsToggling(null);
    }
  };

  const showToggleConfirmation = (alumno: Alumno) => {
    const action = alumno.usuario_activo === 1 ? 'deactivate' : 'activate';
    setConfirmToggleModal({
      isOpen: true,
      studentId: alumno.id_alumno,
      studentName: alumno.nombre_completo,
      currentActive: alumno.usuario_activo,
      action
    });
  };

  const confirmToggleAction = async () => {
    if (!confirmToggleModal) return;
    
    setConfirmToggleModal(null);
    await handleToggleStatus(confirmToggleModal.studentId, confirmToggleModal.currentActive);
  };

  const filteredAlumnos = alumnos.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchSearch = a.matricula.toLowerCase().includes(term) || 
                       a.nombre_completo.toLowerCase().includes(term) ||
                       a.correo.toLowerCase().includes(term);
    const matchEstado = estadoFilter === 'todos' || a.estado === estadoFilter;
    const matchPrograma = programaFilter === 'todos' || a.programa.toLowerCase().includes(programaFilter.toLowerCase());
    return matchSearch && matchEstado && matchPrograma;
  });

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'disponible': return '#2ea853';
      case 'asignado': return '#f59e0b';
      case 'inactivo': return '#ef4444';
      default: return '#2ea853';
    }
  };

  const getEstadoText = (estado: string) => {
    switch(estado) {
      case 'disponible': return 'Available';
      case 'asignado': return 'Assigned';
      case 'inactivo': return 'Inactive';
      default: return 'Unknown';
    }
  };

  // Obtener lista única de programas para el filtro
  const programasUnicos = [...new Set(alumnos.map(a => a.programa))].filter(p => p !== 'No program');

  return (
    <>
      <style jsx>{`
        @keyframes llw-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes llw-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes llw-pop-in { 0% { opacity: 0; transform: translateY(12px) scale(0.96) } 60% { opacity: 1; transform: translateY(0) scale(1.02) } 100% { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes llw-pop-out { from { opacity: 1; transform: translateY(0) scale(1) } to { opacity: 0; transform: translateY(8px) scale(0.94) } }
        @keyframes llw-confirm-bounce-in {
          0% { opacity: 0; transform: translateY(-15px) scale(0.92); }
          60% { opacity: 0.9; transform: translateY(3px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes llw-confirm-slide-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-8px) scale(0.96); }
        }
        .llw-confirm-overlay-enter { animation: llw-fade-in 180ms ease-out forwards; }
        .llw-confirm-overlay-exit { animation: llw-fade-out 180ms ease-in forwards; }
        .llw-confirm-card-enter { animation: llw-confirm-bounce-in 280ms cubic-bezier(0.25, 1.5, 0.5, 1) forwards; }
        .llw-confirm-card-exit { animation: llw-confirm-slide-out 200ms ease-in forwards; }

        @media (max-width: 768px) {
          .llw-filters-container {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .llw-filters-container input,
          .llw-filters-container select {
            width: 100% !important;
            flex: 1 1 auto !important;
          }
        }
      `}</style>
      <DashboardLayout 
        title="Students Management" 
        activeMenu={activeMenu} 
        onMenuItemClick={setActiveMenu} 
        roleType="administrador" 
        successModal={successModal}
      >
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-dark-blue)', margin: 0 }}>
              Students Management
            </h1>
          </div>

          {/* Add Student Section */}
          <div style={{ 
            border: '3px solid var(--color-dark-blue)', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: 'white',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-blue)', margin: 0 }}>
                Add New Student
              </h2>
              <button 
                type="button" 
                onClick={() => setShowStudentModal(true)}
                style={{ 
                  padding: '12px 24px', 
                  backgroundColor: 'var(--color-primary-green)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  transition: 'all 0.25s' 
                }} 
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = 'translateY(-2px)'; 
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)'; 
                }} 
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = 'translateY(0)'; 
                  e.currentTarget.style.boxShadow = 'none'; 
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: '16px' }}>+</span> Add Student
              </button>
            </div>
          </div>

          {/* Students List */}
          <div style={{ 
            border: '3px solid var(--color-dark-blue)', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: 'white' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-blue)', margin: 0 }}>
                Students List
              </h2>
              <div style={{ 
                padding: '10px 20px', 
                backgroundColor: 'var(--color-primary-green)', 
                color: 'white', 
                borderRadius: '10px', 
                fontSize: '15px', 
                fontWeight: 700, 
                boxShadow: '0 3px 10px rgba(46,168,83,0.3)' 
              }}>
                Total: {alumnos.length} {alumnos.length === 1 ? 'Student' : 'Students'}
              </div>
            </div>

            {/* Status Legend */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb' 
            }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                Student Status:
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2ea853' }}></div>
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                  <span>Assigned to Group</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                  <span>Inactive</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="llw-filters-container" style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px', 
              flexWrap: 'wrap', 
              alignItems: 'center' 
            }}>
              <input 
                type="text" 
                placeholder="Search by ID, name or email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  flex: '1 1 250px', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--color-dark-blue)', 
                  fontSize: '13px', 
                  outline: 'none' 
                }} 
              />
              <select 
                value={estadoFilter} 
                onChange={(e) => setEstadoFilter(e.target.value as any)}
                style={{ 
                  flex: '0 0 120px', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--color-dark-blue)', 
                  fontSize: '13px', 
                  outline: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: 'white' 
                }}
              >
                <option value="todos">All Status</option>
                <option value="disponible">Available</option>
                <option value="asignado">Assigned</option>
                <option value="inactivo">Inactive</option>
              </select>
              <select 
                value={programaFilter} 
                onChange={(e) => setProgramaFilter(e.target.value)}
                style={{ 
                  flex: '0 0 150px', 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '2px solid var(--color-dark-blue)', 
                  fontSize: '13px', 
                  outline: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: 'white' 
                }}
              >
                <option value="todos">All Programs</option>
                {programasUnicos.map(programa => (
                  <option key={programa} value={programa}>{programa}</option>
                ))}
              </select>
            </div>

            {/* Students Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', 
              gap: '16px' 
            }}>
              {filteredAlumnos.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666', 
                  fontSize: '14px' 
                }}>
                  No students match the current filters
                </div>
              ) : (
                filteredAlumnos.map(alumno => (
                  <div 
                    key={alumno.id_alumno}
                    style={{ 
                      border: `2px solid ${getEstadoColor(alumno.estado)}`, 
                      borderRadius: '12px', 
                      padding: '20px', 
                      backgroundColor: 'white', 
                      transition: 'all 0.3s',
                      opacity: alumno.usuario_activo === 0 ? 0.7 : 1
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {/* Header with Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ 
                          fontSize: '16px', 
                          fontWeight: 700, 
                          color: 'var(--color-dark-blue)', 
                          margin: '0 0 4px 0' 
                        }}>
                          {alumno.nombre_completo}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                          ID: {alumno.matricula}
                        </p>
                      </div>
                      <div style={{ 
                        padding: '4px 12px', 
                        backgroundColor: getEstadoColor(alumno.estado), 
                        color: 'white', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 600 
                      }}>
                        {getEstadoText(alumno.estado)}
                      </div>
                    </div>

                    {/* Student Info */}
                    <div style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Email:</strong> <span style={{ color: '#666' }}>{alumno.correo}</span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Program:</strong> <span style={{ color: '#666' }}>{alumno.programa}</span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Level:</strong> <span style={{ color: '#666' }}>{alumno.nivel}</span>
                      </div>
                      {alumno.grupo_actual && (
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Group:</strong>
                          <div style={{ 
                            marginTop: '4px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '6px',
                            border: '1px solid var(--color-primary-green)'
                          }}>
                            <p style={{ fontSize:'14px', fontWeight:700, color:'var(--color-primary-green)', margin:0 }}>📚 {alumno.programa_grupo || 'No program assigned'}</p>
                          </div>
                        </div>
                      )}
                      {alumno.docente_nombre && (
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Teacher:</strong> <span style={{ color: '#666' }}>{alumno.docente_nombre}</span>
                        </div>
                      )}
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Internship:</strong> <span style={{ color: '#666' }}>{alumno.en_practicas}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => showToggleConfirmation(alumno)}
                      disabled={isToggling === alumno.id_alumno}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: alumno.usuario_activo === 1 ? '#ef4444' : 'var(--color-primary-green)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isToggling === alumno.id_alumno ? 'wait' : 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isToggling === alumno.id_alumno ? 0.6 : 1,
                        transform: isToggling === alumno.id_alumno ? 'scale(0.98)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (isToggling !== alumno.id_alumno) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {isToggling === alumno.id_alumno ? 'Processing...' : 
                       alumno.usuario_activo === 1 ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {showStudentModal && (
        <FormModal 
          isOpen={showStudentModal} 
          onClose={() => setShowStudentModal(false)} 
          title="Add Student" 
          fields={studentFields} 
          onSubmit={handleAddStudentModal} 
          submitButtonLabel="Add Student" 
        />
      )}

      {/* Confirmation Modal for Toggle Status */}
      {confirmToggleModal && (
        <div 
          className="llw-confirm-overlay llw-confirm-overlay-enter"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setConfirmToggleModal(null)}
        >
          <div
            className="llw-confirm-card llw-confirm-card-enter"
            style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '420px',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: confirmToggleModal.action === 'deactivate' ? 'rgba(239,68,68,0.15)' : 'rgba(46,168,83,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={confirmToggleModal.action === 'deactivate' ? '#ef4444' : '#2ea853'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {confirmToggleModal.action === 'deactivate' ? 
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> :
                    <path d="M9 12l2 2 4-4" />
                  }
                </svg>
              </div>
            </div>

            <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700 }}>
              {confirmToggleModal.action === 'deactivate' ? 'Deactivate Student' : 'Activate Student'}
            </h3>
            
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6' }}>
              Are you sure you want to <strong>{confirmToggleModal.action}</strong> the student <br/>
              <strong style={{ color: 'white' }}>{confirmToggleModal.studentName}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmToggleModal(null)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '2px solid white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleAction}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: confirmToggleModal.action === 'deactivate' ? '#ef4444' : 'var(--color-primary-green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${confirmToggleModal.action === 'deactivate' ? 'rgba(239,68,68,0.4)' : 'rgba(46,168,83,0.4)'}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {confirmToggleModal.action === 'deactivate' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuthProtection(AlumnosPage, 'administrador');