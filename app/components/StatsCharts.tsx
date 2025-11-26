'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ProgressByGameTypeProps {
  data: Array<{
    tipo_juego: string
    icono: string
    total_attempts: number
    average_score: number
  }>
}

export function ProgressByGameTypeChart({ data }: ProgressByGameTypeProps) {
  const chartData = {
    labels: data.map(item => item.tipo_juego),
    datasets: [
      {
        label: 'Intentos',
        data: data.map(item => item.total_attempts),
        backgroundColor: 'rgba(46, 168, 83, 0.6)',
        borderColor: 'rgba(46, 168, 83, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Promedio (%)',
        data: data.map(item => item.average_score),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Intentos',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Promedio (%)',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#64748b',
          font: { size: 12 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  }

  return <Bar data={chartData} options={options} />
}

interface ScoreDistributionProps {
  data: Array<{
    score_range: string
    student_count: number
  }>
}

export function ScoreDistributionChart({ data }: ScoreDistributionProps) {
  const colors = [
    'rgba(239, 68, 68, 0.8)',   // 0-20% - Rojo
    'rgba(249, 115, 22, 0.8)',  // 21-40% - Naranja
    'rgba(234, 179, 8, 0.8)',   // 41-60% - Amarillo
    'rgba(34, 197, 94, 0.8)',   // 61-80% - Verde claro
    'rgba(46, 168, 83, 0.8)'    // 81-100% - Verde oscuro
  ]

  const chartData = {
    labels: data.map(item => item.score_range),
    datasets: [
      {
        label: 'Estudiantes',
        data: data.map(item => item.student_count),
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `Estudiantes: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Número de Estudiantes',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b',
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: 'Rango de Calificación',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      }
    }
  }

  return <Bar data={chartData} options={options} />
}

interface MonthlyProgressProps {
  data: Array<{
    month_name: string
    labs_completed: number
    average_score: number
  }>
}

export function MonthlyProgressChart({ data }: MonthlyProgressProps) {
  const chartData = {
    labels: data.map(item => item.month_name),
    datasets: [
      {
        label: 'Laboratorios Completados',
        data: data.map(item => item.labs_completed),
        backgroundColor: 'rgba(46, 168, 83, 0.2)',
        borderColor: 'rgba(46, 168, 83, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Promedio (%)',
        data: data.map(item => item.average_score),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Laboratorios',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b',
          stepSize: 1
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Promedio (%)',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#64748b'
        },
        max: 100
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#64748b',
          font: { size: 12 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  }

  return <Line data={chartData} options={options} />
}

interface StudentPerformanceProps {
  data: {
    nombre_completo: string
    labs_completed: number
    average_score: number
  }
}

export function StudentPerformanceChart({ data }: StudentPerformanceProps) {
  const chartData = {
    labels: ['Completado', 'Pendiente'],
    datasets: [
      {
        data: [data.labs_completed, Math.max(0, 20 - data.labs_completed)],
        backgroundColor: [
          'rgba(46, 168, 83, 0.8)',
          'rgba(226, 232, 240, 0.8)'
        ],
        borderColor: [
          'rgba(46, 168, 83, 1)',
          'rgba(226, 232, 240, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255,255,255,0.8)',
          font: { size: 13, weight: '600' as any },
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 14,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        titleFont: { size: 13, weight: '700' as any },
        bodyFont: { size: 13 },
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
            return `${label}: ${value} labs (${percentage}%)`
          }
        }
      }
    }
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '300px 1fr',
      gap: '24px',
      alignItems: 'center'
    }}>
      {/* Doughnut Chart */}
      <div style={{ height: '250px' }}>
        <Doughnut data={chartData} options={options} />
      </div>
      
      {/* Stats Summary */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(46, 168, 83, 0.15) 0%, rgba(46, 168, 83, 0.05) 100%)',
          border: '2px solid rgba(46, 168, 83, 0.4)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Promedio General
          </div>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: '700', 
            color: data.average_score >= 70 ? '#4ade80' : data.average_score >= 60 ? '#fbbf24' : '#f87171',
            lineHeight: '1'
          }}>
            {Math.round(data.average_score)}%
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}>
          <div style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Completados
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#4ade80' }}>
              {data.labs_completed}
            </div>
          </div>
          <div style={{
            padding: '16px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
              Pendientes
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#94a3b8' }}>
              {Math.max(0, 20 - data.labs_completed)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TimePerformanceProps {
  data: Array<{
    tipo_juego: string
    icono: string
    avg_time_seconds: number
  }>
}

export function TimePerformanceChart({ data }: TimePerformanceProps) {
  const chartData = {
    labels: data.map(item => item.tipo_juego),
    datasets: [
      {
        label: 'Tiempo Promedio (minutos)',
        data: data.map(item => (item.avg_time_seconds / 60).toFixed(1)),
        backgroundColor: 'rgba(249, 115, 22, 0.6)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const mins = Math.floor(context.parsed.x)
            const secs = Math.round((context.parsed.x - mins) * 60)
            return `Tiempo: ${mins} min ${secs} seg`
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutos',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b'
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 }
        }
      }
    }
  }

  return <Bar data={chartData} options={options} />
}

interface WeeklyProgressProps {
  data: Array<{
    week_start: string
    labs_completados: number
    promedio_semanal: number
    tiempo_promedio: number
  }>
}

export function WeeklyProgressChart({ data }: WeeklyProgressProps) {
  const chartData = {
    labels: data.map(item => item.week_start),
    datasets: [
      {
        label: 'Labs Completados',
        data: data.map(item => item.labs_completados),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Promedio (%)',
        data: data.map(item => item.promedio_semanal),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Labs Completados',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b',
          stepSize: 1
        },
        beginAtZero: true
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Promedio (%)',
          color: '#64748b',
          font: { size: 12, weight: 600 as any }
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#64748b'
        },
        max: 100,
        beginAtZero: true
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#64748b',
          font: { size: 12 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    }
  }

  return <Line data={chartData} options={options} />
}

