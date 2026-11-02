import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { description } from '../../content/description'
import { hypotheses } from '../../content/hypotheses'
import { references } from '../../content/references'
import { getScreen, screenMeta } from '../../content/screens'
import { PageHeader } from '../components/ui'

function LinkCard({ label, href, hint }: { label: string; href: string; hint: string }) {
  const ready = href !== ''
  const body = (
    <>
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block truncate font-mono text-xs text-ink-3">{ready ? href : '준비 중'}</span>
      <span className="mt-2 block text-xs text-ink-3">{hint}</span>
    </>
  )
  return ready ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      {body}
    </a>
  ) : (
    <div className="rounded-xl border border-dashed border-line-strong p-4 text-ink-3">{body}</div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-sm font-semibold">{children}</h3>
}

/** 주제를 고른 이유: 출발점이 된 질문들 */
function Motivation({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <section>
      <SectionTitle>이 주제를 고른 이유</SectionTitle>
      <div className="mt-3 space-y-3 rounded-xl border border-line bg-surface p-5">
        {paragraphs.map((p) => (
          <p key={p} className="border-l-2 border-line-strong pl-4 leading-relaxed text-ink">
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}

/** 프로젝트 설명: 요약과 세 가지 분석 관점 (각 관점을 실험하는 화면으로 이동) */
function Overview() {
  return (
    <section>
      <SectionTitle>무엇을 비교하나요</SectionTitle>
      <p className="mt-2 max-w-3xl leading-relaxed text-ink-2">{description.summary}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {description.questions.map((q) => {
          const s = getScreen(q.screen)
          return (
            <Link
              key={q.name}
              to={s.path}
              className="flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <span className="font-mono text-xs text-ink-3">{s.letter} 화면</span>
              <span className="mt-1 font-semibold">
                {q.name} <span className="text-sm font-normal text-ink-3">{q.en}</span>
              </span>
              <span className="mt-1 text-sm leading-relaxed text-ink-2">{q.desc}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/** 사이트 사용 순서: B~G 화면을 순서대로 안내한다 */
function Tour() {
  const steps = screenMeta.filter((s) => s.id !== 'description')
  return (
    <section>
      <SectionTitle>이렇게 둘러보세요</SectionTitle>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, k) => (
          <li key={s.id}>
            <Link
              to={s.path}
              className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              <span className="flex items-center gap-2 text-xs text-ink-3">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-surface-3 font-mono text-[11px] text-ink">
                  {k + 1}
                </span>
                {s.letter} · {s.subtitle}
              </span>
              <span className="mt-2 font-semibold">{s.name}</span>
              <span className="mt-1 text-xs leading-relaxed text-ink-2">{s.goals[0]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Hypotheses({ active }: { active: string }) {
  return (
    <section id="hypotheses" className="scroll-mt-24">
      <SectionTitle>연구 가설</SectionTitle>
      <p className="mt-1 text-xs text-ink-3">
        각 가설은 해당 화면에서 직접 실험해 확인해요. 화면마다 지금 돌린 결과가 가설과 어떻게 연결되는지 보여줘요.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {hypotheses.map((h) => (
          <div
            key={h.id}
            id={`h${h.id}`}
            className={`flex scroll-mt-24 flex-col rounded-xl border bg-surface p-4 transition-colors ${
              active === `#h${h.id}` ? 'border-focus ring-1 ring-focus' : 'border-line'
            }`}
          >
            <p className="font-semibold">
              <span className="mr-1.5 font-mono text-ink-3">H{h.id}</span>
              {h.question}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{h.statement}</p>
            <p className="mt-3 text-xs text-ink-3">비교: {h.compare}</p>
            <Link to={h.path} className="mt-auto pt-3 text-sm text-link hover:underline">
              {h.screenName}에서 확인하기 →
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

/** 참고 문헌: 분야별로 묶고, 이 사이트의 어디에 쓰였는지 함께 적는다 */
function References() {
  return (
    <section id="references" className="scroll-mt-24">
      <SectionTitle>참고 문헌</SectionTitle>
      <p className="mt-1 text-xs text-ink-3">알고리즘, 난수, 지표의 출처예요. 각 항목 아래에 이 사이트의 어디에 쓰였는지 적었어요.</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {references.map((g) => (
          <div key={g.title} className="rounded-xl border border-line bg-surface p-4">
            <h4 className="text-xs font-semibold text-ink-3">{g.title}</h4>
            <ol className="mt-3 space-y-4">
              {g.items.map((r) => (
                <li key={r.key} className="text-sm leading-relaxed">
                  <p className="font-semibold text-ink">{r.key}</p>
                  <p className="mt-0.5 text-ink-2 [overflow-wrap:anywhere]">
                    {r.citation}
                    {r.url && (
                      <>
                        {' '}
                        <a href={r.url} target="_blank" rel="noreferrer" className="text-link hover:underline">
                          {r.url.replace(/^https:\/\//, '')}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-ink-3">{r.used}</p>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function DescriptionScreen() {
  const { title, subtitle, motivation, links } = description
  const { hash } = useLocation()

  // 다른 화면의 가설 칩에서 #h1 같은 주소로 들어오면 그 카드로 스크롤한다
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="A · 프로젝트 소개" title={title} desc={subtitle} />
      <Motivation paragraphs={motivation} />
      <Overview />
      <Tour />

      <Hypotheses active={hash} />

      <References />

      <section>
        <SectionTitle>링크</SectionTitle>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LinkCard label="GitHub 저장소" href={links.github} hint="소스 코드와 실험 코드" />
          <LinkCard label="보고서 (PDF)" href={links.report} hint="분석 결과와 단계별 설명" />
        </div>
      </section>
    </div>
  )
}
