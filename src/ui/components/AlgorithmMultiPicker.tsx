import { algorithms, type AlgorithmId } from '../../core/algorithms'
import { algoColor } from '../chartTheme'

/** 여러 알고리즘을 고르는 칩. 선택 결과는 항상 알고리즘 목록 순서로 유지한다. 이름표는 쓰는 쪽(SettingRow 등)이 붙인다. */
export default function AlgorithmMultiPicker({
  value,
  onChange,
}: {
  value: AlgorithmId[]
  onChange: (ids: AlgorithmId[]) => void
}) {
  const toggle = (id: AlgorithmId) =>
    onChange(algorithms.map((a) => a.id).filter((x) => (x === id ? !value.includes(id) : value.includes(x))))

  return (
    <div role="group" aria-label="알고리즘" className="flex flex-wrap items-center gap-2 text-sm">
      {algorithms.map((a) => {
        const on = value.includes(a.id)
        return (
          <label
            key={a.id}
            className={`flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus ${
              on ? 'border-ink-2 bg-surface-3 text-ink' : 'border-line-strong text-ink-3 hover:text-ink-2'
            }`}
          >
            <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(a.id)} />
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: on ? algoColor[a.id] : 'var(--line-strong)' }}
            />
            {a.name}
          </label>
        )
      })}
    </div>
  )
}
