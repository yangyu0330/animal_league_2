import type { DepartmentCategory, PressureLevel } from '@/lib/types'

interface MascotCardProps {
  category: DepartmentCategory
  pressureLevel: PressureLevel
  totalClicks: number
  stackCount: number
}

const categoryIcons: Partial<Record<DepartmentCategory, string>> = {
  공학: '기어',
  자연과학: '실험',
  인문: '서가',
  사회과학: '네트워크',
  '경영/경제': '보드',
  '예술/체육': '무대',
  교육: '클래스',
  '보건/의학': '모니터',
}

function getCategoryIcon(category: DepartmentCategory): string {
  return categoryIcons[category] ?? 'stack'
}

const pressureBackgrounds: Record<PressureLevel, string> = {
  0: 'from-pressure-0/50 to-pressure-0/20',
  1: 'from-pressure-1/55 to-pressure-1/25',
  2: 'from-pressure-2/55 to-pressure-2/25',
  3: 'from-pressure-3/60 to-pressure-3/30',
  4: 'from-pressure-4/65 to-pressure-4/35',
}

const pressureFaces: Record<PressureLevel, string> = {
  0: '^_^',
  1: '-_-',
  2: 'T_T',
  3: ';_;',
  4: 'x_x',
}

function StackVisual({ stackCount }: { stackCount: number }) {
  const visible = Math.min(stackCount, 12)
  const hidden = Math.max(stackCount - visible, 0)

  return (
    <div className="flex items-end gap-1">
      {Array.from({ length: visible }).map((_, index) => (
        <span
          key={`stack-${index}`}
          className="h-4 w-2 rounded-sm border border-foreground/20 bg-foreground/90"
          style={{ opacity: 0.45 + index * 0.03 }}
        />
      ))}
      {hidden > 0 ? <span className="text-xs font-semibold text-foreground">+{hidden}</span> : null}
    </div>
  )
}

export function MascotCard({ category, pressureLevel, totalClicks, stackCount }: MascotCardProps) {
  return (
    <section
      className={`relative min-h-[220px] rounded-2xl border border-border bg-gradient-to-b ${pressureBackgrounds[pressureLevel]} p-4`}
    >
      <div className="absolute right-4 top-4 rounded-full bg-card/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
        {getCategoryIcon(category)}
      </div>
      <div className="flex h-full flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">계열 템플릿</p>
          <p className="text-sm font-semibold text-foreground">{category}</p>
        </div>
        <div className="text-center">
          <p className="number-display text-5xl font-bold text-foreground">{pressureFaces[pressureLevel]}</p>
          <p className="mt-2 text-xs text-muted-foreground">압박 상태</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">총 클릭</p>
              <p className="number-display text-xl font-bold text-foreground">{totalClicks.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">학생 스택</p>
              <p className="number-display text-xl font-bold text-foreground">{stackCount}</p>
            </div>
          </div>
          <StackVisual stackCount={stackCount} />
        </div>
      </div>
    </section>
  )
}
