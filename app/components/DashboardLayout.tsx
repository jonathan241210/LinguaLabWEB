'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import FormModal from './FormModal';
import ProfileModal from './ProfileModal';

interface User {
  id_usuario: number;
  nombre: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  rol: string;
  correo?: string;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select';
  placeholder: string;
  required?: boolean;
  autoFillFrom?: string; // Campo del cual auto-rellenar
  showInfo?: boolean; // Mostrar icono de info
  infoMessage?: string; // Mensaje personalizado para el campo
  options?: SelectOption[]; // Opciones para select
  apiEndpoint?: string; // Endpoint para cargar opciones dinámicamente
}

interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
  menuItems?: Array<{ id: string; label: string; icon: React.ReactNode }>;
  onMenuItemClick?: (id: string) => void;
  activeMenu?: string;
  customTools?: Array<{ label: string; icon: React.ReactNode; action: string }>;
  onToolClick?: (action: string) => void;
  roleType?: 'administrador' | 'docente' | 'alumno'; // Rol para determinar menú por defecto
  formModal?: {
    isOpen: boolean;
    title: string;
    fields: FormField[];
    onClose: () => void;
    onSubmit: (formData: Record<string, string>) => Promise<void>;
    submitButtonLabel?: string;
    successMessage?: string;
    onSuccess?: () => void;
  };
  successModal?: {
    isOpen: boolean;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info'; // Tipo de mensaje
    onClose: () => void;
  };
}

// Iconos SVG personalizados - Versión pequeña (20x20)
const Icons = {
  home: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z"/></svg>,
  teacher: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M128 160C128 124.7 156.7 96 192 96L544 96C579.3 96 608 124.7 608 160L608 400L512 400L512 384C512 366.3 497.7 352 480 352L416 352C398.3 352 384 366.3 384 384L384 400L254.9 400C265.8 381.2 272 359.3 272 336C272 265.3 214.7 208 144 208C138.6 208 133.2 208.3 128 209L128 160zM333 512C327.9 487.8 316.7 465.9 300.9 448L608 448C608 483.3 579.3 512 544 512L333 512zM64 336C64 291.8 99.8 256 144 256C188.2 256 224 291.8 224 336C224 380.2 188.2 416 144 416C99.8 416 64 380.2 64 336zM0 544C0 491 43 448 96 448L192 448C245 448 288 491 288 544C288 561.7 273.7 576 256 576L32 576C14.3 576 0 561.7 0 544z"/></svg>,
  group: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M320 64C355.3 64 384 92.7 384 128C384 163.3 355.3 192 320 192C284.7 192 256 163.3 256 128C256 92.7 284.7 64 320 64zM416 376C416 401 403.3 423 384 435.9L384 528C384 554.5 362.5 576 336 576L304 576C277.5 576 256 554.5 256 528L256 435.9C236.7 423 224 401 224 376L224 336C224 283 267 240 320 240C373 240 416 283 416 336L416 376zM160 96C190.9 96 216 121.1 216 152C216 182.9 190.9 208 160 208C129.1 208 104 182.9 104 152C104 121.1 129.1 96 160 96zM176 336L176 368C176 400.5 188.1 430.1 208 452.7L208 528C208 529.2 208 530.5 208.1 531.7C199.6 539.3 188.4 544 176 544L144 544C117.5 544 96 522.5 96 496L96 439.4C76.9 428.4 64 407.7 64 384L64 352C64 299 107 256 160 256C172.7 256 184.8 258.5 195.9 262.9C183.3 284.3 176 309.3 176 336zM432 528L432 452.7C451.9 430.2 464 400.5 464 368L464 336C464 309.3 456.7 284.4 444.1 262.9C455.2 258.4 467.3 256 480 256C533 256 576 299 576 352L576 384C576 407.7 563.1 428.4 544 439.4L544 496C544 522.5 522.5 544 496 544L464 544C451.7 544 440.4 539.4 431.9 531.7C431.9 530.5 432 529.2 432 528zM480 96C510.9 96 536 121.1 536 152C536 182.9 510.9 208 480 208C449.1 208 424 182.9 424 152C424 121.1 449.1 96 480 96z"/></svg>,
  flask: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/></svg>,
  book: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M480 576L192 576C139 576 96 533 96 480L96 160C96 107 139 64 192 64L496 64C522.5 64 544 85.5 544 112L544 400C544 420.9 530.6 438.7 512 445.3L512 512C529.7 512 544 526.3 544 544C544 561.7 529.7 576 512 576L480 576zM192 448C174.3 448 160 462.3 160 480C160 497.7 174.3 512 192 512L448 512L448 448L192 448zM224 216C224 229.3 234.7 240 248 240L424 240C437.3 240 448 229.3 448 216C448 202.7 437.3 192 424 192L248 192C234.7 192 224 202.7 224 216zM248 288C234.7 288 224 298.7 224 312C224 325.3 234.7 336 248 336L424 336C437.3 336 448 325.3 448 312C448 298.7 437.3 288 424 288L248 288z"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M463 448.2C440.9 409.8 399.4 384 352 384L288 384C240.6 384 199.1 409.8 177 448.2C212.2 487.4 263.2 512 320 512C376.8 512 427.8 487.3 463 448.2zM64 320C64 178.6 178.6 64 320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320zM320 336C359.8 336 392 303.8 392 264C392 224.2 359.8 192 320 192C280.2 192 248 224.2 248 264C248 303.8 280.2 336 320 336z"/></svg>,
  students: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>,
  gear: <svg width="20" height="20" viewBox="0 0 640 640" fill="currentColor"><path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>,
};

