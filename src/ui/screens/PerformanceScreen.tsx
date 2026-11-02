import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { algorithms, getAlgorithm, type AlgorithmId } from '../../core/algorithms'
import { doublingRatios, powerOfTwoSizes, type BenchPoint } from '../../core/benchmark'
import type { RngKind } from '../../core/rng'
import HypothesisNote from '../components/HypothesisNote'
import ScreenHeader from '../components/ScreenHeader'
import AlgorithmMultiPicker from '../components/AlgorithmMultiPicker'
import { Button, Callout, Card, CardHeader, Progress, Select, Table, tbody, td, th, thead } from '../components/ui'
import { algoColor, chart, tooltipStyle } from '../chartTheme'
import { fmtInt } from '../format'
import { useBenchmark } from '../useBenchmark'

const MIN_EXP = 8
const MAX_EXP_OPTIONS = [14, 16, 18, 20]
const SAMPLE_OPTIONS = [5, 9, 15]
const BUDGET_MS = 200
const RNG_OPTIONS: { kind: RngKind; label: string }[] = [
  { kind: 'seeded', label: '시드 고정 (SFC32)' },
  { kind: 'math', label: 'Math.random' },
  { kind: 'crypto', label: 'crypto (암호학적)' },
]

const expectedRatio: Record<AlgorithmId, string> = {
  'fisher-yates': '≈ 2',
  'naive-swap': '≈ 2',
  'random-key': '2보다 조금 큼',
  'pick-remove': '≈ 4',
}

function fmtTime(ms: number) {
  if (ms < 0.001) return `${(ms * 1e6).toFixed(0)} ns`
  if (ms < 1) return `${(ms * 1e3).toFixed(ms < 0.01 ? 2 : 1)} µs`
  return `${ms.toFixed(ms < 10 ? 2 : 1)} ms`
}

// 선 끝 이름표용 짧은 이름
const shortName: Record<AlgorithmId, string> = {
  'fisher-yates': 'Fisher–Yates',
  'pick-remove': 'Pick & Remove',
  'naive-swap': 'Naive Swap',
  'random-key': 'Random-Key',
}

/**
 * 끝값이 비슷한 선끼리는 이름표가 겹치므로 위아래로 벌린다.
 * 로그 축이라 값의 비율이 1.25배 안쪽이면 가깝다고 본다.
 */
function labelOffsets(lastValues: { id: AlgorithmId; v: number }[]): Partial<Record<AlgorithmId, number>> {
  const sorted = [...lastValues].sort((a, b) => a.v - b.v)
  const offsets: Partial<Record<AlgorithmId, number>> = {}
  let group: typeof sorted = []
  const flush = () => {
    group.forEach((g, i) => (offsets[g.id] = -(i - (group.length - 1) / 2) * 12))
    group = []
  }
  for (const s of sorted) {
    if (group.length && s.v / group[group.length - 1].v > 1.25) flush()
    group.push(s)
  }
  flush()
  return offsets
}

const fmtN = (n: number) => (n >= 1024 * 1024 ? `${n / 1024 / 1024}M` : n >= 1024 ? `${n / 1024}K` : String(n))

