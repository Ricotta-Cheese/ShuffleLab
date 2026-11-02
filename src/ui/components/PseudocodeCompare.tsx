import { useState } from 'react'
import { algorithms, getAlgorithm, type AlgorithmId } from '../../core/algorithms'
import { algorithmContent } from '../../content/algorithms'
import { algoColor } from '../chartTheme'
import Pseudocode from './Pseudocode'
import { Card, CardHeader, Select } from './ui'

/** 두 의사코드에서 같은 위치의 줄이 다른 곳 (한쪽에만 있는 줄 포함) */
function diffLines(a: string[], b: string[]): number[] {
  const out: number[] = []
  for (let k = 0; k < Math.max(a.length, b.length); k++) if (a[k] !== b[k]) out.push(k)
  return out
}

const options = algorithms.map((a) => ({ value: a.id, label: a.name }))

/** 두 알고리즘의 의사코드를 나란히 놓고 다른 줄을 강조한다 */
export default function PseudocodeCompare() {
  const [left, setLeft] = useState<AlgorithmId>('fisher-yates')
  const [right, setRight] = useState<AlgorithmId>('naive-swap')
  const a = algorithmContent[left].pseudocode
  const b = algorithmContent[right].pseudocode
  const diff = diffLines(a, b)

  const side = (id: AlgorithmId, lines: string[], set: (v: AlgorithmId) => void) => (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[id] }} />
        <Select label="비교할 알고리즘" hideLabel value={id} onChange={set} options={options} />
        <span className="text-xs text-ink-3">{getAlgorithm(id).time}</span>
      </div>
      <Pseudocode lines={lines} active={diff.filter((k) => k < lines.length)} />
    </div>
  )

  return (
    <Card>
      <CardHeader
        title="의사코드 나란히 보기"
        desc={
          left === right
            ? '같은 알고리즘을 골랐어요. 다른 알고리즘을 골라 비교해 보세요.'
            : `강조한 줄이 서로 다른 줄이에요 (${diff.length}줄).` +
              ([left, right].includes('fisher-yates') && [left, right].includes('naive-swap')
                ? ' 두 알고리즘은 반복 방향과 j를 고르는 범위만 다르고, 교환하는 줄은 같아요.'
                : '')
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {side(left, a, setLeft)}
        {side(right, b, setRight)}
      </div>
    </Card>
  )
}
