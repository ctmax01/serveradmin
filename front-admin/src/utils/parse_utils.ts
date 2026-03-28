function parseDate(val: string): Date | null {
  if (!val) return null
  // формат "24.08.2025 17:40:29"
  const [datePart, timePart] = val.split(' ')
  const [day, month, year] = datePart.split('.')
  const iso = `${year}-${month}-${day}${timePart ? 'T' + timePart : ''}`
  const date = new Date(iso)
  return isNaN(date.getTime()) ? null : date
}
