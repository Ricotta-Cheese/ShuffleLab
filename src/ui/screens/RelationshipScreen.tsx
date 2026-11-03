import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getAlgorithm, type AlgorithmId } from '../../core/algorithms'
import { seededRng } from '../../core/rng'
import { factorial } from '../../core/algorithms/recorder'
import { DIST_RUNS, DIST_SEED_OFFSET, repeatKendall } from '../../core/relationship'
import { kendall, originalPositions } from '../../core/stats/kendall'
import { Link, useSearchParams } from 'react-router'
import AlgorithmPicker from '../components/AlgorithmPicker'
import HypothesisNote from '../components/HypothesisNote'
import InputArrayPicker from '../components/InputArrayPicker'
import Metric from '../components/Metric'
import Formula from '../components/Formula'
import ScreenHeader from '../components/ScreenHeader'
import TermPopover from '../components/TermPopover'
import UniformBadge from '../components/UniformBadge'
import { Button, Card, CardHeader, IntInput, SettingRow, Table, tbody, td, th, thead } from '../components/ui'
import { algoColor, chart, tooltipStyle } from '../chartTheme'
import { fmtInt, fmtNum, fmtPct } from '../format'
import { randomDistinctValues } from '../inputArray'
import { log } from '../console'
import { recordRelationship } from '../results'
import { useAlgorithmParam } from '../useAlgorithmParam'

const MIN_N = 2
const MAX_N = 20
const PAIR_GRID_MAX = 12

/** ?n=으로 원소 수를 주면 [1, 2, …, n]을 입력으로 쓴다 (보고서·실험 가이드와 같은 입력) */
function valuesFromN(raw: string | null): string[] | undefined {
  const n = Number(raw)
  if (raw === null || !Number.isInteger(n) || n < MIN_N || n > MAX_N) return undefined
  return Array.from({ length: n }, (_, k) => String(k + 1))
}

