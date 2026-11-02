import { useMemo, useState, type ReactNode } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { algorithms, getAlgorithm, type AlgorithmId } from '../../core/algorithms'
import { factorial } from '../../core/algorithms/recorder'
import type { RngKind } from '../../core/rng'
import { exactDistribution } from '../../core/stats/exact'
import { permutationRank, permutationUnrank } from '../../core/stats/permutation'
import { toProbabilities, totalVariation, uniformity } from '../../core/stats/tvd'
import AlgorithmMultiPicker from '../components/AlgorithmMultiPicker'
import InputArrayPicker from '../components/InputArrayPicker'
import UniformBadge from '../components/UniformBadge'
import { chart } from '../chartTheme'
import { fmtInt, fmtNum, fmtPct } from '../format'
import { useExperiment } from '../useExperiment'

const TRIAL_OPTIONS = [1_000, 10_000, 100_000, 1_000_000]
const RNG_OPTIONS: { kind: RngKind; label: string }[] = [
  { kind: 'seeded', label: '시드 고정 (SFC32)' },
  { kind: 'math', label: 'Math.random' },
  { kind: 'crypto', label: 'crypto (암호학적)' },
]

/**
 * 순열별 이론 확률. int()만 쓰는 알고리즘은 모든 난수 경로를 열거해 정확히 구하고,
 * Random-Key Sort는 키가 모두 다르다는 가정(연속분포)에서의 이론값 1/n!을 쓴다.
 */
function theoreticalProbabilities(id: AlgorithmId, n: number): number[] {
  const size = factorial(n)
  if (id === 'random-key') return new Array(size).fill(1 / size)
  const algo = getAlgorithm(id)
  const probs = new Array(size).fill(0)
  for (const o of exactDistribution(n, (a, rng) => algo.shuffle(a, rng))) {
    probs[permutationRank(o.perm)] = o.probability
  }
  return probs
}

