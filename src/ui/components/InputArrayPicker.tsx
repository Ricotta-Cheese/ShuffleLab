import { useState } from 'react'
import { parseCustom, randomDistinctValues } from '../inputArray'
import { Button, Segmented, Select } from './ui'

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
        <span className="text-ink-2">입력 배열</span>
        <Segmented
          ariaLabel="입력 배열 방식"
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(undefined)
            if (m === 'custom') setText(value.join(', '))
          }}
          options={[
            { value: 'random', label: '랜덤 배열' },
            { value: 'custom', label: '직접 입력' },
          ]}
        />

        {mode === 'random' && (
          <>
            <Select
              label="원소 수"
              value={value.length}
              onChange={(n) => onChange(randomDistinctValues(n))}
              options={Array.from({ length: maxN - minN + 1 }, (_, k) => ({ value: k + minN, label: String(k + minN) }))}
            />
            <Button size="sm" onClick={() => onChange(randomDistinctValues(value.length))}>
              새 배열
            </Button>
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
            aria-describedby="input-array-help"
            className={`w-full rounded-md border bg-surface px-3 py-1.5 font-mono text-ink ${
              error ? 'border-bad' : 'border-line-strong'
            }`}
          />
          <p id="input-array-help" className={`mt-1 text-xs ${error ? 'text-bad' : 'text-ink-3'}`}>
            {error ?? `쉼표나 공백으로 구분해 서로 다른 원소 ${minN}~${maxN}개를 입력한다. 숫자가 아니어도 된다.`}
          </p>
        </div>
      )}

      <p className="font-mono text-xs text-ink-3">[{value.join(', ')}]</p>
    </div>
  )
}
