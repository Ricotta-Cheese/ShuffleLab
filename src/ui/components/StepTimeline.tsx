import { useEffect, useMemo, useRef } from 'react'
import type { AlgorithmId, Trace } from '../../core/algorithms'
import { buildTimeline, rowOfStep, type CellRole, type TimelineLine } from '../stepTimeline'

// 칸 모양. 단계 보기(ArrayStage)와 같은 역할 색을 쓰되, 한눈에 여러 줄을 보도록 옅은 바탕으로 칠한다.
const cellClass: Record<CellRole, string> = {
  i: 'border-role-i bg-role-i/15 text-role-i',
  j: 'border-role-j bg-role-j/15 text-role-j',
  ij: 'border-role-i bg-role-j/15 text-role-j ring-2 ring-role-i ring-offset-1 ring-offset-surface',
  top: 'border-role-i bg-role-i/15 text-role-i',
  bottom: 'border-role-j bg-role-j/15 text-role-j',
  new: 'border-role-i bg-role-i/15 text-role-i',
  fixed: 'border-transparent bg-surface-3 text-ink-2',
  none: 'border-line-strong bg-surface text-ink',
}
const tagClass = (role: CellRole) => (role === 'j' || role === 'bottom' || role === 'ij' ? 'text-role-j' : 'text-role-i')

/** 알고리즘마다 칸 색이 뜻하는 것 */
const legends: Record<AlgorithmId, { role: CellRole; label: string }[]> = {
  'fisher-yates': [
    { role: 'i', label: 'i: 이번에 확정할 칸' },
    { role: 'j', label: 'j: 무작위로 고른 칸' },
    { role: 'fixed', label: '이미 확정된 칸' },
  ],
  'pick-remove': [
    { role: 'j', label: 'k: 무작위로 뽑은 칸' },
    { role: 'new', label: '이번에 결과에 붙인 원소' },
    { role: 'fixed', label: '먼저 붙인 원소' },
  ],
  riffle: [
    { role: 'top', label: '위 더미에서 온 카드' },
    { role: 'bottom', label: '아래 더미에서 온 카드' },
    { role: 'fixed', label: '완료' },
  ],
  'random-key': [
    { role: 'i', label: 'i: 이번에 키를 붙인 원소' },
    { role: 'fixed', label: '완료' },
  ],
}

function Line({ line, n }: { line: TimelineLine; n: number }) {
  // 모든 줄이 같은 칸 폭을 써서 위아래 행의 칸 번호가 맞게 한다
  const grid = { gridTemplateColumns: `repeat(${n}, minmax(0, 2.75rem))` }
  // 표시(i, j, k …)가 하나도 없는 줄은 표시 자리를 비워 두지 않는다
  const tagged = line.cells.some((c) => c.tag)
  return (
    <div>
      {line.label && <p className="mb-0.5 text-[11px] font-medium text-ink-3">{line.label}</p>}
      <div className="grid gap-1" style={grid}>
        {line.cells.length === 0 ? (
          // 결과 배열이 아직 비어 있을 때
          <div>
            <div className="aspect-square rounded-md border-2 border-dashed border-line-strong" />
          </div>
        ) : (
          line.cells.map((c, k) => (
            <div key={c.value} className="min-w-0 text-center">
              {tagged && <div className={`h-4 font-mono text-[11px] leading-4 font-bold ${tagClass(c.role)}`}>{c.tag}</div>}
              <div
                className={`flex aspect-square flex-col items-center justify-center rounded-md border-2 font-semibold ${cellClass[c.role]}`}
              >
                <span className="text-sm leading-none sm:text-base">{c.value}</span>
                {c.key !== undefined && <span className="mt-0.5 font-mono text-[9px] leading-none opacity-80">{c.key.toFixed(2)}</span>}
              </div>
              <div className="font-mono text-[10px] leading-4 text-ink-3">{k}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/**
 * 셔플 과정 전체를 보고서의 단계 다이어그램처럼 위에서 아래로 펼쳐 보여준다.
 * 행을 누르면 그 단계부터 한 단계씩 보기로 돌아간다.
 */
export default function StepTimeline({
  id,
  name,
  seed,
  initial,
  trace,
  currentStep,
  summary,
  onOpenStep,
}: {
  id: AlgorithmId
  name: string
  seed: number
  initial: number[]
  trace: Trace<number>
  /** 한 단계씩 보기에서 보고 있던 단계. 그 행을 표시하고 화면에 보이게 한다. */
  currentStep: number
  summary: string
  onOpenStep: (stepIndex: number) => void
}) {
  const rows = useMemo(() => buildTimeline(trace), [trace])
  const current = currentStep > 0 ? rowOfStep(rows, currentStep) : -1
  const currentRef = useRef<HTMLButtonElement>(null)
  const n = initial.length

  // 보던 단계가 있으면 처음 펼칠 때 그 행으로 스크롤한다
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div data-tour="viz-timeline" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="font-semibold">{name} 단계별 동작</h3>
          <p className="mt-0.5 text-xs text-ink-3">
            입력 <span className="font-mono text-ink-2">[{initial.join(', ')}]</span> · 시드 {seed} (SFC32) · 행을 누르면 그
            단계부터 한 단계씩 볼 수 있어요
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-2">
          {legends[id].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded-sm border-2 ${cellClass[l.role]}`} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <ol className="space-y-0">
        {rows.map((row, r) => (
          <li key={r}>
            {r > 0 && (
              <div aria-hidden className="py-1 pl-6 text-ink-3 md:pl-[calc(7rem+1.25rem)]">
                ↓
              </div>
            )}
            <button
              ref={r === current ? currentRef : undefined}
              onClick={() => onOpenStep(row.stepIndex)}
              aria-current={r === current ? 'step' : undefined}
              className={`grid w-full scroll-mt-24 gap-x-5 gap-y-3 rounded-xl border bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-2 md:grid-cols-[7rem_auto_minmax(0,1fr)] md:items-center ${
                r === current ? 'border-focus ring-1 ring-focus' : 'border-line'
              }`}
            >
              <div>
                <p className="font-semibold">{row.label}</p>
                {row.sub && <p className="text-xs text-ink-3">{row.sub}</p>}
              </div>
              <div className="min-w-0 space-y-1.5">
                {row.lines.map((line, k) => (
                  <Line key={k} line={line} n={n} />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{row.what}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{row.why}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>

      <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-2">{summary}</p>
    </div>
  )
}
