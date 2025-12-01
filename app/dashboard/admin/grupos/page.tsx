'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';
import FormModal from '@/app/components/FormModal';
import * as XLSX from 'xlsx';
import { 
  ProgressByGameTypeChart, 
  ScoreDistributionChart, 
  MonthlyProgressChart,
  TimePerformanceChart,
  WeeklyProgressChart
} from '@/app/components/StatsCharts';

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
  const [grupoDetail, setGrupoDetail] = useState<any>(null);
  
  // New modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailExiting, setDetailExiting] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentExiting, setAddStudentExiting] = useState(false);
  const [selectedGrupoForAddStudent, setSelectedGrupoForAddStudent] = useState<number|null>(null);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<number|null>(null);
  const [showConfirmAssignTeacher, setShowConfirmAssignTeacher] = useState(false);
  const [confirmAssignTeacherExiting, setConfirmAssignTeacherExiting] = useState(false);
  const [showConfirmRemoveStudent, setShowConfirmRemoveStudent] = useState(false);
  const [confirmRemoveStudentExiting, setConfirmRemoveStudentExiting] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{id_alumno: number, id_grupo: number, nombre: string} | null>(null);
  const [showConfirmAddStudent, setShowConfirmAddStudent] = useState(false);
  const [confirmAddStudentExiting, setConfirmAddStudentExiting] = useState(false);
  const [showGroupStatsModal, setShowGroupStatsModal] = useState(false);
  const [groupStatsExiting, setGroupStatsExiting] = useState(false);
  const [selectedGroupStats, setSelectedGroupStats] = useState<any>(null);
  const [loadingGroupStats, setLoadingGroupStats] = useState(false);

  // Bulk upload states
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadExiting, setBulkUploadExiting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewExiting, setPreviewExiting] = useState(false);
  const [excelRowsToUpload, setExcelRowsToUpload] = useState<any[]>([]);

  // Delete states (TESTING ONLY)
  const [showConfirmDeleteGroup, setShowConfirmDeleteGroup] = useState(false);
  const [confirmDeleteGroupExiting, setConfirmDeleteGroupExiting] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{id_grupo: number, nombre: string} | null>(null);

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
    try {
      const res = await fetch(`/api/grupos/detail?id=${id_grupo}`);
      const data = await res.json();
      if (data.success) { 
        setGrupoDetail(data.data); 
        setExpandedGrupo(id_grupo);
        setShowDetailModal(true);
      }
    } catch (e) { console.error('Group detail error', e); }
  };

  const handleAssignTeacherClick = () => {
    if (!selectedGrupoForTeacher || !selectedTeacher) {
      setSuccessModal({
        isOpen: true,
        message: 'Please select both a group and a teacher',
        type: 'warning',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      return;
    }
    setShowConfirmAssignTeacher(true);
  };

  const confirmAssignTeacherAction = async () => {
    setConfirmAssignTeacherExiting(true);
    setTimeout(() => {
      setShowConfirmAssignTeacher(false);
      setConfirmAssignTeacherExiting(false);
    }, 220);
    await handleAssignTeacher();
  };

  const handleAddStudentToGrupoClick = (id_grupo: number) => {
    setSelectedGrupoForAddStudent(id_grupo);
    setSelectedStudentToAdd(null);
    setShowAddStudentModal(true);
  };

  const handleAddStudentConfirm = () => {
    if (!selectedStudentToAdd || !selectedGrupoForAddStudent) return;
    setShowAddStudentModal(false);
    setAddStudentExiting(false);
    setShowConfirmAddStudent(true);
  };

  const confirmAddStudentAction = async () => {
    setConfirmAddStudentExiting(true);
    setTimeout(() => {
      setShowConfirmAddStudent(false);
      setConfirmAddStudentExiting(false);
    }, 220);

    try {
      const res = await fetch('/api/grupos/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_grupo: selectedGrupoForAddStudent, id_alumno: selectedStudentToAdd })
      });
      const data = await res.json();
      if (!data.success) {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error: Unable to add student to group',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }
      setSuccessModal({
        isOpen: true,
        message: 'Student successfully added to group',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setSelectedGrupoForAddStudent(null);
      setSelectedStudentToAdd(null);
      loadGrupos();
      loadAlumnosDisponibles();
      if (expandedGrupo === selectedGrupoForAddStudent && selectedGrupoForAddStudent !== null) {
        handleViewGrupo(selectedGrupoForAddStudent);
      }
    } catch (e) {
      console.error('Error adding student', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error: Unable to add student to group',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    }
  };

  const handleRemoveStudentClick = (id_alumno: number, id_grupo: number, nombre: string) => {
    setStudentToRemove({ id_alumno, id_grupo, nombre });
    setShowConfirmRemoveStudent(true);
  };

  const confirmRemoveStudentAction = async () => {
    if (!studentToRemove) return;
    setConfirmRemoveStudentExiting(true);
    setTimeout(() => {
      setShowConfirmRemoveStudent(false);
      setConfirmRemoveStudentExiting(false);
    }, 220);

    try {
      const res = await fetch('/api/grupos/remove-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_grupo: studentToRemove.id_grupo, id_alumno: studentToRemove.id_alumno })
      });
      const data = await res.json();
      if (!data.success) {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error: Unable to remove student from group',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }
      setSuccessModal({
        isOpen: true,
        message: 'Student successfully removed from group',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setStudentToRemove(null);
      loadGrupos();
      loadAlumnosDisponibles();
      if (expandedGrupo === studentToRemove.id_grupo) {
        handleViewGrupo(studentToRemove.id_grupo);
      }
    } catch (e) {
      console.error('Error removing student', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error: Unable to remove student from group',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    }
  };

  const handleViewGroupStatistics = async (id_grupo: number) => {
    setLoadingGroupStats(true);
    setShowGroupStatsModal(true);
    try {
      const res = await fetch(`/api/grupos/statistics?id=${id_grupo}`);
      const data = await res.json();
      if (data.success) {
        setSelectedGroupStats(data.data);
      } else {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error loading group statistics',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        setShowGroupStatsModal(false);
      }
    } catch (e) {
      console.error('Error loading group statistics', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error loading group statistics',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setShowGroupStatsModal(false);
    } finally {
      setLoadingGroupStats(false);
    }
  };

  const handleViewStudentFromGroup = (id_alumno: number) => {
    // Redirect to students page with student ID
    window.location.href = `/dashboard/admin/alumnos?student=${id_alumno}`;
  };

  const toggleStudentSelection = (id_alumno:number, estado?: string) => {
    // Do not allow selecting already assigned or inactive students
    if (estado === 'asignado' || estado === 'inactivo') return;
    setSelectedStudents(prev => prev.includes(id_alumno) ? prev.filter(id=> id!== id_alumno) : [...prev, id_alumno]);
  };

  // TESTING ONLY - Delete group function
  const handleDeleteGroupClick = (id_grupo: number, nombre: string) => {
    setGroupToDelete({ id_grupo, nombre });
    setShowConfirmDeleteGroup(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    setConfirmDeleteGroupExiting(true);
    setTimeout(() => {
      setShowConfirmDeleteGroup(false);
      setConfirmDeleteGroupExiting(false);
    }, 220);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/grupos/delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_grupo: groupToDelete.id_grupo })
      });
      const data = await res.json();
      
      if (!data.success) {
        setSuccessModal({
          isOpen: true,
          message: data.message || 'Error al eliminar grupo',
          type: 'error',
          onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
        });
        return;
      }
      
      setSuccessModal({
        isOpen: true,
        message: 'Grupo eliminado exitosamente',
        type: 'success',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
      setGroupToDelete(null);
      loadGrupos();
      loadAlumnosDisponibles();
      
    } catch (e) {
      console.error('Error deleting group', e);
      setSuccessModal({
        isOpen: true,
        message: 'Error al eliminar grupo',
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    }
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

  // Bulk upload functions
  const openBulkUploadModal = () => {
    setUploadResults(null);
    setShowBulkUploadModal(true);
  };

  const closeBulkUploadModal = () => {
    setBulkUploadExiting(true);
    setTimeout(() => {
      setShowBulkUploadModal(false);
      setBulkUploadExiting(false);
      setUploadResults(null);
    }, 250);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setUploadResults(null);
      setPreviewData(null);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Mapear los datos del Excel al formato esperado (una fila = un alumno)
      const rows = jsonData.map((row: any) => ({
        grupo_numero: row['Número de Grupo']?.toString() || row['grupo_numero']?.toString() || '',
        cuatrimestre: row['Cuatrimestre'] || row['cuatrimestre'] || '',
        programa_codigo: row['Código Programa'] || row['programa_codigo'] || '',
        nivel_codigo: row['Código Nivel'] || row['nivel_codigo'] || '',
        anio_ingreso: row['Año Ingreso'] || row['anio_ingreso'] || new Date().getFullYear(),
        cuatrimestre_inicial: row['Cuatrimestre Inicial'] || row['cuatrimestre_inicial'] || 1,
        estado_practicas: row['Estado Prácticas'] || row['estado_practicas'] || 'NO',
        
        // Datos docente
        matricula_docente: row['Matrícula Docente'] || row['matricula_docente'] || '',
        nombre_docente: row['Nombre Docente'] || row['nombre_docente'] || '',
        primer_apellido_docente: row['Primer Apellido Docente'] || row['primer_apellido_docente'] || '',
        segundo_apellido_docente: row['Segundo Apellido Docente'] || row['segundo_apellido_docente'] || '',
        correo_docente: row['Correo Docente'] || row['correo_docente'] || '',
        
        // Datos de UN alumno por fila
        matricula_alumno: row['Matrícula Alumno'] || row['matricula_alumno'] || '',
        nombre_alumno: row['Nombre Alumno'] || row['nombre_alumno'] || '',
        primer_apellido_alumno: row['Primer Apellido Alumno'] || row['primer_apellido_alumno'] || '',
        segundo_apellido_alumno: row['Segundo Apellido Alumno'] || row['segundo_apellido_alumno'] || '',
        correo_alumno: row['Correo Alumno'] || row['correo_alumno'] || ''
      }));

      // Guardar rows para después
      setExcelRowsToUpload(rows);

      // Primero obtener previsualización
      const token = localStorage.getItem('token');
      const previewResponse = await fetch('/api/grupos/preview-bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rows })
      });

      const previewResult = await previewResponse.json();
      
      if (previewResult.success) {
        setPreviewData(previewResult.preview);
        setShowPreviewModal(true);
        setPreviewExiting(false);
      } else {
        throw new Error(previewResult.message || 'Error al generar previsualización');
      }

    } catch (error: any) {
      setSuccessModal({
        isOpen: true,
        message: `Error al procesar el archivo: ${error.message}`,
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    } finally {
      setUploadingFile(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const confirmBulkUpload = async () => {
    if (!excelRowsToUpload || excelRowsToUpload.length === 0) return;

    try {
      setUploadingFile(true);
      
      // Cerrar modal de preview
      setPreviewExiting(true);
      setTimeout(() => {
        setShowPreviewModal(false);
        setPreviewExiting(false);
      }, 300);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/grupos/bulk-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rows: excelRowsToUpload })
      });

      const result = await response.json();
      setUploadResults(result);

      if (result.success && result.data?.gruposCreados > 0) {
        loadGrupos();
        loadAlumnosDisponibles();
      }

    } catch (error: any) {
      setSuccessModal({
        isOpen: true,
        message: `Error al crear grupos: ${error.message}`,
        type: 'error',
        onClose: () => setSuccessModal({ isOpen: false, message: '', onClose: () => {} })
      });
    } finally {
      setUploadingFile(false);
      setExcelRowsToUpload([]);
    }
  };

  const downloadExcelTemplate = () => {
    // Datos de ejemplo - Una fila por alumno
    const template = [
      // Grupo 1 - Alumno 1
      {
        'Número de Grupo': '1',
        'Cuatrimestre': '1',
        'Código Programa': 'TIC',
        'Código Nivel': 'TSU',
        'Año Ingreso': 2025,
        'Cuatrimestre Inicial': 1,
        'Estado Prácticas': 'NO',
        'Matrícula Docente': 'D001',
        'Nombre Docente': 'Juan',
        'Primer Apellido Docente': 'Pérez',
        'Segundo Apellido Docente': 'García',
        'Correo Docente': 'juan.perez@example.com',
        'Matrícula Alumno': 'A001',
        'Nombre Alumno': 'María',
        'Primer Apellido Alumno': 'López',
        'Segundo Apellido Alumno': 'Martínez',
        'Correo Alumno': 'maria.lopez@example.com'
      },
      // Grupo 1 - Alumno 2 (mismos datos de grupo y docente)
      {
        'Número de Grupo': '1',
        'Cuatrimestre': '1',
        'Código Programa': 'TIC',
        'Código Nivel': 'TSU',
        'Año Ingreso': 2025,
        'Cuatrimestre Inicial': 1,
        'Estado Prácticas': 'NO',
        'Matrícula Docente': 'D001',
        'Nombre Docente': 'Juan',
        'Primer Apellido Docente': 'Pérez',
        'Segundo Apellido Docente': 'García',
        'Correo Docente': 'juan.perez@example.com',
        'Matrícula Alumno': 'A002',
        'Nombre Alumno': 'Pedro',
        'Primer Apellido Alumno': 'Ramírez',
        'Segundo Apellido Alumno': 'Torres',
        'Correo Alumno': 'pedro.ramirez@example.com'
      },
      // Grupo 1 - Alumno 3
      {
        'Número de Grupo': '1',
        'Cuatrimestre': '1',
        'Código Programa': 'TIC',
        'Código Nivel': 'TSU',
        'Año Ingreso': 2025,
        'Cuatrimestre Inicial': 1,
        'Estado Prácticas': 'NO',
        'Matrícula Docente': 'D001',
        'Nombre Docente': 'Juan',
        'Primer Apellido Docente': 'Pérez',
        'Segundo Apellido Docente': 'García',
        'Correo Docente': 'juan.perez@example.com',
        'Matrícula Alumno': 'A003',
        'Nombre Alumno': 'Ana',
        'Primer Apellido Alumno': 'González',
        'Segundo Apellido Alumno': 'Sánchez',
        'Correo Alumno': 'ana.gonzalez@example.com'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    
    // Crear hoja de catálogos
    const catalogos = [
      {
        'CUATRIMESTRES': '1',
        'CÓDIGOS PROGRAMA': 'TIC',
        'NOMBRE PROGRAMA': 'Tecnologías de la Información e Innovación Digital',
        'CÓDIGOS NIVEL': 'TSU',
        'ESTADO PRÁCTICAS': 'SI'
      },
      {
        'CUATRIMESTRES': '2',
        'CÓDIGOS PROGRAMA': 'NyM',
        'NOMBRE PROGRAMA': 'Negocios y Mercadotecnia',
        'CÓDIGOS NIVEL': 'ING/LIC',
        'ESTADO PRÁCTICAS': 'NO'
      },
      {
        'CUATRIMESTRES': '3',
        'CÓDIGOS PROGRAMA': 'CON',
        'NOMBRE PROGRAMA': 'Contaduría',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '4',
        'CÓDIGOS PROGRAMA': 'TF',
        'NOMBRE PROGRAMA': 'Terapia Física',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '5',
        'CÓDIGOS PROGRAMA': 'TFR',
        'NOMBRE PROGRAMA': 'Terapia Física Área Rehabilitación',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '6',
        'CÓDIGOS PROGRAMA': 'CyCF',
        'NOMBRE PROGRAMA': 'Criminalística y Ciencias Forenses',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '7',
        'CÓDIGOS PROGRAMA': 'CRI',
        'NOMBRE PROGRAMA': 'Criminalística',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '8',
        'CÓDIGOS PROGRAMA': 'DDyPA',
        'NOMBRE PROGRAMA': 'Diseño Digital y Producción Audiovisual',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '9',
        'CÓDIGOS PROGRAMA': 'EyDS',
        'NOMBRE PROGRAMA': 'Energía y Desarrollo Sostenible',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '10',
        'CÓDIGOS PROGRAMA': 'ENF',
        'NOMBRE PROGRAMA': 'Enfermería',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '11',
        'CÓDIGOS PROGRAMA': 'IND',
        'NOMBRE PROGRAMA': 'Industrial',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '12',
        'CÓDIGOS PROGRAMA': 'MEC',
        'NOMBRE PROGRAMA': 'Mecatrónica',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '',
        'CÓDIGOS PROGRAMA': 'MCyP',
        'NOMBRE PROGRAMA': 'Médico Cirujano y Partero',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '',
        'CÓDIGOS PROGRAMA': 'NAN',
        'NOMBRE PROGRAMA': 'Nanotecnología',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '',
        'CÓDIGOS PROGRAMA': 'SRyP',
        'NOMBRE PROGRAMA': 'Salud Reproductiva y Partería',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      },
      {
        'CUATRIMESTRES': '',
        'CÓDIGOS PROGRAMA': 'AyS',
        'NOMBRE PROGRAMA': 'Ambiental y Sustentabilidad',
        'CÓDIGOS NIVEL': '',
        'ESTADO PRÁCTICAS': ''
      }
    ];

    const wsCatalogos = XLSX.utils.json_to_sheet(catalogos);
    
    // Ajustar anchos de columna para la hoja principal
    ws['!cols'] = [
      { wch: 18 }, // Número de Grupo
      { wch: 14 }, // Cuatrimestre
      { wch: 16 }, // Código Programa
      { wch: 14 }, // Código Nivel
      { wch: 12 }, // Año Ingreso
      { wch: 18 }, // Cuatrimestre Inicial
      { wch: 16 }, // Estado Prácticas
      { wch: 18 }, // Matrícula Docente
      { wch: 18 }, // Nombre Docente
      { wch: 25 }, // Primer Apellido Docente
      { wch: 25 }, // Segundo Apellido Docente
      { wch: 30 }, // Correo Docente
      { wch: 18 }, // Matrícula Alumno
      { wch: 18 }, // Nombre Alumno
      { wch: 25 }, // Primer Apellido Alumno
      { wch: 25 }, // Segundo Apellido Alumno
      { wch: 30 }  // Correo Alumno
    ];

    // Ajustar anchos para hoja de catálogos
    wsCatalogos['!cols'] = [
      { wch: 16 },
      { wch: 18 },
      { wch: 50 },
      { wch: 16 },
      { wch: 18 }
    ];

    // Agregar ambas hojas
    XLSX.utils.book_append_sheet(wb, ws, 'Grupos');
    XLSX.utils.book_append_sheet(wb, wsCatalogos, 'Catálogos');

    XLSX.writeFile(wb, 'plantilla_grupos.xlsx');
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
          <div style={{ marginBottom:'24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h1 style={{ fontSize:'28px', fontWeight:'bold', color:'var(--color-dark-blue)', margin:0 }}>Groups Management</h1>
            <button
              onClick={openBulkUploadModal}
              style={{
                padding: '12px 24px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.25s',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
            >
              <i className="bi bi-file-earmark-excel" style={{ fontSize: '18px' }}></i>
              Carga Masiva de Grupos
            </button>
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
              <button onClick={handleAssignTeacherClick} style={{ padding:'12px 24px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:600, cursor:'pointer', width:'100%', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.3)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>Assign Teacher</button>
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
                  <div style={{ border:'2px solid var(--color-dark-blue)', borderRadius:'10px', padding:'16px', backgroundColor:'white', transition:'all 0.3s' }} onMouseOver={(e)=> e.currentTarget.style.transform='translateY(-4px)'} onMouseOut={(e)=> e.currentTarget.style.transform='translateY(0)'}>
                    <h3 style={{ fontSize:'18px', fontWeight:700, color:'var(--color-dark-blue)', marginBottom:'4px' }}>{grupo.cuatrimestre}{grupo.nombre}</h3>
                    <div style={{ padding:'8px 12px', backgroundColor:'rgba(46,168,83,0.1)', borderRadius:'8px', marginBottom:'12px', border:'2px solid var(--color-primary-green)' }}>
                      <p style={{ fontSize:'14px', fontWeight:700, color:'var(--color-primary-green)', margin:0 }}>📚 {grupo.programa || 'No program assigned'}</p>
                    </div>
                    <p style={{ fontSize:'12px', color:'#888', margin:'4px 0', fontStyle:'italic' }}>Cohort: {grupo.cohorte}</p>
                    <p style={{ fontSize:'13px', color:'#666', margin:'4px 0' }}><strong>Students:</strong> {grupo.total_alumnos}</p>
                    <p style={{ fontSize:'13px', color:'#666', margin:'4px 0' }}><strong>Teacher:</strong> {grupo.docente || 'Not assigned'}</p>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button 
                        onClick={()=> handleViewGrupo(grupo.id_grupo)} 
                        style={{ 
                          flex: 1,
                          padding:'8px 16px', 
                          backgroundColor:'var(--color-primary-green)', 
                          color:'white', 
                          border:'none', 
                          borderRadius:'6px', 
                          fontSize:'13px', 
                          fontWeight:600, 
                          cursor:'pointer' 
                        }}>
                        View Details
                      </button>
                      <button 
                        onClick={()=> handleDeleteGroupClick(grupo.id_grupo, grupo.nombre)} 
                        style={{ 
                          padding:'8px 12px', 
                          backgroundColor:'#ef4444', 
                          color:'white', 
                          border:'none', 
                          borderRadius:'6px', 
                          fontSize:'13px', 
                          fontWeight:600, 
                          cursor:'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Eliminar grupo (PRUEBA)">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
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
                <h3 style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'12px' }}><i className="bi bi-clipboard"></i> Cohort Data (Generation)</h3>
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
            <h2 style={{ color:'white', fontSize:'22px', fontWeight:'bold', marginBottom:'16px', textAlign:'center' }}><i className="bi bi-exclamation-triangle-fill"></i> Confirm Group Creation</h2>
            <div style={{ backgroundColor:'rgba(255,255,255,0.1)', borderRadius:'12px', padding:'20px', marginBottom:'20px' }}>
              <h3 style={{ color:'white', fontSize:'16px', fontWeight:600, marginBottom:'12px' }}>Summary:</h3>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Group Number:</strong> {newGrupo.nombre}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Current Semester:</strong> {cuatrimestres.find(c => c.id_cuatrimestre == newGrupo.id_cuatrimestre_grupo_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Entry Year:</strong> {newGrupo.anio_ingreso}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Initial Semester:</strong> 1</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Program:</strong> {programas.find(p => p.id_programa == newGrupo.id_programa_cohorte_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Initial Level:</strong> {niveles.find(n => n.id_nivel == newGrupo.id_nivel_inicial_fk)?.nombre || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}><strong>Total Students:</strong> {selectedStudents.length}</p>
              <div style={{ marginTop:'16px' }}>
                <h4 style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'8px' }}><i className="bi bi-people-fill"></i> Selected Students:</h4>
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
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
      {showStudentModal && (
        <FormModal isOpen={showStudentModal} onClose={()=> setShowStudentModal(false)} title="Add Student" fields={studentFields} onSubmit={handleAddStudentModal} submitButtonLabel="Add" />
      )}

      {/* Detail Modal */}
      {showDetailModal && grupoDetail && (
        <div className={`llw-modal-overlay ${detailExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} onClick={()=> { setDetailExiting(true); setTimeout(()=>{ setShowDetailModal(false); setDetailExiting(false); setExpandedGrupo(null); }, 220); }}>
          <div className={`llw-modal-card ${detailExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'90%', maxWidth:'700px', maxHeight:'85vh', overflowY:'auto', position:'relative' }} onClick={(e)=> e.stopPropagation()}>
            <button onClick={()=> { setDetailExiting(true); setTimeout(()=>{ setShowDetailModal(false); setDetailExiting(false); setExpandedGrupo(null); }, 220); }} style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#ff3b3b', border:'none', color:'white', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>✕</button>
            
            <h2 style={{ color:'white', fontSize:'24px', fontWeight:'bold', marginBottom:'20px', paddingRight:'50px' }}>Group Details</h2>
            
            {/* Group Info */}
            <div style={{ backgroundColor:'rgba(255,255,255,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'20px', border:'1px solid rgba(255,255,255,0.2)' }}>
              <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'12px' }}>Group: {grupoDetail.grupo?.cuatrimestre}{grupoDetail.grupo?.nombre}</h3>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'6px 0' }}><strong>Program:</strong> {grupoDetail.grupo?.programa || 'Not assigned'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'6px 0' }}><strong>Cohort:</strong> {grupoDetail.grupo?.cohorte || 'N/A'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'6px 0' }}><strong>Teacher:</strong> {grupoDetail.grupo?.docente || 'Not assigned'}</p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'6px 0' }}><strong>Total Students:</strong> {grupoDetail.alumnos?.length || 0}</p>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:'12px', marginBottom:'20px' }}>
              <button onClick={()=> handleViewGroupStatistics(expandedGrupo!)} style={{ flex:1, padding:'12px 16px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(59,130,246,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Group Statistics
              </button>
              <button onClick={()=> handleAddStudentToGrupoClick(expandedGrupo!)} style={{ flex:1, padding:'12px 16px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Add Student
              </button>
            </div>

            {/* Student List */}
            <div style={{ backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'12px', padding:'16px' }}>
              <h3 style={{ color:'white', fontSize:'16px', fontWeight:600, marginBottom:'12px' }}><i className="bi bi-people-fill"></i> Students ({grupoDetail.alumnos?.length || 0})</h3>
              {!grupoDetail.alumnos || grupoDetail.alumnos.length === 0 ? (
                <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', textAlign:'center', padding:'20px' }}>No students assigned yet</p>
              ) : (
                <div style={{ maxHeight:'300px', overflowY:'auto' }}>
                  {grupoDetail.alumnos.map((alumno:any, idx:number)=> (
                    <div key={alumno.id_alumno} style={{ padding:'12px', borderBottom: idx < grupoDetail.alumnos.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', display:'flex', justifyContent:'space-between', alignItems:'center', backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius:'6px', marginBottom:'4px' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{alumno.nombre_completo}</div>
                        <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginTop:'2px' }}>
                          ID: {alumno.matricula} • Average: {alumno.promedio_general ? Number(alumno.promedio_general).toFixed(2) : 'N/A'}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={()=> handleViewStudentFromGroup(alumno.id_alumno)} style={{ padding:'8px 12px', backgroundColor:'#3b82f6', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'4px' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(59,130,246,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>
                          Details
                        </button>
                        <button onClick={()=> handleRemoveStudentClick(alumno.id_alumno, expandedGrupo!, alumno.nombre_completo)} style={{ padding:'8px 12px', backgroundColor:'#ff3b3b', color:'white', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 2px 8px rgba(255,59,59,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>
                         Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Statistics Modal */}
      {showGroupStatsModal && selectedGroupStats && (
        <div className={`llw-modal-overlay ${groupStatsExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1002 }} onClick={()=> { setGroupStatsExiting(true); setTimeout(()=>{ setShowGroupStatsModal(false); setGroupStatsExiting(false); }, 220); }}>
          <div className={`llw-modal-card ${groupStatsExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'95%', maxWidth:'900px', maxHeight:'90vh', overflowY:'auto', position:'relative' }} onClick={(e)=> e.stopPropagation()}>
            <button onClick={()=> { setGroupStatsExiting(true); setTimeout(()=>{ setShowGroupStatsModal(false); setGroupStatsExiting(false); }, 220); }} style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#ff3b3b', border:'none', color:'white', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='none'; }}>✕</button>
            
            <h2 style={{ color:'white', fontSize:'28px', fontWeight:'bold', marginBottom:'24px', paddingRight:'50px', display:'flex', alignItems:'center', gap:'12px' }}>
              Group Statistics
            </h2>

            {/* Group Basic Info */}
            <div style={{ backgroundColor:'rgba(147,51,234,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(147,51,234,0.4)' }}>
              <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span><i className="bi bi-people-fill"></i></span> Group Information
              </h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'12px' }}>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginBottom:'4px' }}>Group Name</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{selectedGroupStats.groupInfo.cuatrimestre}{selectedGroupStats.groupInfo.nombre}</p>
                </div>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginBottom:'4px' }}>Program</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{selectedGroupStats.groupInfo.programa || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginBottom:'4px' }}>Cohort</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{selectedGroupStats.groupInfo.cohorte || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginBottom:'4px' }}>Teacher</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{selectedGroupStats.groupInfo.docente || 'Not assigned'}</p>
                </div>
                <div>
                  <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', marginBottom:'4px' }}>Active Students</p>
                  <p style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{selectedGroupStats.groupInfo.total_alumnos}</p>
                </div>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px', marginBottom:'24px' }}>
              <div style={{ backgroundColor:'rgba(249,115,22,0.15)', borderRadius:'12px', padding:'16px', border:'2px solid rgba(249,115,22,0.4)', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>📈</div>
                <div style={{ color:'#fb923c', fontSize:'28px', fontWeight:'bold', marginBottom:'4px' }}>
                  {selectedGroupStats.groupStats.average_score !== null ? Number(selectedGroupStats.groupStats.average_score).toFixed(1) : 'N/A'}
                </div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px' }}>Average Score</div>
              </div>
              <div style={{ backgroundColor:'rgba(168,85,247,0.15)', borderRadius:'12px', padding:'16px', border:'2px solid rgba(168,85,247,0.4)', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>⭐</div>
                <div style={{ color:'#c084fc', fontSize:'28px', fontWeight:'bold', marginBottom:'4px' }}>
                  {selectedGroupStats.groupStats.total_xp !== null ? Number(selectedGroupStats.groupStats.total_xp).toLocaleString() : '0'}
                </div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px' }}>Total XP</div>
              </div>
              <div style={{ backgroundColor:'rgba(59,130,246,0.15)', borderRadius:'12px', padding:'16px', border:'2px solid rgba(59,130,246,0.4)', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}>📝</div>
                <div style={{ color:'#60a5fa', fontSize:'28px', fontWeight:'bold', marginBottom:'4px' }}>
                  {selectedGroupStats.groupStats.total_labs_completed}
                </div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px' }}>Labs Completed</div>
              </div>
              <div style={{ backgroundColor:'rgba(34,197,94,0.15)', borderRadius:'12px', padding:'16px', border:'2px solid rgba(34,197,94,0.4)', textAlign:'center' }}>
                <div style={{ fontSize:'32px', marginBottom:'8px' }}><i className="bi bi-check-circle-fill"></i></div>
                <div style={{ color:'#4ade80', fontSize:'28px', fontWeight:'bold', marginBottom:'4px' }}>
                  {selectedGroupStats.groupStats.total_labs_passed}
                </div>
                <div style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px' }}>Labs Passed</div>
              </div>
            </div>

            {/* Top Students */}
            {selectedGroupStats.topStudents && selectedGroupStats.topStudents.length > 0 && (
              <div style={{ backgroundColor:'rgba(34,197,94,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(34,197,94,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>🏆</span> Top Performing Students
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {selectedGroupStats.topStudents.map((student:any, idx:number) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', backgroundColor:'rgba(255,255,255,0.08)', borderRadius:'8px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'50%', backgroundColor:'#4ade80', color:'#064e3b', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{student.nombre_completo}</div>
                          <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>Labs: {student.labs_completed}</div>
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ color:'#4ade80', fontSize:'18px', fontWeight:'bold' }}>{Number(student.average_score).toFixed(1)}</div>
                        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px' }}>avg score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Students Needing Help */}
            {selectedGroupStats.studentsNeedingHelp && selectedGroupStats.studentsNeedingHelp.length > 0 && (
              <div style={{ backgroundColor:'rgba(239,68,68,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(239,68,68,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span><i className="bi bi-exclamation-triangle-fill"></i></span> Students Needing Support
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {selectedGroupStats.studentsNeedingHelp.map((student:any, idx:number) => (
                    <div key={idx} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px', backgroundColor:'rgba(255,255,255,0.08)', borderRadius:'8px' }}>
                      <div>
                        <div style={{ color:'white', fontSize:'14px', fontWeight:600 }}>{student.nombre_completo}</div>
                        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'12px' }}>
                          {student.labs_completed === 0 ? 'No labs completed yet' : `Average: ${Number(student.average_score).toFixed(1)} • Labs: ${student.labs_completed}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress by Game Type */}
            {selectedGroupStats.progressByGameType && selectedGroupStats.progressByGameType.length > 0 && (
              <div style={{ backgroundColor:'rgba(59,130,246,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(59,130,246,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>🎮</span> Progress by Game Type
                </h3>
                <div style={{ height:'350px', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'16px' }}>
                  <ProgressByGameTypeChart data={selectedGroupStats.progressByGameType} />
                </div>
              </div>
            )}

            {/* Score Distribution */}
            {selectedGroupStats.scoreDistribution && selectedGroupStats.scoreDistribution.length > 0 && (
              <div style={{ backgroundColor:'rgba(168,85,247,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(168,85,247,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>📊</span> Score Distribution
                </h3>
                <div style={{ height:'350px', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'16px' }}>
                  <ScoreDistributionChart data={selectedGroupStats.scoreDistribution} />
                </div>
              </div>
            )}

            {/* Monthly Progress */}
            {selectedGroupStats.monthlyProgress && selectedGroupStats.monthlyProgress.length > 0 && (
              <div style={{ backgroundColor:'rgba(249,115,22,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(249,115,22,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>📅</span> Monthly Progress Trend (Last 6 Months)
                </h3>
                <div style={{ height:'350px', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'16px' }}>
                  <MonthlyProgressChart data={selectedGroupStats.monthlyProgress.slice(-6)} />
                </div>
              </div>
            )}

            {/* Average Time by Game Type */}
            {selectedGroupStats.avgTimeByGameType && selectedGroupStats.avgTimeByGameType.length > 0 && (
              <div style={{ backgroundColor:'rgba(34,197,94,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(34,197,94,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>⏱️</span> Tiempo Promedio por Tipo de Juego
                </h3>
                <div style={{ height:'350px', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'16px' }}>
                  <TimePerformanceChart data={selectedGroupStats.avgTimeByGameType} />
                </div>
              </div>
            )}

            {/* Weekly Progress */}
            {selectedGroupStats.weeklyProgress && selectedGroupStats.weeklyProgress.length > 0 && (
              <div style={{ backgroundColor:'rgba(147,51,234,0.15)', borderRadius:'12px', padding:'20px', marginBottom:'24px', border:'2px solid rgba(147,51,234,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span>📈</span> Progreso Semanal (Últimas 4 Semanas)
                </h3>
                <div style={{ height:'350px', backgroundColor:'rgba(0,0,0,0.2)', borderRadius:'8px', padding:'16px' }}>
                  <WeeklyProgressChart data={selectedGroupStats.weeklyProgress} />
                </div>
              </div>
            )}

            {/* Assigned Labs */}
            {selectedGroupStats.assignedLabs && selectedGroupStats.assignedLabs.length > 0 && (
              <div style={{ backgroundColor:'rgba(20,184,166,0.15)', borderRadius:'12px', padding:'20px', border:'2px solid rgba(20,184,166,0.4)' }}>
                <h3 style={{ color:'white', fontSize:'18px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span><i className="bi bi-clipboard"></i></span> Assigned Laboratories
                </h3>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px', maxHeight:'300px', overflowY:'auto' }}>
                  {selectedGroupStats.assignedLabs.map((lab:any, idx:number) => (
                    <div key={idx} style={{ padding:'14px', backgroundColor:'rgba(255,255,255,0.08)', borderRadius:'8px' }}>
                      <div style={{ color:'white', fontSize:'14px', fontWeight:600, marginBottom:'8px' }}>{lab.nombre_laboratorio}</div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px' }}>Game Type:</span>
                        <span style={{ color:'#5eead4', fontSize:'12px', fontWeight:600 }}>{lab.tipo_juego}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px' }}>Status:</span>
                        <span style={{ color: lab.publicado === 1 ? '#4ade80' : '#fb923c', fontSize:'12px', fontWeight:600 }}>
                          {lab.publicado === 1 ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'11px', marginTop:'8px' }}>
                        Assigned: {new Date(lab.fecha_asignacion).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {loadingGroupStats && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1003 }}>
          <div style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'16px', padding:'32px', textAlign:'center' }}>
            <p style={{ color:'white', fontSize:'18px', fontWeight:600 }}>Loading group statistics...</p>
          </div>
        </div>
      )}

      {/* Add Student to Group Modal */}
      {showAddStudentModal && (
        <div className={`llw-modal-overlay ${addStudentExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1001 }} onClick={()=> { setAddStudentExiting(true); setTimeout(()=>{ setShowAddStudentModal(false); setAddStudentExiting(false); }, 220); }}>
          <div className={`llw-modal-card ${addStudentExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'90%', maxWidth:'500px', maxHeight:'80vh', overflowY:'auto', position:'relative' }} onClick={(e)=> e.stopPropagation()}>
            <button onClick={()=> { setAddStudentExiting(true); setTimeout(()=>{ setShowAddStudentModal(false); setAddStudentExiting(false); }, 220); }} style={{ position:'absolute', top:'16px', right:'16px', width:'40px', height:'40px', borderRadius:'50%', backgroundColor:'#ff3b3b', border:'none', color:'white', fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s' }} onMouseEnter={(e)=> e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={(e)=> e.currentTarget.style.transform='scale(1)'}>✕</button>
            
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'24px' }}> Add Student to Group</h2>
            
            <div style={{ marginBottom:'20px' }}>
              <label style={{ color:'white', fontSize:'14px', fontWeight:600, display:'block', marginBottom:'8px' }}>Select Available Student</label>
              <select value={selectedStudentToAdd || ''} onChange={(e)=> setSelectedStudentToAdd(Number(e.target.value))} style={{ width:'100%', padding:'12px', borderRadius:'10px', border:'2px solid rgba(255,255,255,0.3)', fontSize:'14px', backgroundColor:'white', color:'#333', cursor:'pointer' }}>
                <option value=''>-- Select a student --</option>
                {alumnosDisponibles.filter(a => a.estado === 'disponible').map(alumno => (
                  <option key={alumno.id_alumno} value={alumno.id_alumno}>
                    {alumno.nombre_completo} ({alumno.matricula}) {alumno.programa_completo && alumno.programa_completo !== 'Not assigned' ? `- ${alumno.programa_completo}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> { setAddStudentExiting(true); setTimeout(()=>{ setShowAddStudentModal(false); setAddStudentExiting(false); }, 220); }} style={{ flex:1, padding:'12px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAddStudentConfirm} disabled={!selectedStudentToAdd} style={{ flex:1, padding:'12px', backgroundColor: selectedStudentToAdd ? 'var(--color-primary-green)' : '#999', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor: selectedStudentToAdd ? 'pointer' : 'not-allowed', transition:'all 0.2s', opacity: selectedStudentToAdd ? 1 : 0.6 }} onMouseEnter={(e)=> { if(selectedStudentToAdd) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.4)'; } }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Assign Teacher */}
      {showConfirmAssignTeacher && (
        <div className={`llw-confirm-overlay ${confirmAssignTeacherExiting ? 'llw-confirm-overlay-exit' : 'llw-confirm-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1002 }} onClick={()=> { setConfirmAssignTeacherExiting(true); setTimeout(()=>{ setShowConfirmAssignTeacher(false); setConfirmAssignTeacherExiting(false); }, 220); }}>
          <div className={`llw-confirm-card ${confirmAssignTeacherExiting ? 'llw-confirm-card-exit' : 'llw-confirm-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'16px', padding:'28px', width:'90%', maxWidth:'450px' }} onClick={(e)=> e.stopPropagation()}>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'16px', textAlign:'center' }}>👨‍🏫 Confirm Teacher Assignment</h2>
            <div style={{ backgroundColor:'rgba(255,255,255,0.1)', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Group:</strong> {grupos.find(g => g.id_grupo === selectedGrupoForTeacher)?.cuatrimestre}{grupos.find(g => g.id_grupo === selectedGrupoForTeacher)?.nombre} - {grupos.find(g => g.id_grupo === selectedGrupoForTeacher)?.programa}
              </p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Teacher:</strong> {docentes.find(d => d.id_docente === selectedTeacher)?.nombre_completo}
              </p>
            </div>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'14px', marginBottom:'20px', textAlign:'center' }}>
              Are you sure you want to assign this teacher to this group?
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> { setConfirmAssignTeacherExiting(true); setTimeout(()=>{ setShowConfirmAssignTeacher(false); setConfirmAssignTeacherExiting(false); }, 220); }} style={{ flex:1, padding:'12px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={confirmAssignTeacherAction} style={{ flex:1, padding:'12px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Add Student */}
      {showConfirmAddStudent && (
        <div className={`llw-confirm-overlay ${confirmAddStudentExiting ? 'llw-confirm-overlay-exit' : 'llw-confirm-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1002 }} onClick={()=> { setConfirmAddStudentExiting(true); setTimeout(()=>{ setShowConfirmAddStudent(false); setConfirmAddStudentExiting(false); }, 220); }}>
          <div className={`llw-confirm-card ${confirmAddStudentExiting ? 'llw-confirm-card-exit' : 'llw-confirm-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'16px', padding:'28px', width:'90%', maxWidth:'450px' }} onClick={(e)=> e.stopPropagation()}>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'16px', textAlign:'center' }}>👤 Confirm Add Student</h2>
            <div style={{ backgroundColor:'rgba(255,255,255,0.1)', borderRadius:'10px', padding:'16px', marginBottom:'20px' }}>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Student:</strong> {alumnosDisponibles.find(a => a.id_alumno === selectedStudentToAdd)?.nombre_completo}
              </p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Group:</strong> {grupos.find(g => g.id_grupo === selectedGrupoForAddStudent)?.cuatrimestre}{grupos.find(g => g.id_grupo === selectedGrupoForAddStudent)?.nombre}
              </p>
            </div>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'14px', marginBottom:'20px', textAlign:'center' }}>
              Are you sure you want to add this student to the group?
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> { setConfirmAddStudentExiting(true); setTimeout(()=>{ setShowConfirmAddStudent(false); setConfirmAddStudentExiting(false); }, 220); }} style={{ flex:1, padding:'12px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={confirmAddStudentAction} style={{ flex:1, padding:'12px', backgroundColor:'var(--color-primary-green)', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(46,168,83,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Remove Student */}
      {showConfirmRemoveStudent && studentToRemove && (
        <div className={`llw-confirm-overlay ${confirmRemoveStudentExiting ? 'llw-confirm-overlay-exit' : 'llw-confirm-overlay-enter'}`} style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1002 }} onClick={()=> { setConfirmRemoveStudentExiting(true); setTimeout(()=>{ setShowConfirmRemoveStudent(false); setConfirmRemoveStudentExiting(false); setStudentToRemove(null); }, 220); }}>
          <div className={`llw-confirm-card ${confirmRemoveStudentExiting ? 'llw-confirm-card-exit' : 'llw-confirm-card-enter'}`} style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'16px', padding:'28px', width:'90%', maxWidth:'450px' }} onClick={(e)=> e.stopPropagation()}>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:'bold', marginBottom:'16px', textAlign:'center' }}><i className="bi bi-exclamation-triangle-fill"></i> Confirm Remove Student</h2>
            <div style={{ backgroundColor:'rgba(255,59,59,0.15)', borderRadius:'10px', padding:'16px', marginBottom:'20px', border:'2px solid rgba(255,59,59,0.5)' }}>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Student:</strong> {studentToRemove.nombre}
              </p>
              <p style={{ color:'rgba(255,255,255,0.9)', fontSize:'14px', margin:'8px 0' }}>
                <strong>Group:</strong> {grupos.find(g => g.id_grupo === studentToRemove.id_grupo)?.cuatrimestre}{grupos.find(g => g.id_grupo === studentToRemove.id_grupo)?.nombre}
              </p>
            </div>
            <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'14px', marginBottom:'20px', textAlign:'center' }}>
              Are you sure you want to remove this student from the group?<br/>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>This action can be reversed later.</span>
            </p>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> { setConfirmRemoveStudentExiting(true); setTimeout(()=>{ setShowConfirmRemoveStudent(false); setConfirmRemoveStudentExiting(false); setStudentToRemove(null); }, 220); }} style={{ flex:1, padding:'12px', backgroundColor:'rgba(255,255,255,0.2)', color:'white', border:'2px solid white', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={confirmRemoveStudentAction} style={{ flex:1, padding:'12px', backgroundColor:'#ff3b3b', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e)=> { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(255,59,59,0.4)'; }} onMouseLeave={(e)=> { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div
          className={`llw-modal-overlay ${bulkUploadExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            padding: '20px'
          }}
          onClick={closeBulkUploadModal}
        >
          <div
            className={`llw-modal-card ${bulkUploadExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
            style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeBulkUploadModal}
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
                transition: 'all 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)';
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <i className="bi bi-file-earmark-excel" style={{ fontSize: '28px', color: '#8b5cf6' }}></i>
                Carga Masiva de Grupos
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
                Crea múltiples grupos y relaciones con un solo archivo Excel
              </p>
            </div>

            {/* Instructions */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="bi bi-info-circle"></i>
                Instrucciones
              </h3>
              <ol style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', margin: 0, paddingLeft: '20px' }}>
                <li style={{ marginBottom: '8px' }}>Descarga la plantilla de Excel haciendo clic en el botón de abajo</li>
                <li style={{ marginBottom: '8px' }}>Llena el archivo con los datos de grupos, docentes y alumnos</li>
                <li style={{ marginBottom: '8px' }}>El sistema creará automáticamente usuarios nuevos si no existen</li>
                <li style={{ marginBottom: '8px' }}>Guarda el archivo y súbelo usando el botón "Seleccionar Archivo"</li>
                <li>El sistema creará grupos, usuarios y relaciones automáticamente</li>
              </ol>
            </div>

            {/* Excel Structure Info */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                📋 Estructura del Excel
              </h3>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                <p style={{ marginBottom: '12px', fontWeight: '600' }}>Columnas del Grupo:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Número de Grupo:</strong> Número (1, 2, 3, 4...)</li>
                  <li><strong>Cuatrimestre:</strong> Número del cuatrimestre (1 al 12)</li>
                  <li><strong>Código Programa:</strong> Código del programa (ver hoja "Catálogos")</li>
                  <li><strong>Código Nivel:</strong> TSU o ING/LIC</li>
                  <li><strong>Año Ingreso:</strong> Año (2025, 2024, etc.)</li>
                  <li><strong>Cuatrimestre Inicial:</strong> Número (1, 2, 3...)</li>
                  <li><strong>Estado Prácticas:</strong> SI o NO</li>
                </ul>
                
                <p style={{ marginBottom: '12px', fontWeight: '600', color: '#60a5fa' }}>Columnas del Docente:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', marginBottom: '16px' }}>
                  <li><strong>Matrícula Docente:</strong> Matrícula del docente</li>
                  <li><strong>Nombre Docente:</strong> Nombre del docente (requerido si es nuevo)</li>
                  <li><strong>Primer Apellido Docente:</strong> Primer apellido (requerido si es nuevo)</li>
                  <li><strong>Segundo Apellido Docente:</strong> Segundo apellido (opcional)</li>
                  <li><strong>Correo Docente:</strong> Correo electrónico (requerido si es nuevo)</li>
                </ul>

                <p style={{ marginBottom: '12px', fontWeight: '600', color: '#34d399' }}>Columnas de Alumnos:</p>
                <ul style={{ margin: 0, paddingLeft: '20px', marginBottom: '12px' }}>
                  <li><strong>Matrícula Alumno:</strong> Matrícula del alumno</li>
                  <li><strong>Nombre Alumno:</strong> Nombre del alumno</li>
                  <li><strong>Primer Apellido Alumno:</strong> Primer apellido</li>
                  <li><strong>Segundo Apellido Alumno:</strong> Segundo apellido (opcional)</li>
                  <li><strong>Correo Alumno:</strong> Correo electrónico</li>
                </ul>

                <div style={{ 
                  marginTop: '16px', 
                  padding: '14px', 
                  background: 'rgba(59, 130, 246, 0.15)', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  <p style={{ margin: 0, marginBottom: '8px', fontWeight: '600', color: '#60a5fa' }}>📝 Formato del Excel:</p>
                  <p style={{ margin: '8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                    <strong>UNA FILA = UN ALUMNO</strong>
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    • Si un grupo tiene 3 alumnos, tendrás 3 filas<br/>
                    • Repite los datos del grupo y docente en cada fila<br/>
                    • Solo cambia los datos del alumno en cada fila<br/>
                    • Ejemplo: El Grupo 1 con Docente D001 y 3 alumnos = 3 filas iguales excepto por los datos de cada alumno
                  </p>
                </div>

                <p style={{ marginTop: '16px', padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '6px', fontSize: '12px' }}>
                  💡 <strong>Importante:</strong> Si un docente o alumno ya existe (misma matrícula), se usará el existente. Si no existe, se creará automáticamente con contraseña = matrícula
                </p>
              </div>
            </div>

            {/* Download Template Button */}
            <button
              onClick={downloadExcelTemplate}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.25s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <i className="bi bi-download" style={{ fontSize: '18px' }}></i>
              Descargar Plantilla de Excel
            </button>

            {/* File Upload */}
            <div style={{
              border: '2px dashed rgba(255,255,255,0.3)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              marginBottom: '20px',
              background: 'rgba(255,255,255,0.03)'
            }}>
              <i className="bi bi-cloud-upload" style={{ fontSize: '48px', color: '#8b5cf6', marginBottom: '16px' }}></i>
              <p style={{ color: 'white', fontSize: '15px', marginBottom: '16px', fontWeight: '600' }}>
                {uploadingFile ? 'Procesando archivo...' : 'Selecciona tu archivo Excel'}
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                style={{ display: 'none' }}
                id="bulk-upload-input"
              />
              <label
                htmlFor="bulk-upload-input"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: uploadingFile ? '#6b7280' : '#8b5cf6',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: uploadingFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s'
                }}
                onMouseEnter={(e) => {
                  if (!uploadingFile) {
                    e.currentTarget.style.backgroundColor = '#7c3aed';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploadingFile) {
                    e.currentTarget.style.backgroundColor = '#8b5cf6';
                  }
                }}
              >
                {uploadingFile ? 'Procesando...' : 'Seleccionar Archivo'}
              </label>
            </div>

            {/* Results */}
            {uploadResults && uploadResults.success && (
              <div style={{
                background: uploadResults.data.gruposCreados > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `2px solid ${uploadResults.data.gruposCreados > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className={`bi ${uploadResults.data.gruposCreados > 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
                  Resultados de la Carga Masiva
                </h3>
                
                {/* Summary Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>{uploadResults.data.gruposCreados}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Grupos Creados</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#a78bfa' }}>{uploadResults.data.cohortesCreadas}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Cohortes Creadas</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{uploadResults.data.docentesCreados}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Docentes Creados</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#93c5fd' }}>{uploadResults.data.docentesAsignados}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Docentes Asignados</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#34d399' }}>{uploadResults.data.alumnosCreados}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Alumnos Creados</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#6ee7b7' }}>{uploadResults.data.alumnosAsignados}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Alumnos Asignados</div>
                  </div>
                </div>

                {/* Errors */}
                {uploadResults.data.errores && uploadResults.data.errores.length > 0 && (
                  <div>
                    <h4 style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      ❌ Errores encontrados ({uploadResults.data.errores.length}):
                    </h4>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {uploadResults.data.errores.map((error: string, idx: number) => (
                        <div key={idx} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', marginBottom: '6px' }}>
                          • {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.data.gruposCreados > 0 && (
                  <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    ✅ Los usuarios nuevos se crearon con contraseña = matrícula
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TESTING ONLY - Confirm Delete Group Modal */}
      {showConfirmDeleteGroup && (
        <div className={`llw-modal-overlay ${confirmDeleteGroupExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`} 
          style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }} 
          onClick={()=> {
            setConfirmDeleteGroupExiting(true);
            setTimeout(()=>{ setShowConfirmDeleteGroup(false); setConfirmDeleteGroupExiting(false); }, 220);
          }}>
          <div className={`llw-modal-card ${confirmDeleteGroupExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`} 
            style={{ backgroundColor:'var(--color-dark-blue)', borderRadius:'20px', padding:'32px', width:'90%', maxWidth:'400px', position:'relative' }} 
            onClick={(e)=> e.stopPropagation()}>
            
            <button onClick={()=> {
              setConfirmDeleteGroupExiting(true);
              setTimeout(()=>{ setShowConfirmDeleteGroup(false); setConfirmDeleteGroupExiting(false); }, 220);
            }} style={{ position:'absolute', top:'16px', right:'16px', background:'transparent', border:'none', color:'white', fontSize:'24px', cursor:'pointer', padding:'4px 8px' }}>×</button>

            <div style={{ textAlign:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>⚠️</div>
              <h3 style={{ color:'white', fontSize:'20px', fontWeight:700, marginBottom:'8px' }}>Eliminar Grupo</h3>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'14px', margin:0 }}>
                ¿Estás seguro de eliminar el <strong>Grupo {groupToDelete?.nombre}</strong>?
              </p>
              <p style={{ color:'#ef4444', fontSize:'13px', marginTop:'12px', fontWeight:600 }}>
                ⚠️ SOLO PARA PRUEBAS - Esto eliminará el grupo y todas sus relaciones
              </p>
            </div>

            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={()=> {
                setConfirmDeleteGroupExiting(true);
                setTimeout(()=>{ setShowConfirmDeleteGroup(false); setConfirmDeleteGroupExiting(false); }, 220);
              }} style={{ flex:1, padding:'12px', backgroundColor:'#374151', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmDeleteGroup} style={{ flex:1, padding:'12px', backgroundColor:'#ef4444', color:'white', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
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
            animation: previewExiting ? 'fadeOut 0.3s ease-out forwards' : 'fadeIn 0.3s ease-out',
          }}
          onClick={() => {
            setPreviewExiting(true);
            setTimeout(() => {
              setShowPreviewModal(false);
              setPreviewExiting(false);
              setPreviewData(null);
            }, 300);
          }}
        >
          <div 
            style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '900px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              animation: previewExiting ? 'slideDown 0.3s ease-out forwards' : 'slideUp 0.3s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              color: 'white',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '20px',
              textAlign: 'center',
            }}>
              📋 Previsualización de Carga Masiva
            </h3>

            {/* Summary Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: '#2ea853',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                  {previewData.totalGrupos}
                </div>
                <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                  Grupos a Crear
                </div>
              </div>
              <div style={{
                backgroundColor: '#8b5cf6',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                  {previewData.totalCohortes}
                </div>
                <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                  Cohortes Nuevas
                </div>
              </div>
              <div style={{
                backgroundColor: '#3b82f6',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                  {previewData.totalDocentes}
                </div>
                <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                  Docentes Nuevos
                </div>
              </div>
              <div style={{
                backgroundColor: '#f59e0b',
                padding: '16px',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                  {previewData.totalAlumnos}
                </div>
                <div style={{ fontSize: '12px', color: 'white', opacity: 0.9 }}>
                  Alumnos Nuevos
                </div>
              </div>
            </div>

            {/* Warnings */}
            {previewData.warnings && previewData.warnings.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                border: '1px solid #fbbf24',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  color: '#fbbf24',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  ⚠️ Advertencias ({previewData.warnings.length}):
                </div>
                <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                  {previewData.warnings.map((warning: string, idx: number) => (
                    <div key={idx} style={{
                      color: '#94a3b8',
                      fontSize: '13px',
                      marginBottom: '4px',
                      paddingLeft: '8px'
                    }}>
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Lists */}
            <div style={{ marginBottom: '20px' }}>
              <details style={{ marginBottom: '12px' }}>
                <summary style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '12px',
                  backgroundColor: '#334155',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}>
                  📚 Grupos ({previewData.grupos.length})
                </summary>
                <div style={{ maxHeight: '200px', overflow: 'auto', padding: '8px' }}>
                  {previewData.grupos.map((grupo: any, idx: number) => (
                    <div key={idx} style={{
                      backgroundColor: '#334155',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      color: '#94a3b8',
                      fontSize: '13px'
                    }}>
                      <strong style={{ color: 'white' }}>Grupo {grupo.numero}</strong> - {grupo.cohorte}
                      <br />
                      Docente: {grupo.docente} | Alumnos: {grupo.totalAlumnos}
                    </div>
                  ))}
                </div>
              </details>

              {previewData.totalDocentes > 0 && (
                <details style={{ marginBottom: '12px' }}>
                  <summary style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: '#334155',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    👨‍🏫 Docentes Nuevos ({previewData.totalDocentes})
                  </summary>
                  <div style={{ maxHeight: '200px', overflow: 'auto', padding: '8px' }}>
                    {previewData.docentes.filter((d: any) => !d.existe).map((docente: any, idx: number) => (
                      <div key={idx} style={{
                        backgroundColor: '#334155',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        color: '#94a3b8',
                        fontSize: '13px'
                      }}>
                        <strong style={{ color: 'white' }}>{docente.matricula}</strong> - {docente.nombre} {docente.primer_apellido}
                        <br />
                        {docente.correo}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {previewData.totalAlumnos > 0 && (
                <details style={{ marginBottom: '12px' }}>
                  <summary style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '12px',
                    backgroundColor: '#334155',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}>
                    👨‍🎓 Alumnos Nuevos ({previewData.totalAlumnos})
                  </summary>
                  <div style={{ maxHeight: '200px', overflow: 'auto', padding: '8px' }}>
                    {previewData.alumnos.filter((a: any) => !a.existe).map((alumno: any, idx: number) => (
                      <div key={idx} style={{
                        backgroundColor: '#334155',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        color: '#94a3b8',
                        fontSize: '13px'
                      }}>
                        <strong style={{ color: 'white' }}>{alumno.matricula}</strong> - {alumno.nombre} {alumno.primer_apellido}
                        <br />
                        Grupo: {alumno.grupo} | {alumno.correo}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
            }}>
              <button
                onClick={() => {
                  setPreviewExiting(true);
                  setTimeout(() => {
                    setShowPreviewModal(false);
                    setPreviewExiting(false);
                    setPreviewData(null);
                    setExcelRowsToUpload([]);
                  }, 300);
                }}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmBulkUpload}
                disabled={uploadingFile}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  backgroundColor: uploadingFile ? '#6b7280' : '#2ea853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: uploadingFile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: uploadingFile ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!uploadingFile) {
                    e.currentTarget.style.backgroundColor = '#25883f';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 168, 83, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!uploadingFile) {
                    e.currentTarget.style.backgroundColor = '#2ea853';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {uploadingFile ? '⏳ Creando...' : '✅ Confirmar y Crear Todo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuthProtection(GruposPage, 'administrador');
