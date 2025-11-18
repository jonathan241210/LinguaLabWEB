'use client';

import { useState, useEffect } from 'react';
import { withAuthProtection } from '@/lib/withAuth';
import DashboardLayout from '@/app/components/DashboardLayout';

interface StatData {
  label: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  lastAdded?: string;
}

// Iconos SVG grandes (64x64) solo para estadísticas
const IconsLarge = {
  flask: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/></svg>,
  group: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M320 64C355.3 64 384 92.7 384 128C384 163.3 355.3 192 320 192C284.7 192 256 163.3 256 128C256 92.7 284.7 64 320 64zM416 376C416 401 403.3 423 384 435.9L384 528C384 554.5 362.5 576 336 576L304 576C277.5 576 256 554.5 256 528L256 435.9C236.7 423 224 401 224 376L224 336C224 283 267 240 320 240C373 240 416 283 416 336L416 376zM160 96C190.9 96 216 121.1 216 152C216 182.9 190.9 208 160 208C129.1 208 104 182.9 104 152C104 121.1 129.1 96 160 96zM176 336L176 368C176 400.5 188.1 430.1 208 452.7L208 528C208 529.2 208 530.5 208.1 531.7C199.6 539.3 188.4 544 176 544L144 544C117.5 544 96 522.5 96 496L96 439.4C76.9 428.4 64 407.7 64 384L64 352C64 299 107 256 160 256C172.7 256 184.8 258.5 195.9 262.9C183.3 284.3 176 309.3 176 336zM432 528L432 452.7C451.9 430.2 464 400.5 464 368L464 336C464 309.3 456.7 284.4 444.1 262.9C455.2 258.4 467.3 256 480 256C533 256 576 299 576 352L576 384C576 407.7 563.1 428.4 544 439.4L544 496C544 522.5 522.5 544 496 544L464 544C451.7 544 440.4 539.4 431.9 531.7C431.9 530.5 432 529.2 432 528zM480 96C510.9 96 536 121.1 536 152C536 182.9 510.9 208 480 208C449.1 208 424 182.9 424 152C424 121.1 449.1 96 480 96z"/></svg>,
  students: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>,
  teacher: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M128 160C128 124.7 156.7 96 192 96L544 96C579.3 96 608 124.7 608 160L608 400L512 400L512 384C512 366.3 497.7 352 480 352L416 352C398.3 352 384 366.3 384 384L384 400L254.9 400C265.8 381.2 272 359.3 272 336C272 265.3 214.7 208 144 208C138.6 208 133.2 208.3 128 209L128 160zM333 512C327.9 487.8 316.7 465.9 300.9 448L608 448C608 483.3 579.3 512 544 512L333 512zM64 336C64 291.8 99.8 256 144 256C188.2 256 224 291.8 224 336C224 380.2 188.2 416 144 416C99.8 416 64 380.2 64 336zM0 544C0 491 43 448 96 448L192 448C245 448 288 491 288 544C288 561.7 273.7 576 256 576L32 576C14.3 576 0 561.7 0 544z"/></svg>,
};

// Iconos pequeños para tools
const Icons = {
  group: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M320 64C355.3 64 384 92.7 384 128C384 163.3 355.3 192 320 192C284.7 192 256 163.3 256 128C256 92.7 284.7 64 320 64zM416 376C416 401 403.3 423 384 435.9L384 528C384 554.5 362.5 576 336 576L304 576C277.5 576 256 554.5 256 528L256 435.9C236.7 423 224 401 224 376L224 336C224 283 267 240 320 240C373 240 416 283 416 336L416 376zM160 96C190.9 96 216 121.1 216 152C216 182.9 190.9 208 160 208C129.1 208 104 182.9 104 152C104 121.1 129.1 96 160 96zM176 336L176 368C176 400.5 188.1 430.1 208 452.7L208 528C208 529.2 208 530.5 208.1 531.7C199.6 539.3 188.4 544 176 544L144 544C117.5 544 96 522.5 96 496L96 439.4C76.9 428.4 64 407.7 64 384L64 352C64 299 107 256 160 256C172.7 256 184.8 258.5 195.9 262.9C183.3 284.3 176 309.3 176 336zM432 528L432 452.7C451.9 430.2 464 400.5 464 368L464 336C464 309.3 456.7 284.4 444.1 262.9C455.2 258.4 467.3 256 480 256C533 256 576 299 576 352L576 384C576 407.7 563.1 428.4 544 439.4L544 496C544 522.5 522.5 544 496 544L464 544C451.7 544 440.4 539.4 431.9 531.7C431.9 530.5 432 529.2 432 528zM480 96C510.9 96 536 121.1 536 152C536 182.9 510.9 208 480 208C449.1 208 424 182.9 424 152C424 121.1 449.1 96 480 96z"/></svg>,
  teacher: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M128 160C128 124.7 156.7 96 192 96L544 96C579.3 96 608 124.7 608 160L608 400L512 400L512 384C512 366.3 497.7 352 480 352L416 352C398.3 352 384 366.3 384 384L384 400L254.9 400C265.8 381.2 272 359.3 272 336C272 265.3 214.7 208 144 208C138.6 208 133.2 208.3 128 209L128 160zM333 512C327.9 487.8 316.7 465.9 300.9 448L608 448C608 483.3 579.3 512 544 512L333 512zM64 336C64 291.8 99.8 256 144 256C188.2 256 224 291.8 224 336C224 380.2 188.2 416 144 416C99.8 416 64 380.2 64 336zM0 544C0 491 43 448 96 448L192 448C245 448 288 491 288 544C288 561.7 273.7 576 256 576L32 576C14.3 576 0 561.7 0 544z"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/></svg>,
  book: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/></svg>,
  students: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>,
};

