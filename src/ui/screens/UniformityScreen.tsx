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
import { permutationUnrank } from '../../core/stats/permutation'
import { theoreticalProbabilities } from '../../core/theory'
import { toProbabilities, totalVariation, uniformity } from '../../core/stats/tvd'
import AlgorithmMultiPicker from '../components/AlgorithmMultiPicker'
import HypothesisNote from '../components/HypothesisNote'
import InputArrayPicker from '../components/InputArrayPicker'
import Formula from '../components/Formula'
import ScreenHeader from '../components/ScreenHeader'
import TermPopover from '../components/TermPopover'
import UniformBadge from '../components/UniformBadge'
import { Button, Callout, Card, CardHeader, IntInput, Progress, Segmented, Select, SettingRow, Table, tbody, td, th, thead } from '../components/ui'
import { algoColor, chart, tooltipStyle } from '../chartTheme'
import { fmtInt, fmtNum, fmtPct } from '../format'
import { useExperiment } from '../useExperiment'

interface Preset {
  label: string
  desc: string
  algoIds: AlgorithmId[]
  n: number
  trials: number
}

const PRESETS: Preset[] = [
  {
    label: 'H1 확인 · FY vs Riffle',
    desc: 'n = 4, 1,000,000회, 시드 1 — Riffle의 작은 편향은 반복이 많아야 보여요',
    algoIds: ['fisher-yates', 'riffle'],
    n: 4,
    trials: 1_000_000,
  },
  {
    label: '반복이 적을 때 (1,000회)',
    desc: '4종, n = 3, 1,000회, 시드 1 — 균등한 알고리즘도 TVD가 0이 아닌 것을 확인',
    algoIds: ['fisher-yates', 'pick-remove', 'riffle', 'random-key'],
    n: 3,
    trials: 1_000,
  },
  {
    label: '전체 비교 (n = 4, 100만 회)',
    desc: '4종, n = 4, 1,000,000회, 시드 1',
    algoIds: ['fisher-yates', 'pick-remove', 'riffle', 'random-key'],
    n: 4,
    trials: 1_000_000,
  },
]

const TRIAL_OPTIONS = [1_000, 10_000, 100_000, 1_000_000]
const RNG_OPTIONS: { kind: RngKind; label: string }[] = [
  { kind: 'seeded', label: '시드 고정 (SFC32)' },
  { kind: 'math', label: 'Math.random' },
  { kind: 'crypto', label: 'crypto (암호학적)' },
]

