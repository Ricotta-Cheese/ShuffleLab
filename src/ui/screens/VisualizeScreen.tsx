import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { getAlgorithm, type AlgorithmId, type Counters, type Trace } from '../../core/algorithms'
import { seededRng } from '../../core/rng'
import { kendall } from '../../core/stats/kendall'
import { algorithmContent } from '../../content/algorithms'
import AlgorithmPicker from '../components/AlgorithmPicker'
import ArrayStage from '../components/ArrayStage'
import Pseudocode from '../components/Pseudocode'
import UniformBadge from '../components/UniformBadge'
import { useAlgorithmParam } from '../useAlgorithmParam'

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
  'naive-swap': ['randomCalls', 'swaps', 'reads', 'writes'],
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

  const setParam = (key: string, value: number) =>
    setParams(
      (p) => {
        p.set(key, String(value))
        return p
      },
      { replace: true },
    )

  const initial = useMemo(() => Array.from({ length: n }, (_, k) => k + 1), [n])
  const trace = useMemo(() => getAlgorithm(id).trace(initial, seededRng(seed)), [id, initial, seed])

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-bold">단계별 동작 시각화</h2>
        <p className="mt-1 text-sm text-slate-600">
          원소 {MIN_N}~{MAX_N}개로 셔플 과정을 한 단계씩 따라간다. 같은 시드는 항상 같은 과정을 재현한다.
        </p>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AlgorithmPicker value={id} onChange={setId} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            원소 수
            <select
              value={n}
              onChange={(e) => setParam('n', Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              {Array.from({ length: MAX_N - MIN_N + 1 }, (_, k) => k + MIN_N).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            시드
            <input
              type="number"
              min={1}
              max={999999}
              value={seed}
              onChange={(e) => setParam('seed', clampInt(e.target.value, 1, 999_999, seed))}
              className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono"
            />
          </label>
          <button
            onClick={() => setParam('seed', 1 + Math.floor(Math.random() * 999_999))}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 hover:bg-slate-50"
          >
            새로 섞기
          </button>
        </div>
      </div>

      {/* 알고리즘·크기·시드가 바뀌면 재생 상태를 처음부터 다시 시작한다 */}
      <Player key={`${id}-${n}-${seed}`} id={id} initial={initial} trace={trace} />
    </div>
  )
}

function Player({ id, initial, trace }: { id: AlgorithmId; initial: number[]; trace: Trace<number> }) {
  const [index, setIndex] = useState(0)
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

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => setIndex((k) => Math.min(k + 1, last)), delay)
    return () => clearTimeout(t)
  }, [playing, index, last, delay])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              초기 배열 <span className="font-mono text-slate-800">[{initial.join(', ')}]</span>
            </span>
            <Legend />
          </div>
          <ArrayStage step={step} n={initial.length} withOutput={isPickRemove} durationMs={Math.min(450, delay * 0.6)} />
        </section>

        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <input
            type="range"
            min={0}
            max={last}
            value={index}
            onChange={(e) => go(Number(e.target.value))}
            aria-label="단계 이동"
            className="w-full accent-slate-900"
          />
          <div className="flex flex-wrap items-center gap-2">
            <CtrlButton onClick={() => go(0)} label="처음으로">⏮</CtrlButton>
            <CtrlButton onClick={() => go(index - 1)} label="이전 단계" disabled={index === 0}>
              ◀ 이전
            </CtrlButton>
            <button
              onClick={togglePlay}
              className="min-w-20 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              {playing ? '일시정지' : index >= last ? '다시 재생' : '재생'}
            </button>
            <CtrlButton onClick={() => go(index + 1)} label="다음 단계" disabled={index === last}>
              다음 ▶
            </CtrlButton>
            <CtrlButton onClick={() => go(last)} label="끝으로">⏭</CtrlButton>
            <div className="ml-auto flex items-center gap-1 text-sm">
              {SPEEDS.map((s, k) => (
                <button
                  key={s.label}
                  onClick={() => setSpeed(k)}
                  className={`rounded px-2 py-1 ${k === speed ? 'bg-slate-200 font-semibold' : 'text-slate-500'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">키보드: ← → 단계 이동, 스페이스 재생/일시정지</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono">
              단계 {index} / {last}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{step.kind}</span>
          </div>
          <p className="mt-2 font-semibold">{step.what}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            <span className="font-medium text-slate-800">왜? </span>
            {step.why}
          </p>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{algo.name}</h3>
            <UniformBadge uniform={algo.uniform} />
          </div>
          <Pseudocode lines={content.pseudocode} active={content.stepLines[step.kind]} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">현재 배치의 관계성</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
            <Metric label="관계성 지수 R = |τ|" value={fmtNum(rel.r)} />
            <Metric label="순서 유지 쌍 C" value={String(rel.concordant)} />
            <Metric label="순서 뒤집힌 쌍 D" value={String(rel.discordant)} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            τ = 1은 원본과 같은 순서, −1은 완전히 반대 순서다. R은 원본 순서와의 관계를 나타낼 뿐 무작위성 점수가
            아니다.
            {isPickRemove && ' 이 알고리즘은 중간 단계에서 "결과 배열 뒤에 남은 배열을 이어 붙인 배치"로 계산한다.'}
          </p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">누적 연산 횟수</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {visibleCounters[id].map((k) => (
              <Metric key={k} label={counterLabels[k]} value={String(step.counters[k])} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

const fmtNum = (v: number) => (Number.isNaN(v) ? '—' : v.toFixed(3))

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
    </div>
  )
}

function CtrlButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void
  label: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function Legend() {
  const items = [
    ['bg-role-i', 'i: 현재 위치'],
    ['bg-role-j', 'j: 무작위 선택'],
    ['bg-green-50 border-2 border-role-fixed', '확정된 칸'],
  ]
  return (
    <span className="flex flex-wrap gap-3">
      {items.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-1">
          <span className={`inline-block h-3 w-3 rounded-sm ${cls}`} />
          {label}
        </span>
      ))}
    </span>
  )
}