function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState('home');
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Load stats from database
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          // Agregar los iconos grandes a los datos
          const statsWithIcons = data.map((stat: any, idx: number) => ({
            ...stat,
            icon: [IconsLarge.flask, IconsLarge.group, IconsLarge.students, IconsLarge.teacher][idx],
          }));
          setStats(statsWithIcons);
        } else {
          // Use default values if no data
          setStats([
            { label: 'Labs', value: 0, icon: IconsLarge.flask, subtitle: 'No labs yet' },
            { label: 'Groups', value: 0, icon: IconsLarge.group, subtitle: 'No groups yet' },
            { label: 'Students', value: 0, icon: IconsLarge.students, subtitle: 'No students yet' },
            { label: 'Teachers', value: 0, icon: IconsLarge.teacher, subtitle: 'No teachers yet' },
          ]);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Default values in case of error
        setStats([
          { label: 'Labs', value: 0, icon: IconsLarge.flask, subtitle: 'No labs yet' },
          { label: 'Groups', value: 0, icon: IconsLarge.group, subtitle: 'No groups yet' },
          { label: 'Students', value: 0, icon: IconsLarge.students, subtitle: 'No students yet' },
          { label: 'Teachers', value: 0, icon: IconsLarge.teacher, subtitle: 'No teachers yet' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const addTeacherFields = [
    { name: 'nombre', label: 'Name(s)', type: 'text' as const, placeholder: '', required: true },
    { name: 'primer_apellido', label: 'Last name', type: 'text' as const, placeholder: '', required: true },
    { name: 'segundo_apellido', label: 'Second last name', type: 'text' as const, placeholder: '', required: false },
    { name: 'matricula', label: 'Teacher ID', type: 'text' as const, placeholder: '', required: true },
    { name: 'correo', label: 'Email', type: 'email' as const, placeholder: '', required: true },
    { 
      name: 'contrasena', 
      label: 'Password', 
      type: 'password' as const, 
      placeholder: '', 
      required: true,
      autoFillFrom: 'matricula',
      showInfo: true,
      infoMessage: 'Teacher must change password in profile',
    },
  ];

  const handleAddTeacher = async (formData: Record<string, string>) => {
    try {
      const response = await fetch('/api/auth/register-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          matricula: formData.matricula,
          correo: formData.correo,
          contrasena: formData.contrasena,
          rol: 'docente',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setMessageType('error');
        setSuccessMessage(data.error || 'Error registering teacher');
        setShowSuccessModal(true);
        setShowTeacherForm(false);
        throw new Error(data.error || 'Error registering teacher');
      }

      console.log('Teacher registered successfully:', data);
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const tools = [
    { label: 'Create new group', icon: Icons.group, action: 'create-group' },
    { label: 'Add teacher', icon: Icons.teacher, action: 'add-teacher' },
    { label: 'Create new lab', icon: Icons.flask, action: 'create-lab' },
    { label: 'Add student', icon: Icons.students, action: 'add-student' },
    { label: 'Add vocabulary', icon: Icons.book, action: 'add-vocab' },
  ];

  const handleToolClick = (action: string) => {
    if (action === 'add-teacher') {
      setShowTeacherForm(true);
    } else if (action === 'add-student') {
      setShowStudentForm(true);
    } else {
      console.log(`Action: ${action}`);
    }
  };

  const addStudentFields = [
    { name: 'nombre', label: 'Name(s)', type: 'text' as const, placeholder: '', required: true },
    { name: 'primer_apellido', label: 'Last name', type: 'text' as const, placeholder: '', required: true },
    { name: 'segundo_apellido', label: 'Second last name', type: 'text' as const, placeholder: '', required: false },
    { name: 'matricula', label: 'Student ID', type: 'text' as const, placeholder: '', required: true },
    { name: 'correo', label: 'Email', type: 'email' as const, placeholder: '', required: true },
    {
      name: 'contrasena',
      label: 'Password',
      type: 'password' as const,
      placeholder: '',
      required: true,
      autoFillFrom: 'matricula',
      showInfo: true,
      infoMessage: 'Student must change password in profile',
    },
  ];

  const handleAddStudent = async (formData: Record<string, string>) => {
    try {
      const response = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          matricula: formData.matricula,
          correo: formData.correo,
          id_programa_alumno_fk: parseInt(formData.id_programa_alumno_fk),
          id_nivel_alumno_fk: parseInt(formData.id_nivel_alumno_fk),
          contrasena: formData.contrasena,
          rol: 'alumno',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setMessageType('error');
        setSuccessMessage(data.error || 'Error registering student');
        setShowSuccessModal(true);
        setShowStudentForm(false);
        throw new Error(data.error || 'Error registering student');
      }
      
      // Cerrar el modal y mostrar mensaje de éxito
      setShowStudentForm(false);
      setMessageType('success');
      setSuccessMessage('Student registered successfully');
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const currentForm = showTeacherForm
    ? {
        isOpen: showTeacherForm,
        title: 'Add Teacher',
        fields: addTeacherFields,
        onClose: () => setShowTeacherForm(false),
        onSubmit: handleAddTeacher,
        submitButtonLabel: 'Add',
        onSuccess: () => {
          setMessageType('success');
          setSuccessMessage('Teacher registered successfully');
          setShowSuccessModal(true);
        },
      }
    : showStudentForm
    ? {
        isOpen: showStudentForm,
        title: 'Add Student',
        fields: addStudentFields,
        onClose: () => setShowStudentForm(false),
        onSubmit: handleAddStudent,
        submitButtonLabel: 'Add',
        onSuccess: () => {
          setSuccessMessage('Student registered successfully');
          setShowSuccessModal(true);
        },
      }
    : undefined;

  return (
    <DashboardLayout
      title="Administrator"
      activeMenu={activeMenu}
      onMenuItemClick={setActiveMenu}
      formModal={currentForm}
      successModal={{
        isOpen: showSuccessModal,
        message: successMessage,
        type: messageType,
        onClose: () => setShowSuccessModal(false),
      }}
    >
      <style jsx>{`
        @keyframes llw-toast-slide-in {
          0% { 
            opacity: 0; 
            transform: translateX(100%) scale(0.8); 
          }
          50% { 
            opacity: 0.8; 
            transform: translateX(-5px) scale(1.05); 
          }
          100% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
        }
        @keyframes llw-toast-slide-out {
          0% { 
            opacity: 1; 
            transform: translateX(0) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateX(50px) scale(0.9); 
          }
        }
        @keyframes llw-card-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(0.5deg); }
        }
        
        @media (max-width: 768px) {
          .llw-header {
            padding: 12px 16px !important;
          }
          .stat-card {
            min-width: 100% !important;
          }
          .tool-button {
            min-width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .stat-card h3 {
            font-size: 14px !important;
          }
          .stat-card p {
            font-size: 24px !important;
          }
        }

        .stat-card {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          padding: 24px;
          text-align: center;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-normal);
          border: 1px solid #e5e7eb;
        }

        .stat-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-6px) scale(1.02);
          border-color: var(--color-primary-green);
          animation: llw-card-float 2s ease-in-out infinite;
        }

        .tool-button {
          background: var(--color-white);
          border: 2px solid #e5e7eb;
          border-radius: var(--radius-lg);
          padding: 20px 24px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 120px;
        }

        .tool-button:hover {
          border-color: var(--color-primary-green);
          background-color: rgba(46, 168, 83, 0.05);
          transform: scale(1.02);
          box-shadow: var(--shadow-md);
        }

        .tool-button:active {
          transform: scale(0.98);
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>

      {/* Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px', marginBottom: '40px' }}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-card animate-scale-in"
                style={{
                  animationDelay: `${idx * 0.1}s`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                {/* Icono grande a la izquierda */}
                <div style={{
                  fontSize: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary-green)',
                  minWidth: '100px',
                  minHeight: '100px',
                }}>
                  {stat.icon}
                </div>

                {/* Información a la derecha */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'var(--color-dark-blue)',
                    marginBottom: '4px',
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-gray-dark)',
                    fontWeight: 500,
                    marginBottom: '6px',
                  }}>
                    {stat.label}
                  </div>
                  {stat.subtitle && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-gray)',
                      fontStyle: 'italic',
                    }}>
                      {stat.subtitle}
                    </div>
                  )}
                  {stat.lastAdded && (
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-primary-green)',
                      fontWeight: 600,
                      marginTop: '4px',
                    }}>
                      Last: {stat.lastAdded}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sección TOOLS */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-dark-blue)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tools
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="tool-button animate-slide-in-right"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => handleToolClick(tool.action)}
                >
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '48px', display: 'flex', alignItems: 'center', color: 'var(--color-primary-green)' }}>{tool.icon}</span>
                    {/* Icono pequeño de + */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-8px',
                      right: '-8px',
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'var(--color-primary-green)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white',
                      fontWeight: 'bold',
                    }}>
                      +
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-dark-blue)', textAlign: 'center' }}>
                    {tool.label}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuthProtection(AdminDashboard, 'administrador');