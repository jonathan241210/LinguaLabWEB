'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';
import FormModal from '@/app/components/FormModal';

interface Docente {
  id_docente: number;
  matricula: string;
  nombre_completo: string;
  correo: string;
  usuario_activo: number;
  estado: 'disponible' | 'asignado' | 'inactivo';
  grupos_asignados: number;
  grupos_nombres?: string;
}

function DocentesPage() {
  const [activeMenu, setActiveMenu] = useState('teachers');
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }>({ 
    isOpen: false, 
    message: '', 
    onClose: () => {} 
  });

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'disponible' | 'asignado' | 'inactivo'>('todos');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [confirmToggleModal, setConfirmToggleModal] = useState<{
    isOpen: boolean;
    teacherId: number;
    teacherName: string;
    currentActive: number;
    action: 'activate' | 'deactivate';
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacherEdit, setSelectedTeacherEdit] = useState<Docente | null>(null);
  const [showConfirmDeleteTeacher, setShowConfirmDeleteTeacher] = useState(false);
  const [confirmDeleteTeacherExiting, setConfirmDeleteTeacherExiting] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: number; name: string } | null>(null);

  const teacherFields: any = [
    { name: 'nombre', label: 'Name(s)', type: 'text', required: true, placeholder: 'E.g.: María' },
    { name: 'primer_apellido', label: 'First Last Name', type: 'text', required: true, placeholder: 'E.g.: García' },
    { name: 'segundo_apellido', label: 'Second Last Name', type: 'text', required: false, placeholder: 'Optional' },
    { name: 'matricula', label: 'Teacher ID', type: 'text', required: true, placeholder: 'E.g.: T12345' },
    { name: 'correo', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'contrasena', label: 'Password', type: 'password', required: true, autoFillFrom: 'matricula', placeholder: 'Auto = teacher ID', showInfo: true, infoMessage: 'Teacher must change their password in profile' },
  ];

  const editTeacherFields: any = [
    { name: 'nombre', label: 'Name(s)', type: 'text', required: true, placeholder: 'E.g.: María' },
    { name: 'primer_apellido', label: 'First Last Name', type: 'text', required: true, placeholder: 'E.g.: García' },
    { name: 'segundo_apellido', label: 'Second Last Name', type: 'text', required: false, placeholder: 'Optional' },
    { name: 'matricula', label: 'Employee ID', type: 'text', required: true, placeholder: 'E.g.: T12345' },
    { name: 'correo', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'contrasena', label: 'New Password', type: 'password', required: false, placeholder: 'Leave empty to keep current password' },
  ];

  const loadDocentes = async () => {
    try {
      const res = await fetch('/api/docentes/detailed');
      const data = await res.json();
      if (data.success) setDocentes(data.data);
    } catch (e) {
      console.error('Error al cargar docentes', e);
    }
  };

  useEffect(() => {
    loadDocentes();
  }, []);

  const handleAddTeacherModal = async (formData: Record<string, string>) => {
    try {
      const res = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          matricula: formData.matricula,
          correo: formData.correo,
          contrasena: formData.contrasena,
          rol: 'docente'
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setSuccessModal({
          isOpen: true,
          message: data.error || 'Error registering teacher',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        throw new Error(data.error || 'Error registering teacher');
      }
      await loadDocentes();
      setSuccessModal({
        isOpen: true,
        message: 'Teacher registered successfully',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setShowTeacherModal(false);
    } catch (e) {
      console.error('Error registering teacher', e);
      throw e;
    }
  };

  const handleToggleStatus = async (id_docente: number, currentActive: number) => {
    if (isToggling) return;
    
    setIsToggling(id_docente);
    try {
      const newStatus = currentActive === 1 ? false : true;
      const res = await fetch('/api/docentes/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_docente, activo: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error changing teacher status',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }

      setSuccessModal({
        isOpen: true,
        message: `Teacher ${newStatus ? 'activated' : 'deactivated'} successfully`,
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      await loadDocentes();
    } catch (e) {
      console.error('Error toggling status', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error changing teacher status',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    } finally {
      setIsToggling(null);
    }
  };

  const showToggleConfirmation = (docente: Docente) => {
    const action = docente.usuario_activo === 1 ? 'deactivate' : 'activate';
    setConfirmToggleModal({
      isOpen: true,
      teacherId: docente.id_docente,
      teacherName: docente.nombre_completo,
      currentActive: docente.usuario_activo,
      action
    });
  };

  const confirmToggleAction = async () => {
    if (!confirmToggleModal) return;
    
    setConfirmToggleModal(null);
    await handleToggleStatus(confirmToggleModal.teacherId, confirmToggleModal.currentActive);
  };

  const handleEditTeacher = (docente: Docente) => {
    setSelectedTeacherEdit(docente);
    setShowEditModal(true);
  };

  const handleUpdateTeacher = async (formData: Record<string, string>) => {
    try {
      if (!selectedTeacherEdit) return;

      const res = await fetch('/api/docentes/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_docente: selectedTeacherEdit.id_docente,
          nombre: formData.nombre,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          correo: formData.correo,
          matricula: formData.matricula,
          contrasena: formData.contrasena || undefined
        })
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error updating teacher');
      }

      await loadDocentes();
      setSuccessModal({
        isOpen: true,
        message: 'Teacher information updated successfully',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setShowEditModal(false);
      setSelectedTeacherEdit(null);
    } catch (e: any) {
      console.error('Error updating teacher', e);
      throw e;
    }
  };

  const handleDeleteTeacherClick = (id_docente: number, nombre_completo: string) => {
    setTeacherToDelete({ id: id_docente, name: nombre_completo });
    setShowConfirmDeleteTeacher(true);
    setConfirmDeleteTeacherExiting(false);
  };

  const confirmDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/docentes/delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_docente: teacherToDelete.id })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Error deleting teacher');
      }

      // Animación de salida del modal
      setConfirmDeleteTeacherExiting(true);
      setTimeout(() => {
        setShowConfirmDeleteTeacher(false);
        setConfirmDeleteTeacherExiting(false);
        setTeacherToDelete(null);
      }, 300);

      setSuccessModal({
        isOpen: true,
        message: 'Teacher deleted successfully',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });

      await loadDocentes();
    } catch (e: any) {
      console.error('Error deleting teacher:', e);
      setSuccessModal({
        isOpen: true,
        message: e.message || 'Error deleting teacher',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    }
  };

  const filteredDocentes = docentes.filter(d => {
    const term = searchTerm.toLowerCase();
    const matchSearch = d.matricula.toLowerCase().includes(term) || 
                       d.nombre_completo.toLowerCase().includes(term) ||
                       d.correo.toLowerCase().includes(term);
    const matchEstado = estadoFilter === 'todos' || d.estado === estadoFilter;
    return matchSearch && matchEstado;
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
        title="Teachers Management" 
        activeMenu={activeMenu} 
        onMenuItemClick={setActiveMenu} 
        roleType="administrador" 
        successModal={successModal}
      >
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-dark-blue)', margin: 0 }}>
              Teachers Management
            </h1>
          </div>

          {/* Add Teacher Section */}
          <div style={{ 
            border: '3px solid var(--color-dark-blue)', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: 'white',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-blue)', margin: 0 }}>
                Add New Teacher
              </h2>
              <button 
                type="button" 
                onClick={() => setShowTeacherModal(true)}
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
                <span style={{ fontSize: '16px', lineHeight: '16px' }}>+</span> Add Teacher
              </button>
            </div>
          </div>

          {/* Teachers List */}
          <div style={{ 
            border: '3px solid var(--color-dark-blue)', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: 'white' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-dark-blue)', margin: 0 }}>
                Teachers List
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
                Total: {docentes.length} {docentes.length === 1 ? 'Teacher' : 'Teachers'}
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
                Teacher Status:
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#2ea853' }}></div>
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                  <span>Assigned to Groups</span>
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
            </div>

            {/* Teachers Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', 
              gap: '16px' 
            }}>
              {filteredDocentes.length === 0 ? (
                <div style={{ 
                  gridColumn: '1 / -1', 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#666', 
                  fontSize: '14px' 
                }}>
                  No teachers match the current filters
                </div>
              ) : (
                filteredDocentes.map(docente => (
                  <div 
                    key={docente.id_docente}
                    style={{ 
                      border: `2px solid ${getEstadoColor(docente.estado)}`, 
                      borderRadius: '12px', 
                      padding: '20px', 
                      backgroundColor: 'white', 
                      transition: 'all 0.3s',
                      opacity: docente.usuario_activo === 0 ? 0.7 : 1
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
                          {docente.nombre_completo}
                        </h3>
                        <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                          ID: {docente.matricula}
                        </p>
                      </div>
                      <div style={{ 
                        padding: '4px 12px', 
                        backgroundColor: getEstadoColor(docente.estado), 
                        color: 'white', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 600 
                      }}>
                        {getEstadoText(docente.estado)}
                      </div>
                    </div>

                    {/* Teacher Info */}
                    <div style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.5' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Email:</strong> <span style={{ color: '#666' }}>{docente.correo}</span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Groups Assigned:</strong> <span style={{ color: 'var(--color-primary-green)', fontWeight: 600 }}>
                          {docente.grupos_asignados}
                        </span>
                      </div>
                      {docente.grupos_nombres && (
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Groups:</strong> 
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '11px', 
                            color: '#666', 
                            backgroundColor: '#f9fafb', 
                            padding: '8px', 
                            borderRadius: '6px',
                            maxHeight: '60px',
                            overflowY: 'auto'
                          }}>
                            {docente.grupos_nombres}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleEditTeacher(docente)}
                        style={{
                          flex: '1 1 calc(50% - 4px)',
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        Edit Info
                      </button>
                      <button
                        onClick={() => handleDeleteTeacherClick(docente.id_docente, docente.nombre_completo)}
                        style={{
                          flex: '1 1 calc(50% - 4px)',
                          padding: '10px 16px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <i className="bi bi-trash"></i> Delete (TEST)
                      </button>
                      <button
                        onClick={() => showToggleConfirmation(docente)}
                        disabled={isToggling === docente.id_docente}
                        style={{
                          flex: '1 1 100%',
                          padding: '10px 16px',
                          backgroundColor: docente.usuario_activo === 1 ? '#ef4444' : 'var(--color-primary-green)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isToggling === docente.id_docente ? 'wait' : 'pointer',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: isToggling === docente.id_docente ? 0.6 : 1,
                          transform: isToggling === docente.id_docente ? 'scale(0.98)' : 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                          if (isToggling !== docente.id_docente) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {isToggling === docente.id_docente ? 'Processing...' : 
                         docente.usuario_activo === 1 ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {showTeacherModal && (
        <FormModal 
          isOpen={showTeacherModal} 
          onClose={() => setShowTeacherModal(false)} 
          title="Add Teacher" 
          fields={teacherFields} 
          onSubmit={handleAddTeacherModal} 
          submitButtonLabel="Add Teacher" 
        />
      )}

      {showEditModal && selectedTeacherEdit && (
        <FormModal 
          isOpen={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeacherEdit(null);
          }} 
          title="Edit Teacher Information" 
          fields={editTeacherFields} 
          onSubmit={handleUpdateTeacher} 
          submitButtonLabel="Update Information" 
          initialValues={{
            nombre: selectedTeacherEdit.nombre_completo.split(' ')[0],
            primer_apellido: selectedTeacherEdit.nombre_completo.split(' ')[1] || '',
            segundo_apellido: selectedTeacherEdit.nombre_completo.split(' ')[2] || '',
            matricula: selectedTeacherEdit.matricula,
            correo: selectedTeacherEdit.correo,
            contrasena: ''
          }}
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
              {confirmToggleModal.action === 'deactivate' ? 'Deactivate Teacher' : 'Activate Teacher'}
            </h3>
            
            <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 24px 0', fontSize: '15px', lineHeight: '1.6' }}>
              Are you sure you want to <strong>{confirmToggleModal.action}</strong> the teacher <br/>
              <strong style={{ color: 'white' }}>{confirmToggleModal.teacherName}</strong>?
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

      {/* Delete Confirmation Modal */}
      {showConfirmDeleteTeacher && teacherToDelete && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            animation: confirmDeleteTeacherExiting ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.3s ease-out',
          }}
          onClick={() => {
            setConfirmDeleteTeacherExiting(true);
            setTimeout(() => {
              setShowConfirmDeleteTeacher(false);
              setConfirmDeleteTeacherExiting(false);
              setTeacherToDelete(null);
            }, 300);
          }}
        >
          <div 
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: confirmDeleteTeacherExiting ? 'slideDown 0.3s ease-out forwards' : 'slideUp 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <i className="bi bi-exclamation-triangle-fill" style={{
                fontSize: '32px',
                color: '#ef4444'
              }}></i>
            </div>

            {/* Title */}
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '12px',
              textAlign: 'center',
            }}>
              Delete Teacher
            </h3>

            {/* Message */}
            <p style={{
              color: '#94a3b8',
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              Are you sure you want to delete the teacher:
            </p>
            <p style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              {teacherToDelete.name}
            </p>
            <p style={{
              color: '#ef4444',
              fontSize: '14px',
              lineHeight: '1.5',
              marginBottom: '24px',
              textAlign: 'center',
              fontWeight: 500,
            }}>
              This action cannot be undone. All teacher data, including their user account and group assignments will be permanently deleted.
            </p>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
            }}>
              <button
                onClick={() => {
                  setConfirmDeleteTeacherExiting(true);
                  setTimeout(() => {
                    setShowConfirmDeleteTeacher(false);
                    setConfirmDeleteTeacherExiting(false);
                    setTeacherToDelete(null);
                  }, 300);
                }}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#334155';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTeacher}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Yes, Delete Teacher
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuthProtection(DocentesPage, 'administrador');