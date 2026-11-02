import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { getHypothesis, type HypothesisId } from '../../content/hypotheses'

/**
 * 화면 안에서 가설과 관련된 수치를 보여주는 상자.
 * 결론 문장을 미리 쓰지 않고, 지금 화면에서 돌린 결과만 children으로 보여준다.
 */
export default function HypothesisNote({ id, children }: { id: HypothesisId; children: ReactNode }) {
  const h = getHypothesis(id)
  return (
    <aside className="rounded-xl border border-line-strong bg-surface-2 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-semibold">
          <span className="mr-1.5 font-mono text-ink-3">H{id}</span>
          {h.question}
        </p>
        <Link to={`/description#h${id}`} className="text-xs text-link hover:underline">
          가설 보기
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-ink-3">{h.statement}</p>
      <div className="mt-2 leading-relaxed text-ink-2">{children}</div>
    </aside>
  )
}
