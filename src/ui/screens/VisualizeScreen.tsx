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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AlgorithmPicker value={id} onChange={setId} />
        <div className="flex flex-wrap items-center gap-3">
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
          <Segmented
            ariaLabel="보기 방식"
            size="sm"
            value={view}
            onChange={(v) => setParam('view', v)}
            options={[
              { value: 'step', label: '한 단계씩' },
              { value: 'all', label: '전체 펼치기' },
            ]}
          />
        </div>
      </div>

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
    <div data-tour="viz-player" className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
            <span>
              초기 배열 <span className="font-mono text-ink">[{initial.join(', ')}]</span>
            </span>
            <Legend riffle={isRiffle} />
          </div>
          <ArrayStage step={step} n={initial.length} withOutput={isPickRemove} withPiles={isRiffle} durationMs={Math.min(450, delay * 0.6)} />

          {/* 단계 설명은 배열 바로 아래에 두어 시선이 멀리 움직이지 않게 한다 */}
          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="font-mono">
                단계 {index} / {last}
              </span>
              <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">{step.kind}</span>
            </div>
            <div aria-live="polite">
              <p className="mt-2 font-semibold">{step.what}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">
                <span className="font-medium text-ink">왜? </span>
                {step.why}
              </p>
            </div>
          </div>
        </Card>

        {/* 모바일에서는 화면 아래에 붙어 있어서, 배열과 설명을 보면서 바로 조작할 수 있다 */}
        <Card className="sticky bottom-2 z-10 space-y-3 shadow-lg shadow-black/20 lg:static lg:shadow-none">
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
            <Button size="sm" onClick={() => go(0)} aria-label="처음으로" title="처음으로">
              ⏮
            </Button>
            <Button size="sm" onClick={() => go(index - 1)} aria-label="이전 단계" title="이전 단계" disabled={index === 0}>
              ◀ 이전
            </Button>
            <Button size="sm" variant="primary" onClick={togglePlay} className="min-w-20">
              {playing ? '일시정지' : index >= last ? '다시 재생' : '재생'}
            </Button>
            <Button size="sm" onClick={() => go(index + 1)} aria-label="다음 단계" title="다음 단계" disabled={index === last}>
              다음 ▶
            </Button>
            <Button size="sm" onClick={() => go(last)} aria-label="끝으로" title="끝으로">
              ⏭
            </Button>
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
          <p className="hidden text-xs text-ink-3 lg:block">키보드: ← → 단계 이동, 스페이스 재생/일시정지</p>
        </Card>
      </div>

      <aside className="space-y-4">
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

        <Card>
          <CardHeader title="현재 배치의 관계성" />
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
            <Metric label="관계성 지수 R = |τ|" value={fmtNum(rel.r)} />
            <Metric label="순서 유지 쌍 C" value={String(rel.concordant)} />
            <Metric label="순서 뒤집힌 쌍 D" value={String(rel.discordant)} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            τ = 1은 원본과 같은 순서, −1은 완전히 반대 순서예요. R은 원본 순서와의 관계를 나타낼 뿐 무작위성 점수가
            아니에요.
            {isPickRemove && ' 이 알고리즘은 중간 단계에서 "결과 배열 뒤에 남은 배열을 이어 붙인 배치"로 계산해요.'}
          </p>
        </Card>

        <Card>
          <CardHeader title="누적 연산 횟수" />
          <div className="grid grid-cols-2 gap-3">
            {visibleCounters[id].map((k) => (
              <Metric key={k} label={counterLabels[k]} value={String(step.counters[k])} />
            ))}
          </div>
        </Card>
      </aside>
    </div>
  )
}

function Legend({ riffle }: { riffle: boolean }) {
  return (
    <span className="flex flex-wrap gap-3">
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
