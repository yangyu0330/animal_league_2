'use client'

import Link from 'next/link'
import type { RankingItem } from '@/lib/types'
import { PressureBadge } from './pressure-badge'

interface RankingCardProps {
  item: RankingItem
}

export function RankingCard({ item }: RankingCardProps) {
  return (
    <Link
      href={`/departments/${item.departmentId}`}
      className="flex h-[72px] items-center gap-3 px-3 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors"
    >
      <div className="flex-shrink-0 w-8 text-center">
        <span className={`number-display text-xl font-bold ${
          item.rank <= 3 ? 'text-primary' : 'text-muted-foreground'
        }`}>
          {item.rank}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">
          {item.departmentName}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {item.schoolName}
        </p>
      </div>

      <div className="flex flex-col items-end leading-tight">
        <span className="number-display text-sm font-bold text-foreground">
          {item.totalClicks.toLocaleString()}
        </span>
        <span className="number-display text-[11px] text-muted-foreground">
          스택 {item.stackCount}
        </span>
      </div>
      <div className="flex-shrink-0">
        <PressureBadge level={item.pressureLevel} size="sm" />
      </div>
    </Link>
  )
}
