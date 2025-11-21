'use client'

import { useState, useEffect } from 'react'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  userInfo: {
    nombre: string
    primer_apellido: string
    segundo_apellido?: string
    correo: string
    rol: 'admin' | 'docente' | 'alumno'
  }
}

export default function ProfileModal({ isOpen, onClose, onSuccess, onError, userInfo }: ProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info')
  const [loading, setLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Estados para información personal
  const [nombre, setNombre] = useState(userInfo.nombre)
  const [primerApellido, setPrimerApellido] = useState(userInfo.primer_apellido)
  const [segundoApellido, setSegundoApellido] = useState(userInfo.segundo_apellido || '')
  const [correo, setCorreo] = useState('') // Vacío inicialmente para el nuevo correo
  const [correoActual] = useState(userInfo.correo) // Para mostrar el correo actual

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (isOpen) {
      console.log('ProfileModal - userInfo recibido:', userInfo)
      setNombre(userInfo.nombre)
      setPrimerApellido(userInfo.primer_apellido)
      setSegundoApellido(userInfo.segundo_apellido || '')
      setCorreo('') // Vacío para que el usuario ingrese un nuevo correo si quiere
      setIsExiting(false)
    }
  }, [isOpen, userInfo])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose()
      setIsExiting(false)
    }, 250)
  }

  const handleUpdateProfile = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      
      // Si el correo está vacío, usar el correo actual (no cambiar)
      const correoToUpdate = correo.trim() === '' ? correoActual : correo
      
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, primer_apellido: primerApellido, segundo_apellido: segundoApellido, correo: correoToUpdate })
      })

      const data = await res.json()

      if (res.ok) {
        handleClose()
        if (onSuccess) onSuccess('Profile updated successfully')
        setTimeout(() => {
          window.location.reload() // Recargar para actualizar el header
        }, 1500)
      } else {
        handleClose()
        if (onError) onError(data.message || 'Error updating profile')
      }
    } catch (error) {
      handleClose()
      if (onError) onError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      if (onError) onError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      if (onError) onError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()

      if (res.ok) {
        handleClose()
        if (onSuccess) onSuccess('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        handleClose()
        if (onError) onError(data.message || 'Error changing password')
      }
    } catch (error) {
      handleClose()
      if (onError) onError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`llw-modal-overlay ${isExiting ? 'llw-modal-overlay-exit' : 'llw-modal-overlay-enter'}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={handleClose}
    >
      <div
        className={`llw-modal-card ${isExiting ? 'llw-modal-card-exit' : 'llw-modal-card-enter'}`}
        style={{
          background: 'var(--color-dark-blue)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            <i className="bi bi-person-circle"></i> Profile Settings
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
            {userInfo.rol.charAt(0).toUpperCase() + userInfo.rol.slice(1)} Account
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
          <button
            onClick={() => setActiveTab('info')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'info' ? 'rgba(46, 168, 83, 0.2)' : 'transparent',
              color: activeTab === 'info' ? 'var(--color-primary-green)' : 'rgba(255, 255, 255, 0.6)',
              border: 'none',
              borderBottom: activeTab === 'info' ? '2px solid var(--color-primary-green)' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              marginBottom: '-2px'
            }}
          >
            <i className="bi bi-person"></i> Personal Info
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'password' ? 'rgba(46, 168, 83, 0.2)' : 'transparent',
              color: activeTab === 'password' ? 'var(--color-primary-green)' : 'rgba(255, 255, 255, 0.6)',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid var(--color-primary-green)' : 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              marginBottom: '-2px'
            }}
          >
            <i className="bi bi-lock"></i> Change Password
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-person"></i> First Name
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-person-badge"></i> First Last Name
              </label>
              <input
                type="text"
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-person-badge"></i> Second Last Name (Optional)
              </label>
              <input
                type="text"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <div style={{ marginBottom: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                Current Email
              </label>
              <div style={{ color: '#93c5fd', fontSize: '14px', fontWeight: '500' }}>
                {correoActual}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-envelope"></i> New Email (optional)
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Leave empty to keep current email"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, var(--color-primary-green) 0%, var(--color-primary-green-dark) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 168, 83, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-lock"></i> Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-key"></i> New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>
                <i className="bi bi-check-circle"></i> Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'white',
                  border: '2px solid var(--color-dark-blue)',
                  borderRadius: '12px',
                  color: '#333',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary-green)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-dark-blue)'
                }}
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleClose}
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
            transition: 'transform 0.25s, box-shadow 0.25s, background-color 0.25s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
            e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.35)'
            e.currentTarget.style.backgroundColor = '#ff4f4f'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.backgroundColor = '#ff3b3b'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.9) rotate(0deg)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) rotate(3deg)'
          }}
        >
          ✕
        </button>
      </div>

      {/* Animations CSS */}
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
          0% { opacity: 0; transform: translateY(15px) scale(0.94); }
          50% { opacity: 0.8; transform: translateY(-2px) scale(1.03); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes llw-pop-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(10px) scale(0.92); }
        }
        .llw-modal-overlay-enter { animation: llw-fade-in 200ms ease-out forwards; }
        .llw-modal-overlay-exit { animation: llw-fade-out 200ms ease-in forwards; }
        .llw-modal-card-enter { animation: llw-pop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; will-change: transform, opacity; }
        .llw-modal-card-exit { animation: llw-pop-out 250ms ease-in forwards; will-change: transform, opacity; }
      `}</style>
    </div>
  )
}