export default function RelationshipScreen() {
  const [id, setId] = useAlgorithmParam()
  const [params, setParams] = useSearchParams()
  const nParam = params.get('n')
  const [values, setValues] = useState(() => valuesFromN(nParam) ?? randomDistinctValues(8))
  // 같은 화면에 있는 채로 주소의 n이 바뀌면(실험 가이드가 조건을 채울 때) 입력을 다시 만든다
  const [seenN, setSeenN] = useState(nParam)
  if (nParam !== seenN) {
    setSeenN(nParam)
    const v = valuesFromN(nParam)
    if (v) setValues(v)
  }
  // 시드는 C 화면처럼 주소(?seed=)에 둔다
  const rawSeed = Number(params.get('seed'))
  const seed = Number.isInteger(rawSeed) && rawSeed >= 1 && rawSeed <= 999_999 ? rawSeed : 1
  const setSeed = (v: number) =>
    setParams(
      (p) => {
        p.set('seed', String(v))
        return p
      },
      { replace: true },
    )
  const algo = getAlgorithm(id)

  const shuffled = useMemo(() => algo.shuffle([...values], seededRng(seed)), [algo, values, seed])
  const rel = kendall(values, shuffled)

  // 섞을 때마다 원본·결과와 τ 계산 과정을 콘솔에 남긴다.
  // 아래 τ 분포 요약(자식의 useEffect)보다 먼저 찍히도록 useLayoutEffect를 쓴다.
  const loggedShuffle = useRef('')
  useLayoutEffect(() => {
    const key = `${algo.id}|${seed}|${shuffled.join(',')}`
    if (loggedShuffle.current === key) return
    loggedShuffle.current = key
    const total = rel.concordant + rel.discordant
    log(
      'D 관계성',
      `${algo.name} · 시드 ${seed}로 한 번 섞기\n  원본 [${values.join(', ')}]\n  결과 [${shuffled.join(', ')}]\n` +
        `  쌍 ${total}개 중 일치 C = ${rel.concordant}, 불일치 D = ${rel.discordant} → τ = (${rel.concordant} − ${rel.discordant}) / ${total} = ${fmtNum(rel.tau)}`,
      'step',
    )
  }, [algo, seed, values, shuffled, rel])
  // newPos[원본 위치] = 결과에서의 위치
  const newPos = useMemo(() => {
    const orig = originalPositions(values, shuffled)
    const res = new Array<number>(values.length)
    orig.forEach((o, k) => (res[o] = k))
    return res
  }, [values, shuffled])

  return (
    <div className="space-y-5">
      <ScreenHeader id="relationship"
        title="관계성 분석"
        desc={
          <>
            한 번 섞은 결과가 원본의 순서와 얼마나 관계있는지{' '}
            <TermPopover term="Kendall's τ" title="Kendall's τ (켄달 타우)">
              <span className="block">
                두 순서가 얼마나 같은 방향인지 재는 순위 상관계수예요. 원소 두 개씩 짝을 지어, 원본과 결과에서 앞뒤
                순서가 같으면 일치(C), 반대면 불일치(D)로 세요.
              </span>
              <span className="block rounded-md bg-surface-2 px-3 py-2 text-ink">
                <Formula display tex={String.raw`\tau = \frac{C - D}{C + D}`} />
              </span>
              <span className="block">
                τ = 1이면 원본과 같은 순서, −1이면 완전히 반대 순서, 0 근처면 일치와 불일치가 비슷한 수예요. 원소가 n개면
                쌍은 n(n−1)/2개예요.
              </span>
              <span className="block text-xs text-ink-3">
                이 사이트는 R = |τ|를 관계성 지수로 써요. 원본과 닮은 정도일 뿐 무작위성 점수가 아니에요.
              </span>
            </TermPopover>
            로 재요. 원소 쌍마다 원본과 앞뒤 순서가 같으면 일치(C), 반대면 불일치(D)로 세요.
          </>
        }
      />

      <Card className="space-y-5">
        <SettingRow label="알고리즘">
          <div className="flex flex-wrap items-center gap-3">
            <AlgorithmPicker value={id} onChange={setId} />
            <UniformBadge uniform={algo.uniform} />
          </div>
        </SettingRow>

        <div className="border-t border-line pt-5">
          <SettingRow label="입력 배열">
            <InputArrayPicker value={values} onChange={setValues} minN={MIN_N} maxN={MAX_N} />
          </SettingRow>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-5">
          <div className="w-28">
            <IntInput stacked label="시드" value={seed} onChange={setSeed} />
          </div>
          <Button variant="primary" onClick={() => setSeed(1 + Math.floor(Math.random() * 999_999))}>
            다시 섞기
          </Button>
          <p className="pb-2 text-xs text-ink-3">같은 시드는 항상 같은 결과를 만들어요. 다시 섞으면 새 시드를 골라요.</p>
        </div>
      </Card>

      {/* 결과 요약을 먼저 보여주고, 그 근거(위치 이동)를 옆에 둔다 */}
      <div data-tour="rel-result" className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader title="이번 결과의 관계성" />
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
            <Metric label="관계성 지수 R = |τ|" value={fmtNum(rel.r)} />
            <Metric label="순서 유지 쌍 C" value={String(rel.concordant)} />
            <Metric label="순서 뒤집힌 쌍 D" value={String(rel.discordant)} />
          </div>
          <div className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-ink">
            <Formula
              display
              tex={String.raw`\tau = \frac{C - D}{C + D} = \frac{${rel.concordant} - ${rel.discordant}}{${rel.concordant + rel.discordant}}`}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            τ = 1은 원본과 같은 순서, −1은 완전히 반대 순서, 0은 일치·불일치 쌍이 같은 수예요. R은 원본 순서와의
            관계를 나타낼 뿐 무작위성 점수가 아니에요. R = 0이어도 무작위라는 뜻은 아니고, R = 1에는 원본과 같은
            경우와 완전히 반대인 경우가 모두 포함돼요.
          </p>
        </Card>

        <Card>
          <CardHeader title="원소별 위치 이동" desc="위 줄은 원본, 아래 줄은 결과예요. 선은 같은 원소를 이어요." />
          <MovementDiagram values={values} shuffled={shuffled} newPos={newPos} algoId={id} />
        </Card>
      </div>

      <HypothesisNote id={3}>
        {algo.name} · 이번 결과 <b className="font-mono text-ink">R = {fmtNum(rel.r)}</b>. R은 원본 순서와 얼마나
        닮았는지만 재고, 모든 순열이 공평하게 나오는지는 알려주지 않아요. 알고리즘을 바꿔 R을 비교해 보고, 균등성은{' '}
        <Link to="/uniformity" className="text-link hover:underline">
          E 균등성
        </Link>
        에서 함께 확인해요.
      </HypothesisNote>

      <RotationExample values={values} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="원소 쌍별 순서 비교" />
          {values.length <= PAIR_GRID_MAX ? (
            <PairGrid values={values} newPos={newPos} />
          ) : (
            <p className="text-sm text-ink-3">
              원소가 {PAIR_GRID_MAX}개 이하일 때 보여줘요 (현재 쌍 {rel.concordant + rel.discordant}개).
            </p>
          )}
        </Card>

        <div className="max-h-[26rem] overflow-auto rounded-xl">
          <Table caption="이동: 원래 위치에서 새 위치까지 몇 칸 움직였는지 (→ 뒤로, ← 앞으로)">
            <thead className={`${thead} sticky top-0`}>
              <tr>
                <th className={th}>원소</th>
                <th className={th}>원래 위치</th>
                <th className={th}>새 위치</th>
                <th className={th}>이동</th>
              </tr>
            </thead>
            <tbody className={`${tbody} font-mono`}>
              {values.map((v, o) => {
                const d = newPos[o] - o
                return (
                  <tr key={v}>
                    <td className={`${td} py-1.5 font-sans font-medium`}>{v}</td>
                    <td className={`${td} py-1.5`}>{o}</td>
                    <td className={`${td} py-1.5`}>{newPos[o]}</td>
                    <td className={`${td} py-1.5 text-ink-2`}>{d === 0 ? '제자리' : d > 0 ? `→ ${d}` : `← ${-d}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </div>

      <TauDistribution
        values={values}
        seed={seed}
        currentTau={rel.tau}
        algoId={id}
        algoName={algo.name}
        algoShuffle={algo.shuffle}
      />
    </div>
  )
}

function MovementDiagram({
  values,
  shuffled,
  newPos,
  algoId,
}: {
  values: string[]
  shuffled: string[]
  newPos: number[]
  algoId: AlgorithmId
}) {
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
        fill={hover === o ? algoColor[algoId] : chart.surface}
        stroke={hover === o ? algoColor[algoId] : chart.lineMuted}
        strokeWidth={1.5}
      />
      <text
        x={cx(k)}
        y={y + 23}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill={hover === o ? 'var(--role-ink)' : chart.text}
      >
        {label}
      </text>
    </g>
  )

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${bottom + 42}`}
        className="w-full"
        style={{ minWidth: Math.min(W, n * 34) }}
        role="img"
        aria-label={`원본 [${values.join(', ')}]이 결과 [${shuffled.join(', ')}]로 바뀌었어요`}
      >
        {values.map((_, o) => (
          <line
            key={o}
            x1={cx(o)}
            y1={top + 36}
            x2={cx(newPos[o])}
            y2={bottom}
            stroke={hover === o ? algoColor[algoId] : chart.reference}
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
    <div className="space-y-2">
      <div className="flex gap-4 text-xs text-ink-2">
        <span className="flex items-center gap-1">
          <span className="inline-grid h-4 w-4 place-items-center rounded-sm bg-surface-3 text-[10px] text-ink">✓</span>
          순서 유지 (C)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-grid h-4 w-4 place-items-center rounded-sm bg-ink text-[10px] text-surface">✗</span>
          순서 뒤집힘 (D)
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-center font-mono text-xs">
          <thead>
            <tr>
              <th />
              {values.map((v) => (
                <th key={v} className="h-6 min-w-6 px-0.5 font-medium text-ink-3">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map((a, i) => (
              <tr key={a}>
                <th className="pr-1 text-right font-medium text-ink-3">{a}</th>
                {values.map((b, j) => {
                  if (j <= i) return <td key={b} />
                  const kept = newPos[i] < newPos[j]
                  return (
                    <td
                      key={b}
                      title={`(${a}, ${b}): ${kept ? '원본처럼 ' + a + '이(가) 앞 → 일치' : b + '이(가) 앞으로 → 불일치'}`}
                      className={`h-6 min-w-6 rounded-sm ${kept ? 'bg-surface-3 text-ink' : 'bg-ink text-surface'}`}
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
      <p className="text-xs text-ink-3">
        행의 원소가 원본에서 열의 원소보다 앞에 있어요. 결과에서도 앞에 있으면 ✓, 뒤로 가면 ✗예요.
      </p>
    </div>
  )
}

function TauDistribution({
  values,
  seed,
  currentTau,
  algoId,
  algoName,
  algoShuffle,
}: {
  values: string[]
  seed: number
  currentTau: number
  algoId: AlgorithmId
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
    const summary = repeatKendall(values, algoShuffle, seededRng(seed + DIST_SEED_OFFSET), DIST_RUNS, (tau) => bins[binOf(tau)].count++)
    return { bins, binOf, summary, mean: summary.meanTau, highR: summary.highR }
  }, [values, seed, algoShuffle])

  // G 전체 비교 화면에서 볼 수 있게 이번 분포의 요약을 남긴다
  const loggedStats = useRef<typeof stats>(undefined)
  useEffect(() => {
    if (values.length < 2) return
    recordRelationship(algoId, { n: values.length, seed, ...stats.summary })
    if (loggedStats.current === stats) return
    loggedStats.current = stats
    const s = stats.summary
    log(
      'D 관계성',
      `${algoName} · 같은 입력을 ${fmtInt(s.runs)}번 섞어 τ 분포 계산\n  평균 τ ${fmtNum(s.meanTau)} · 평균 R ${fmtNum(s.meanR)} · R ≥ 0.5인 비율 ${fmtPct(s.highR)}`,
      'result',
    )
  }, [algoId, algoName, values.length, seed, stats])

  const currentBin = Number.isNaN(currentTau) ? undefined : stats.bins[stats.binOf(currentTau)]?.label

  if (values.length < 2) return null
  return (
    <Card tour="rel-dist">
      <CardHeader
        title={`같은 입력을 ${DIST_RUNS.toLocaleString()}번 섞었을 때 τ의 분포 · ${algoName}`}
        desc="한 번의 결과만으로는 셔플의 품질을 판단할 수 없어요. 같은 입력을 여러 번 섞으면 τ가 어떻게 퍼지는지 볼 수 있어요."
      />
      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
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
                {...tooltipStyle}
                cursor={{ fill: 'var(--surface-3)' }}
                formatter={(v) => [`${v}회`, '실행 수']}
                labelFormatter={(l) => stats.bins.find((x) => x.label === l)?.range ?? l}
              />
              <Bar dataKey="count" fill={algoColor[algoId]} radius={[4, 4, 0, 0]} />
              {currentBin && (
                <ReferenceLine
                  x={currentBin}
                  stroke={chart.ink}
                  strokeWidth={2}
                  strokeDasharray="4 3"
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
      <div className="mt-4">
        <HypothesisNote id={4}>
          같은 입력을 {algoName} 알고리즘으로 {DIST_RUNS.toLocaleString()}번 섞었더니 R ≥ 0.5인 결과가{' '}
          <b className="font-mono text-ink">{fmtPct(stats.highR)}</b> 나왔어요 (이번 한 번의 결과:{' '}
          <b className="font-mono text-ink">R = {fmtNum(Math.abs(currentTau))}</b>). 원소 수를 바꾸거나 알고리즘을
          바꿔 이 비율이 어떻게 달라지는지 확인해요.
        </HypothesisNote>
      </div>
    </Card>
  )
}

/**
 * 가설 3 비교 사례: 매번 똑같이 k칸 회전시키는 가짜 셔플.
 * k칸 회전하면 앞쪽 k개와 뒤쪽 n−k개 사이의 쌍만 순서가 뒤집히므로 D = k(n−k)이고, τ = 1 − 2D/P다.
 * τ가 0에 가장 가까운 k를 고르면 관계성은 낮아 보이지만, 같은 입력에 늘 같은 결과만 내므로 균등과는 거리가 멀다.
 */
function RotationExample({ values }: { values: string[] }) {
  const n = values.length
  const pairs = (n * (n - 1)) / 2
  let k = 1
  for (let c = 1; c < n; c++) if (Math.abs(pairs - 2 * c * (n - c)) < Math.abs(pairs - 2 * k * (n - k))) k = c
  const rotated = [...values.slice(k), ...values.slice(0, k)]
  const rel = kendall(values, rotated)
  const perms = factorial(n)
  const u = 1 / perms
  const fmtTiny = (v: number) => (v >= 1e-4 ? fmtNum(v, 4) : v.toExponential(2))

  return (
    <Card tour="rel-rotation">
      <CardHeader
        title={`비교 사례 · 항상 ${k}칸 회전하는 "셔플"`}
        desc="무작위성이 전혀 없는 규칙이에요. 이 규칙이 만든 결과도 관계성 지수로만 보면 원본과 관계가 낮아 보일 수 있어요."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-1 font-mono text-sm">
          <p>
            <span className="mr-2 font-sans text-xs text-ink-3">원본</span>[{values.join(', ')}]
          </p>
          <p>
            <span className="mr-2 font-sans text-xs text-ink-3">결과</span>[{rotated.join(', ')}]
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Kendall's τ" value={fmtNum(rel.tau)} />
          <Metric label="관계성 지수 R" value={fmtNum(rel.r)} />
          <Metric label="균등성 지수 U" value={fmtTiny(u)} hint={`가능한 ${perms.toLocaleString()}개 중 1개만 나옴`} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-ink-3">
        같은 입력에는 항상 같은 결과가 나오므로 몇 번을 실행해도 순열 하나에만 확률 1이 몰려요. 그래서 TVD = 1 − 1/n!,
        U = 1/n!로 실험 없이 정해져요. 관계성(R)과 균등성(U)을 따로 봐야 하는 이유예요.
      </p>
    </Card>
  )
}
