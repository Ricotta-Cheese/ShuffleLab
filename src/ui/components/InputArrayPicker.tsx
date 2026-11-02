import { useState } from 'react'
import { parseCustom, randomDistinctValues } from '../inputArray'

type Mode = 'random' | 'custom'

/**
 * 입력 배열을 고르는 컨트롤. 랜덤 배열(서로 다른 정수) 또는 직접 입력.
 * 유효한 배열이 정해질 때만 onChange를 부른다.
 */
export default function InputArrayPicker({
  value,
  onChange,
  minN,
  maxN,
}: {
  value: string[]
  onChange: (values: string[]) => void
  minN: number
  maxN: number
}) {
  const [mode, setMode] = useState<Mode>('random')
  const [text, setText] = useState(value.join(', '))
  const [error, setError] = useState<string>()

  const applyCustom = (t: string) => {
    setText(t)
    const res = parseCustom(t, minN, maxN)
    setError(res.error)
    if (res.values) onChange(res.values)
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">입력 배열</span>
        <div className="inline-flex rounded-md bg-slate-200/70 p-0.5">
          {(['random', 'custom'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError(undefined)
                if (m === 'custom') setText(value.join(', '))
              }}
              className={`rounded px-3 py-1 ${mode === m ? 'bg-white font-semibold shadow-sm' : 'text-slate-600'}`}
            >
              {m === 'random' ? '랜덤 배열' : '직접 입력'}
            </button>
          ))}
        </div>

        {mode === 'random' && (
          <>
            <label className="flex items-center gap-2">
              원소 수
              <select
                value={value.length}
                onChange={(e) => onChange(randomDistinctValues(Number(e.target.value)))}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                {Array.from({ length: maxN - minN + 1 }, (_, k) => k + minN).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => onChange(randomDistinctValues(value.length))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50"
            >
              새 배열
            </button>
          </>
        )}
      </div>

      {mode === 'custom' && (
        <div>
          <input
            value={text}
            onChange={(e) => applyCustom(e.target.value)}
            placeholder="예: 3, 8, 1, 5, 9"
            aria-invalid={error !== undefined}
            className={`w-full rounded-md border bg-white px-3 py-1.5 font-mono ${
              error ? 'border-red-400' : 'border-slate-300'
            }`}
          />
          <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}>
            {error ?? `쉼표나 공백으로 구분해 서로 다른 원소 ${minN}~${maxN}개를 입력한다. 숫자가 아니어도 된다.`}
          </p>
        </div>
      )}

      <p className="font-mono text-xs text-slate-500">[{value.join(', ')}]</p>
    </div>
  )
}
