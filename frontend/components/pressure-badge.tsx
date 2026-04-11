import type { PressureLevel } from '@/lib/types'

interface PressureBadgeProps {
  level: PressureLevel
  size?: 'sm' | 'md' | 'lg'
}

const levelLabels: Record<PressureLevel, string> = {
  0: '0단계',
  1: '1단계',
  2: '2단계',
  3: '3단계',
  4: '4단계',
}

const levelColors: Record<PressureLevel, string> = {
  0: 'bg-pressure-0 text-green-800',
  1: 'bg-pressure-1 text-yellow-800',
  2: 'bg-pressure-2 text-orange-800',
  3: 'bg-pressure-3 text-orange-900',
  4: 'bg-pressure-4 text-white',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export function PressureBadge({ level, size = 'md' }: PressureBadgeProps) {
  return (
    <span 
      className={`inline-flex items-center font-semibold rounded-full ${levelColors[level]} ${sizeClasses[size]}`}
    >
      {levelLabels[level]}
    </span>
  )
}
