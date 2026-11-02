import { algorithms, type AlgorithmId } from '../../core/algorithms'
import { algoColor } from '../chartTheme'

export default function AlgorithmPicker({
  value,
  onChange,
}: {
  value: AlgorithmId
  onChange: (id: AlgorithmId) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="알고리즘"
      className="grid grid-cols-2 gap-1 rounded-lg bg-surface-3 p-1 md:inline-grid md:grid-cols-4"
    >
      {algorithms.map((a) => {
        const on = a.id === value
        return (
          <button
            key={a.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(a.id)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm leading-tight transition-colors md:px-3 md:whitespace-nowrap ${
              on ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: algoColor[a.id] }} />
            {a.name}
          </button>
        )
      })}
    </div>
  )
}
