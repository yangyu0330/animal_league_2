'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { searchSchools } from '@/lib/api/schools'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { School } from '@/lib/types'

interface SchoolSelectorProps {
  value: string | null
  valueLabel?: string | null
  onChange: (schoolId: string | null, schoolName: string | null) => void
  showAllOption?: boolean
}

export function SchoolSelector({
  value,
  valueLabel = null,
  onChange,
  showAllOption = true,
}: SchoolSelectorProps) {
  const [options, setOptions] = useState<School[]>([])
  const selectedSchool = value ? options.find((school) => school.id === value) : null

  useEffect(() => {
    let cancelled = false

    async function loadSchools() {
      try {
        const schoolItems = await searchSchools('', 200)
        if (!cancelled) {
          setOptions(schoolItems)
        }
      } catch {
        if (!cancelled) {
          setOptions([])
        }
      }
    }

    void loadSchools()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 rounded-xl border-border bg-card">
          <span className="max-w-[120px] truncate">
            {selectedSchool ? selectedSchool.name : valueLabel ?? '?꾧뎅'}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] w-56 overflow-y-auto">
        {showAllOption && (
          <DropdownMenuItem onClick={() => onChange(null, null)}>
            <span className="flex-1">?꾧뎅</span>
            {!value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        )}
        {options.map((school) => (
          <DropdownMenuItem key={school.id} onClick={() => onChange(school.id, school.name)}>
            <span className="flex-1">{school.name}</span>
            {value === school.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
