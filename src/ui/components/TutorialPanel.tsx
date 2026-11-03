import { useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { tutorialSteps, type TutorialLive } from '../../content/tutorial'
import { getAlgorithm, type AlgorithmId } from '../../core/algorithms'
import { useConsoleOpen } from '../console'
import { fmtNum, fmtPct } from '../format'
import { useResults, type PerformanceEntry } from '../results'
import { endTutorial, goToStep, setTutorialCollapsed, startTutorial, useTutorial } from '../tutorial'
import { Button, Tooltip } from './ui'

/** 헤더의 실험 가이드 시작/끝내기 버튼 (콘솔 버튼 왼쪽) */
export function TutorialToggle() {
  const { active } = useTutorial()
  return (
    <Tooltip label={active ? '실험 가이드 끝내기' : '실험 가이드 (보고서 흐름대로 따라 하기)'}>
      <button
        onClick={active ? endTutorial : startTutorial}
        aria-pressed={active}
        aria-label={active ? '실험 가이드 끝내기' : '실험 가이드 시작'}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition duration-150 active:scale-90 ${
          active ? 'border-ink-2 bg-surface-3 text-ink' : 'border-line-strong text-ink-2 hover:bg-surface-2 hover:text-ink'
        }`}
      >
        {/* 접힌 지도 위의 경로 */}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      </button>
    </Tooltip>
  )
}

/** 지금 단계가 강조하는 요소를 찾아 화면 안으로 스크롤하고 테두리를 띄운다. 화면은 늦게 불러오므로 나타날 때까지 기다린다. */
function useSpotlight(target: string | undefined, active: boolean, pathname: string) {
  useEffect(() => {
    if (!active || !target) return
    let el: HTMLElement | null = null
    let tries = 0
    const timer = setInterval(() => {
      el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
      if (!el && ++tries < 50) return
      clearInterval(timer)
      if (!el) return
      el.dataset.tourActive = 'true'
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    }, 100)
    return () => {
      clearInterval(timer)
      if (el) delete el.dataset.tourActive
    }
  }, [target, active, pathname])
}

/**
 * 보고서 흐름을 따라가는 실험 가이드. 헤더 버튼을 눌렀을 때만 뜨고, ✕나 헤더 버튼으로 언제든 끝낼 수 있다.
 * 단계를 옮기면 그 단계의 화면을 보고서와 같은 조건으로 열고, 확인할 곳을 강조한다.
 * 실험 실행은 사용자가 직접 누른다 (무거운 실험이 저절로 돌지 않도록).
 */
export default function TutorialPanel() {
  const { active, index, collapsed } = useTutorial()
  const [consoleOpen] = useConsoleOpen()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const step = tutorialSteps[index]
  const total = tutorialSteps.length
  const stepPath = step.to.split('?')[0]
  const isLast = index === total - 1

  // 단계가 바뀔 때만 이동한다. 가이드 도중 사용자가 다른 화면을 둘러봐도 끌고 오지 않는다.
  useEffect(() => {
    if (!active) return
    navigate(tutorialSteps[index].to)
  }, [active, index, navigate])

  useSpotlight(step.target, active && pathname === stepPath, pathname)

  if (!active) return null
  return (
    <aside
      aria-label="실험 가이드"
      className={`tutorial-enter fixed inset-x-2 z-30 flex flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black/40 md:inset-x-auto md:left-4 md:w-[380px] ${
        // 휴대폰에서 콘솔이 아래쪽 절반을 차지하면 그 위로 올린다
        consoleOpen ? 'bottom-[calc(45dvh+0.5rem)] md:bottom-4' : 'bottom-2 md:bottom-4'
      } ${collapsed ? '' : 'max-h-[min(70dvh,600px)] md:max-h-[min(80dvh,640px)]'}`}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="text-xs font-semibold text-ink-3">실험 가이드</span>
        <span className="font-mono text-xs text-ink-3">
          {index + 1} / {total}
        </span>
        {collapsed && <span className="min-w-0 truncate text-sm font-medium">{step.title}</span>}
        <div className="ml-auto flex shrink-0 gap-1">
          <button
            onClick={() => setTutorialCollapsed(!collapsed)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? '가이드 펼치기' : '가이드 접기'}
            title={collapsed ? '펼치기' : '접기'}
            className="rounded px-2 py-1 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
              className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={endTutorial}
            aria-label="실험 가이드 끝내기"
            title="가이드 끝내기"
            className="rounded px-2 py-1 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>
      <div aria-hidden className="h-0.5 bg-surface-3">
        <div className="h-full bg-ink-2 transition-[width] duration-300" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>

      {!collapsed && (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            <div>
              <p className="font-mono text-xs text-ink-3">보고서 {step.section}</p>
              <h2 className="mt-0.5 font-semibold">{step.title}</h2>
            </div>
            {step.body.map((p) => (
              <p key={p} className="leading-relaxed text-ink-2">
                {p}
              </p>
            ))}
            {step.todo && (
              <p className="rounded-md border border-line-strong bg-surface-2 px-3 py-2 leading-relaxed">
                <span className="mr-1.5 text-xs font-semibold text-ink-3">해 볼 것</span>
                {step.todo}
              </p>
            )}
            {pathname !== stepPath && (
              <Button size="sm" onClick={() => navigate(step.to)}>
                이 단계 화면으로 돌아가기
              </Button>
            )}
            {step.expect && (
              <div>
                <p className="text-xs font-semibold text-ink-3">보고서 값</p>
                <dl className="mt-1 divide-y divide-line rounded-md border border-line">
                  {step.expect.map((e) => (
                    <div key={e.label} className="flex justify-between gap-3 px-3 py-1.5">
                      <dt className="text-ink-3">{e.label}</dt>
                      <dd className="text-right font-mono text-xs leading-5">{e.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {step.live && <LiveResults kind={step.live} />}
          </div>

          <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
            <Button size="sm" variant="ghost" onClick={() => goToStep(index - 1)} disabled={index === 0}>
              ← 이전
            </Button>
            <Button size="sm" variant="primary" className="ml-auto" onClick={isLast ? endTutorial : () => goToStep(index + 1)}>
              {isLast ? '가이드 끝내기' : '다음 →'}
            </Button>
          </div>
        </>
      )}
    </aside>
  )
}

// ── 지금 측정한 값 ──────────────────────────────────────────
// D·E·F·G 화면이 남긴 마지막 결과(ui/results.ts)를 읽어 보고서 값 옆에 보여준다.

const name = (id: AlgorithmId) => getAlgorithm(id).name

function LiveBox({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-3">지금 측정한 값</p>
      <div className="mt-1 divide-y divide-line rounded-md border border-line">{children}</div>
      {note && <p className="mt-1 text-xs leading-relaxed text-ink-3">{note}</p>}
    </div>
  )
}

function LiveRow({ label, value, match }: { label: string; value: string; match?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-3 py-1.5">
      <span className="text-ink-3">{label}</span>
      <span className="text-right font-mono text-xs leading-5">
        {value}
        {match !== undefined && (
          <span className={`ml-1.5 ${match ? 'text-good' : 'text-warn'}`}>{match ? '✓ 일치' : '차이 있음'}</span>
        )}
      </span>
    </div>
  )
}

const empty = (what: string) => <p className="px-3 py-2 text-xs text-ink-3">아직 {what} 결과가 없어요.</p>

/** 마지막 두 크기(2배 차이)의 시간 비율 */
function growth(e: PerformanceEntry | undefined) {
  const [a, b] = e?.points.slice(-2) ?? []
  return a && b && b.n === a.n * 2 ? { from: a.n, to: b.n, ratio: b.medianMs / a.medianMs } : undefined
}

/** 두 알고리즘이 모두 잰 가장 큰 크기에서의 시간 비율 (b ÷ a) */
function ratioAtCommon(a: PerformanceEntry | undefined, b: PerformanceEntry | undefined) {
  if (!a || !b) return undefined
  const common = a.points.filter((p) => b.points.some((q) => q.n === p.n)).at(-1)
  if (!common) return undefined
  return { n: common.n, ratio: b.points.find((q) => q.n === common.n)!.medianMs / common.medianMs }
}

const REPORT_TVD: Record<AlgorithmId, number> = {
  'fisher-yates': 0.0013,
  'pick-remove': 0.0016,
  riffle: 0.0082,
  'random-key': 0.0022,
}

function LiveResults({ kind }: { kind: TutorialLive }) {
  const { relationship, uniformity, performance } = useResults()
  const fy = performance['fisher-yates']
  const pr = performance['pick-remove']

  if (kind === 'performance') {
    const rows = [fy, pr].map((e, k) => ({ label: k === 0 ? 'Fisher–Yates' : 'Pick & Remove', g: growth(e) }))
    const r = ratioAtCommon(fy, pr)
    return (
      <LiveBox note="실행 시간은 컴퓨터마다 달라요. 2배 늘렸을 때 약 2배(O(n)), 약 4배(O(n²))면 보고서와 같은 경향이에요.">
        {!fy && !pr
          ? empty('효율성 측정')
          : rows.map(({ label, g }) => (
              <LiveRow
                key={label}
                label={g ? `${label} ${g.from.toLocaleString()} → ${g.to.toLocaleString()}` : label}
                value={g ? `${fmtNum(g.ratio, 2)}배` : '—'}
              />
            ))}
        {r && <LiveRow label={`P&R ÷ FY (n = ${r.n.toLocaleString()})`} value={`${fmtNum(r.ratio, 1)}배`} />}
      </LiveBox>
    )
  }

  if (kind === 'uniformity') {
    const ids = Object.keys(REPORT_TVD) as AlgorithmId[]
    const any = ids.some((id) => uniformity[id])
    return (
      <LiveBox note="시드 1로 고정해 n = 4, 100만 회로 돌리면 보고서와 같은 값이 나와요. 조건이 다르면 비교하지 않아요.">
        {!any
          ? empty('균등성 실험')
          : ids.map((id) => {
              const e = uniformity[id]
              if (!e) return <LiveRow key={id} label={name(id)} value="—" />
              const same = e.n === 4 && e.trials === 1_000_000 && e.rngKind === 'seeded' && e.seed === 1
              return (
                <LiveRow
                  key={id}
                  label={name(id)}
                  value={same ? `TVD ${fmtNum(e.tvd, 4)}` : `다른 조건 (n = ${e.n}, ${e.trials.toLocaleString()}회)`}
                  match={same ? Math.abs(e.tvd - REPORT_TVD[id]) < 0.00005 : undefined}
                />
              )
            })}
      </LiveBox>
    )
  }

  if (kind === 'relationship') {
    const e = relationship['fisher-yates']
    const same = e && e.n === 8 && e.seed === 1
    return (
      <LiveBox note="τ 분포는 화면을 열면 바로 계산돼요. Fisher–Yates, 원소 8개, 시드 1일 때 보고서와 같아요.">
        {!e ? (
          empty('Fisher–Yates 관계성')
        ) : !same ? (
          <LiveRow label="Fisher–Yates" value={`다른 조건 (원소 ${e.n}개, 시드 ${e.seed})`} />
        ) : (
          <>
            <LiveRow label="평균 τ" value={fmtNum(e.meanTau)} match={fmtNum(e.meanTau) === '-0.010'} />
            <LiveRow label="|τ| ≥ 0.5인 비율" value={fmtPct(e.highR)} match={fmtPct(e.highR) === '10.7%'} />
          </>
        )}
      </LiveBox>
    )
  }

  // compare
  const ids = Object.keys(REPORT_TVD) as AlgorithmId[]
  const withR = ids.filter((id) => relationship[id])
  const r = ratioAtCommon(fy, pr)
  return (
    <LiveBox>
      {withR.length === 0 && !r
        ? empty('전체 비교')
        : withR.map((id) => (
            <LiveRow key={id} label={`${name(id)} 평균 R`} value={`${fmtNum(relationship[id]!.meanR)} (n = ${relationship[id]!.n})`} />
          ))}
      {r && <LiveRow label={`P&R ÷ FY (n = ${r.n.toLocaleString()})`} value={`${fmtNum(r.ratio, 1)}배`} />}
    </LiveBox>
  )
}
