import { description } from '../../content/description'
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

export default function DescriptionScreen() {
  const { title, subtitle, motivation, questions, links } = description

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Shuffle Lab" title={title} desc={subtitle} />

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
