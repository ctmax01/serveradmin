import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'

interface ColorAlphaPickerProps {
  value: string
  onChange: (val: string) => void
}

function hexToRgba(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length === 8) {
    const a = Math.round((parseInt(clean.slice(6, 8), 16) / 255) * 100)
    return { color: '#' + clean.slice(0, 6), alpha: a }
  }
  if (clean.length === 6) {
    return { color: '#' + clean, alpha: 100 }
  }
  return { color: '#ffff00', alpha: 100 }
}

function rgbaToHex(color: string, alpha: number) {
  const a = Math.round((alpha / 100) * 255)
    .toString(16)
    .padStart(2, '0')
  return color + a
}

export function ColorAlphaPicker({ value, onChange }: ColorAlphaPickerProps) {
  const parsed = value ? hexToRgba(value) : { color: '#ffff00', alpha: 100 }
  const [color, setColor] = useState(parsed.color)
  const [alpha, setAlpha] = useState(parsed.alpha)
  const colorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value) {
      const p = hexToRgba(value)
      setColor(p.color)
      setAlpha(p.alpha)
    }
  }, [value])

  const handleColor = (c: string) => {
    setColor(c)
    onChange(rgbaToHex(c, alpha))
  }

  const handleAlpha = (a: number) => {
    setAlpha(a)
    onChange(rgbaToHex(color, a))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div
          className="relative w-10 h-10 rounded-md border-2 border-border cursor-pointer shrink-0 overflow-hidden"
          onClick={() => colorInputRef.current?.click()}
          title="Выбрать цвет"
          style={{
            backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          }}
        >
          <div className="absolute inset-0" style={{ background: value }} />
        </div>

        <input
          ref={colorInputRef}
          type="color"
          value={color}
          onChange={(e) => handleColor(e.target.value)}
          className="sr-only"
        />

        {/* Прозрачность */}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Прозрачность</span>
            <span>{alpha}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={alpha}
            onChange={(e) => handleAlpha(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Ручной ввод */}
      <Input
        className="font-mono text-xs"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          onChange(v)
          if (/^#[0-9a-fA-F]{8}$/.test(v)) {
            const p = hexToRgba(v)
            setColor(p.color)
            setAlpha(p.alpha)
          }
        }}
        placeholder="#rrggbbaa"
      />
    </div>
  )
}