export default function PerformanceScreen() {
  const [selected, setSelected] = useState<AlgorithmId[]>(algorithms.map((a) => a.id))
  const [maxExp, setMaxExp] = useState(18)
  const [samples, setSamples] = useState(9)
  const [rngKind, setRngKind] = useState<RngKind>('seeded')
  const bench = useBenchmark()
  const running = bench.status === 'running'

  const run = () =>
    bench.start({
      algoIds: selected,
      sizes: powerOfTwoSizes(MIN_EXP, maxExp),
      samples,
      rngKind,
      seed: 1,
      budgetMs: BUDGET_MS,
    })

  const cfg = bench.config
  const byAlgo = (cfg?.algoIds ?? []).map((id) => ({
    id,
    points: bench.points.filter((p) => p.algoId === id),
  }))
  const totalPlanned = cfg ? cfg.algoIds.length * cfg.sizes.length : 0

  return (
    <div className="space-y-5">
      <ScreenHeader id="performance"
        title="성능 비교"
        desc="배열 크기를 두 배씩 늘리면서 셔플 1회의 실행 시간을 잰다. 크기가 두 배가 될 때 시간이 몇 배가 되는지 보면 시간 복잡도의 증가 추세를 실제로 확인할 수 있다."
      />

      <Card className="space-y-4">
        <AlgorithmMultiPicker value={selected} onChange={setSelected} />
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Select
            label="최대 크기"
            value={maxExp}
            onChange={setMaxExp}
            options={MAX_EXP_OPTIONS.map((e) => ({ value: e, label: `2^${e} = ${fmtInt(2 ** e)}` }))}
          />
          <Select
            label="반복 측정"
            value={samples}
            onChange={setSamples}
            options={SAMPLE_OPTIONS.map((v) => ({ value: v, label: `${v}회 (중앙값)` }))}
          />
          <Select
            label="난수"
            value={rngKind}
            onChange={setRngKind}
            options={RNG_OPTIONS.map((o) => ({ value: o.kind, label: o.label }))}
          />
          <div className="ml-auto flex gap-2">
            {running && <Button onClick={bench.cancel}>취소</Button>}
            <Button variant="primary" onClick={run} disabled={running || selected.length === 0}>
              {running ? '측정 중…' : '측정 시작'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-ink-3">
          크기 {fmtInt(2 ** MIN_EXP)}부터 두 배씩 잰다. 한 크기의 중앙값이 {BUDGET_MS}ms를 넘으면 그 알고리즘의 더 큰
          크기는 건너뛴다 (O(n²)인 Pick & Remove가 화면을 오래 붙잡지 않도록).
        </p>
      </Card>

      <H2Note byAlgo={byAlgo} />

      {!cfg ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-3">
          조건을 고르고 "측정 시작"을 누른다. 측정은 별도 스레드(Web Worker)에서 알고리즘을 하나씩 순서대로 잰다.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-2">
            <Progress value={bench.status === 'done' ? 1 : bench.points.length / Math.max(1, totalPlanned)} />
            {bench.measuring && (
              <span>
                측정 중: {getAlgorithm(bench.measuring.algoId).name}, n = {fmtInt(bench.measuring.n)}
              </span>
            )}
            {bench.status === 'done' && <span>측정 완료</span>}
            {bench.status === 'cancelled' && <span>취소됨</span>}
            {bench.status === 'error' && <span className="text-bad">오류: {bench.error}</span>}
          </div>
          {bench.hiddenDuringRun && (
            <Callout tone="warn">
              ⚠ 측정 중에 이 탭이 화면에서 숨겨진 적이 있다. 브라우저는 숨겨진 탭을 느리게 돌리므로 시간이 실제보다
              크게 나왔을 수 있다. 탭을 띄워 둔 채로 다시 측정한다.
            </Callout>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-ink-2">
            {byAlgo.map(({ id }) => (
              <span key={id} className="flex items-center gap-1.5">
                <span className="inline-block h-0.5 w-4" style={{ background: algoColor[id] }} />
                <span className="inline-block h-2 w-2 -ml-3 rounded-full" style={{ background: algoColor[id] }} />
                {getAlgorithm(id).name}
              </span>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="셔플 1회 실행 시간"
              desc="두 축 모두 로그 눈금이다. 기울기가 1이면 O(n), 2면 O(n²)이다."
              series={byAlgo}
              value={(p) => p.medianMs}
              format={fmtTime}
            />
            <ChartCard
              title="원소 1개당 시간"
              desc="실행 시간 ÷ n. O(n)이면 수평, O(n log n)이면 완만히 증가, O(n²)이면 n에 비례해 증가한다."
              series={byAlgo}
              value={(p) => p.medianMs / p.n}
              format={fmtTime}
            />
          </div>

          <ResultTable cfg={cfg} byAlgo={byAlgo} skipped={bench.skipped} />
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Table minWidth={420} caption="이론값. 공간 복잡도는 브라우저에서 메모리를 믿을 만하게 재기 어려워 이론 분석으로 대신한다.">
          <thead className={thead}>
            <tr>
              <th className={th}>알고리즘</th>
              <th className={th}>시간</th>
              <th className={th}>n이 2배일 때 시간</th>
              <th className={th}>추가 공간</th>
            </tr>
          </thead>
          <tbody className={tbody}>
            {algorithms.map((a) => (
              <tr key={a.id}>
                <td className={`${td} font-medium`}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[a.id] }} />
                    {a.name}
                  </span>
                </td>
                <td className={`${td} font-mono`}>{a.time}</td>
                <td className={td}>{expectedRatio[a.id]}</td>
                <td className={`${td} font-mono`}>{a.space}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Callout title="측정 방법과 주의할 점">
          <ul className="list-disc space-y-1 pl-5">
            <li>배열 생성과 복사는 시간을 재기 전에 끝낸다. 난수 생성은 셔플의 일부라 포함한다.</li>
            <li>
              타이머 해상도보다 짧은 실행은 여러 배열을 연속으로 섞어 한 번에 잰 뒤 개수로 나눈다. 처음 몇 번은
              워밍업으로 버린다.
            </li>
            <li>같은 조건을 여러 번 재서 중앙값을 쓴다. 화면 렌더링·애니메이션 시간은 포함하지 않는다.</li>
            <li>측정하는 동안 탭을 화면에 띄워 둔다. 숨겨진 탭은 브라우저가 느리게 실행한다.</li>
            <li>
              절대 시간은 기기, 브라우저, 다른 작업에 따라 달라진다. 비교할 때는 같은 실행 안의 상대적인 차이와 증가
              비율을 본다.
            </li>
          </ul>
        </Callout>
      </section>
    </div>
  )
}

type Series = { id: AlgorithmId; points: BenchPoint[] }

function ChartCard({
  title,
  desc,
  series,
  value,
  format,
}: {
  title: string
  desc: string
  series: Series[]
  value: (p: BenchPoint) => number
  format: (v: number) => string
}) {
  const lines = series.map(({ id, points }) => ({
    id,
    data: points.map((p) => ({ n: p.n, v: value(p) })).filter((d) => d.v > 0),
  }))
  const offsets = labelOffsets(lines.filter((l) => l.data.length).map((l) => ({ id: l.id, v: l.data[l.data.length - 1].v })))

  return (
    <Card>
      <CardHeader title={title} desc={desc} />
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 12, right: 92, bottom: 4, left: 4 }}>
            <CartesianGrid stroke={chart.grid} />
            <XAxis
              dataKey="n"
              type="number"
              scale="log"
              domain={['dataMin', 'dataMax']}
              allowDuplicatedCategory={false}
              tickFormatter={fmtN}
              tick={{ fontSize: 10, fill: chart.axis }}
              tickLine={false}
            />
            <YAxis
              dataKey="v"
              type="number"
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={format}
              tick={{ fontSize: 10, fill: chart.axis }}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(v, name) => [typeof v === 'number' ? format(v) : '—', name]}
              labelFormatter={(n) => `n = ${fmtInt(Number(n))}`}
            />
            {lines.map(({ id, data }) => {
              const name = getAlgorithm(id).name
              return (
                <Line
                  key={id}
                  data={data}
                  dataKey="v"
                  name={name}
                  stroke={algoColor[id]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: algoColor[id], stroke: chart.surface, strokeWidth: 1 }}
                  isAnimationActive={false}
                  label={(props: { x?: number | string; y?: number | string; index?: number }) =>
                    props.index === data.length - 1 ? (
                      <text
                        key={`${id}-label`}
                        x={Number(props.x) + 6}
                        y={Number(props.y) + 4 + (offsets[id] ?? 0)}
                        fontSize={11}
                        fill={chart.text}
                      >
                        {shortName[id]}
                      </text>
                    ) : (
                      <g key={`${id}-${props.index}`} />
                    )
                  }
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function ResultTable({
  cfg,
  byAlgo,
  skipped,
}: {
  cfg: { sizes: number[]; samples: number; rngKind: RngKind }
  byAlgo: Series[]
  skipped: Partial<Record<AlgorithmId, number>>
}) {
  const ratios = Object.fromEntries(byAlgo.map((s) => [s.id, doublingRatios(s.points)]))
  return (
    <Table
      minWidth={560}
      caption={
        <>
          셔플 1회 시간의 중앙값 ({cfg.samples}회 측정). ×값은 바로 위 크기(n/2) 대비 시간 비율이다. 난수:{' '}
          {RNG_OPTIONS.find((o) => o.kind === cfg.rngKind)?.label}
        </>
      }
    >
      <thead className={thead}>
        <tr>
          <th className={th}>n</th>
          {byAlgo.map(({ id }) => (
            <th key={id} className={th}>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[id] }} />
                {getAlgorithm(id).name}
              </span>
            </th>
          ))}
          </tr>
        </thead>
        <tbody className={`${tbody} font-mono`}>
          {cfg.sizes.map((n) => (
            <tr key={n}>
              <td className={`${td} py-1.5 text-ink-2`}>{fmtInt(n)}</td>
              {byAlgo.map(({ id, points }) => {
                const k = points.findIndex((p) => p.n === n)
                const sk = skipped[id]
                if (k < 0)
                  return (
                    <td key={id} className={`${td} py-1.5 font-sans text-xs text-ink-3`}>
                      {sk !== undefined && n >= sk ? '건너뜀' : ''}
                    </td>
                  )
                const r = ratios[id][k]
                return (
                  <td key={id} className={`${td} py-1.5`}>
                    {fmtTime(points[k].medianMs)}
                    {r !== undefined && <span className="ml-2 text-xs text-ink-3">×{r.toFixed(2)}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
    </Table>
  )
}

function H2Note({ byAlgo }: { byAlgo: Series[] }) {
  const fy = byAlgo.find((s) => s.id === 'fisher-yates')?.points ?? []
  const pr = byAlgo.find((s) => s.id === 'pick-remove')?.points ?? []
  // 두 알고리즘을 모두 잰 가장 큰 크기
  const common = pr.filter((p) => fy.some((q) => q.n === p.n)).at(-1)
  const fyAt = common && fy.find((q) => q.n === common.n)
  const lastRatio = (pts: BenchPoint[]) => doublingRatios(pts).filter((r) => r !== undefined).at(-1)
  return (
    <HypothesisNote id={2}>
      {common && fyAt ? (
        <>
          둘 다 균등한 두 알고리즘을 n = {fmtInt(common.n)}에서 비교하면 Fisher–Yates{' '}
          <b className="font-mono text-ink">{fmtTime(fyAt.medianMs)}</b>, Random Pick & Remove{' '}
          <b className="font-mono text-ink">{fmtTime(common.medianMs)}</b>로 약{' '}
          <b className="font-mono text-ink">{(common.medianMs / fyAt.medianMs).toFixed(1)}배</b> 차이가 나요. 크기가 2배일
          때 시간은 마지막 측정 기준 각각 ×{lastRatio(fy)?.toFixed(2) ?? '—'}, ×{lastRatio(pr)?.toFixed(2) ?? '—'}였어요.
          추가 공간은 이론적으로 O(1)과 O(n)이에요.
        </>
      ) : (
        <>Fisher–Yates와 Random Pick & Remove를 함께 골라 측정하면, 같은 크기에서 두 알고리즘의 시간 차이를 여기서 보여줘요.</>
      )}
    </HypothesisNote>
  )
}
