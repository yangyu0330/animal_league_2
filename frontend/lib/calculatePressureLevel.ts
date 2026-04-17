export function calculatePressureLevel(totalClicks: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  if (totalClicks < 500) return 0
  if (totalClicks < 1000) return 1
  if (totalClicks < 1500) return 2
  if (totalClicks < 2000) return 3
  if (totalClicks < 2500) return 4
  if (totalClicks < 3000) return 5
  return 6
}