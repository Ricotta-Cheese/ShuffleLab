import type { Step, StepKind, Trace } from '../core/algorithms'

// C 화면 "전체 펼치기" 보기: 단계 기록(trace)을 보고서의 단계 다이어그램처럼 한 줄씩 쌓을 행으로 바꾼다.
// 고르기와 그 결과를 따로 기록한 단계(선택→교환, 뽑기→옮기기, 나누기→합치기)는 한 행으로 합친다.

export type CellRole = 'i' | 'j' | 'ij' | 'top' | 'bottom' | 'fixed' | 'new' | 'none'

export interface TimelineCell {
  value: number
  role: CellRole
  /** 칸 위에 붙일 짧은 표시 (i, j, k, 위, 아래 …) */
  tag?: string
  /** Random-Key Sort의 키 */
  key?: number
}

export interface TimelineLine {
  label?: string
  cells: TimelineCell[]
}

export interface TimelineRow {
  label: string
  sub?: string
  lines: TimelineLine[]
  what: string
  why: string
  /** 이 행에 들어간 마지막 단계의 번호 (한 단계씩 보기로 돌아갈 때 쓴다) */
  stepIndex: number
}

/** 앞 단계 → 뒤 단계를 한 행으로 합치는 짝 */
const PAIRS: Partial<Record<StepKind, StepKind>> = { select: 'swap', pick: 'move', cut: 'riffle' }

/** 작업 배열 한 줄. 역할은 단계 보기(ArrayStage)와 같은 규칙으로 정한다. */
function arrayLine(step: Step<number>, label?: string, jTag = 'j'): TimelineLine {
  const fixed = new Set(step.fixed)
  const cells = step.array.map((value, idx): TimelineCell => {
    const key = step.keys?.[idx]
    const isI = step.i === idx
    const isJ = step.j === idx
    if (isI && isJ) return { value, key, role: 'ij', tag: 'i=j' }
    if (isI) return { value, key, role: 'i', tag: 'i' }
    if (isJ) return { value, key, role: 'j', tag: jTag }
    if (fixed.has(idx)) return { value, key, role: 'fixed' }
    const pile = step.cut !== undefined ? (idx < step.cut ? 0 : 1) : step.source?.[idx]
    if (pile !== undefined) return pile === 0 ? { value, key, role: 'top', tag: '위' } : { value, key, role: 'bottom', tag: '아래' }
    return { value, key, role: 'none' }
  })
  return { label, cells }
}

/** Pick & Remove의 결과 배열 줄. 이번에 붙인 원소(맨 끝)를 따로 표시한다. */
function outputLine(output: readonly number[], highlightLast: boolean): TimelineLine {
  return {
    label: '결과',
    cells: output.map((value, k) => ({ value, role: highlightLast && k === output.length - 1 ? 'new' : 'fixed' })),
  }
}

function single(step: Step<number>): { lines: TimelineLine[]; sub?: string } {
  if (step.output === undefined) {
    const sub = step.kind === 'assignKey' ? '키 부여' : step.kind === 'sort' ? '키 순서로 정렬' : undefined
    return { lines: [arrayLine(step)], sub }
  }
  // Pick & Remove: 다 옮긴 뒤에는 남은 배열이 비므로 결과만 보여준다
  if (step.kind === 'done') return { lines: [outputLine(step.output, false)] }
  return { lines: [arrayLine(step, '남은 배열'), outputLine(step.output, false)] }
}

function pair(a: Step<number>, b: Step<number>): { lines: TimelineLine[]; sub?: string } {
  if (a.kind === 'select') return { lines: [arrayLine(b)], sub: '교환 후' }
  if (a.kind === 'pick') {
    return {
      lines: [arrayLine(a, '남은 배열 (뽑기 전)', 'k'), outputLine(b.output ?? [], true)],
      sub: `당김 ${b.counters.shifts - a.counters.shifts}번`,
    }
  }
  return { lines: [arrayLine(a, '나눈 뒤'), arrayLine(b, '합친 뒤')], sub: '나누고 합침' }
}

export function buildTimeline(trace: Trace<number>): TimelineRow[] {
  const rows: TimelineRow[] = []
  const { steps } = trace
  let round = 0
  for (let s = 0; s < steps.length; s++) {
    const step = steps[s]
    const label = step.kind === 'init' ? '시작' : step.kind === 'done' ? '완료' : `단계 ${++round}`
    const next = steps[s + 1]
    if (next && PAIRS[step.kind] === next.kind) {
      rows.push({ label, ...pair(step, next), what: `${step.what} → ${next.what}`, why: step.why, stepIndex: s + 1 })
      s++
    } else {
      rows.push({ label, ...single(step), what: step.what, why: step.why, stepIndex: s })
    }
  }
  return rows
}

/** 단계 번호가 들어 있는 행 */
export const rowOfStep = (rows: TimelineRow[], stepIndex: number) => rows.findIndex((r) => r.stepIndex >= stepIndex)
