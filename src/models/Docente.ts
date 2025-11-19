/**
 * Modelo de datos para Docente
 */
export interface Docente {
  id_docente: number;
  id_usuario_docente_fk: number;
  matricula: string;
}

export interface DocenteDetallado extends Docente {
  nombre_completo: string;
  correo: string;
  usuario_activo: boolean;
  estado: 'disponible' | 'asignado' | 'inactivo';
  grupos_asignados: number;
  grupos_nombres?: string;
}

export interface CreateDocenteData {
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string;
  matricula: string;
  correo: string;
  contrasena: string;
  rol?: string;
}
