import { algorithms, type AlgorithmId } from '../../core/algorithms'
import { algoColor } from '../chartTheme'
import { sliderClass, useSlider } from '../useSlider'

/** 알고리즘 하나를 고르는 버튼 묶음. 선택 상태는 aria-pressed로 알린다. */
export default function AlgorithmPicker({
  value,
  onChange,
}: {
  value: AlgorithmId
  onChange: (id: AlgorithmId) => void
}) {
  const [ref, slider] = useSlider<HTMLDivElement>(value)
  return (
    <div
      ref={ref}
      role="group"
      aria-label="알고리즘 선택"
      className="relative grid grid-cols-2 gap-1 rounded-lg bg-surface-3 p-1 md:inline-grid md:grid-cols-4"
    >
      <span aria-hidden className={`${sliderClass} rounded-md bg-surface shadow-sm`} style={slider} />
      {algorithms.map((a) => {
        const on = a.id === value
        return (
          <button
            key={a.id}
            aria-pressed={on}
            data-active={on}
            onClick={() => onChange(a.id)}
            className={`relative flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm leading-tight transition active:scale-95 md:px-3 md:whitespace-nowrap ${
              on ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full transition-transform duration-300 ${on ? 'scale-150' : ''}`} style={{ background: algoColor[a.id] }} />
            {a.name}
          </button>
        )
      })}
    </div>
  )
}
