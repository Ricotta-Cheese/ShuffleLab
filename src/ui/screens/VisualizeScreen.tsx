import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { getAlgorithm, type AlgorithmId, type Counters, type Trace } from '../../core/algorithms'
import { seededRng } from '../../core/rng'
import { kendall } from '../../core/stats/kendall'
import { algorithmContent } from '../../content/algorithms'
import AlgorithmPicker from '../components/AlgorithmPicker'
import ArrayStage from '../components/ArrayStage'
import Metric from '../components/Metric'
import Pseudocode from '../components/Pseudocode'
import ScreenHeader from '../components/ScreenHeader'
import StepTimeline from '../components/StepTimeline'
import UniformBadge from '../components/UniformBadge'
import { Button, Card, CardHeader, IntInput, Segmented, Select } from '../components/ui'
import { log } from '../console'
import { fmtNum } from '../format'
import { useAlgorithmParam } from '../useAlgorithmParam'

type View = 'step' | 'all'

const MIN_N = 2
const MAX_N = 10
const SPEEDS = [
  { label: '0.5×', ms: 2000 },
  { label: '1×', ms: 1000 },
  { label: '2×', ms: 500 },
]

const counterLabels: Record<keyof Counters, string> = {
  randomCalls: '난수 호출',
  swaps: '교환',
  comparisons: '키 비교',
  reads: '읽기',
  writes: '쓰기',
  shifts: '당긴 원소',
}

const visibleCounters: Record<AlgorithmId, (keyof Counters)[]> = {
  'fisher-yates': ['randomCalls', 'swaps', 'reads', 'writes'],
  'riffle': ['randomCalls', 'reads', 'writes'],
  'pick-remove': ['randomCalls', 'reads', 'writes', 'shifts'],
  'random-key': ['randomCalls', 'comparisons', 'reads', 'writes'],
}

function clampInt(raw: string | null, min: number, max: number, fallback: number) {
  const v = Number(raw)
  return Number.isInteger(v) && v >= min && v <= max ? v : fallback
}

