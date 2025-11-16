'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';

interface Grupo {
  id_grupo: number;
  nombre: string;
  cuatrimestre: string;
  cohorte: string;
  docente: string | null;
  id_docente: number | null;
  total_alumnos: number;
  estado_practicas: number;
}

interface Alumno {
  id_alumno: number;
  matricula: string;
  nombre_completo: string;
  programa?: string;
  nivel?: string;
  promedio_general?: number;
  experiencia_total?: number;
  fecha_ingreso?: string;
}

interface Cohorte {
  id_cohorte: number;
  etiqueta: string;
}

interface Cuatrimestre {
  id_cuatrimestre: number;
  nombre: string;
}

interface Docente {
  id_docente: number;
  nombre_completo: string;
  matricula: string;
}

function GruposPage() {
  const [activeMenu, setActiveMenu] = useState('grupos');
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Alumno[]>([]);
  const [cohortes, setCohortes] = useState<Cohorte[]>([]);
  const [cuatrimestres, setCuatrimestres] = useState<Cuatrimestre[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  
  // Estados para modals y forms
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGrupoForStudents, setSelectedGrupoForStudents] = useState<number | null>(null);
  const [selectedGrupoForTeacher, setSelectedGrupoForTeacher] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [expandedGrupo, setExpandedGrupo] = useState<number | null>(null);
  const [grupoDetail, setGrupoDetail] = useState<any>(null);

  // Form para crear grupo
  const [newGrupo, setNewGrupo] = useState({
    nombre: '',
    id_cuatrimestre_grupo_fk: '',
    anio_ingreso: new Date().getFullYear().toString(),
    cuatrimestre_inicial: '',
    id_programa_cohorte_fk: '',
    id_nivel_inicial_fk: '',
  });

  // Success modal
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '', onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} }) });

  useEffect(() => {
    loadGrupos();
    loadAlumnosDisponibles();
    loadCatalogs();
  }, []);

  const loadGrupos = async () => {
    try {
      const res = await fetch('/api/grupos/list');
      const data = await res.json();
      if (data.success) {
        setGrupos(data.data);
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
    }
  };

  const loadAlumnosDisponibles = async () => {
    try {
      const res = await fetch('/api/alumnos/available');
      const data = await res.json();
      if (data.success) {
        setAlumnosDisponibles(data.data);
      }
    } catch (error) {
      console.error('Error al cargar alumnos disponibles:', error);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [cohortesRes, cuatrimestresRes, docentesRes, programasRes, nivelesRes] = await Promise.all([
        fetch('/api/catalogs/cohortes'),
        fetch('/api/catalogs/cuatrimestres'),
        fetch('/api/catalogs/docentes'),
        fetch('/api/catalogs/programas'),
        fetch('/api/catalogs/niveles'),
      ]);
      const [cohortesData, cuatrimestresData, docentesData, programasData, nivelesData] = await Promise.all([
        cohortesRes.json(),
        cuatrimestresRes.json(),
        docentesRes.json(),
        programasRes.json(),
        nivelesRes.json(),
      ]);
      if (cohortesData.success) setCohortes(cohortesData.data);
      if (cuatrimestresData.success) setCuatrimestres(cuatrimestresData.data);
      if (docentesData.success) setDocentes(docentesData.data);
      if (programasData.success) setProgramas(programasData.data);
      if (nivelesData.success) setNiveles(nivelesData.data);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const handleCreateGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Crear cohorte primero
      const etiqueta = `${newGrupo.anio_ingreso}-C${newGrupo.cuatrimestre_inicial}-${programas.find(p => p.id_programa == newGrupo.id_programa_cohorte_fk)?.codigo || 'PROG'}-${niveles.find(n => n.id_nivel == newGrupo.id_nivel_inicial_fk)?.codigo || 'NIV'}`;
      
      const cohorteRes = await fetch('/api/cohortes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anio_ingreso: parseInt(newGrupo.anio_ingreso),
          cuatrimestre_inicial: parseInt(newGrupo.cuatrimestre_inicial),
          id_programa_cohorte_fk: parseInt(newGrupo.id_programa_cohorte_fk),
          id_nivel_inicial_fk: parseInt(newGrupo.id_nivel_inicial_fk),
          etiqueta,
        }),
      });
      const cohorteData = await cohorteRes.json();
      
      let id_cohorte_grupo_fk = null;
      if (cohorteData.success) {
        id_cohorte_grupo_fk = cohorteData.data.id_cohorte;
      } else if (cohorteData.message?.includes('etiqueta')) {
        // Cohorte ya existe, buscarla
        await loadCatalogs();
        const cohorteExistente = cohortes.find(c => c.etiqueta === etiqueta);
        if (cohorteExistente) {
          id_cohorte_grupo_fk = cohorteExistente.id_cohorte;
        }
      }

      if (!id_cohorte_grupo_fk) {
        alert('Error al crear o encontrar cohorte');
        return;
      }

      // 2. Crear grupo
      const res = await fetch('/api/grupos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newGrupo.nombre,
          id_cuatrimestre_grupo_fk: newGrupo.id_cuatrimestre_grupo_fk,
          id_cohorte_grupo_fk,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const id_grupo = data.data.id_grupo;
        
        // 3. Asignar alumnos al grupo recién creado con programa y nivel
        if (selectedStudents.length > 0) {
          const assignRes = await fetch('/api/grupos/assign-students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id_grupo, 
              id_alumnos: selectedStudents,
              id_programa: parseInt(newGrupo.id_programa_cohorte_fk),
              id_nivel: parseInt(newGrupo.id_nivel_inicial_fk),
            }),
          });
          const assignData = await assignRes.json();
          if (!assignData.success) {
            console.error('Error al asignar alumnos:', assignData.message);
          }
        }
        
        setSuccessModal({ isOpen: true, message: `¡Grupo creado con ${selectedStudents.length} alumno(s)!`, onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} }) });
        setShowCreateModal(false);
        setNewGrupo({
          nombre: '',
          id_cuatrimestre_grupo_fk: '',
          anio_ingreso: new Date().getFullYear().toString(),
          cuatrimestre_inicial: '',
          id_programa_cohorte_fk: '',
          id_nivel_inicial_fk: '',
        });
        setSelectedStudents([]);
        loadGrupos();
        loadAlumnosDisponibles();
        loadCatalogs();
      } else {
        alert(data.message || 'Error al crear grupo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear grupo');
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedGrupoForStudents || selectedStudents.length === 0) {
      alert('Selecciona un grupo y al menos un alumno');
      return;
    }
    try {
      const res = await fetch('/api/grupos/assign-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_grupo: selectedGrupoForStudents, id_alumnos: selectedStudents }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessModal({ isOpen: true, message: data.message, onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} }) });
        setSelectedStudents([]);
        setSelectedGrupoForStudents(null);
        loadGrupos();
        loadAlumnosDisponibles();
      } else {
        alert(data.message || 'Error al asignar alumnos');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar alumnos');
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedGrupoForTeacher || !selectedTeacher) {
      alert('Selecciona un grupo y un docente');
      return;
    }
    try {
      const res = await fetch('/api/grupos/assign-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_grupo: selectedGrupoForTeacher, id_docente: selectedTeacher }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessModal({ isOpen: true, message: data.message, onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} }) });
        setSelectedGrupoForTeacher(null);
        setSelectedTeacher(null);
        loadGrupos();
      } else {
        alert(data.message || 'Error al asignar docente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar docente');
    }
  };

  const handleViewGrupo = async (id_grupo: number) => {
    if (expandedGrupo === id_grupo) {
      setExpandedGrupo(null);
      setGrupoDetail(null);
      return;
    }
    try {
      const res = await fetch(`/api/grupos/detail?id=${id_grupo}`);
      const data = await res.json();
      if (data.success) {
        setGrupoDetail(data.data);
        setExpandedGrupo(id_grupo);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleStudentSelection = (id_alumno: number) => {
    setSelectedStudents((prev) =>
      prev.includes(id_alumno) ? prev.filter((id) => id !== id_alumno) : [...prev, id_alumno]
    );
  };

  return (
    <DashboardLayout
      title="Groups Management"
      activeMenu={activeMenu}
      onMenuItemClick={setActiveMenu}
      roleType="administrador"
      successModal={successModal}
    >
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-dark-blue)', margin: 0 }}>
            Gestión de Grupos
          </h1>
        </div>

        {/* Secciones lado a lado: Crear Grupo y Asignar Docente */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Sección 1: Crear Grupo con Alumnos */}
          <div style={{
            flex: '1 1 45%',
            minWidth: '400px',
            border: '3px solid var(--color-dark-blue)',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: 'white',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-dark-blue)', marginBottom: '16px' }}>
              Crear Grupo de Alumnos
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>
                Seleccionar Alumnos ({selectedStudents.length} seleccionados)
              </label>
              <div style={{
                maxHeight: '250px',
                overflowY: 'auto',
                border: '2px solid #ddd',
                borderRadius: '8px',
                padding: '8px',
              }}>
                {alumnosDisponibles.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#999', padding: '8px' }}>No hay alumnos disponibles sin grupo</p>
                ) : (
                  alumnosDisponibles.map((alumno) => (
                    <label
                      key={alumno.id_alumno}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        backgroundColor: selectedStudents.includes(alumno.id_alumno) ? '#e3f2fd' : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseOver={(e) => {
                        if (!selectedStudents.includes(alumno.id_alumno)) {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!selectedStudents.includes(alumno.id_alumno)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(alumno.id_alumno)}
                        onChange={() => toggleStudentSelection(alumno.id_alumno)}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '13px' }}>
                        {alumno.nombre_completo} ({alumno.matricula}) - {alumno.programa}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <button
              onClick={() => {
                if (selectedStudents.length < 10) {
                  alert('Selecciona al menos 10 alumnos para crear un grupo');
                  return;
                }
                setShowCreateModal(true);
              }}
              disabled={selectedStudents.length < 10}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedStudents.length < 10 ? '#ccc' : 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: selectedStudents.length < 10 ? 'not-allowed' : 'pointer',
                width: '100%',
              }}
            >
              Crear Grupo con {selectedStudents.length} Alumno(s) {selectedStudents.length < 10 && `(mín. 10)`}
            </button>
          </div>

          {/* Sección 2: Asignar Docente a Grupo */}
          <div style={{
            flex: '1 1 45%',
            minWidth: '400px',
            border: '3px solid var(--color-dark-blue)',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: 'white',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-dark-blue)', marginBottom: '16px' }}>
              Asignar Docente a Grupo
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>
                Grupo
              </label>
              <select
                value={selectedGrupoForTeacher || ''}
                onChange={(e) => setSelectedGrupoForTeacher(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                }}
              >
                <option value="">Seleccionar grupo...</option>
                {grupos.map((g) => (
                  <option key={g.id_grupo} value={g.id_grupo}>
                    {g.nombre} - {g.cohorte}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' }}>
                Docente
              </label>
              <select
                value={selectedTeacher || ''}
                onChange={(e) => setSelectedTeacher(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                }}
              >
                <option value="">Seleccionar docente...</option>
                {docentes.map((d) => (
                  <option key={d.id_docente} value={d.id_docente}>
                    {d.nombre_completo} ({d.matricula})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAssignTeacher}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Asignar Docente
            </button>
          </div>
        </div>

        {/* Sección 3: Grupos Existentes */}
        <div style={{
          border: '3px solid var(--color-dark-blue)',
          borderRadius: '12px',
          padding: '24px',
          backgroundColor: 'white',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-dark-blue)', marginBottom: '16px' }}>
            Grupos Existentes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {grupos.map((grupo) => (
              <div key={grupo.id_grupo}>
                <div
                  style={{
                    border: '2px solid var(--color-dark-blue)',
                    borderRadius: '10px',
                    padding: '16px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all var(--transition-normal)',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-dark-blue)', marginBottom: '8px' }}>
                    {grupo.nombre}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>Cohorte:</strong> {grupo.cohorte}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>Cuatrimestre:</strong> {grupo.cuatrimestre}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>Alumnos:</strong> {grupo.total_alumnos}
                  </p>
                  <p style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>
                    <strong>Docente:</strong> {grupo.docente || 'Sin asignar'}
                  </p>
                  <button
                    onClick={() => handleViewGrupo(grupo.id_grupo)}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-primary-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {expandedGrupo === grupo.id_grupo ? 'Ocultar ▲' : 'Ver Detalle ▼'}
                  </button>
                </div>

                {/* Detalle expandido */}
                {expandedGrupo === grupo.id_grupo && grupoDetail && (
                  <div style={{
                    marginTop: '8px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f9f9f9',
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-dark-blue)' }}>
                      Lista de Alumnos ({grupoDetail.alumnos.length})
                    </h4>
                    {grupoDetail.alumnos.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#999' }}>Sin alumnos asignados</p>
                    ) : (
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {grupoDetail.alumnos.map((alumno: Alumno) => (
                          <div
                            key={alumno.id_alumno}
                            style={{
                              padding: '8px',
                              borderBottom: '1px solid #ddd',
                              fontSize: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              {alumno.nombre_completo} ({alumno.matricula})
                            </span>
                            <span style={{ fontSize: '11px', color: '#666' }}>
                              Promedio: {alumno.promedio_general?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal Crear Grupo */}
        {showCreateModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '32px',
                width: '90%',
                maxWidth: '400px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setShowCreateModal(false)}
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
                }}
              >
                ✕
              </button>

              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', paddingRight: '40px' }}>
                Crear Grupo con {selectedStudents.length} Alumno(s)
              </h2>
              <form onSubmit={handleCreateGrupo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'white', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Número del Grupo
                  </label>
                  <input
                    type="text"
                    value={newGrupo.nombre}
                    onChange={(e) => setNewGrupo({ ...newGrupo, nombre: e.target.value })}
                    required
                    placeholder="Ej: 1, 2, 3, 71"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white',
                      color: '#333',
                    }}
                  />
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                    Solo número del grupo. No agregar programa ni cuatrimestre.
                  </p>
                </div>

                <div>
                  <label style={{ color: 'white', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Cuatrimestre Actual
                  </label>
                  <select
                    value={newGrupo.id_cuatrimestre_grupo_fk}
                    onChange={(e) => setNewGrupo({ ...newGrupo, id_cuatrimestre_grupo_fk: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid var(--color-dark-blue)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      backgroundColor: 'white',
                      color: '#333',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {cuatrimestres.map((c) => (
                      <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>
                        Cuatrimestre {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    📋 Datos de Cohorte (Generación)
                  </h3>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Año de Ingreso
                    </label>
                    <input
                      type="number"
                      value={newGrupo.anio_ingreso}
                      onChange={(e) => setNewGrupo({ ...newGrupo, anio_ingreso: e.target.value })}
                      required
                      min="2020"
                      max="2030"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-dark-blue)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Cuatrimestre Inicial
                    </label>
                    <select
                      value={newGrupo.cuatrimestre_inicial}
                      onChange={(e) => setNewGrupo({ ...newGrupo, cuatrimestre_inicial: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-dark-blue)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {cuatrimestres.map((c) => (
                        <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>
                          Cuatrimestre {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Programa
                    </label>
                    <select
                      value={newGrupo.id_programa_cohorte_fk}
                      onChange={(e) => setNewGrupo({ ...newGrupo, id_programa_cohorte_fk: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-dark-blue)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {programas.map((p) => (
                        <option key={p.id_programa} value={p.id_programa}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '0' }}>
                    <label style={{ color: 'white', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Nivel Inicial
                    </label>
                    <select
                      value={newGrupo.id_nivel_inicial_fk}
                      onChange={(e) => setNewGrupo({ ...newGrupo, id_nivel_inicial_fk: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '2px solid var(--color-dark-blue)',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {niveles.map((n) => (
                        <option key={n.id_nivel} value={n.id_nivel}>
                          {n.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: 'var(--color-primary-green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuthProtection(GruposPage, 'administrador');