export default function UniformityScreen() {
  const [values, setValues] = useState(() => ['1', '2', '3'])
  const [selected, setSelected] = useState<AlgorithmId[]>(algorithms.map((a) => a.id))
  const [trials, setTrials] = useState(100_000)
  const [rngKind, setRngKind] = useState<RngKind>('seeded')
  const [seed, setSeed] = useState(1)
  const [runValues, setRunValues] = useState<string[]>([])
  const { config, runs, running, start, cancel } = useExperiment()

  const run = () => {
    setRunValues(values)
    start({ algoIds: selected, n: values.length, trials, rngKind, seed })
  }

  const n = config?.n ?? values.length
  const size = factorial(n)
  const theory = useMemo(
    () => Object.fromEntries(algorithms.map((a) => [a.id, theoreticalProbabilities(a.id, n)])) as Record<AlgorithmId, number[]>,
    [n],
  )
  const labels = useMemo(
    () =>
      Array.from({ length: size }, (_, r) =>
        permutationUnrank(r, n)
          .map((p) => runValues[p] ?? String(p))
          .join(' '),
      ),
    [size, n, runValues],
  )

  const results = (config?.algoIds ?? []).map((id) => {
    const r = runs[id]
    const observed = r?.counts ? toProbabilities(r.counts) : undefined
    return {
      id,
      algo: getAlgorithm(id),
      run: r,
      observed,
      stats: r?.counts ? uniformity(r.counts) : undefined,
      theoryTvd: totalVariation(theory[id], new Array(size).fill(1 / size)),
    }
  })
  const yMax = Math.max(
    1 / size,
    ...results.flatMap((x) => [...(x.observed ?? []), ...theory[x.id]]),
  )

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-bold">반복 실험 및 균등성 분석</h2>
        <p className="mt-1 text-sm text-slate-600">
          같은 알고리즘을 여러 번 실행해 순열별 발생 확률을 측정하고, 모든 순열이 1/n! 확률로 나오는 균등분포와의
          차이를 TVD로 잰다.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <AlgorithmMultiPicker value={selected} onChange={setSelected} />

        <InputArrayPicker value={values} onChange={setValues} minN={3} maxN={5} />
        <p className="-mt-2 text-xs text-slate-500">
          순열은 원소 값이 아니라 위치 기준으로 센다. 입력 값은 그래프의 순열 이름에만 쓰이고 결과 분포에는 영향이 없다.
        </p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            반복 횟수
            <select
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              {TRIAL_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {fmtInt(t)}회
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            난수
            <select
              value={rngKind}
              onChange={(e) => setRngKind(e.target.value as RngKind)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              {RNG_OPTIONS.map((o) => (
                <option key={o.kind} value={o.kind}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {rngKind === 'seeded' && (
            <label className="flex items-center gap-2">
              시드
              <input
                type="number"
                min={1}
                value={seed}
                onChange={(e) => setSeed(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono"
              />
            </label>
          )}
          <div className="ml-auto flex gap-2">
            {running && (
              <button onClick={cancel} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50">
                취소
              </button>
            )}
            <button
              onClick={run}
              disabled={running || selected.length === 0}
              className="rounded-md bg-slate-900 px-4 py-1.5 font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {running ? '실험 중…' : '실험 시작'}
            </button>
          </div>
        </div>
      </section>

      {!config ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          조건을 고르고 "실험 시작"을 누른다. 실험은 별도 스레드(Web Worker)에서 돌아가 화면이 멈추지 않는다.
        </p>
      ) : (
        <>
          <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">알고리즘</th>
                  <th className="px-4 py-2 font-medium">진행</th>
                  <th className="px-4 py-2 font-medium">관측 TVD</th>
                  <th className="px-4 py-2 font-medium">균등성 지수 U</th>
                  <th className="px-4 py-2 font-medium">이론 TVD</th>
                  <th className="px-4 py-2 font-medium">관측 확률 최소~최대</th>
                  <th className="px-4 py-2 font-medium">시간</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map(({ id, algo, run: r, observed, stats, theoryTvd }) => (
                  <tr key={id}>
                    <td className="px-4 py-2">
                      <span className="font-medium">{algo.name}</span> <UniformBadge uniform={algo.uniform} />
                    </td>
                    <td className="px-4 py-2">
                      {r?.error ? (
                        <span className="text-red-600">{r.error}</span>
                      ) : (
                        <div className="h-1.5 w-24 overflow-hidden rounded bg-slate-100">
                          <div
                            className="h-full bg-slate-700 transition-[width]"
                            style={{ width: `${((r?.done ?? 0) / config.trials) * 100}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono">{stats ? fmtNum(stats.tvd, 4) : '…'}</td>
                    <td className="px-4 py-2 font-mono font-semibold">{stats ? fmtNum(stats.u, 4) : '…'}</td>
                    <td className="px-4 py-2 font-mono text-slate-500">{fmtNum(theoryTvd, 4)}</td>
                    <td className="px-4 py-2 font-mono text-slate-600">
                      {observed ? `${fmtPct(Math.min(...observed), 2)} ~ ${fmtPct(Math.max(...observed), 2)}` : '…'}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-500">
                      {r?.elapsedMs !== undefined ? `${Math.round(r.elapsedMs)} ms` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              n = {config.n} (순열 {size}개, 균등 확률 1/{size} = {fmtPct(1 / size, 2)}) · 반복 {fmtInt(config.trials)}회 ·{' '}
              {RNG_OPTIONS.find((o) => o.kind === config.rngKind)?.label}
              {config.rngKind === 'seeded' && ` · 시드 ${config.seed}`}
            </p>
          </section>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <LegendItem swatch={<span className="inline-block h-3 w-3 rounded-sm" style={{ background: chart.series1 }} />}>
              관측 확률
            </LegendItem>
            <LegendItem swatch={<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: chart.series2 }} />}>
              이론 확률 (모든 경로 열거)
            </LegendItem>
            <LegendItem swatch={<span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: chart.reference }} />}>
              균등 확률 1/n!
            </LegendItem>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {results.map(({ id, algo, observed }) => (
              <section key={id} className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold">{algo.name}</h3>
                <div className="mt-2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={labels.map((label, k) => ({ label, observed: observed?.[k], theory: theory[id][k] }))}
                      margin={{ top: 8, right: 8, bottom: n === 4 ? 24 : 4, left: 0 }}
                      barCategoryGap={n >= 5 ? 0 : 2}
                    >
                      <CartesianGrid vertical={false} stroke={chart.grid} />
                      <XAxis
                        dataKey="label"
                        tick={n >= 5 ? false : { fontSize: 10, fill: chart.axis }}
                        angle={n === 4 ? -60 : 0}
                        textAnchor={n === 4 ? 'end' : 'middle'}
                        interval={0}
                        tickLine={false}
                        height={n === 4 ? 40 : 24}
                      />
                      <YAxis
                        domain={[0, yMax * 1.1]}
                        tickFormatter={(v: number) => fmtPct(v, 0)}
                        tick={{ fontSize: 10, fill: chart.axis }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip
                        formatter={(v, name) => [
                          typeof v === 'number' ? fmtPct(v, 3) : '—',
                          name === 'observed' ? '관측' : '이론',
                        ]}
                        labelFormatter={(l) => `순열 [${l}]`}
                      />
                      <Bar dataKey="observed" fill={chart.series1} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Line
                        dataKey="theory"
                        stroke="none"
                        dot={{ r: n >= 5 ? 1.5 : 3, fill: chart.series2, stroke: '#fff', strokeWidth: 1 }}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                      <ReferenceLine y={1 / size} stroke={chart.reference} strokeDasharray="4 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
        <h3 className="font-semibold">해석할 때 주의할 점</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            TVD = ½ Σ|P(π) − 1/n!|, U = 1 − TVD. U는 이 프로젝트에서 정의한 표시용 지수이며 셔플 품질의 절대 점수가
            아니다.
          </li>
          <li>
            실행 횟수가 유한하면 균등한 알고리즘도 TVD가 0이 되지 않는다. 같은 조건의 Fisher–Yates 결과를 표본 잡음의
            기준으로 함께 보고, 반복 횟수를 늘려 차이가 줄어드는지 확인한다.
          </li>
          <li>
            "이론 TVD"는 실험이 아니라 가능한 모든 난수 경로를 열거해 계산한 값이다. Random-Key Sort는 키가 모두 다르다는
            가정의 이론값이다.
          </li>
          <li>이 실험은 통계적 균등성을 관찰하는 것이며, 난수 생성기의 암호학적 안전성을 검증하지 않는다.</li>
        </ul>
      </section>
    </div>
  )
}

function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {children}
    </span>
  )
}
