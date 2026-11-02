import { algorithms, type AlgorithmId } from '../../core/algorithms'

export default function AlgorithmPicker({
  value,
  onChange,
}: {
  value: AlgorithmId
  onChange: (id: AlgorithmId) => void
}) {
  return (
    <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-1 md:inline-grid md:grid-cols-4">
      {algorithms.map((a) => (
        <button
          key={a.id}
          role="tab"
          aria-selected={a.id === value}
          onClick={() => onChange(a.id)}
          className={`rounded-md px-2 py-1.5 text-sm leading-tight md:px-3 md:whitespace-nowrap ${
            a.id === value ? 'bg-white font-semibold shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {a.name}
        </button>
      ))}
    </div>
  )
}
