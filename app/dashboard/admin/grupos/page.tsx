'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';
import FormModal from '@/app/components/FormModal';

interface Alumno { 
  id_alumno: number; 
  nombre_completo: string; 
  matricula: string; 
  promedio_general?: number;
  estado?: 'disponible' | 'asignado' | 'inactivo';
  grupo_actual?: string;
  programa_completo?: string;
}
interface Grupo { 
  id_grupo: number; 
  nombre: string; 
  cohorte: string; 
  cuatrimestre: string; 
  total_alumnos: number; 
  docente?: string;
  programa?: string;
}

function GruposPage() {
  const [activeMenu, setActiveMenu] = useState('groups');
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; message: string; type?: 'success' | 'error' | 'warning' | 'info'; onClose: () => void }>({ isOpen: false, message: '', onClose: () => {} });

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Alumno[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | 'disponible' | 'asignado' | 'inactivo'>('todos');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createExiting, setCreateExiting] = useState(false);
  const [confirmExiting, setConfirmExiting] = useState(false);

  const [cohortes, setCohortes] = useState<any[]>([]);
  const [cuatrimestres, setCuatrimestres] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [niveles, setNiveles] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);

  const [selectedGrupoForStudents, setSelectedGrupoForStudents] = useState<number | null>(null); // Reserved (not used in create flow now)
  const [selectedGrupoForTeacher, setSelectedGrupoForTeacher] = useState<number | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [expandedGrupo, setExpandedGrupo] = useState<number | null>(null);
  const [grupoDetail, setGrupoDetail] = useState<any | null>(null);

  const [newGrupo, setNewGrupo] = useState({
    nombre:'',
    id_cuatrimestre_grupo_fk:'',
    anio_ingreso:new Date().getFullYear().toString(),
    cuatrimestre_inicial:'1',
    id_programa_cohorte_fk:'',
    id_nivel_inicial_fk:'',
    en_practicas: '0'
  });

  const studentFields: any = [
    { name: 'nombre', label: 'Name(s)', type: 'text', required: true, placeholder: 'E.g.: Juan' },
    { name: 'primer_apellido', label: 'First Last Name', type: 'text', required: true, placeholder: 'E.g.: Pérez' },
    { name: 'segundo_apellido', label: 'Second Last Name', type: 'text', required: false, placeholder: 'Optional' },
    { name: 'matricula', label: 'Student ID', type: 'text', required: true, placeholder: 'E.g.: A12345' },
    { name: 'correo', label: 'Email', type: 'email', required: true, placeholder: 'email@example.com' },
    { name: 'contrasena', label: 'Password', type: 'password', required: true, autoFillFrom: 'matricula', placeholder: 'Auto = student ID', showInfo: true, infoMessage: 'Student must change their password in profile' }
  ];

  const loadGrupos = async () => {
    try {
      const res = await fetch('/api/grupos/list');
      const data = await res.json();
      if (data.success) setGrupos(data.data);
    } catch (e) {
      console.error('Error loading groups', e);
    }
  };

  const loadAlumnosDisponibles = async () => {
    try {
      const res = await fetch('/api/alumnos/available');
      const data = await res.json();
      if (data.success) setAlumnosDisponibles(data.data);
    } catch (e) {
      console.error('Error loading students', e);
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
      const cohorteData = await cohortesRes.json();
      const cuatrimestresData = await cuatrimestresRes.json();
      const docentesData = await docentesRes.json();
      const programasData = await programasRes.json();
      const nivelesData = await nivelesRes.json();
      if (cohorteData.success) setCohortes(cohorteData.data);
      if (cuatrimestresData.success) setCuatrimestres(cuatrimestresData.data);
      if (docentesData.success) setDocentes(docentesData.data);
      if (programasData.success) setProgramas(programasData.data);
      if (nivelesData.success) setNiveles(nivelesData.data);
    } catch (e) {
      console.error('Error loading catalogs', e);
    }
  };

  useEffect(() => {
    loadGrupos();
    loadAlumnosDisponibles();
    loadCatalogs();
  }, []);

  const handleCreateGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedStudents.length < 10) {
        setSuccessModal({
          isOpen: true,
          message: 'You need to select at least 10 students to create a group',
          type: 'warning',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }
      const etiqueta = `${newGrupo.anio_ingreso}-C${newGrupo.cuatrimestre_inicial}-${programas.find(p => p.id_programa == newGrupo.id_programa_cohorte_fk)?.codigo || 'PROG'}-${niveles.find(n => n.id_nivel == newGrupo.id_nivel_inicial_fk)?.codigo || 'NIV'}`;
      const cohorteRes = await fetch('/api/cohortes/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          anio_ingreso: parseInt(newGrupo.anio_ingreso),
          cuatrimestre_inicial: parseInt(newGrupo.cuatrimestre_inicial),
          id_programa_cohorte_fk: parseInt(newGrupo.id_programa_cohorte_fk),
          id_nivel_inicial_fk: parseInt(newGrupo.id_nivel_inicial_fk), etiqueta
        })
      });
      const cohorteData = await cohorteRes.json();
      let id_cohorte_grupo_fk: number | null = null;
      if (cohorteData.success) id_cohorte_grupo_fk = cohorteData.data.id_cohorte; else if (cohorteData.message?.includes('etiqueta')) {
        await loadCatalogs();
        const existente = cohortes.find(c => c.etiqueta === etiqueta);
        if (existente) id_cohorte_grupo_fk = existente.id_cohorte;
      }
      if (!id_cohorte_grupo_fk) { alert('Error creating cohort'); return; }
      const grupoRes = await fetch('/api/grupos/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre:newGrupo.nombre, id_cuatrimestre_grupo_fk:newGrupo.id_cuatrimestre_grupo_fk, id_cohorte_grupo_fk, en_practicas: parseInt(newGrupo.en_practicas || '0') }) });
      const grupoData = await grupoRes.json();
      if (!grupoData.success) { alert(grupoData.message||'Error creating group'); return; }
      const id_grupo = grupoData.data.id_grupo;
      if (selectedStudents.length > 0) {
        const assignRes = await fetch('/api/grupos/assign-students', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id_grupo, id_alumnos:selectedStudents, id_programa: parseInt(newGrupo.id_programa_cohorte_fk), id_nivel: parseInt(newGrupo.id_nivel_inicial_fk) }) });
        const assignData = await assignRes.json();
        if (!assignData.success) console.error('Assigning students', assignData.message);
      }
      setSuccessModal({ isOpen:true, message:'Group created successfully', type: 'success', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose:()=>{} }) });
      setShowCreateModal(false);
      setShowConfirmModal(false);
      setNewGrupo({ nombre:'', id_cuatrimestre_grupo_fk:'', anio_ingreso:new Date().getFullYear().toString(), cuatrimestre_inicial:'1', id_programa_cohorte_fk:'', id_nivel_inicial_fk:'', en_practicas: '0' });
      setSelectedStudents([]);
      loadGrupos();
      loadAlumnosDisponibles();
      loadCatalogs();
    } catch (e) {
      console.error('Error creating group', e);
      alert('Error creating group');
    }
  };

  const handleAddStudentModal = async (formData: Record<string,string>) => {
    try {
      const res = await fetch('/api/auth/register-student', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ nombre:formData.nombre, primer_apellido:formData.primer_apellido, segundo_apellido:formData.segundo_apellido, matricula:formData.matricula, correo:formData.correo, contrasena:formData.contrasena, rol:'alumno' }) });
      const data = await res.json();
      if (!res.ok) {
        setSuccessModal({ isOpen:true, message: data.error || 'Error registering student', type: 'error', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
        throw new Error(data.error || 'Error registering student');
      }
      await loadAlumnosDisponibles();
      const nuevoId = data.data?.id_alumno;
      if (nuevoId && !selectedStudents.includes(nuevoId)) setSelectedStudents(prev=>[...prev, nuevoId]);
      setSuccessModal({ isOpen:true, message:'Student registered successfully', type: 'success', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
      setShowStudentModal(false);
    } catch (e) {
      console.error('Error registering student', e);
      throw e;
    }
  };

  const handleAssignTeacher = async () => {
    if (!selectedGrupoForTeacher || !selectedTeacher) { 
      setSuccessModal({ isOpen:true, message:'Please select a group and teacher', type: 'warning', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
      return; 
    }
    try {
      const res = await fetch('/api/grupos/assign-teacher', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id_grupo:selectedGrupoForTeacher, id_docente:selectedTeacher }) });
      const data = await res.json();
      if (!data.success) { 
        setSuccessModal({ isOpen:true, message: data.message || 'Error assigning teacher', type: 'error', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
        return; 
      }
      setSuccessModal({ isOpen:true, message:'Teacher assigned successfully', type: 'success', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
      setSelectedGrupoForTeacher(null);
      setSelectedTeacher(null);
      loadGrupos();
    } catch (e) { 
      console.error('Error assigning teacher', e); 
      setSuccessModal({ isOpen:true, message:'Error assigning teacher', type: 'error', onClose: ()=> setSuccessModal({ isOpen:false, message:'', onClose: ()=>{} }) });
    }
  };

  const handleViewGrupo = async (id_grupo:number) => {
    if (expandedGrupo === id_grupo) { setExpandedGrupo(null); setGrupoDetail(null); return; }
    try {
      const res = await fetch(`/api/grupos/detail?id=${id_grupo}`);
      const data = await res.json();
      if (data.success) { setGrupoDetail(data.data); setExpandedGrupo(id_grupo); }
    } catch (e) { console.error('Group detail error', e); }
  };

  const toggleStudentSelection = (id_alumno:number, estado?: string) => {
    // Do not allow selecting already assigned or inactive students
    if (estado === 'asignado' || estado === 'inactivo') return;
    setSelectedStudents(prev => prev.includes(id_alumno) ? prev.filter(id=> id!== id_alumno) : [...prev, id_alumno]);
  };

  const filteredAlumnos = alumnosDisponibles.filter(a => {
    const term = searchTerm.toLowerCase();
    const matchSearch = a.matricula.toLowerCase().includes(term) || a.nombre_completo.toLowerCase().includes(term);
    const matchEstado = estadoFilter === 'todos' || a.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  const getEstadoColor = (estado?: string) => {
    switch(estado) {
      case 'disponible': return '#2ea853'; // Green
      case 'asignado': return '#f59e0b'; // Orange
      case 'inactivo': return '#ef4444'; // Red
      default: return '#2ea853';
    }
  };

  const getEstadoBgColor = (estado?: string, isSelected?: boolean) => {
    if (isSelected) return 'rgba(46,168,83,0.2)';
    switch(estado) {
      case 'disponible': return 'white';
      case 'asignado': return 'rgba(245,158,11,0.1)';
      case 'inactivo': return 'rgba(239,68,68,0.1)';
      default: return 'white';
    }
  };

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
          0% { opacity: 0; transform: translateY(12px) scale(0.96); }
          60% { opacity: 1; transform: translateY(0) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes llw-pop-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(8px) scale(0.94); }
        }
        @keyframes llw-confirm-bounce-in {
          0% { opacity: 0; transform: translateY(-20px) scale(0.9) rotate(1deg); }
          50% { opacity: 0.8; transform: translateY(5px) scale(1.05) rotate(-0.5deg); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
        }
        @keyframes llw-confirm-slide-out {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.95) rotate(1deg); }
        }
        .llw-modal-overlay-enter { animation: llw-fade-in 220ms ease-out forwards; }
        .llw-modal-overlay-exit { animation: llw-fade-out 220ms ease-in forwards; }
        .llw-modal-card-enter { animation: llw-pop-in 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards; will-change: transform, opacity; }
        .llw-modal-card-exit { animation: llw-pop-out 240ms ease-in forwards; will-change: transform, opacity; }
        .llw-confirm-overlay-enter { animation: llw-fade-in 200ms ease-out forwards; }
        .llw-confirm-overlay-exit { animation: llw-fade-out 200ms ease-in forwards; }
        .llw-confirm-card-enter { animation: llw-confirm-bounce-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .llw-confirm-card-exit { animation: llw-confirm-slide-out 220ms ease-in forwards; }
      `}</style>
      <DashboardLayout title="Groups Management" activeMenu={activeMenu} onMenuItemClick={setActiveMenu} roleType="administrador" successModal={successModal}>
        <div style={{ padding:'24px' }}>
          <div style={{ marginBottom:'24px' }}>
            <h1 style={{ fontSize:'28px', fontWeight:'bold', color:'var(--color-dark-blue)', margin:0 }}>Groups Management</h1>
          </div>
          <div style={{ display:'flex', gap:'24px', marginBottom:'24px', flexWrap:'wrap' }}>
            {/* Create Group */}
            <div style={{ flex:'1 1 45%', minWidth:'400px', border:'3px solid var(--color-dark-blue)', borderRadius:'12px', padding:'24px', backgroundColor:'white' }}>
              <h2 style={{ fontSize:'18px', fontWeight:600, color:'var(--color-dark-blue)', marginBottom:'16px' }}>Create Student Group</h2>
              
              {/* Status Legend */}
              <div style={{ marginBottom:'12px', padding:'12px', backgroundColor:'#f9fafb', borderRadius:'8px', border:'1px solid #e5e7eb' }}>
                <p style={{ fontSize:'12px', fontWeight:600, color:'#333', marginBottom:'8px' }}>Student Status:</p>
                <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', fontSize:'11px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'12px', height:'12px', borderRadius:'50%', backgroundColor:'#2ea853' }}></div>
                    <span>Available</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'12px', height:'12px', borderRadius:'50%', backgroundColor:'#f59e0b' }}></div>
                    <span>Already assigned</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'12px', height:'12px', borderRadius:'50%', backgroundColor:'#ef4444' }}></div>
                    <span>Inactive</span>
                  </div>
                </div>
              </div>

              <label style={{ fontSize:'14px', fontWeight:600, color:'#333', display:'block', marginBottom:'8px' }}>Select Students ({selectedStudents.length} selected)</label>
              
              {/* Search and filters */}
              <div style={{ display:'flex', gap:'8px', marginBottom:'8px', flexWrap:'wrap', alignItems:'center' }}>
                <input type="text" placeholder="Search by ID or name..." value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)} style={{ flex:'1 1 200px', padding:'8px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', outline:'none' }} />
                <select value={estadoFilter} onChange={(e)=> setEstadoFilter(e.target.value as any)} style={{ flex:'0 0 120px', padding:'8px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', outline:'none', cursor:'pointer', backgroundColor:'white' }}>
                  <option value="todos">All</option>
                  <option value="disponible">Available</option>
                  <option value="asignado">Assigned</option>
                  <option value="inactivo">Inactive</option>
                </select>
                <button type="button" onClick={()=> setShowStudentModal(true)} style={{ flex:'0 0 auto', padding:'10px 16px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', transition:'all 0.25s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 10px rgba(0,0,0,0.15)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}><span style={{ fontSize:'16px', lineHeight:'16px' }}>+</span> Add</button>
              </div>
              
              <div style={{ maxHeight:'250px', overflowY:'auto', border:'2px solid #ddd', borderRadius:'8px', padding:'8px', backgroundColor:'#fafafa' }}>
                {filteredAlumnos.length === 0 ? <p style={{ fontSize:'12px', color:'#666', margin:0 }}>No students in this filter</p> : filteredAlumnos.map(a => {
                  const isSelected = selectedStudents.includes(a.id_alumno);
                  const borderColor = isSelected ? '#2ea853' : getEstadoColor(a.estado);
                  const isDisabled = a.estado === 'asignado' || a.estado === 'inactivo';
                  return (
                    <div 
                      key={a.id_alumno} 
                      onClick={()=> toggleStudentSelection(a.id_alumno, a.estado)} 
                      style={{ 
                        padding:'10px', 
                        borderRadius:'6px', 
                        marginBottom:'6px', 
                        cursor: isDisabled ? 'not-allowed' : 'pointer', 
                        backgroundColor: isSelected ? 'var(--color-primary-green)' : 'white',
                        color: isSelected ? 'white' : '#333', 
                        border:`2px solid ${borderColor}`, 
                        fontSize:'12px', 
                        transition:'background-color 0.2s',
                        opacity: isDisabled ? 0.6 : 1
                      }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: a.programa_completo && a.programa_completo !== 'Not assigned' ? '4px' : '0' }}>
                        <span style={{ fontWeight:500 }}>{a.nombre_completo} ({a.matricula})</span>
                        {isSelected && <span style={{ fontWeight:600, fontSize:'16px' }}>✓</span>}
                      </div>
                      {a.programa_completo && a.programa_completo !== 'Not assigned' && (
                        <div style={{ fontSize:'10px', fontWeight:600, color: isSelected ? 'rgba(255,255,255,0.9)' : '#2ea853', backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'rgba(46,168,83,0.1)', padding:'3px 8px', borderRadius:'4px', display:'inline-block' }}>
                          📚 {a.programa_completo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize:'11px', color:'#666', marginTop:'8px' }}>Select minimum 10 students to create a group.</p>
              <button
                type="button"
                onClick={()=> {
                  if (selectedStudents.length < 10) {
                    setSuccessModal({
                      isOpen: true,
                      message: 'You need to select at least 10 students to create a group',
                      type: 'warning',
                      onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
                    });
                    return;
                  }
                  setShowCreateModal(true);
                }}
                style={{
                  marginTop:'12px',
                  width:'100%',
                  padding:'12px',
                  backgroundColor: 'var(--color-dark-blue)',
                  color:'white',
                  border:'none',
                  borderRadius:'8px',
                  fontSize:'14px',
                  fontWeight:600,
                  cursor: 'pointer',
                  transition:'all 0.25s'
                }}
                onMouseEnter={(e)=> {
                  e.currentTarget.style.transform='translateY(-2px)';
                  e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e)=> {
                  e.currentTarget.style.transform='translateY(0)';
                  e.currentTarget.style.boxShadow='none';
                }}
              >Create Group</button>
            </div>
            {/* Assign Teacher */}
            <div style={{ flex:'1 1 45%', minWidth:'400px', border:'3px solid var(--color-dark-blue)', borderRadius:'12px', padding:'24px', backgroundColor:'white' }}>
              <h2 style={{ fontSize:'18px', fontWeight:600, color:'var(--color-dark-blue)', marginBottom:'16px' }}>Assign Teacher to Group</h2>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'14px', fontWeight:600, color:'#333', display:'block', marginBottom:'8px' }}>Group</label>
                <select value={selectedGrupoForTeacher || ''} onChange={(e)=> setSelectedGrupoForTeacher(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #ddd', fontSize:'14px' }}>
                  <option value=''>Select group...</option>
                  {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.cuatrimestre}{g.nombre} - {g.programa || 'No program'}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'16px' }}>
                <label style={{ fontSize:'14px', fontWeight:600, color:'#333', display:'block', marginBottom:'8px' }}>Teacher</label>
                <select value={selectedTeacher || ''} onChange={(e)=> setSelectedTeacher(Number(e.target.value))} style={{ width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #ddd', fontSize:'14px' }}>
                  <option value=''>Select teacher...</option>
                  {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombre_completo} ({d.matricula})</option>)}
                </select>
              </div>
              <button onClick={handleAssignTeacher} style={{ padding:'12px 24px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer', width:'100%', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.3)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>Assign Teacher</button>
            </div>
          </div>
          {/* Existing Groups */}
          <div style={{ border:'3px solid var(--color-dark-blue)', borderRadius:'12px', padding:'24px', backgroundColor:'white' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h2 style={{ fontSize:'18px', fontWeight:600, color:'var(--color-dark-blue)', margin:0 }}>Existing Groups</h2>
              <div style={{ padding:'10px 20px', backgroundColor:'var(--color-primary-green)', color:'white', borderRadius:'10px', fontSize:'15px', fontWeight:700, boxShadow:'0 3px 10px rgba(46,168,83,0.3)' }}>
                Total: {grupos.length} {grupos.length === 1 ? 'Group' : 'Groups'}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'16px' }}>
              {grupos.map(grupo => (
                <div key={grupo.id_grupo}>
                  <div style={{ border:'2px solid var(--color-dark-blue)', borderRadius:'10px', padding:'16px', backgroundColor:'white', cursor:'pointer', transition:'all 0.3s' }} onMouseOver={(e)=> e.currentTarget.style.transform='translateY(-4px)'} onMouseOut={(e)=> e.currentTarget.style.transform='translateY(0)'}>
                    <h3 style={{ fontSize:'18px', fontWeight:700, color:'var(--color-dark-blue)', marginBottom:'4px' }}>{grupo.cuatrimestre}{grupo.nombre}</h3>
                    <div style={{ padding:'8px 12px', backgroundColor:'rgba(46,168,83,0.1)', borderRadius:'8px', marginBottom:'12px', border:'2px solid var(--color-primary-green)' }}>
                      <p style={{ fontSize:'14px', fontWeight:700, color:'var(--color-primary-green)', margin:0 }}>📚 {grupo.programa || 'No program assigned'}</p>
                    </div>
                    <p style={{ fontSize:'12px', color:'#888', margin:'4px 0', fontStyle:'italic' }}>Cohort: {grupo.cohorte}</p>
                    <p style={{ fontSize:'13px', color:'#666', margin:'4px 0' }}><strong>Students:</strong> {grupo.total_alumnos}</p>
                    <p style={{ fontSize:'13px', color:'#666', margin:'4px 0' }}><strong>Teacher:</strong> {grupo.docente || 'Not assigned'}</p>
                    <button onClick={()=> handleViewGrupo(grupo.id_grupo)} style={{ marginTop:'12px', padding:'8px 16px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'6px', fontSize:'13px', fontWeight:600, cursor:'pointer', width:'100%' }}>{expandedGrupo === grupo.id_grupo ? 'Hide ▲' : 'View Details ▼'}</button>
                  </div>
                  {expandedGrupo === grupo.id_grupo && grupoDetail && (
                    <div style={{ marginTop:'8px', border:'2px solid #e0e0e0', borderRadius:'8px', padding:'16px', backgroundColor:'#f9f9f9' }}>
                      <h4 style={{ fontSize:'14px', fontWeight:600, marginBottom:'12px', color:'var(--color-dark-blue)' }}>Student List ({grupoDetail.alumnos.length})</h4>
                      {grupoDetail.alumnos.length === 0 ? <p style={{ fontSize:'13px', color:'#999' }}>No assigned students</p> : (
                        <div style={{ maxHeight:'200px', overflowY:'auto' }}>
                          {grupoDetail.alumnos.map((alumno:any)=> (
                            <div key={alumno.id_alumno} style={{ padding:'8px', borderBottom:'1px solid #ddd', fontSize:'12px', display:'flex', justifyContent:'space-between' }}>
                              <span>{alumno.nombre_completo} ({alumno.matricula})</span>
                              <span style={{ fontSize:'11px', color:'#666' }}>Average: {alumno.promedio_general ? Number(alumno.promedio_general).toFixed(2) : 'N/A'}</span>
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
        </div>
      </DashboardLayout>
      
      {/* Create Group Modal */}
      {showCreateModal && (
        <div className={`llw-modal-overlay ${createExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={()=> {
          setCreateExiting(true);
          setTimeout(()=>{ setShowCreateModal(false); setCreateExiting(false); }, 260);
        }}>
          <div className={`llw-modal-card ${createExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'90%', maxWidth:'400px', maxHeight:'90vh', overflowY:'auto', position:'relative' }} onClick={(e)=> e.stopPropagation()}>
            <button onClick={()=> { setCreateExiting(true); setTimeout(()=>{ setShowCreateModal(false); setCreateExiting(false); }, 240); }} style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#ff3b3b', border:'none', color:'white', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }} onMouseDown={(e)=> { e.currentTarget.style.transform='scale(0.9)'; }} onMouseUp={(e)=> { e.currentTarget.style.transform='scale(1.05)'; }}>✕</button>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'24px', paddingRight:'40px' }}>Group Details</h2>
            <form onSubmit={handleCreateGrupo} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ color:'white', fontSize:'13px', fontWeight:600, display:'block', marginBottom:'8px' }}>Group Number</label>
                <input type='text' value={newGrupo.nombre} onChange={(e)=> setNewGrupo({ ...newGrupo, nombre:e.target.value })} required placeholder='E.g.: 1' style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'2px solid var(--color-dark-blue)', fontSize:'14px', backgroundColor:'white', color:'#333' }} />
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'4px' }}>Only group number. Do not add program or semester.</p>
              </div>
              <div>
                <label style={{ color:'white', fontSize:'13px', fontWeight:600, display:'block', marginBottom:'8px' }}>Current Semester</label>
                <select value={newGrupo.id_cuatrimestre_grupo_fk} onChange={(e)=> setNewGrupo({ ...newGrupo, id_cuatrimestre_grupo_fk:e.target.value })} required style={{ width:'100%', padding:'12px 16px', borderRadius:'12px', border:'2px solid var(--color-dark-blue)', fontSize:'14px', backgroundColor:'white', color:'#333', cursor:'pointer' }}>
                  <option value=''>Select...</option>
                  {cuatrimestres.map(c=> <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>Semester {c.nombre}</option>)}
                </select>
              </div>
              <div style={{ padding:'16px', backgroundColor:'rgba(46,168,83,0.15)', borderRadius:'12px', border:'1px solid rgba(46,168,83,0.3)' }}>
                <label style={{ color:'white', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' }}>
                  <input 
                    type='checkbox' 
                    checked={newGrupo.en_practicas === '1' || false} 
                    onChange={(e)=> setNewGrupo({ ...newGrupo, en_practicas: e.target.checked ? '1' : '0' })} 
                    style={{ width:'18px', height:'18px', cursor:'pointer', accentColor:'var(--color-primary-green)' }}
                  />
                  <span>Students are in Internship</span>
                </label>
                <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'6px', margin:'6px 0 0 26px' }}>Check if all students in this group are currently doing an internship</p>
              </div>
              <div style={{ padding:'16px', backgroundColor:'rgba(255,255,255,0.1)', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.2)' }}>
                <h3 style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'12px' }}>📋 Cohort Data (Generation)</h3>
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ color:'white', fontSize:'12px', fontWeight:600, display:'block', marginBottom:'6px' }}>Entry Year</label>
                  <input type='number' value={newGrupo.anio_ingreso} onChange={(e)=> setNewGrupo({ ...newGrupo, anio_ingreso:e.target.value })} required min={2020} max={2035} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', backgroundColor:'white', color:'#333' }} />
                </div>
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ color:'white', fontSize:'12px', fontWeight:600, display:'block', marginBottom:'6px' }}>Initial Semester (Default: 1)</label>
                  <select value={newGrupo.cuatrimestre_inicial || '1'} onChange={(e)=> setNewGrupo({ ...newGrupo, cuatrimestre_inicial:e.target.value })} required disabled style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', backgroundColor:'#e5e7eb', color:'#6b7280', cursor:'not-allowed' }}>
                    <option value='1'>Semester 1</option>
                  </select>
                  <p style={{ fontSize:'10px', color:'rgba(255,255,255,0.6)', marginTop:'4px' }}>Groups always start in semester 1</p>
                </div>
                <div style={{ marginBottom:'12px' }}>
                  <label style={{ color:'white', fontSize:'12px', fontWeight:600, display:'block', marginBottom:'6px' }}>Program</label>
                  <select value={newGrupo.id_programa_cohorte_fk} onChange={(e)=> setNewGrupo({ ...newGrupo, id_programa_cohorte_fk:e.target.value })} required style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', backgroundColor:'white', color:'#333', cursor:'pointer' }}>
                    <option value=''>Select...</option>
                    {programas.map(p=> <option key={p.id_programa} value={p.id_programa}>{p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color:'white', fontSize:'12px', fontWeight:600, display:'block', marginBottom:'6px' }}>Initial Level</label>
                  <select value={newGrupo.id_nivel_inicial_fk} onChange={(e)=> setNewGrupo({ ...newGrupo, id_nivel_inicial_fk:e.target.value })} required style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'2px solid var(--color-dark-blue)', fontSize:'13px', backgroundColor:'white', color:'#333', cursor:'pointer' }}>
                    <option value=''>Select...</option>
                    {niveles.map(n=> <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:'flex', gap:'12px' }}>
                <button type='button' onClick={()=> { setCreateExiting(true); setTimeout(()=>{ setShowCreateModal(false); setCreateExiting(false); }, 260); }} style={{ flex:1, padding:'12px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'12px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <button type='button' onClick={()=> { setCreateExiting(true); setTimeout(()=>{ setShowCreateModal(false); setCreateExiting(false); setShowConfirmModal(true); }, 260); }} style={{ flex:1, padding:'12px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Next</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className={`llw-confirm-overlay ${confirmExiting ? 'llw-confirm-overlay-exit' : 'llw-confirm-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }} onClick={()=> { setConfirmExiting(true); setTimeout(()=>{ setShowConfirmModal(false); setConfirmExiting(false); }, 220); }}>
          <div className={`llw-confirm-card ${confirmExiting ? 'llw-confirm-card-exit' : 'llw-confirm-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'90%', maxWidth:'500px', maxHeight:'80vh', overflowY:'auto' }} onClick={(e)=> e.stopPropagation()}>
            <h2 style={{ color:'white', fontSize:'22px', fontWeight:'bold', marginBottom:'16px', textAlign:'center' }}>⚠️ Confirm Group Creation</h2>
            <div style={{ backgroundColor:'rgba(255,255,255,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
              <h3 style={{ color:'white', fontSize:'16px', fontWeight:600, marginBottom:'12px' }}>📊 Summary:</h3>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Group Number:</strong> {newGrupo.nombre}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Current Semester:</strong> {cuatrimestres.find(c => c.id_cuatrimestre == newGrupo.id_cuatrimestre_grupo_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Entry Year:</strong> {newGrupo.anio_ingreso}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Initial Semester:</strong> 1</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Program:</strong> {programas.find(p => p.id_programa == newGrupo.id_programa_cohorte_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Initial Level:</strong> {niveles.find(n => n.id_nivel == newGrupo.id_nivel_inicial_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Total Students:</strong> {selectedStudents.length}</p>
              <div style={{ marginTop:'16px' }}>
                <h4 style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'8px' }}>👥 Selected Students:</h4>
                <div style={{ maxHeight:'200px', overflowY:'auto', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'12px' }}>
                  {alumnosDisponibles.filter(a => selectedStudents.includes(a.id_alumno)).map((alumno, idx) => (
                    <div key={alumno.id_alumno} style={{ padding:'8px', borderBottom: idx < selectedStudents.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', fontSize:'13px', color:'white' }}>
                      <div style={{ fontWeight:600 }}>{alumno.nombre_completo}</div>
                      <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.7)' }}>
                        ID: {alumno.matricula}
                        {alumno.programa_completo && alumno.programa_completo !== 'Not assigned' && <span> • {alumno.programa_completo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'14px', marginBottom:'20px', textAlign:'center', lineHeight:'1.6' }}>
              Are you sure you want to create a group with these {selectedStudents.length} students?
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> { setConfirmExiting(true); setTimeout(()=>{ setShowConfirmModal(false); setConfirmExiting(false); setShowCreateModal(true); }, 240); }} style={{ flex:1, padding:'14px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> e.currentTarget.style.backgroundColor='rgba(255,255,255,0.3)'} onMouseLeave={(e)=> e.currentTarget.style.backgroundColor='rgba(255,255,255,0.2)'}>
                ← Back
              </button>
              <button onClick={(e)=> { e.preventDefault(); handleCreateGrupo(e as any); }} style={{ flex:1, padding:'14px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(46,168,83,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                ✅ Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      {showStudentModal && (
        <FormModal isOpen={showStudentModal} onClose={()=> setShowStudentModal(false)} title="Add Student" fields={studentFields} onSubmit={handleAddStudentModal} submitButtonLabel="Add" />
      )}
    </>
  );
}

export default withAuthProtection(GruposPage, 'administrador');