export default function UniformityScreen() {
  const [values, setValues] = useState(() => ['1', '2', '3'])
  const [selected, setSelected] = useState<AlgorithmId[]>(algorithms.map((a) => a.id))
  const [trials, setTrials] = useState(100_000)
  const [rngKind, setRngKind] = useState<RngKind>('seeded')
  const [seed, setSeed] = useState(1)
  const [runValues, setRunValues] = useState<string[]>([])
  const { config, runs, running, start, cancel } = useExperiment()

  const [zoom, setZoom] = useState(false)

  const run = () => {
    setRunValues(values)
    start({ algoIds: selected, n: values.length, trials, rngKind, seed })
  }

  // 추천 실험: 조건을 화면에 채우고 바로 실행한다
  const runPreset = (p: Preset) => {
    const v = Array.from({ length: p.n }, (_, k) => String(k + 1))
    setSelected(p.algoIds)
    setValues(v)
    setTrials(p.trials)
    setRngKind('seeded')
    setSeed(1)
    setRunValues(v)
    start({ algoIds: p.algoIds, n: p.n, trials: p.trials, rngKind: 'seeded', seed: 1 })
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
  const shown = [1 / size, ...results.flatMap((x) => [...(x.observed ?? []), ...theory[x.id]])]
  const yMax = Math.max(...shown)
  const yMin = Math.min(...shown)
  // 확대하면 값이 있는 범위만 보여준다 (모든 차트가 같은 범위를 써서 서로 비교할 수 있게)
  const pad = Math.max((yMax - yMin) * 0.15, yMax * 0.01)
  const yDomain: [number, number] = zoom ? [Math.max(0, yMin - pad), yMax + pad] : [0, yMax * 1.1]
  // 범위가 좁으면 눈금에 소수 자릿수를 늘려 같은 숫자가 반복되지 않게 한다
  const span = yDomain[1] - yDomain[0]
  const tickDigits = span < 0.01 ? 2 : span < 0.1 ? 1 : 0

  return (
    <div className="space-y-5">
      <ScreenHeader id="uniformity"
        title="반복 실험 및 균등성 분석"
        desc={
          <>
            같은 알고리즘을 여러 번 실행해 순열별 발생 확률을 측정하고, 모든 순열이 1/n! 확률로 나오는 균등분포와의
            차이를{' '}
            <TermPopover term="TVD" title="TVD (총변동거리, Total Variation Distance)">
              <span className="block">
                두 확률분포가 얼마나 다른지 재는 거리예요. 여기서는 실험으로 얻은 순열별 확률 P(π)를 모든 순열이 같은
                확률 1/n!인 균등분포와 비교해요.
              </span>
              <span className="block rounded-md bg-surface-2 px-3 py-2 text-ink">
                <Formula display tex={String.raw`\mathrm{TVD} = \frac{1}{2} \sum_{\pi} \left| P(\pi) - \frac{1}{n!} \right|`} />
              </span>
              <span className="block">
                0이면 균등분포와 똑같고, 1에 가까울수록 다른 분포예요. 균등분포가 되려면 확률을 얼마나 옮겨야 하는지로 읽을
                수 있어요. 예: TVD = 0.01이면 1/n!보다 자주 나온 순열들이 더 가져간 확률을 모두 더해 1%예요.
              </span>
              <span className="block text-xs text-ink-3">
                실험 횟수가 유한하면 균등한 알고리즘도 0이 되지 않아요. 같은 조건의 Fisher–Yates 값을 표본 잡음의 기준으로
                함께 봐요. 이 사이트는 U = 1 − TVD를 균등성 지수로 함께 보여줘요.
              </span>
            </TermPopover>
            로 재요.
          </>
        }
      />

      <Card className="space-y-5">
        <SettingRow label="추천 실험">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.label} disabled={running} onClick={() => runPreset(p)} title={p.desc}>
                {p.label}
              </Button>
            ))}
          </div>
        </SettingRow>

        <div className="space-y-4 border-t border-line pt-5">
          <SettingRow label="알고리즘">
            <AlgorithmMultiPicker value={selected} onChange={setSelected} />
          </SettingRow>
          <SettingRow label="입력 배열">
            <InputArrayPicker value={values} onChange={setValues} minN={3} maxN={5} />
            <p className="mt-2 text-xs leading-relaxed text-ink-3">
              순열은 원소 값이 아니라 위치 기준으로 세요. 입력 값은 그래프의 순열 이름에만 쓰이고 결과 분포에는 영향이 없어요.
            </p>
          </SettingRow>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
          <div className="w-36">
            <Select
              stacked
              label="반복 횟수"
              value={trials}
              onChange={setTrials}
              options={TRIAL_OPTIONS.map((t) => ({ value: t, label: `${fmtInt(t)}회` }))}
            />
          </div>
          <div className="w-48">
            <Select
              stacked
              label="난수"
              value={rngKind}
              onChange={setRngKind}
              options={RNG_OPTIONS.map((o) => ({ value: o.kind, label: o.label }))}
            />
          </div>
          {rngKind === 'seeded' && (
            <div className="w-28">
              <IntInput stacked label="시드" value={seed} onChange={setSeed} />
            </div>
          )}
          <div className="ml-auto flex gap-2">
            {running && <Button onClick={cancel}>취소</Button>}
            <Button variant="primary" onClick={run} disabled={running || selected.length === 0}>
              {running ? '실험 중…' : '실험 시작'}
            </Button>
          </div>
        </div>
      </Card>

      <H1Note results={results} config={config} />

      {!config ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-3">
          조건을 고르고 "실험 시작"을 누르거나 위의 추천 실험을 골라요. 실험은 별도 스레드(Web Worker)에서 돌아가 화면이 멈추지 않아요.
        </p>
      ) : (
        <>
          <Table
            minWidth={680}
            caption={
              <>
                n = {config.n} (순열 {size}개, 균등 확률 1/{size} = {fmtPct(1 / size, 2)}) · 반복 {fmtInt(config.trials)}회 ·{' '}
                {RNG_OPTIONS.find((o) => o.kind === config.rngKind)?.label}
                {config.rngKind === 'seeded' && ` · 시드 ${config.seed}`}
              </>
            }
          >
            <thead className={thead}>
              <tr>
                <th className={th}>알고리즘</th>
                <th className={th}>진행</th>
                <th className={th}>관측 TVD</th>
                <th className={th}>균등성 지수 U</th>
                <th className={th}>이론 TVD</th>
                <th className={th}>관측 확률 최소~최대</th>
                <th className={th}>시간</th>
              </tr>
            </thead>
            <tbody className={tbody}>
              {results.map(({ id, algo, run: r, observed, stats, theoryTvd }) => (
                <tr key={id}>
                  <td className={td}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[id] }} />
                      <span className="font-medium">{algo.name}</span> <UniformBadge uniform={algo.uniform} />
                    </span>
                  </td>
                  <td className={td}>
                    {r?.error ? <span className="text-bad">{r.error}</span> : <Progress value={(r?.done ?? 0) / config.trials} />}
                  </td>
                  <td className={`${td} font-mono`}>{stats ? fmtNum(stats.tvd, 4) : '…'}</td>
                  <td className={`${td} font-mono font-semibold`}>{stats ? fmtNum(stats.u, 4) : '…'}</td>
                  <td className={`${td} font-mono text-ink-3`}>{fmtNum(theoryTvd, 4)}</td>
                  <td className={`${td} font-mono text-ink-2`}>
                    {observed ? `${fmtPct(Math.min(...observed), 2)} ~ ${fmtPct(Math.max(...observed), 2)}` : '…'}
                  </td>
                  <td className={`${td} font-mono text-ink-3`}>
                    {r?.elapsedMs !== undefined ? `${Math.round(r.elapsedMs)} ms` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
            <LegendItem
              swatch={
                <span className="flex gap-0.5">
                  {results.map(({ id }) => (
                    <span key={id} className="inline-block h-3 w-1.5 rounded-sm" style={{ background: algoColor[id] }} />
                  ))}
                </span>
              }
            >
              관측 확률 (막대, 알고리즘 색)
            </LegendItem>
            <LegendItem swatch={<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: chart.ink }} />}>
              이론 확률 (모든 경로 열거)
            </LegendItem>
            <LegendItem swatch={<span className="inline-block w-4 border-t-2 border-dashed" style={{ borderColor: chart.reference }} />}>
              균등 확률 1/n!
            </LegendItem>
            <span className="ml-auto flex items-center gap-2">
              세로축
              <Segmented
                ariaLabel="세로축 범위"
                size="sm"
                value={zoom ? 'zoom' : 'zero'}
                onChange={(v) => setZoom(v === 'zoom')}
                options={[
                  { value: 'zero', label: '0부터' },
                  { value: 'zoom', label: '확대' },
                ]}
              />
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {results.map(({ id, algo, observed }) => (
              <Card key={id}>
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[id] }} />
                      {algo.name}
                    </span>
                  }
                  right={
                    zoom && (
                      <span className="rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">
                        세로축 확대 · 0에서 시작하지 않아요
                      </span>
                    )
                  }
                />
                <div className="h-56">
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
                        domain={yDomain}
                        allowDataOverflow
                        tickFormatter={(v: number) => fmtPct(v, tickDigits)}
                        tick={{ fontSize: 10, fill: chart.axis }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        cursor={{ fill: 'var(--surface-3)' }}
                        formatter={(v, name) => [
                          typeof v === 'number' ? fmtPct(v, 3) : '—',
                          name === 'observed' ? '관측' : '이론',
                        ]}
                        labelFormatter={(l) => `순열 [${l}]`}
                      />
                      <Bar dataKey="observed" fill={algoColor[id]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Line
                        dataKey="theory"
                        stroke="none"
                        dot={{ r: n >= 5 ? 1.5 : 3, fill: chart.ink, stroke: chart.surface, strokeWidth: 1 }}
                        activeDot={false}
                        isAnimationActive={false}
                      />
                      <ReferenceLine y={1 / size} stroke={chart.reference} strokeDasharray="4 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Callout title="해석할 때 주의할 점">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Formula tex={String.raw`\mathrm{TVD} = \tfrac{1}{2} \sum_{\pi} \left| P(\pi) - \tfrac{1}{n!} \right|`} />,{' '}
            <Formula tex={String.raw`U = 1 - \mathrm{TVD}`} />. U는 이 프로젝트에서 정의한 표시용 지수이며 셔플 품질의 절대 점수가
            아니에요.
          </li>
          <li>
            실행 횟수가 유한하면 균등한 알고리즘도 TVD가 0이 되지 않아요. 같은 조건의 Fisher–Yates 결과를 표본 잡음의
            기준으로 함께 보고, 반복 횟수를 늘려 차이가 줄어드는지 확인해요.
          </li>
          <li>
            "이론 TVD"는 실험이 아니라 가능한 모든 난수 경로를 열거해 계산한 값이에요. Riffle Shuffle은 경로가 너무
            많아 상승 수열 공식(Bayer–Diaconis)으로 계산하고, Random-Key Sort는 키가 모두 다르다는 가정의 이론값이에요.
          </li>
          <li>이 실험은 통계적 균등성을 관찰하는 것이고, 난수 생성기의 암호학적 안전성을 검증하지 않아요.</li>
        </ul>
      </Callout>
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

function H1Note({
  results,
  config,
}: {
  results: { id: AlgorithmId; algo: { name: string }; stats?: { tvd: number }; theoryTvd: number }[]
  config?: { n: number; trials: number }
}) {
  const fy = results.find((r) => r.id === 'fisher-yates')
  const rf = results.find((r) => r.id === 'riffle')
  const ready = config && fy?.stats && rf?.stats
  return (
    <HypothesisNote id={1}>
      {ready ? (
        <>
          둘 다 O(n)인 두 알고리즘을 같은 조건(n = {config.n}, {fmtInt(config.trials)}회)에서 돌린 결과예요. 관측
          TVD: Fisher–Yates <b className="font-mono text-ink">{fmtNum(fy.stats!.tvd, 4)}</b>, Riffle Shuffle{' '}
          <b className="font-mono text-ink">{fmtNum(rf.stats!.tvd, 4)}</b>. 이론 TVD: 각각{' '}
          <span className="font-mono">{fmtNum(fy.theoryTvd, 4)}</span>,{' '}
          <span className="font-mono">{fmtNum(rf.theoryTvd, 4)}</span>. Riffle의 이론 TVD는 0이 아니지만 아주 작아서,
          반복 횟수가 적으면 표본 잡음에 묻혀요. 반복을 늘리며 두 관측값이 갈라지는지 확인해요.
        </>
      ) : (
        <>Fisher–Yates와 Riffle Shuffle을 함께 골라 실험하면, 같은 조건에서 두 알고리즘의 TVD를 여기서 바로 비교해요.</>
      )}
    </HypothesisNote>
  )
}
