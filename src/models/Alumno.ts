/**
 * Modelo de datos para Alumno
 */
export interface Alumno {
  id_alumno: number;
  id_usuario_alumno_fk: number;
  matricula: string;
  id_programa_alumno_fk: number | null;
  id_nivel_alumno_fk: number | null;
  en_practicas: boolean;
}

export interface AlumnoDetallado extends Alumno {
  nombre_completo: string;
  correo: string;
  programa: string;
  nivel: string;
  usuario_activo: boolean;
  estado: 'disponible' | 'asignado' | 'inactivo';
  grupo_actual?: string;
  cohorte_etiqueta?: string;
  programa_grupo?: string;
  docente_nombre?: string;
  docente_correo?: string;
}

export interface AlumnoDisponible {
  id_alumno: number;
  matricula: string;
  nombre_completo: string;
  programa: string;
  programa_completo: string;
  nivel: string;
  usuario_activo: boolean;
  estado: 'disponible' | 'asignado' | 'inactivo';
  grupo_actual?: string;
}

export interface CreateAlumnoData {
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string;
  matricula: string;
  correo: string;
  contrasena: string;
  rol?: string;
  id_programa_alumno_fk?: number;
  id_nivel_alumno_fk?: number;
  en_practicas?: boolean;
}
