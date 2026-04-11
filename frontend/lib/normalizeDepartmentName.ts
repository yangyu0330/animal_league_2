const synonyms: Record<string, string> = {
  "컴퓨터공학부": "컴퓨터공학과",
  "컴공": "컴퓨터공학과",
  "전자전기공학과": "전기전자공학과",
  "경영학부": "경영학과",
  "기계공학부": "기계공학과",
}

export function normalizeDepartmentName(input: string): string {
  let value = input.trim()
  value = value.replace(/\s+/g, " ")
  value = value.replace(/\s/g, "")
  value = value.replace(/[-_.()/]/g, "")
  value = value.toLowerCase()

  if (synonyms[value]) {
    value = synonyms[value]
  }

  return value
}