import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { description } from '../../content/description'
import { hypotheses } from '../../content/hypotheses'
import { screenMeta } from '../../content/screens'
import { Card, CardHeader, PageHeader } from '../components/ui'

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

/** 사이트 사용 순서: B~F 화면을 순서대로 안내한다 */
function Tour() {
  const steps = screenMeta.filter((s) => s.id !== 'description')
  return (
    <section>
      <h3 className="text-sm font-semibold">이렇게 둘러보세요</h3>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
      <h3 className="text-sm font-semibold">연구 가설</h3>
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

export default function DescriptionScreen() {
  const { title, subtitle, summary, motivation, questions, links } = description
  const { hash } = useLocation()

  // 다른 화면의 가설 칩에서 #h1 같은 주소로 들어오면 그 카드로 스크롤한다
  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="A · 프로젝트 소개" title={title} desc={subtitle} />
      <p className="-mt-4 max-w-3xl leading-relaxed text-ink-2">{summary}</p>

      <Tour />

      <Card>
        <CardHeader title="이 주제를 고른 이유" />
        <div className="space-y-2 leading-relaxed text-ink-2">
          {motivation.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Card>

      <section>
        <h3 className="text-sm font-semibold">분석 관점</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {questions.map((q) => (
            <Card key={q.name}>
              <p className="font-semibold">
                {q.name} <span className="text-sm font-normal text-ink-3">{q.en}</span>
              </p>
              <p className="mt-1 text-sm text-ink-2">{q.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <Hypotheses active={hash} />

      <section>
        <h3 className="text-sm font-semibold">링크</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LinkCard label="GitHub 저장소" href={links.github} hint="소스 코드와 실험 코드" />
          <LinkCard label="보고서 (PDF)" href={links.report} hint="분석 결과와 단계별 설명" />
        </div>
      </section>
    </div>
  )
}
