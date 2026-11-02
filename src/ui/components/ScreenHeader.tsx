import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getHypothesis, type HypothesisId } from '../../content/hypotheses'
import { getScreen, type ScreenId } from '../../content/screens'
import { PageHeader } from './ui'

export function HypothesisChip({ id }: { id: HypothesisId }) {
  const h = getHypothesis(id)
  return (
    <Link
      to={`/description#h${id}`}
      title={h.statement}
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-0.5 text-xs text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      <span className="font-mono font-semibold text-ink">H{id}</span>
      {h.question}
    </Link>
  )
}

/** 화면 머리말: 제목, 설명, 이 화면에서 확인할 것, 관련 가설 */
export default function ScreenHeader({ id, title, desc }: { id: ScreenId; title: string; desc?: ReactNode }) {
  const s = getScreen(id)
  return (
    <div className="space-y-4">
      <PageHeader eyebrow={`${s.letter} · ${s.subtitle}`} title={title} desc={desc} />
      {(s.goals.length > 0 || s.hypotheses.length > 0) && (
        <div className="grid gap-x-8 gap-y-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm md:grid-cols-[1fr_auto]">
          {s.goals.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-3">이 화면에서 확인할 것</p>
              <ul className="mt-1 space-y-0.5 text-ink-2">
                {s.goals.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span aria-hidden className="text-ink-3">·</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.hypotheses.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-3">관련 가설</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5 md:flex-col md:items-start">
                {s.hypotheses.map((h) => (
                  <HypothesisChip key={h} id={h} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
