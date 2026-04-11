'use client'

import { Check, ChevronDown } from 'lucide-react'
import { schools } from '@/lib/catalog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SchoolSelectorProps {
  value: string | null
  onChange: (schoolId: string | null, schoolName: string | null) => void
  showAllOption?: boolean
}

export function SchoolSelector({ value, onChange, showAllOption = true }: SchoolSelectorProps) {
  const selectedSchool = value ? schools.find((school) => school.id === value) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 border-border rounded-xl bg-card">
          <span className="truncate max-w-[120px]">
            {selectedSchool ? selectedSchool.name : '전국'}
          </span>
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
        {showAllOption && (
          <DropdownMenuItem onClick={() => onChange(null, null)}>
            <span className="flex-1">전국</span>
            {!value && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        )}
        {schools.map((school) => (
          <DropdownMenuItem
            key={school.id}
            onClick={() => onChange(school.id, school.name)}
          >
            <span className="flex-1">{school.name}</span>
            {value === school.id && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
