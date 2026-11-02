import type { Step } from '../../core/algorithms'

// 한 줄의 세로 배치 (px)
const LABEL_H = 18
const TAG_H = 18
const CARD_H = 52
const INDEX_H = 18
const ROW_H = LABEL_H + TAG_H + CARD_H + INDEX_H + 10

interface Props {
  step: Step<number>
  /** 칸 수 (원소 수) */
  n: number
  /** 결과 배열 줄을 따로 보여줄지 (Pick & Remove) */
  withOutput: boolean
  durationMs: number
}

type Role = 'i' | 'j' | 'ij' | 'fixed' | 'none'

const cardStyle: Record<Role, string> = {
  i: 'border-role-i bg-role-i text-role-ink',
  j: 'border-role-j bg-role-j text-role-ink',
  ij: 'border-role-i bg-role-j text-role-ink ring-2 ring-role-i ring-offset-2 ring-offset-surface',
  // 확정된 칸은 색 대신 중립 톤 + 굵은 테두리 + ✓ 표시로 구분한다
  fixed: 'border-ink-3 bg-surface-3 text-ink',
  none: 'border-line-strong bg-surface text-ink',
}

/**
 * 배열 칸을 카드로 그린다. 카드는 원소 값으로 key를 잡아서,
 * 원소가 다른 칸이나 다른 줄로 옮겨 가면 위치가 애니메이션으로 이어진다.
 */
export default function ArrayStage({ step, n, withOutput, durationMs }: Props) {
  const rows = withOutput ? ['남은 배열', '결과 배열'] : ['작업 배열']
  const fixed = new Set(step.fixed)

  const items = [
    ...step.array.map((value, idx) => {
      const isI = step.i === idx
      const isJ = step.j === idx
      const role: Role = isI && isJ ? 'ij' : isI ? 'i' : isJ ? 'j' : fixed.has(idx) ? 'fixed' : 'none'
      return { value, row: 0, idx, role, key: step.keys?.[idx] }
    }),
    ...(step.output ?? []).map((value, idx) => ({
      value,
      row: 1,
      idx,
      role: 'fixed' as Role,
      key: undefined,
    })),
  ].sort((a, b) => a.value - b.value)

  const left = (idx: number) => `calc(${idx} * 100% / ${n})`
  const width = `calc(100% / ${n})`
  const transition = { transitionDuration: `${durationMs}ms` }

  return (
    <div className="relative select-none" style={{ height: rows.length * ROW_H }}>
      {rows.map((label, r) => (
        <div key={label} className="absolute inset-x-0" style={{ top: r * ROW_H }}>
          <div className="text-xs font-medium text-ink-3" style={{ height: LABEL_H }}>
            {label}
          </div>
          {Array.from({ length: n }, (_, k) => (
            <div key={k}>
              <div
                className="absolute px-0.5"
                style={{ left: left(k), width, top: LABEL_H + TAG_H, height: CARD_H }}
              >
                <div className="h-full rounded-md border border-dashed border-line" />
              </div>
              <div
                className="absolute text-center font-mono text-[11px] text-ink-3"
                style={{ left: left(k), width, top: LABEL_H + TAG_H + CARD_H + 2 }}
              >
                {k}
              </div>
            </div>
          ))}
        </div>
      ))}

      {items.map((it) => {
        const top = it.row * ROW_H + LABEL_H
        const tag =
          it.role === 'ij' ? 'i=j' : it.role === 'i' || it.role === 'j' ? it.role : it.role === 'fixed' ? '✓' : ''
        return (
          <div
            key={it.value}
            className="absolute px-0.5 transition-[left,top] ease-in-out motion-reduce:transition-none"
            style={{ left: left(it.idx), width, top, ...transition }}
          >
            <div
              className={`text-center font-mono text-xs font-bold ${
                it.role === 'j' ? 'text-role-j' : it.role === 'fixed' ? 'text-ink-3' : 'text-role-i'
              }`}
              style={{ height: TAG_H }}
            >
              {tag}
            </div>
            <div
              className={`flex flex-col items-center justify-center rounded-md border-2 transition-colors ${cardStyle[it.role]}`}
              style={{ height: CARD_H, ...transition }}
            >
              <span className="text-base leading-none font-semibold sm:text-lg">{it.value}</span>
              {it.key !== undefined && (
                <span className="mt-1 font-mono text-[10px] leading-none opacity-80">{it.key.toFixed(3)}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
