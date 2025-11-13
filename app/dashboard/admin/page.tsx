'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withAuthProtection } from '@/lib/withAuth';

interface User {
  id_usuario: number;
  nombre: string;
  rol: string;
}

interface StatData {
  label: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  lastAdded?: string;
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

// Iconos SVG grandes (64x64) solo para estadísticas
const IconsLarge = {
  flask: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M384 64L224 64C206.3 64 192 78.3 192 96C192 113.7 206.3 128 224 128L224 279.5L103.5 490.3C98.6 499 96 508.7 96 518.7C96 550.4 121.6 576 153.3 576L486.7 576C518.3 576 544 550.4 544 518.7C544 508.7 541.4 498.9 536.5 490.3L416 279.5L416 128C433.7 128 448 113.7 448 96C448 78.3 433.7 64 416 64L384 64zM288 279.5L288 128L352 128L352 279.5C352 290.6 354.9 301.6 360.4 311.3L402 384L238 384L279.6 311.3C285.1 301.6 288 290.7 288 279.5z"/></svg>,
  group: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M320 64C355.3 64 384 92.7 384 128C384 163.3 355.3 192 320 192C284.7 192 256 163.3 256 128C256 92.7 284.7 64 320 64zM416 376C416 401 403.3 423 384 435.9L384 528C384 554.5 362.5 576 336 576L304 576C277.5 576 256 554.5 256 528L256 435.9C236.7 423 224 401 224 376L224 336C224 283 267 240 320 240C373 240 416 283 416 336L416 376zM160 96C190.9 96 216 121.1 216 152C216 182.9 190.9 208 160 208C129.1 208 104 182.9 104 152C104 121.1 129.1 96 160 96zM176 336L176 368C176 400.5 188.1 430.1 208 452.7L208 528C208 529.2 208 530.5 208.1 531.7C199.6 539.3 188.4 544 176 544L144 544C117.5 544 96 522.5 96 496L96 439.4C76.9 428.4 64 407.7 64 384L64 352C64 299 107 256 160 256C172.7 256 184.8 258.5 195.9 262.9C183.3 284.3 176 309.3 176 336zM432 528L432 452.7C451.9 430.2 464 400.5 464 368L464 336C464 309.3 456.7 284.4 444.1 262.9C455.2 258.4 467.3 256 480 256C533 256 576 299 576 352L576 384C576 407.7 563.1 428.4 544 439.4L544 496C544 522.5 522.5 544 496 544L464 544C451.7 544 440.4 539.4 431.9 531.7C431.9 530.5 432 529.2 432 528zM480 96C510.9 96 536 121.1 536 152C536 182.9 510.9 208 480 208C449.1 208 424 182.9 424 152C424 121.1 449.1 96 480 96z"/></svg>,
  students: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M80 259.8L289.2 345.9C299 349.9 309.4 352 320 352C330.6 352 341 349.9 350.8 345.9L593.2 246.1C602.2 242.4 608 233.7 608 224C608 214.3 602.2 205.6 593.2 201.9L350.8 102.1C341 98.1 330.6 96 320 96C309.4 96 299 98.1 289.2 102.1L46.8 201.9C37.8 205.6 32 214.3 32 224L32 520C32 533.3 42.7 544 56 544C69.3 544 80 533.3 80 520L80 259.8zM128 331.5L128 448C128 501 214 544 320 544C426 544 512 501 512 448L512 331.4L369.1 390.3C353.5 396.7 336.9 400 320 400C303.1 400 286.5 396.7 270.9 390.3L128 331.4z"/></svg>,
  teacher: <svg width="64" height="64" viewBox="0 0 640 640" fill="currentColor"><path d="M128 160C128 124.7 156.7 96 192 96L544 96C579.3 96 608 124.7 608 160L608 400L512 400L512 384C512 366.3 497.7 352 480 352L416 352C398.3 352 384 366.3 384 384L384 400L254.9 400C265.8 381.2 272 359.3 272 336C272 265.3 214.7 208 144 208C138.6 208 133.2 208.3 128 209L128 160zM333 512C327.9 487.8 316.7 465.9 300.9 448L608 448C608 483.3 579.3 512 544 512L333 512zM64 336C64 291.8 99.8 256 144 256C188.2 256 224 291.8 224 336C224 380.2 188.2 416 144 416C99.8 416 64 380.2 64 336zM0 544C0 491 43 448 96 448L192 448C245 448 288 491 288 544C288 561.7 273.7 576 256 576L32 576C14.3 576 0 561.7 0 544z"/></svg>,
};

function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeMenu, setActiveMenu] = useState('home');
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos del usuario desde localStorage
  if (!user) {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // Error al parsear
      }
    }
  }

  // Cargar estadísticas desde la base de datos
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
          // Si no hay datos, usar valores por defecto
          setStats([
            { label: 'Labs', value: 0, icon: IconsLarge.flask, subtitle: 'No labs yet' },
            { label: 'Groups', value: 0, icon: IconsLarge.group, subtitle: 'No groups yet' },
            { label: 'Students', value: 0, icon: IconsLarge.students, subtitle: 'No students yet' },
            { label: 'Teachers', value: 0, icon: IconsLarge.teacher, subtitle: 'No teachers yet' },
          ]);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Valores por defecto en caso de error
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

  const tools = [
    { label: 'Create a new group', icon: Icons.group, action: 'create-group' },
    { label: 'Add a teacher', icon: Icons.teacher, action: 'add-teacher' },
    { label: 'Create a new lab', icon: Icons.flask, action: 'create-lab' },
    { label: 'Add new vocabulary', icon: Icons.book, action: 'add-vocab' },
  ];

  const menuItems = [
    { id: 'home', label: 'Home', icon: Icons.home },
    { id: 'labs', label: 'Labs', icon: Icons.flask },
    { id: 'groups', label: 'Groups', icon: Icons.group },
    { id: 'students', label: 'Students', icon: Icons.students },
    { id: 'teachers', label: 'Teachers', icon: Icons.teacher },
    { id: 'vocab', label: 'Vocabulary', icon: Icons.book },
  ];

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
          transition: all var(--transition-normal);
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 3px solid transparent;
          margin: 8px 0;
        }

        .menu-item:hover {
          background-color: rgba(46, 168, 83, 0.2);
          border-left-color: var(--color-primary-green);
        }

        .menu-item.active {
          background-color: var(--color-primary-green);
          color: white;
          border-left-color: var(--color-primary-green-dark);
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
          transform: translateY(-4px);
          border-color: var(--color-primary-green);
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
      `}</style>

      {/* Sidebar */}
      <div 
        className="animate-slide-in-left"
        style={{
          width: '280px',
          backgroundColor: '#2c1f4a',
          color: 'white',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo y Título */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <img
            src="/logo1.png"
            alt="LinguaLab"
            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', opacity: 0.7 }}>Principal</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>Administrador</p>
          </div>
        </div>

        {/* Menú */}
        <nav style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '16px', letterSpacing: '1px' }}>
            Menú<br />Main
          </p>
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              style={{
                backgroundColor: activeMenu === item.id ? 'var(--color-primary-green)' : 'transparent',
                color: activeMenu === item.id ? 'white' : '#e5e7eb',
                borderLeftColor: activeMenu === item.id ? 'var(--color-primary-green-dark)' : 'transparent',
              }}
            >
              <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', color: activeMenu === item.id ? 'white' : 'currentColor' }}>{item.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: activeMenu === item.id ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Botón Logout */}
        <button
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
          Logout
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div 
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          
          <button
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

        {/* Contenido */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          {/* Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
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
                      Último: {stat.lastAdded}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              {tools.map((tool, idx) => (
                <div
                  key={idx}
                  className="tool-button animate-slide-in-right"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                  onClick={() => console.log(`Action: ${tool.action}`)}
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
        </div>
      </div>
    </div>
  );
}

export default withAuthProtection(AdminDashboard, 'administrador');
