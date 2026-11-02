import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { algorithms, type AlgorithmId } from '../../core/algorithms'
import { powerOfTwoSizes } from '../../core/benchmark'
import { DIST_RUNS, DIST_SEED_OFFSET, repeatKendall } from '../../core/relationship'
import { seededRng } from '../../core/rng'
import HypothesisNote from '../components/HypothesisNote'
import ScreenHeader from '../components/ScreenHeader'
import UniformBadge from '../components/UniformBadge'
import { Button, Callout, Card, CardHeader, Progress, Table, tbody, td, th, thead } from '../components/ui'
import { algoColor, chart, tooltipStyle } from '../chartTheme'
import { fmtInt, fmtNum, fmtPct } from '../format'
import { clearResults, recordRelationship, useResults, type PerformanceEntry, type Results } from '../results'
import { BENCH_BUDGET_MS, BENCH_MIN_EXP, useBenchmark } from '../useBenchmark'
import { useExperiment } from '../useExperiment'

// 표준 조건: D·E·F 화면의 추천 설정과 같은 값이라 화면별 결과와 그대로 비교할 수 있다
const STD = {
  relationship: { n: 8, seed: 1 },
  uniformity: { n: 4, trials: 1_000_000, seed: 1 },
  performance: { maxExp: 14, samples: 5 },
}

const shortName: Record<AlgorithmId, string> = {
  'fisher-yates': 'Fisher–Yates',
  'pick-remove': 'Pick & Remove',
  riffle: 'Riffle',
  'random-key': 'Random-Key',
}

function fmtTime(ms: number) {
  if (ms < 0.001) return `${(ms * 1e6).toFixed(0)} ns`
  if (ms < 1) return `${(ms * 1e3).toFixed(ms < 0.01 ? 2 : 1)} µs`
  return `${ms.toFixed(ms < 10 ? 2 : 1)} ms`
}

const rngLabel = { seeded: '시드 고정', math: 'Math.random', crypto: 'crypto' } as const

/** 측정한 모든 알고리즘이 공통으로 가진 가장 큰 크기 (Pick & Remove는 시간 예산 때문에 큰 크기를 건너뛸 수 있다) */
function commonSize(perf: Results['performance']): number | undefined {
  const lists = Object.values(perf).map((e) => new Set(e!.points.map((p) => p.n)))
  if (lists.length === 0) return undefined
  const shared = [...lists[0]].filter((n) => lists.every((s) => s.has(n)))
  return shared.length ? Math.max(...shared) : undefined
}

/** 마지막 두 크기(2배 차이)의 시간 비율 */
function lastRatio(e: PerformanceEntry): number | undefined {
  const [a, b] = e.points.slice(-2)
  return a && b && b.n === a.n * 2 ? b.medianMs / a.medianMs : undefined
}

/** 알고리즘마다 조건이 다르면 그 조건들을 돌려준다 (같으면 빈 배열) */
function distinct(keys: string[]): string[] {
  const set = [...new Set(keys)]
  return set.length > 1 ? set : []
}

