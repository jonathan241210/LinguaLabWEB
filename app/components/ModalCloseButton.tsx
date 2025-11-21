interface CloseButtonProps {
  onClick: () => void
  style?: React.CSSProperties
}

export default function ModalCloseButton({ onClick, style }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '18px',
        transition: 'all 0.3s ease',
        zIndex: 10,
        ...style
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
        e.currentTarget.style.color = '#ef4444'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
      }}
    >
      <i className="bi bi-x-lg"></i>
    </button>
  )
}
