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
  /** 아래 더미 줄을 따로 보여줄지 (Riffle) */
  withPiles: boolean
  durationMs: number
}

type Role = 'i' | 'j' | 'ij' | 'top' | 'bottom' | 'fixed' | 'none'

const cardStyle: Record<Role, string> = {
  i: 'border-role-i bg-role-i text-role-ink',
  j: 'border-role-j bg-role-j text-role-ink',
  ij: 'border-role-i bg-role-j text-role-ink ring-2 ring-role-i ring-offset-2 ring-offset-surface',
  // Riffle의 위·아래 더미는 i·j와 같은 두 역할 색을 빌려 쓰고, 글자 표시(위/아래)로 구분한다
  top: 'border-role-i bg-role-i text-role-ink',
  bottom: 'border-role-j bg-role-j text-role-ink',
  // 확정된 칸은 색 대신 중립 톤 + 굵은 테두리 + ✓ 표시로 구분한다
  fixed: 'border-ink-3 bg-surface-3 text-ink',
  none: 'border-line-strong bg-surface text-ink',
}

/**
 * 배열 칸을 카드로 그린다. 카드는 원소 값으로 key를 잡아서,
 * 원소가 다른 칸이나 다른 줄로 옮겨 가면 위치가 애니메이션으로 이어진다.
 */
export default function ArrayStage({ step, n, withOutput, withPiles, durationMs }: Props) {
  const rows = withOutput ? ['남은 배열', '결과 배열'] : withPiles ? ['작업 배열 · 위 더미', '아래 더미'] : ['작업 배열']
  const fixed = new Set(step.fixed)

  // Riffle: 나누는 단계에서는 아래 더미를 같은 칸 그대로 한 줄 내리고, 내려놓는 단계에서는 카드가 온 더미를 표시한다
  const pileOf = (idx: number): Role | undefined => {
    if (step.cut !== undefined) return idx < step.cut ? 'top' : 'bottom'
    if (step.source) return step.source[idx] === 0 ? 'top' : 'bottom'
  }

  const items = [
    ...step.array.map((value, idx) => {
      const isI = step.i === idx
      const isJ = step.j === idx
      const role: Role =
        isI && isJ ? 'ij' : isI ? 'i' : isJ ? 'j' : fixed.has(idx) ? 'fixed' : (pileOf(idx) ?? 'none')
      const row = step.cut !== undefined && idx >= step.cut ? 1 : 0
      return { value, row, idx, role, key: step.keys?.[idx] }
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
    <div
      className="relative select-none"
      style={{ height: rows.length * ROW_H }}
      role="img"
      aria-label={[
        `${rows[0]} [${step.array.join(', ')}]`,
        step.output && `결과 배열 [${step.output.join(', ')}]`,
        step.i !== undefined && `i = ${step.i}`,
        step.j !== undefined && `j = ${step.j}`,
        step.cut !== undefined && `위 더미 ${step.cut}장, 아래 더미 ${n - step.cut}장`,
        step.source && `카드가 온 더미 ${step.source.map((b) => (b === 0 ? '위' : '아래')).join(', ')}`,
        step.fixed.length > 0 && `확정된 칸 ${step.fixed.join(', ')}`,
      ]
        .filter(Boolean)
        .join(', ')}
    >
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
        const tag = { ij: 'i=j', i: 'i', j: 'j', top: '위', bottom: '아래', fixed: '✓', none: '' }[it.role]
        return (
          <div
            key={it.value}
            className="absolute px-0.5 transition-[left,top] ease-in-out motion-reduce:transition-none"
            style={{ left: left(it.idx), width, top, ...transition }}
          >
            <div
              className={`text-center font-mono text-xs font-bold ${
                it.role === 'j' || it.role === 'bottom'
                  ? 'text-role-j'
                  : it.role === 'fixed'
                    ? 'text-ink-3'
                    : 'text-role-i'
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
