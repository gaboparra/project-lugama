import { useState, useEffect, useRef } from 'react'

const items = [
  { icon: '🎵', text: 'Vas a escuchar fragmentos de una canción y tenés que adivinar cuál es.' },
  { icon: '⏱️', text: <>Tenés <strong>6 intentos</strong>. En cada intento escuchás más segundos: <strong>0.5s → 1s → 2s → 5s → 10s → 30s</strong>.</> },
  { icon: '⏭️', text: <>Si no la sabés, podés usar <strong>Skip</strong> para saltar el intento.</> },
  { icon: '🔀', text: <>También podés usar <strong>Saltar canción</strong> para recibir una nueva.</> },
  { icon: '🎼', text: <>Elegí un <strong>género musical</strong> para aumentar tus chances.</> },
  { icon: '⭐', text: <>Cuanto antes adivines, más puntos. Si adivinás en el primer intento te llevás una Estrella⭐.</> },
]

export default function InstructionsModal() {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--white)' }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm hover:border-purple-500 transition-colors w-auto">
        ? <span className="font-medium hidden sm:inline">Instrucciones</span>
      </button>

      {open && (
        <div style={{ background: 'rgba(20,20,25,0.97)', border: '1px solid var(--border)' }}
          className="absolute top-12 right-0 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontFamily: 'Syne', color: 'var(--purple-h)' }} className="text-lg font-bold">
              ¿Cómo se juega?
            </h3>
            <button onClick={() => setOpen(false)}
              style={{ color: 'var(--muted)' }} className="text-lg hover:text-white bg-transparent border-none cursor-pointer w-auto p-0">
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map(({ icon, text }, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-lg w-6 flex-shrink-0">{icon}</span>
                <p style={{ color: 'var(--white)' }} className="text-xs leading-relaxed opacity-90">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}