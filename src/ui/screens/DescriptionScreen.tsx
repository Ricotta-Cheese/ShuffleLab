import { description } from '../../content/description'

function LinkCard({ label, href, hint }: { label: string; href: string; hint: string }) {
  const ready = href !== ''
  const body = (
    <>
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block truncate text-xs text-slate-500">{ready ? href : '준비 중'}</span>
      <span className="mt-2 block text-xs text-slate-400">{hint}</span>
    </>
  )
  return ready ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-400"
    >
      {body}
    </a>
  ) : (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-slate-400">{body}</div>
  )
}

export default function DescriptionScreen() {
  const { title, subtitle, motivation, questions, links } = description

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold">이 주제를 고른 이유</h3>
        <div className="mt-3 space-y-2 leading-relaxed text-slate-700">
          {motivation.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold">분석 관점</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {questions.map((q) => (
            <div key={q.name} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold">
                {q.name} <span className="text-sm font-normal text-slate-400">{q.en}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600">{q.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold">링크</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <LinkCard label="GitHub 저장소" href={links.github} hint="소스 코드와 실험 코드" />
          <LinkCard label="보고서 (PDF)" href={links.report} hint="분석 결과와 단계별 설명" />
        </div>
      </section>
    </div>
  )
}