export default function VisualizeScreen() {
  const [id, setId] = useAlgorithmParam()
  const [params, setParams] = useSearchParams()
  const n = clampInt(params.get('n'), MIN_N, MAX_N, 6)
  const seed = clampInt(params.get('seed'), 1, 999_999, 1)
  // 보기 방식: 한 단계씩(기본) 또는 전체 펼치기(?view=all)
  const view: View = params.get('view') === 'all' ? 'all' : 'step'

  const setParam = (key: string, value: number | string) =>
    setParams(
      (p) => {
        p.set(key, String(value))
        return p
      },
      { replace: true },
    )

  const initial = useMemo(() => Array.from({ length: n }, (_, k) => k + 1), [n])
  const trace = useMemo(() => getAlgorithm(id).trace(initial, seededRng(seed)), [id, initial, seed])
  const algo = getAlgorithm(id)

  // 두 보기를 오갈 때 보던 단계를 이어받는다. 알고리즘·크기·시드가 바뀌면 처음부터 다시 본다.
  const traceKey = `${id}-${n}-${seed}`
  const [pos, setPos] = useState({ key: traceKey, index: 0 })
  const current = pos.key === traceKey ? pos.index : 0
  const setCurrent = useCallback(
    (index: number) => setPos((p) => (p.key === traceKey && p.index === index ? p : { key: traceKey, index })),
    [traceKey],
  )

  const final = trace.steps[trace.steps.length - 1].counters
  const summary = visibleCounters[id].map((k) => `${counterLabels[k]} ${final[k]}번`).join(' · ')

  return (
    <div className="space-y-5">
      <ScreenHeader id="visualize"
        title="단계별 동작 시각화"
        desc={`원소 ${MIN_N}~${MAX_N}개로 셔플 과정을 한 단계씩 따라가요. 같은 시드는 항상 같은 과정을 재현해요.`}
      />

      {/* 설정은 한 카드에: 위 줄은 무엇을 볼지(알고리즘·보기 방식), 아래 줄은 입력(원소 수·시드) */}
      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AlgorithmPicker value={id} onChange={setId} />
          <Segmented
            ariaLabel="보기 방식"
            value={view}
            onChange={(v) => setParam('view', v)}
            options={[
              { value: 'step', label: '한 단계씩' },
              { value: 'all', label: '전체 펼치기' },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line pt-4">
          <Select
            label="원소 수"
            value={n}
            onChange={(v) => setParam('n', v)}
            options={Array.from({ length: MAX_N - MIN_N + 1 }, (_, k) => ({ value: k + MIN_N, label: String(k + MIN_N) }))}
          />
          <IntInput label="시드" value={seed} onChange={(v) => setParam('seed', v)} />
          <Button size="sm" onClick={() => setParam('seed', 1 + Math.floor(Math.random() * 999_999))}>
            새로 섞기
          </Button>
          <p className="text-xs text-ink-3 lg:ml-auto">
            입력 <span className="font-mono text-ink-2">[{initial.join(', ')}]</span> · 같은 시드는 항상 같은 과정을 재현해요
          </p>
        </div>
      </Card>

      {view === 'all' ? (
        <Card>
          <StepTimeline
            id={id}
            name={algo.name}
            seed={seed}
            initial={initial}
            trace={trace}
            currentStep={current}
            summary={summary}
            onOpenStep={(index) => {
              setCurrent(index)
              setParam('view', 'step')
            }}
          />
        </Card>
      ) : (
        // 알고리즘·크기·시드가 바뀌면 재생 상태를 처음부터 다시 시작한다
        <Player
          key={traceKey}
          id={id}
          seed={seed}
          initial={initial}
          trace={trace}
          initialIndex={current}
          onIndexChange={setCurrent}
        />
      )}
    </div>
  )
}

function Player({
  id,
  seed,
  initial,
  trace,
  initialIndex,
  onIndexChange,
}: {
  id: AlgorithmId
  seed: number
  initial: number[]
  trace: Trace<number>
  initialIndex: number
  onIndexChange: (index: number) => void
}) {
  const [index, setIndex] = useState(initialIndex)
  const [playRequested, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  const steps = trace.steps
  const last = steps.length - 1
  // 마지막 단계에 닿으면 재생 요청이 남아 있어도 멈춘 것으로 본다
  const playing = playRequested && index < last
  const step = steps[index]
  const delay = SPEEDS[speed].ms
  const algo = getAlgorithm(id)
  const content = algorithmContent[id]
  const isPickRemove = id === 'pick-remove'
  const isRiffle = id === 'riffle'

  // 지금 보고 있는 단계를 콘솔에 남긴다 (StrictMode의 두 번 실행에도 한 번만)
  const loggedIndex = useRef<number>(undefined)
  useEffect(() => {
    if (loggedIndex.current === index) return
    loggedIndex.current = index
    if (index === 0) log('C 시각화', `${algo.name} · 원소 ${initial.length}개 · 시드 ${seed} → 단계 ${last + 1}개`)
    const counters = visibleCounters[id].map((k) => `${counterLabels[k]} ${step.counters[k]}`).join(' · ')
    const arrays = step.output ? `결과 [${step.output.join(', ')}] · 남은 [${step.array.join(', ')}]` : `[${step.array.join(', ')}]`
    log('C 시각화', `#${index} ${step.kind}  ${step.what}\n  ${arrays}\n  ${counters}`, step.kind === 'done' ? 'result' : 'step')
  }, [index, algo.name, initial.length, seed, last, id, step])

  // 전체 펼치기로 바꿨을 때 보던 단계를 표시할 수 있게 알린다
  useEffect(() => onIndexChange(index), [index, onIndexChange])

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => setIndex((k) => Math.min(k + 1, last)), delay)
    return () => clearTimeout(t)
  }, [playing, index, last, delay])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      // 버튼·링크에 포커스가 있을 때 스페이스는 그 버튼을 누르는 키로 둔다
      if (e.key === ' ' && (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) return
      if (e.key === 'ArrowRight') setIndex((k) => Math.min(k + 1, last))
      else if (e.key === 'ArrowLeft') setIndex((k) => Math.max(k - 1, 0))
      else if (e.key === ' ') {
        e.preventDefault()
        togglePlay()
      } else return
      if (e.key !== ' ') setPlaying(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function togglePlay() {
    if (index >= last) {
      setIndex(0)
      setPlaying(true)
    } else setPlaying(!playing)
  }

  // Pick & Remove는 중간 단계에서 "결과 배열 + 남은 배열"을 현재 배치로 본다
  const arrangement = isPickRemove ? [...(step.output ?? []), ...step.array] : step.array
  const rel = kendall(initial, arrangement)

  const go = (k: number) => {
    setPlaying(false)
    setIndex(Math.max(0, Math.min(k, last)))
  }

  return (
    <div data-tour="viz-player" className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* 무대: 배열 → 이번 단계 설명 → 재생 조작을 한 카드 안에 위에서 아래로 둔다 */}
      <Card className="flex flex-col gap-5 self-start">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="flex items-center gap-2 text-sm">
            <span className="font-semibold">
              단계 <span className="font-mono">{index}</span>
              <span className="font-mono font-normal text-ink-3"> / {last}</span>
            </span>
            <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-ink-2">{step.kind}</span>
          </p>
          <Legend riffle={isRiffle} />
        </div>

        <ArrayStage step={step} n={initial.length} withOutput={isPickRemove} withPiles={isRiffle} durationMs={Math.min(450, delay * 0.6)} />

        {/* 단계 설명은 배열 바로 아래에 두어 시선이 멀리 움직이지 않게 한다 */}
        <div aria-live="polite" className="rounded-lg bg-surface-2 px-4 py-3">
          <p className="font-semibold">{step.what}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{step.why}</p>
        </div>

        {/* 재생 조작. 휴대폰에서는 화면 아래에 붙어 있어서 배열과 설명을 보면서 바로 넘길 수 있다 */}
        <div className="sticky bottom-2 z-10 -mx-2 space-y-3 rounded-lg bg-surface p-2 shadow-lg shadow-black/20 lg:static lg:m-0 lg:p-0 lg:shadow-none">
          <input
            type="range"
            min={0}
            max={last}
            value={index}
            onChange={(e) => go(Number(e.target.value))}
            aria-label="단계 이동"
            className="w-full accent-[var(--ink-2)]"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => go(0)} aria-label="처음으로" title="처음으로" disabled={index === 0}>
                ⏮
              </Button>
              <Button size="sm" onClick={() => go(index - 1)} aria-label="이전 단계" title="이전 단계 (←)" disabled={index === 0}>
                ◀ 이전
              </Button>
              <Button size="sm" variant="primary" onClick={togglePlay} className="min-w-20" title="재생/일시정지 (스페이스)">
                {playing ? '일시정지' : index >= last ? '다시 재생' : '재생'}
              </Button>
              <Button size="sm" onClick={() => go(index + 1)} aria-label="다음 단계" title="다음 단계 (→)" disabled={index === last}>
                다음 ▶
              </Button>
              <Button size="sm" variant="ghost" onClick={() => go(last)} aria-label="끝으로" title="끝으로" disabled={index === last}>
                ⏭
              </Button>
            </div>
            <div className="ml-auto">
              <Segmented
                ariaLabel="재생 속도"
                size="sm"
                value={speed}
                onChange={setSpeed}
                options={SPEEDS.map((s, k) => ({ value: k, label: s.label }))}
              />
            </div>
          </div>
        </div>
      </Card>

      <aside className="space-y-5">
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                {algo.name} <UniformBadge uniform={algo.uniform} />
              </span>
            }
          />
          <Pseudocode lines={content.pseudocode} active={content.stepLines[step.kind]} />
        </Card>

        {/* 지금 단계까지의 수치는 한 카드에 모은다 */}
        <Card className="space-y-4">
          <section>
            <h3 className="text-sm font-semibold">누적 연산 횟수</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {visibleCounters[id].map((k) => (
                <Metric key={k} label={counterLabels[k]} value={String(step.counters[k])} />
              ))}
            </div>
          </section>
          <section className="border-t border-line pt-4">
            <h3 className="text-sm font-semibold">원본과의 관계</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
              <Metric label="R = |τ|" value={fmtNum(rel.r)} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-3">
              순서 유지 쌍 C = {rel.concordant}, 뒤집힌 쌍 D = {rel.discordant}. R은 원본과 닮은 정도일 뿐 무작위성
              점수가 아니에요.
              {isPickRemove && ' 중간 단계는 "결과 배열 + 남은 배열"을 이어 붙여 계산해요.'}
            </p>
          </section>
        </Card>
      </aside>
    </div>
  )
}

function Legend({ riffle }: { riffle: boolean }) {
  return (
    <span className="flex flex-wrap gap-3 text-xs text-ink-3">
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm bg-role-i" />
        {riffle ? '위 더미' : 'i: 현재 위치'}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm bg-role-j" />
        {riffle ? '아래 더미' : 'j: 무작위 선택'}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-grid h-3 w-3 place-items-center rounded-sm border border-ink-3 bg-surface-3 text-[8px] leading-none text-ink">
          ✓
        </span>
        확정된 칸
      </span>
    </span>
  )
}
