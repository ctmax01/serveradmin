import { parse, parseISO, isValid, format } from 'date-fns'

const DATE_FORMATS = [
  'dd.MM.yyyy HH:mm:ss',
  'dd.MM.yyyy HH:mm',
  'dd.MM.yyyy',
  'yyyy-MM-dd HH:mm:ss',
  'yyyy-MM-dd',
  "yyyy-MM-dd'T'HH:mm:ss",
]

export function parseAnyDate(val: unknown): Date | null {
  if (!val) return null
  const str = String(val).trim()

  try {
    const iso = parseISO(str)
    if (isValid(iso)) return iso
  } catch {}

  for (const fmt of DATE_FORMATS) {
    try {
      const d = parse(str, fmt, new Date())
      if (isValid(d)) return d
    } catch {}
  }

  const native = new Date(str)
  return isNaN(native.getTime()) ? null : native
}

export function formatDate(val: unknown, fmt = 'dd.MM.yyyy HH:mm'): string {
  const date = parseAnyDate(val)
  if (!date) return val ? String(val) : '—'
  return format(date, fmt)
}
