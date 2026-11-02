import { Link, NavLink, useLocation } from 'react-router'
import { screenMeta, type ScreenMeta } from '../../content/screens'
import { useLastAlgorithm } from '../useAlgorithmParam'

/** 화면으로 가는 주소. 알고리즘을 고르는 화면이면 마지막으로 고른 알고리즘을 붙인다. */
function useScreenHref() {
  const algo = useLastAlgorithm()
  return (s: ScreenMeta) => (s.usesAlgorithm ? `${s.path}?algo=${algo}` : s.path)
}

/** 상단 메뉴 */
export function TopNav() {
  const href = useScreenHref()
  return (
    <nav aria-label="화면" className="-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
      {screenMeta.map((s) => (
        <NavLink
          key={s.id}
          to={href(s)}
          title={s.subtitle}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
              isActive ? 'bg-accent font-medium text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`font-mono text-xs ${isActive ? 'opacity-70' : 'text-ink-3'}`}>{s.letter}</span>
              {s.name}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/** 화면 아래의 이전/다음 이동 */
export function ScreenPager() {
  const { pathname } = useLocation()
  const href = useScreenHref()
  const k = screenMeta.findIndex((s) => s.path === pathname)
  if (k < 0) return null
  const prev = screenMeta[k - 1]
  const next = screenMeta[k + 1]

  const card = (s: ScreenMeta, dir: 'prev' | 'next') => (
    <Link
      to={href(s)}
      onClick={() => window.scrollTo({ top: 0 })}
      className={`group flex flex-1 flex-col rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-2 ${
        dir === 'next' ? 'items-end text-right' : ''
      }`}
    >
      <span className="text-xs text-ink-3">{dir === 'prev' ? '← 이전' : '다음 →'}</span>
      <span className="mt-0.5 font-semibold">
        <span className="mr-1.5 font-mono text-sm text-ink-3">{s.letter}</span>
        {s.name}
      </span>
      <span className="text-xs text-ink-3">{s.subtitle}</span>
    </Link>
  )

  return (
    <nav aria-label="이전·다음 화면" className="mt-12 flex gap-3">
      {prev ? card(prev, 'prev') : <span className="flex-1" />}
      {next ? card(next, 'next') : <span className="flex-1" />}
    </nav>
  )
}
