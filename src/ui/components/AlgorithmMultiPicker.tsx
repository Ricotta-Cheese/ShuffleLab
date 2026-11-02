import { algorithms, type AlgorithmId } from '../../core/algorithms'

/** 여러 알고리즘을 고르는 칩. 선택 결과는 항상 알고리즘 목록 순서로 유지한다. */
export default function AlgorithmMultiPicker({
  value,
  onChange,
  colors,
}: {
  value: AlgorithmId[]
  onChange: (ids: AlgorithmId[]) => void
  /** 차트 색상과 맞출 때 칩 앞에 색 점을 붙인다 */
  colors?: Record<AlgorithmId, string>
}) {
  const toggle = (id: AlgorithmId) =>
    onChange(algorithms.map((a) => a.id).filter((x) => (x === id ? !value.includes(id) : value.includes(x))))

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="mr-1 font-medium">알고리즘</span>
      {algorithms.map((a) => {
        const on = value.includes(a.id)
        return (
          <label
            key={a.id}
            className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 ${
              on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-600'
            }`}
          >
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(a.id)} />
            {colors && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[a.id] }} />}
            {a.name}
          </label>
        )
      })}
    </div>
  )
}
