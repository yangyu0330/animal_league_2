export function calculatePressureLevel(totalClicks: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  if (totalClicks < 1000) return 0
  if (totalClicks < 5000) return 1
  if (totalClicks < 10000) return 2
  if (totalClicks < 25000) return 3
  if (totalClicks < 50000) return 4
  if (totalClicks < 100000) return 5
  return 6
}