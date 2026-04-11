'use client'

import Link from 'next/link'
import type { TrendingItem } from '@/lib/types'
import { TrendingUp } from 'lucide-react'

interface TrendingCardProps {
  item: TrendingItem
}

export function TrendingCard({ item }: TrendingCardProps) {
  return (
    <Link
      href={`/departments/${item.departmentId}`}
      className="flex-shrink-0 w-40 p-3 bg-card rounded-2xl border border-border hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-1 mb-2 text-primary">
        <TrendingUp className="w-4 h-4" />
        <span className="number-display text-sm font-semibold">+{item.todayClicks}</span>
      </div>
      <h3 className="font-semibold text-sm text-foreground truncate mb-1">
        {item.departmentName}
      </h3>
      <p className="text-xs text-muted-foreground truncate">
        {item.schoolName}
      </p>
    </Link>
  )
}