export default function DashboardLayout({
  title,
  children,
  menuItems,
  onMenuItemClick,
  activeMenu = 'home',
  customTools,
  onToolClick,
  roleType = 'administrador',
  formModal,
  successModal,
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [showProfileSuccess, setShowProfileSuccess] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarCollapsed');
      return stored ? JSON.parse(stored) : true;
    }
    return true;
  });

  // Control local render of success modal for exit animations
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successExiting, setSuccessExiting] = useState(false);

  useEffect(() => {
    if (successModal?.isOpen) {
      setShowSuccessModal(true);
      setSuccessExiting(false);
    } else if (showSuccessModal) {
      setSuccessExiting(true);
      const t = setTimeout(() => setShowSuccessModal(false), 240);
      return () => clearTimeout(t);
    }
  }, [successModal?.isOpen]);

  // Menú por defecto según el rol
  const defaultMenuItems = {
    administrador: [
      { id: 'home', label: 'Home', icon: Icons.home },
      { id: 'labs', label: 'Labs', icon: Icons.flask },
      { id: 'groups', label: 'Groups', icon: Icons.group },
      { id: 'students', label: 'Students', icon: Icons.students },
      { id: 'teachers', label: 'Teachers', icon: Icons.teacher },
      { id: 'vocab', label: 'Vocabulary', icon: Icons.book },
    ],
    docente: [
      { id: 'home', label: 'Home', icon: Icons.home },
      { id: 'groups', label: 'Groups', icon: Icons.group },
    ],
    alumno: [
      { id: 'home', label: 'Home', icon: Icons.home },
      { id: 'courses', label: 'Mis Cursos', icon: Icons.book },
      { id: 'activities', label: 'Mis Tareas', icon: Icons.flask },
      { id: 'progress', label: 'Mi Progreso', icon: Icons.students },
    ],
  };

  // Usar menú personalizado si se pasa, sino usar menú por defecto del rol
  const finalMenuItems = menuItems || defaultMenuItems[roleType];

  // Cargar datos del usuario desde localStorage y luego del servidor
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        // Cargar datos completos del servidor
        fetchUserData();
      } catch {
        // Error al parsear
      }
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('DashboardLayout - Fetching user data...');
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          // Actualizar también en localStorage
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      // Error fetching user data
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      router.push('/login');
    }
  };

  const getPathForItem = (id: string) => {
    if (roleType === 'administrador') {
      switch (id) {
        case 'home':
          return '/dashboard/admin';
        case 'groups':
          return '/dashboard/admin/grupos';
        case 'students':
          return '/dashboard/admin/alumnos';
        case 'teachers':
          return '/dashboard/admin/docentes';
        case 'labs':
          return '/dashboard/admin/laboratorios';
        case 'vocab':
          return '/dashboard/admin/vocabulario';
        default:
          return undefined;
      }
    } else if (roleType === 'docente') {
      switch (id) {
        case 'home':
          return '/dashboard/docente';
        case 'groups':
          return '/dashboard/docente';
        default:
          return undefined;
      }
    } else if (roleType === 'alumno') {
      switch (id) {
        case 'home':
          return '/dashboard/alumnos';
        case 'courses':
          return '/dashboard/alumnos';
        default:
          return undefined;
      }
    }
    return undefined;
  };

  const isItemActive = (id: string) => {
    // Si se pasa activeMenu, se respeta; si no, se infiere por ruta
    if (activeMenu) return activeMenu === id;
    const expected = getPathForItem(id);
    if (!expected) return false;
    return pathname?.startsWith(expected) ?? false;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-light)', display: 'flex', position: 'relative' }}>
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .menu-item {
          cursor: pointer;
          padding: 12px 16px;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid transparent;
          margin: 8px 0;
          position: relative;
          overflow: hidden;
        }

        .menu-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 0;
          background: linear-gradient(90deg, rgba(46, 168, 83, 0.15) 0%, rgba(46, 168, 83, 0.05) 100%);
          transition: width 0.3s ease;
          z-index: 0;
        }

        .menu-item:hover:not(.active)::before {
          width: 100%;
        }

        .menu-item:hover:not(.active) {
          border-left-color: var(--color-primary-green);
          padding-left: 20px;
        }

        .menu-item.active {
          background-color: var(--color-primary-green);
          color: white;
          border-left-color: var(--color-primary-green-dark);
          box-shadow: 0 4px 12px rgba(46, 168, 83, 0.3);
        }

        .menu-item > * {
          position: relative;
          z-index: 1;
        }

        /* Modal animations */
        @keyframes llw-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes llw-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes llw-pop-in { 0% { opacity: 0; transform: translateY(12px) scale(0.96) } 60% { opacity: 1; transform: translateY(0) scale(1.02) } 100% { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes llw-pop-out { from { opacity: 1; transform: translateY(0) scale(1) } to { opacity: 0; transform: translateY(8px) scale(0.94) } }
        .llw-overlay-enter { animation: llw-fade-in 220ms ease-out forwards }
        .llw-overlay-exit { animation: llw-fade-out 220ms ease-in forwards }
        .llw-card-enter { animation: llw-pop-in 260ms cubic-bezier(0.22, 1, 0.36, 1) forwards; will-change: transform, opacity }
        .llw-card-exit { animation: llw-pop-out 240ms ease-in forwards; will-change: transform, opacity }

        /* Estilos responsivos */
        @media (max-width: 768px) {
          .llw-sidebar {
            position: fixed !important;
            left: ${sidebarCollapsed ? '-300px' : '0'} !important;
            width: 280px !important;
            z-index: 1000 !important;
            height: 100vh !important;
            box-shadow: ${sidebarCollapsed ? 'none' : '4px 0 20px rgba(0,0,0,0.3)'} !important;
          }
          .llw-hamburger-btn {
            display: flex !important;
          }
          .llw-header {
            padding: 12px 16px !important;
          }
          .llw-content {
            padding: 16px !important;
          }
        }
        @media (max-width: 480px) {
          .llw-header h1 {
            font-size: 20px !important;
          }
          .llw-content {
            padding: 12px !important;
          }
        }
      `}</style>

      {/* Overlay para cerrar sidebar en móvil */}
      {!sidebarCollapsed && (
        <div
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          className="llw-sidebar-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <style jsx>{`
        @media (max-width: 768px) {
          .llw-sidebar-overlay {
            display: block !important;
          }
        }
      `}</style>

      {/* Sidebar */}
      <div 
        className="animate-slide-in-left llw-sidebar"
        style={{
          width: sidebarCollapsed ? '72px' : '280px',
          backgroundColor: '#2c1f4a',
          color: 'white',
          padding: sidebarCollapsed ? '16px 8px' : '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          boxShadow: 'var(--shadow-lg)',
          transition: 'width 0.2s ease, left 0.3s ease',
        }}
        onMouseEnter={() => {
          setSidebarCollapsed(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sidebarCollapsed', 'false');
          }
        }}
        onMouseLeave={() => {
          setSidebarCollapsed(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('sidebarCollapsed', 'true');
          }
        }}
      >
        {/* Logo y Título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sidebarCollapsed ? '8px' : '16px' }}>
          <img
            src="/logo1.png"
            alt="LinguaLab"
            style={{ width: sidebarCollapsed ? '36px' : '60px', height: sidebarCollapsed ? '36px' : '60px', objectFit: 'contain', transition: 'all 0.2s' }}
          />
          {!sidebarCollapsed && (
            <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', opacity: 0.7 }}>Principal</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>{title}</p>
            </div>
          )}
        </div>

        {/* Menú */}
        <nav style={{ flex: 1 }}>
          {!sidebarCollapsed && (
            <p style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '16px', letterSpacing: '1px' }}>
              Menú<br />Main
            </p>
          )}
          {finalMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onMenuItemClick?.(item.id);
                // Navegación usando mapa centralizado
                const path = getPathForItem(item.id);
                if (path) {
                  router.push(path);
                }
              }}
              className={`menu-item ${isItemActive(item.id) ? 'active' : ''}`}
              style={{
                backgroundColor: isItemActive(item.id) ? 'var(--color-primary-green)' : 'transparent',
                color: isItemActive(item.id) ? 'white' : '#e5e7eb',
                borderLeftColor: isItemActive(item.id) ? 'var(--color-primary-green-dark)' : 'transparent',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              }}
            >
              <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', color: isItemActive(item.id) ? 'white' : 'currentColor' }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ fontSize: '14px', fontWeight: isItemActive(item.id) ? 600 : 400 }}>{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Sección TOOLS para docentes */}
        {roleType === 'docente' && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '16px', letterSpacing: '1px' }}>
              Tools
            </p>
            <button
              onClick={() => console.log('Create activity')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(46, 168, 83, 0.2)',
                color: 'var(--color-primary-green)',
                border: '2px solid var(--color-primary-green)',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-green)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(46, 168, 83, 0.2)';
                e.currentTarget.style.color = 'var(--color-primary-green)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span>
              Create activity
            </button>
          </div>
        )}

        {/* Botón Logout (ícono X) */}
        <button
          title="Logout"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all var(--transition-normal)',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {sidebarCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
            </svg>
          ) : (
            'Logout'
          )}
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div 
          className="llw-header"
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
            borderBottom: '1px solid #e5e7eb',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Botón hamburguesa para móvil */}
            <button
              className="llw-hamburger-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                display: 'none',
                background: 'var(--color-primary-green)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px 12px',
                color: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                transition: 'all 0.2s',
              }}
            >
              ☰
            </button>
            <button
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-dark-blue)',
              }}
            >
              {Icons.gear}
            </button>
          </div>

          {/* Barra de búsqueda para docentes */}
          {roleType === 'docente' && (
            <input
              type="text"
              placeholder="Search something..."
              style={{
                flex: 1,
                maxWidth: '400px',
                padding: '10px 16px',
                backgroundColor: 'var(--color-gray-light)',
                border: '2px solid var(--color-primary-green)',
                borderRadius: 'var(--radius-full)',
                fontSize: '14px',
                color: 'var(--color-dark-blue)',
                outline: 'none',
                transition: 'all var(--transition-normal)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gray-light)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          )}
          
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all var(--transition-normal)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green-light)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-green)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {Icons.user}
            {user?.nombre}
          </button>
        </div>

        {/* Contenido - Aquí va el children */}
        <div style={{ flex: 1, padding: 'clamp(16px, 4vw, 32px)', overflowY: 'auto' }}>
          {children}
        </div>
      </div>

      {/* FormModal reutilizable */}
      {formModal && (
        <FormModal
          isOpen={formModal.isOpen}
          onClose={formModal.onClose}
          title={formModal.title}
          fields={formModal.fields}
          onSubmit={formModal.onSubmit}
          submitButtonLabel={formModal.submitButtonLabel}
          successMessage={formModal.successMessage}
          onSuccess={formModal.onSuccess}
        />
      )}

      {/* ProfileModal */}
      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSuccess={(message) => {
            setProfileSuccessMessage(message);
            setShowProfileSuccess(true);
          }}
          onError={(message) => {
            setProfileSuccessMessage(message);
            setShowProfileSuccess(true);
          }}
          userInfo={{
            nombre: user.nombre,
            primer_apellido: user.primer_apellido || '',
            segundo_apellido: user.segundo_apellido || '',
            correo: user.correo || '',
            rol: (user.rol === 'administrador' ? 'admin' : user.rol === 'docente' ? 'docente' : 'alumno') as 'admin' | 'docente' | 'alumno'
          }}
        />
      )}

      {/* Profile Success/Error Modal */}
      {showProfileSuccess && (
        <div
          className="llw-message-overlay llw-message-overlay-enter"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
          }}
          onClick={() => setShowProfileSuccess(false)}
        >
          <div
            className="llw-message-card llw-message-bounce-in"
            style={{
              backgroundColor: 'var(--color-dark-blue)',
              borderRadius: '20px',
              padding: '32px',
              width: '90%',
              maxWidth: '420px',
              position: 'relative',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(46, 168, 83, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>{profileSuccessMessage}</h3>
            <button
              onClick={() => setShowProfileSuccess(false)}
              style={{
                padding: '12px 32px',
                backgroundColor: 'var(--color-primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                maxWidth: '200px',
                marginTop: '12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(46, 168, 83, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Animaciones CSS para modales */}
      <style jsx>{`
        @keyframes llw-message-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes llw-message-fade-out { from { opacity: 1 } to { opacity: 0 } }
        @keyframes llw-message-bounce-in {
          0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
          50% { opacity: 0.8; transform: translateY(5px) scale(1.05); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes llw-message-slide-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        .llw-message-overlay-enter { animation: llw-message-fade-in 200ms ease-out forwards; }
        .llw-message-overlay-exit { animation: llw-message-fade-out 200ms ease-in forwards; }
        .llw-message-card-enter { animation: llw-message-bounce-in 350ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .llw-message-card-exit { animation: llw-message-slide-out 250ms ease-in forwards; }

        @media (max-width: 768px) {
          .llw-message-card {
            width: 95% !important;
            max-width: none !important;
            padding: 24px !important;
          }
        }
        @media (max-width: 480px) {
          .llw-message-card {
            padding: 20px !important;
          }
          .llw-message-card h3 {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* Modal universal - Diseño profesional reutilizable para todos los tipos de mensajes */}
      {successModal && showSuccessModal && (() => {
        const type = successModal.type || 'success';
        const config = {
          success: {
            bgColor: 'rgba(46,168,83,0.15)',
            iconColor: '#2ea853',
            icon: <path d="M20 6L9 17l-5-5" />,
            buttonColor: 'var(--color-primary-green)',
            buttonShadow: 'rgba(46,168,83,0.4)',
            subtitle: 'The data has been saved successfully.',
          },
          error: {
            bgColor: 'rgba(239,68,68,0.15)',
            iconColor: '#ef4444',
            icon: <path d="M18 6L6 18M6 6l12 12" />,
            buttonColor: '#ef4444',
            buttonShadow: 'rgba(239,68,68,0.4)',
            subtitle: 'Please check the information and try again.',
          },
          warning: {
            bgColor: 'rgba(245,158,11,0.15)',
            iconColor: '#f59e0b',
            icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
            buttonColor: '#f59e0b',
            buttonShadow: 'rgba(245,158,11,0.4)',
            subtitle: 'Review the information before continuing.',
          },
          info: {
            bgColor: 'rgba(59,130,246,0.15)',
            iconColor: '#3b82f6',
            icon: <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
            buttonColor: '#3b82f6',
            buttonShadow: 'rgba(59,130,246,0.4)',
            subtitle: 'This is important information for you.',
          },
        }[type];

        return (
          <div
            className={`llw-overlay-${successExiting ? 'exit' : 'enter'}`}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10002,
            }}
            onClick={() => {
              setSuccessExiting(true);
              setTimeout(() => {
                successModal.onClose();
                setShowSuccessModal(false);
                setSuccessExiting(false);
              }, 250);
            }}
          >
            <div
              className={`llw-card-${successExiting ? 'exit' : 'enter'}`}
              style={{
                backgroundColor: 'var(--color-dark-blue)',
                borderRadius: '20px',
                padding: '40px 32px',
                width: '90%',
                maxWidth: '420px',
                position: 'relative',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: config.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    {config.icon}
                  </svg>
                </div>
              </div>
              <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>{successModal.message}</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 24px 0', fontSize: '14px', lineHeight: '1.6' }}>{config.subtitle}</p>
              <button
                onClick={() => {
                  setSuccessExiting(true);
                  setTimeout(() => {
                    successModal.onClose();
                    setShowSuccessModal(false);
                    setSuccessExiting(false);
                  }, 240);
                }}
                style={{
                  padding: '12px 32px',
                  backgroundColor: config.buttonColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  maxWidth: '200px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${config.buttonShadow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                OK
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
