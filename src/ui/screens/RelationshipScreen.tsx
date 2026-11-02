import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAlgorithm } from '../../core/algorithms'
import { seededRng } from '../../core/rng'
import { kendall, originalPositions } from '../../core/stats/kendall'
import AlgorithmPicker from '../components/AlgorithmPicker'
import InputArrayPicker from '../components/InputArrayPicker'
import Metric from '../components/Metric'
import UniformBadge from '../components/UniformBadge'
import { chart } from '../chartTheme'
import { fmtNum, fmtPct } from '../format'
import { randomDistinctValues } from '../inputArray'
import { useAlgorithmParam } from '../useAlgorithmParam'

const MIN_N = 2
const MAX_N = 20
const PAIR_GRID_MAX = 12
const DIST_RUNS = 2000

export default function RelationshipScreen() {
  const [id, setId] = useAlgorithmParam()
  const [values, setValues] = useState(() => randomDistinctValues(8))
  const [seed, setSeed] = useState(1)
  const algo = getAlgorithm(id)

  const shuffled = useMemo(() => algo.shuffle([...values], seededRng(seed)), [algo, values, seed])
  const rel = kendall(values, shuffled)
  // newPos[원본 위치] = 결과에서의 위치
  const newPos = useMemo(() => {
    const orig = originalPositions(values, shuffled)
    const res = new Array<number>(values.length)
    orig.forEach((o, k) => (res[o] = k))
    return res
  }, [values, shuffled])

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-bold">관계성 분석</h2>
        <p className="mt-1 text-sm text-slate-600">
          한 번 섞은 결과가 원본의 순서와 얼마나 관계있는지 Kendall's τ로 측정한다. 원소 쌍마다 원본과 앞뒤 순서가
          같으면 일치(C), 반대면 불일치(D)로 센다.
        </p>
      </section>

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <AlgorithmPicker value={id} onChange={setId} />
        <InputArrayPicker value={values} onChange={setValues} minN={MIN_N} maxN={MAX_N} />
        <div className="flex flex-wrap items-center gap-3 text-sm">
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
          <button
            onClick={() => setSeed(1 + Math.floor(Math.random() * 999_999))}
            className="rounded-md bg-slate-900 px-3 py-1 font-medium text-white hover:bg-slate-700"
          >
            다시 섞기
          </button>
          <span className="flex items-center gap-2 text-slate-500">
            {algo.name} <UniformBadge uniform={algo.uniform} />
          </span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">원소별 위치 이동</h3>
          <p className="mt-1 text-xs text-slate-500">위 줄은 원본, 아래 줄은 결과다. 선은 같은 원소를 잇는다.</p>
          <MovementDiagram values={values} shuffled={shuffled} newPos={newPos} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">이번 결과의 관계성</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
            <Metric label="관계성 지수 R = |τ|" value={fmtNum(rel.r)} />
            <Metric label="순서 유지 쌍 C" value={String(rel.concordant)} />
            <Metric label="순서 뒤집힌 쌍 D" value={String(rel.discordant)} />
          </div>
          <p className="mt-3 font-mono text-xs text-slate-600">
            τ = (C − D) / (C + D) = ({rel.concordant} − {rel.discordant}) / {rel.concordant + rel.discordant}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            τ = 1은 원본과 같은 순서, −1은 완전히 반대 순서, 0은 일치·불일치 쌍이 같은 수다. R은 원본 순서와의
            관계를 나타낼 뿐 무작위성 점수가 아니다. R = 0이어도 무작위라는 뜻은 아니고, R = 1에는 원본과 같은 경우와
            완전히 반대인 경우가 모두 포함된다.
          </p>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">원소 쌍별 순서 비교</h3>
          {values.length <= PAIR_GRID_MAX ? (
            <PairGrid values={values} newPos={newPos} />
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              원소가 {PAIR_GRID_MAX}개 이하일 때 표시한다 (현재 쌍 {rel.concordant + rel.discordant}개).
            </p>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold">위치 변화</h3>
          <div className="mt-2 max-h-80 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white text-left text-xs text-slate-500">
                <tr>
                  <th className="py-1 pr-2 font-medium">원소</th>
                  <th className="py-1 pr-2 font-medium">원래 위치</th>
                  <th className="py-1 pr-2 font-medium">새 위치</th>
                  <th className="py-1 font-medium">이동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {values.map((v, o) => {
                  const d = newPos[o] - o
                  return (
                    <tr key={v}>
                      <td className="py-1 pr-2 font-sans font-medium">{v}</td>
                      <td className="py-1 pr-2">{o}</td>
                      <td className="py-1 pr-2">{newPos[o]}</td>
                      <td className="py-1 text-slate-600">{d === 0 ? '제자리' : d > 0 ? `→ ${d}` : `← ${-d}`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <TauDistribution values={values} seed={seed} currentTau={rel.tau} algoName={algo.name} algoShuffle={algo.shuffle} />
    </div>
  )
}

function MovementDiagram({ values, shuffled, newPos }: { values: string[]; shuffled: string[]; newPos: number[] }) {
  const [hover, setHover] = useState<number>()
  const n = values.length
  const slot = 56
  const box = 44
  const W = n * slot
  const top = 6
  const bottom = 130
  const cx = (k: number) => k * slot + slot / 2

  const node = (label: string, k: number, y: number, o: number) => (
    <g
      key={`${y}-${label}`}
      onMouseEnter={() => setHover(o)}
      onMouseLeave={() => setHover(undefined)}
      className="cursor-default"
    >
      <rect
        x={cx(k) - box / 2}
        y={y}
        width={box}
        height={36}
        rx={6}
        fill={hover === o ? chart.series1 : '#fff'}
        stroke={hover === o ? chart.series1 : '#cbd5e1'}
        strokeWidth={1.5}
      />
      <text
        x={cx(k)}
        y={y + 23}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill={hover === o ? '#fff' : chart.text}
      >
        {label}
      </text>
    </g>
  )

  return (
    <div className="mt-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${bottom + 42}`} className="w-full" style={{ minWidth: Math.min(W, n * 34) }}>
        {values.map((_, o) => (
          <line
            key={o}
            x1={cx(o)}
            y1={top + 36}
            x2={cx(newPos[o])}
            y2={bottom}
            stroke={hover === o ? chart.series1 : '#94a3b8'}
            strokeWidth={hover === o ? 2.5 : 1.25}
            opacity={hover === undefined || hover === o ? 1 : 0.35}
          />
        ))}
        {values.map((v, o) => node(v, o, top, o))}
        {shuffled.map((v, k) => node(v, k, bottom, values.indexOf(v)))}
      </svg>
    </div>
  )
}

function PairGrid({ values, newPos }: { values: string[]; newPos: number[] }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: chart.series1 }} />✓ 순서 유지 (C)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: chart.series2 }} />✗ 순서 뒤집힘 (D)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-center font-mono text-xs">
          <thead>
            <tr>
              <th />
              {values.map((v) => (
                <th key={v} className="h-6 min-w-6 px-0.5 font-medium text-slate-500">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((a, i) => (
              <tr key={a}>
                <th className="pr-1 text-right font-medium text-slate-500">{a}</th>
                {values.map((b, j) => {
                  if (j <= i) return <td key={b} />
                  const kept = newPos[i] < newPos[j]
                  return (
                    <td
                      key={b}
                      title={`(${a}, ${b}): ${kept ? '원본처럼 ' + a + '이(가) 앞 → 일치' : b + '이(가) 앞으로 → 불일치'}`}
                      className="h-6 min-w-6 rounded-sm text-white"
                      style={{ background: kept ? chart.series1 : chart.series2 }}
                    >
                      {kept ? '✓' : '✗'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        행의 원소가 원본에서 열의 원소보다 앞에 있다. 결과에서도 앞에 있으면 ✓, 뒤로 가면 ✗이다.
      </p>
    </div>
  )
}

function TauDistribution({
  values,
  seed,
  currentTau,
  algoName,
  algoShuffle,
}: {
  values: string[]
  seed: number
  currentTau: number
  algoName: string
  algoShuffle: <T>(arr: T[], rng: ReturnType<typeof seededRng>) => T[]
}) {
  const stats = useMemo(() => {
    // τ = 1 − 2D/P (P = 전체 쌍 수)라서 P+1가지 값만 가진다.
    // 쌍이 적으면 값마다 막대 하나, 많으면 폭 0.1 구간으로 묶는다 (고정 구간에 담으면 막대가 들쭉날쭉해진다).
    const pairs = (values.length * (values.length - 1)) / 2
    const exactBins = pairs <= 45
    const binOf = (tau: number) =>
      exactBins ? Math.round(((tau + 1) / 2) * pairs) : Math.min(19, Math.floor((tau + 1) / 0.1))
    const bins = exactBins
      ? Array.from({ length: pairs + 1 }, (_, k) => {
          const tau = -1 + (2 * k) / pairs
          return { label: tau.toFixed(2), range: `τ = ${tau.toFixed(3)}`, count: 0 }
        })
      : Array.from({ length: 20 }, (_, k) => {
          const from = -1 + 0.1 * k
          return {
            label: (from + 0.05).toFixed(2),
            range: `τ ∈ [${from.toFixed(1)}, ${(from + 0.1).toFixed(1)})`,
            count: 0,
          }
        })
    const rng = seededRng(seed + 1_000_003)
    let sumTau = 0
    let highR = 0
    for (let t = 0; t < DIST_RUNS; t++) {
      const { tau, r } = kendall(values, algoShuffle([...values], rng))
      sumTau += tau
      if (r >= 0.5) highR++
      bins[binOf(tau)].count++
    }
    return { bins, binOf, mean: sumTau / DIST_RUNS, highR: highR / DIST_RUNS }
  }, [values, seed, algoShuffle])

  const currentBin = Number.isNaN(currentTau) ? undefined : stats.bins[stats.binOf(currentTau)]?.label

  if (values.length < 2) return null
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold">
        같은 입력을 {DIST_RUNS.toLocaleString()}번 섞었을 때 τ의 분포 · {algoName}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        한 번의 결과만으로는 셔플의 품질을 판단할 수 없다. 올바른 셔플에서도 τ가 큰 결과가 일정 비율로 나온다.
      </p>
      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_200px]">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.bins} margin={{ top: 8, right: 8, bottom: 4, left: -16 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke={chart.grid} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: chart.axis }}
                interval="preserveStartEnd"
                minTickGap={8}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v) => [`${v}회`, '실행 수']}
                labelFormatter={(l) => stats.bins.find((x) => x.label === l)?.range ?? l}
              />
              <Bar dataKey="count" fill={chart.series1} radius={[4, 4, 0, 0]} />
              {currentBin && (
                <ReferenceLine
                  x={currentBin}
                  stroke={chart.series2}
                  strokeWidth={2}
                  label={{ value: '이번 결과', position: 'top', fill: chart.text, fontSize: 11 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid content-start gap-3">
          <Metric label="평균 τ" value={fmtNum(stats.mean)} />
          <Metric label="R ≥ 0.5인 실행 비율" value={fmtPct(stats.highR)} />
        </div>
      </div>
    </section>
  )
}
