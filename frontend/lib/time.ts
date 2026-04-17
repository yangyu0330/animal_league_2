const KST_OFFSET = '+09:00'
const KST_TIME_ZONE = 'Asia/Seoul'

function getDatePartsInTimeZone(
  date: Date,
  timeZone: string,
): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error(`Failed to resolve date parts for timezone: ${timeZone}`)
  }

  return { year, month, day }
}

export function getKstDateKey(date: Date = new Date()): string {
  const { year, month, day } = getDatePartsInTimeZone(date, KST_TIME_ZONE)
  return `${year}-${month}-${day}`
}

export function getKstDayStartIso(date: Date = new Date()): string {
  return new Date(`${getKstDateKey(date)}T00:00:00${KST_OFFSET}`).toISOString()
}
