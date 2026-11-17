import { useEffect, useRef, useState } from 'react'

// Input de código en casillas separadas (un dígito por casilla).
// Recibe/entrega el valor como string (p. ej. "483193").
export default function CodigoInput({ value = '', onChange, length = 6, autoFocus = true, disabled = false }) {
  const refs = useRef([])
  const [digits, setDigits] = useState(() => Array.from({ length }, (_, i) => value[i] || ''))

  // Si el valor externo cambia (por ejemplo, al limpiar el formulario),
  // sincronizar las casillas.
  useEffect(() => {
    if (digits.join('') !== value) {
      setDigits(Array.from({ length }, (_, i) => value[i] || ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (next) => {
    setDigits(next)
    onChange(next.join('').slice(0, length))
  }

  const focusAt = (i) => refs.current[Math.max(0, Math.min(i, length - 1))]?.focus()

  const handleChange = (i, e) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) {
      const next = digits.slice()
      next[i] = ''
      commit(next)
      return
    }
    // Varios dígitos de golpe (autocompletar / pegado)
    if (raw.length > 1) {
      const next = digits.slice()
      for (let k = 0; k < raw.length && i + k < length; k++) next[i + k] = raw[k]
      commit(next)
      focusAt(i + raw.length)
      return
    }
    const next = digits.slice()
    next[i] = raw
    commit(next)
    if (i < length - 1) focusAt(i + 1)
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = digits.slice()
      if (next[i]) {
        next[i] = ''
        commit(next)
      } else if (i > 0) {
        next[i - 1] = ''
        commit(next)
        focusAt(i - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAt(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(i + 1)
    }
  }

  const handlePaste = (i, e) => {
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '')
    if (!text) return
    e.preventDefault()
    const next = digits.slice()
    for (let k = 0; k < text.length && i + k < length; k++) next[i + k] = text[k]
    commit(next)
    focusAt(i + text.length)
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`Dígito ${i + 1}`}
          className="h-14 w-11 rounded-xl border border-white/10 bg-night-900/70 text-center font-mono text-2xl font-black text-amber-400 ring-1 ring-white/5 transition focus:border-amber-500/60 focus:outline-none disabled:opacity-50 sm:h-16 sm:w-12"
        />
      ))}
    </div>
  )
}