export default function CompareScreen() {
  const results = useResults()
  const experiment = useExperiment()
  const bench = useBenchmark()
  const [ranAll, setRanAll] = useState(false)
  const phase = experiment.running ? 'uniformity' : bench.status === 'running' ? 'performance' : undefined
  const running = phase !== undefined

  // 1) 관계성은 바로 계산하고 2) 균등성 실험(Worker 병렬) 3) 성능 측정(Worker 하나) 순서로 돌린다.
  // 성능 측정은 다른 실험과 CPU를 나눠 쓰면 시간이 흔들리므로 균등성 실험이 끝난 뒤에 시작한다.
  const runAll = () => {
    const values = Array.from({ length: STD.relationship.n }, (_, k) => String(k + 1))
    for (const a of algorithms) {
      const s = repeatKendall(values, a.shuffle, seededRng(STD.relationship.seed + DIST_SEED_OFFSET), DIST_RUNS)
      recordRelationship(a.id, { n: values.length, seed: STD.relationship.seed, ...s })
    }
    setRanAll(true)
    experiment.start({ algoIds: algorithms.map((a) => a.id), rngKind: 'seeded', ...STD.uniformity }, () =>
      bench.start({
        algoIds: algorithms.map((a) => a.id),
        sizes: powerOfTwoSizes(BENCH_MIN_EXP, STD.performance.maxExp),
        samples: STD.performance.samples,
        rngKind: 'seeded',
        seed: 1,
        budgetMs: BENCH_BUDGET_MS,
      }),
    )
  }

  const cancel = () => {
    experiment.cancel()
    bench.cancel()
    setRanAll(false)
  }

  const { relationship: rel, uniformity: uni, performance: perf } = results
  const empty = !Object.keys(rel).length && !Object.keys(uni).length && !Object.keys(perf).length
  const sizeN = commonSize(perf)
  const timeAt = (id: AlgorithmId) => perf[id]?.points.find((p) => p.n === sizeN)?.medianMs
  const fyTime = timeAt('fisher-yates')

  const progress =
    phase === 'uniformity'
      ? Object.values(experiment.runs).reduce((s, r) => s + (r?.done ?? 0), 0) /
        (algorithms.length * STD.uniformity.trials) /
        2
      : phase === 'performance'
        ? 0.5 + bench.points.length / (algorithms.length * (STD.performance.maxExp - BENCH_MIN_EXP + 1)) / 2
        : 1

  const relDiff = distinct(Object.values(rel).map((e) => `원소 ${e!.n}개 · 시드 ${e!.seed}`))
  const uniDiff = distinct(
    Object.values(uni).map((e) => `n = ${e!.n} · ${fmtInt(e!.trials)}회 · ${rngLabel[e!.rngKind]} · 시드 ${e!.seed}`),
  )
  const perfDiff = distinct(Object.values(perf).map((e) => `${e!.samples}회 중앙값 · ${rngLabel[e!.rngKind]}`))

  return (
    <div className="space-y-5">
      <ScreenHeader
        id="compare"
        title="전체 비교"
        desc="D 관계성 · E 균등성 · F 성능 화면에서 잰 결과를 알고리즘별로 모아 나란히 놓아요. 알고리즘마다 가장 최근에 잰 값을 보여주고, 측정 조건도 함께 적어요."
      />

      <Card className="space-y-3">
        <CardHeader
          title="표준 조건으로 한 번에 측정"
          desc={
            <>
              네 알고리즘을 같은 조건으로 재요. 관계성: 원소 {STD.relationship.n}개를 {fmtInt(DIST_RUNS)}번 섞기 · 균등성: n ={' '}
              {STD.uniformity.n}, {fmtInt(STD.uniformity.trials)}회 · 성능: {fmtInt(2 ** BENCH_MIN_EXP)}~
              {fmtInt(2 ** STD.performance.maxExp)}, {STD.performance.samples}회 측정 중앙값. 모두 시드 1이에요.
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={runAll} disabled={running}>
            {running ? '측정 중…' : '모두 측정'}
          </Button>
          {running && <Button onClick={cancel}>취소</Button>}
          {running && (
            <>
              <Progress value={progress} />
              <span className="text-sm text-ink-2">{phase === 'uniformity' ? '균등성 실험 중' : '성능 측정 중'}</span>
            </>
          )}
          {ranAll && !running && bench.status === 'done' && <span className="text-sm text-ink-2">측정 완료</span>}
          <div className="ml-auto">
            <Button size="sm" onClick={clearResults} disabled={running || empty}>
              결과 지우기
            </Button>
          </div>
        </div>
        {bench.hiddenDuringRun && bench.status !== 'idle' && (
          <Callout tone="warn">
            ⚠ 성능을 재는 중에 이 탭이 화면에서 숨겨진 적이 있어요. 시간이 실제보다 크게 나왔을 수 있으니 탭을 띄워 둔 채로
            다시 재 주세요.
          </Callout>
        )}
        <p className="text-xs text-ink-3">
          D·E·F 화면에서 직접 잰 결과도 여기에 모여요. 결과는 이 브라우저에 저장돼요. 성능을 재는 동안에는 이 탭을 화면에
          띄워 두세요.
        </p>
      </Card>

      {empty ? (
        <p className="rounded-xl border border-dashed border-line-strong p-6 text-sm text-ink-3">
          아직 측정한 결과가 없어요. "모두 측정"을 누르거나{' '}
          <ScreenLink to="/relationship">D 관계성</ScreenLink>, <ScreenLink to="/uniformity">E 균등성</ScreenLink>,{' '}
          <ScreenLink to="/performance">F 성능</ScreenLink> 화면에서 실험을 돌려요.
        </p>
      ) : (
        <>
          <Table
            minWidth={980}
            caption={
              <>
                빈칸(—)은 아직 재지 않은 값이에요. 이론값은{' '}
                <ScreenLink to="/algorithms">B 알고리즘</ScreenLink> 화면에서 근거를 볼 수 있어요.
              </>
            }
          >
            <thead className={thead}>
              <tr>
                <th className={th} rowSpan={2}>
                  알고리즘
                </th>
                <GroupTh span={3}>이론</GroupTh>
                <GroupTh span={3}>효율성 · F{sizeN !== undefined && ` · n = ${fmtInt(sizeN)}`}</GroupTh>
                <GroupTh span={3}>균등성 · E</GroupTh>
                <GroupTh span={2}>관계성 · D</GroupTh>
              </tr>
              <tr>
                <th className={th}>시간</th>
                <th className={th}>공간</th>
                <th className={th}>균등성</th>
                <th className={th}>1회 시간</th>
                <th className={th}>FY 대비</th>
                <th className={th} title="마지막 두 크기(2배 차이)의 시간 비율">
                  2배 비율
                </th>
                <th className={th}>관측 TVD</th>
                <th className={th}>이론 TVD</th>
                <th className={th}>U</th>
                <th className={th}>평균 R</th>
                <th className={th}>R ≥ 0.5</th>
              </tr>
            </thead>
            <tbody className={`${tbody} font-mono`}>
              {algorithms.map((a) => {
                const t = timeAt(a.id)
                const ratio = perf[a.id] && lastRatio(perf[a.id]!)
                return (
                  <tr key={a.id}>
                    <td className={`${td} font-sans font-medium`}>
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[a.id] }} />
                        {a.name}
                      </span>
                    </td>
                    <td className={td}>{a.time}</td>
                    <td className={td}>{a.space}</td>
                    <td className={`${td} font-sans`}>
                      <UniformBadge uniform={a.uniform} />
                    </td>
                    <td className={td}>{t !== undefined ? fmtTime(t) : '—'}</td>
                    <td className={td}>{t !== undefined && fyTime ? `${fmtNum(t / fyTime, 1)}×` : '—'}</td>
                    <td className={td}>{ratio !== undefined ? fmtNum(ratio, 2) : '—'}</td>
                    <td className={td}>{uni[a.id] ? fmtNum(uni[a.id]!.tvd, 4) : '—'}</td>
                    <td className={`${td} text-ink-3`}>{uni[a.id] ? fmtNum(uni[a.id]!.theoryTvd, 4) : '—'}</td>
                    <td className={td}>{uni[a.id] ? fmtNum(uni[a.id]!.u, 4) : '—'}</td>
                    <td className={td}>{rel[a.id] ? fmtNum(rel[a.id]!.meanR) : '—'}</td>
                    <td className={td}>{rel[a.id] ? fmtPct(rel[a.id]!.highR) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>

          <ConditionNotes
            items={[
              {
                name: '효율성',
                to: '/performance',
                has: Object.keys(perf).length > 0,
                same: perfDiff.length === 0 && (Object.keys(perf).length === 0 || sizeN !== undefined),
                desc: sizeN === undefined ? '알고리즘끼리 공통으로 잰 크기가 없어요' : perfDiff.join(' / '),
                summary: Object.values(perf)[0] && `${Object.values(perf)[0]!.samples}회 측정 중앙값`,
              },
              {
                name: '균등성',
                to: '/uniformity',
                has: Object.keys(uni).length > 0,
                same: uniDiff.length === 0,
                desc: uniDiff.join(' / '),
                summary:
                  Object.values(uni)[0] &&
                  `n = ${Object.values(uni)[0]!.n}, ${fmtInt(Object.values(uni)[0]!.trials)}회, ${rngLabel[Object.values(uni)[0]!.rngKind]}`,
              },
              {
                name: '관계성',
                to: '/relationship',
                has: Object.keys(rel).length > 0,
                same: relDiff.length === 0,
                desc: relDiff.join(' / '),
                summary:
                  Object.values(rel)[0] && `원소 ${Object.values(rel)[0]!.n}개를 ${fmtInt(Object.values(rel)[0]!.runs)}번 섞기`,
              },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <MetricChart
              title={sizeN !== undefined ? `셔플 1회 시간 · n = ${fmtInt(sizeN)}` : '셔플 1회 시간'}
              desc="짧을수록 빨라요."
              data={algorithms.map((a) => ({ id: a.id, v: timeAt(a.id) }))}
              format={fmtTime}
            />
            <MetricChart
              title="관측 TVD"
              desc="균등분포와의 차이예요. 0에 가까울수록 균등해요."
              data={algorithms.map((a) => ({ id: a.id, v: uni[a.id]?.tvd }))}
              format={(v) => fmtNum(v, 4)}
            />
            <MetricChart
              title="평균 R = |τ|"
              desc="원본 순서와 닮은 정도예요. 무작위성 점수가 아니에요."
              data={algorithms.map((a) => ({ id: a.id, v: rel[a.id]?.meanR }))}
              format={(v) => fmtNum(v)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <HypothesisNote id={1}>
              {uni['fisher-yates'] && uni.riffle ? (
                <>
                  둘 다 O(n)인데 관측 TVD는 Fisher–Yates <b className="font-mono text-ink">{fmtNum(uni['fisher-yates'].tvd, 4)}</b>,
                  Riffle <b className="font-mono text-ink">{fmtNum(uni.riffle.tvd, 4)}</b>예요 (이론값{' '}
                  <span className="font-mono">{fmtNum(uni['fisher-yates'].theoryTvd, 4)}</span>,{' '}
                  <span className="font-mono">{fmtNum(uni.riffle.theoryTvd, 4)}</span>).
                </>
              ) : (
                <>Fisher–Yates와 Riffle의 균등성 결과가 모이면 여기서 비교해요.</>
              )}
            </HypothesisNote>
            <HypothesisNote id={2}>
              {fyTime !== undefined && timeAt('pick-remove') !== undefined ? (
                <>
                  둘 다 균등한데 n = {fmtInt(sizeN!)}에서 Pick & Remove가 Fisher–Yates보다{' '}
                  <b className="font-mono text-ink">{fmtNum(timeAt('pick-remove')! / fyTime, 1)}배</b> 오래 걸렸어요. 2배 비율:{' '}
                  <span className="font-mono">{fmtNum(lastRatio(perf['fisher-yates']!) ?? NaN, 2)}</span>,{' '}
                  <span className="font-mono">{fmtNum(lastRatio(perf['pick-remove']!) ?? NaN, 2)}</span>.
                </>
              ) : (
                <>Fisher–Yates와 Pick & Remove의 성능 결과가 모이면 여기서 비교해요.</>
              )}
            </HypothesisNote>
            <HypothesisNote id={3}>
              {Object.keys(rel).length > 1 && Object.keys(uni).length > 1 ? (
                <>
                  알고리즘별 평균 R은 <b className="font-mono text-ink">{range(rel, (e) => e.meanR, 3)}</b>, 관측 TVD는{' '}
                  <b className="font-mono text-ink">{range(uni, (e) => e.tvd, 4)}</b> 범위예요. 평균 R이 비슷한 알고리즘끼리
                  TVD도 비슷한지 표에서 비교해요.
                </>
              ) : (
                <>관계성과 균등성 결과가 두 알고리즘 이상 모이면 두 지표의 순위를 비교해요.</>
              )}
            </HypothesisNote>
          </div>
        </>
      )}
    </div>
  )
}

/** 측정한 알고리즘들의 값 범위 "최소 ~ 최대" */
function range<E>(rec: Partial<Record<AlgorithmId, E>>, value: (e: E) => number, digits: number): string {
  const vs = Object.values(rec).map((e) => value(e as E))
  return `${fmtNum(Math.min(...vs), digits)} ~ ${fmtNum(Math.max(...vs), digits)}`
}

function GroupTh({ span, children }: { span: number; children: ReactNode }) {
  return (
    <th colSpan={span} className={`${th} border-l border-line text-ink-2`}>
      {children}
    </th>
  )
}

function ScreenLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-link hover:underline">
      {children}
    </Link>
  )
}

function ConditionNotes({
  items,
}: {
  items: { name: string; to: string; has: boolean; same: boolean; desc: string; summary?: string }[]
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map((it) =>
        !it.has ? (
          <p key={it.name} className="rounded-xl border border-dashed border-line-strong px-4 py-3 text-xs text-ink-3">
            {it.name}: 아직 재지 않았어요. <ScreenLink to={it.to}>측정하러 가기</ScreenLink>
          </p>
        ) : it.same ? (
          <p key={it.name} className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs text-ink-2">
            <span className="font-semibold text-ink">{it.name}</span> 측정 조건: {it.summary}
          </p>
        ) : (
          <Callout key={it.name} tone="warn" title={`${it.name}: 알고리즘마다 측정 조건이 달라요`}>
            <span className="text-xs">
              {it.desc}. 같은 조건으로 다시 재야 공정하게 비교할 수 있어요.
            </span>
          </Callout>
        ),
      )}
    </div>
  )
}

function MetricChart({
  title,
  desc,
  data,
  format,
}: {
  title: string
  desc: string
  data: { id: AlgorithmId; v: number | undefined }[]
  format: (v: number) => string
}) {
  const rows = data.filter((d) => d.v !== undefined).map((d) => ({ ...d, name: shortName[d.id] }))
  return (
    <Card>
      <CardHeader title={title} desc={desc} />
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-3">아직 측정한 값이 없어요.</p>
      ) : (
        <div className="mt-3" style={{ height: rows.length * 40 + 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 72, bottom: 0, left: 0 }} barCategoryGap={8}>
              <CartesianGrid horizontal={false} stroke={chart.grid} />
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis
                type="category"
                dataKey="name"
                width={96}
                tick={{ fontSize: 11, fill: chart.text }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                {...tooltipStyle}
                cursor={{ fill: 'var(--surface-3)' }}
                formatter={(v) => [format(Number(v)), title]}
              />
              <Bar dataKey="v" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.id} fill={algoColor[r.id]} />
                ))}
                <LabelList dataKey="v" position="right" formatter={(v) => format(Number(v))} fill={chart.text} fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
