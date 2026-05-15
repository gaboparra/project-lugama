import { useState, useEffect, useRef } from 'react'

const ITEMS = [
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
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button className="btn-header flex items-center gap-2" onClick={() => setOpen(v => !v)}>
        ? <span className="hidden sm:inline">Instrucciones</span>
      </button>

      {open && (
        <div className="absolute top-12 right-0 w-80 sm:w-96 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-xl"
          style={{ background: 'rgba(20,20,25,0.97)', border: '1px solid var(--border)' }}>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-purple-h" style={{ fontFamily: 'Syne' }}>
              ¿Cómo se juega?
            </h3>
            <button className="btn-volume text-lg" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="flex flex-col gap-3">
            {ITEMS.map(({ icon, text }, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-lg w-6 flex-shrink-0">{icon}</span>
                <p className="text-xs leading-relaxed opacity-90 text-white-custom">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}