import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { useTheme } from '../theme'

export default function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const next = theme === 'dark' ? '라이트' : '다크'

  // 새 테마가 버튼에서 원으로 퍼지며 드러난다. View Transitions를 못 쓰거나 움직임 줄이기를 켰으면 바로 바꾼다.
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return toggle()
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const t = document.startViewTransition(() => flushSync(toggle))
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <button
      onClick={onClick}
      aria-label={`${next} 모드로 바꾸기`}
      title={`${next} 모드로 바꾸기`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-strong text-ink-2 transition duration-150 hover:bg-surface-2 hover:text-ink active:scale-90"
    >
      {/* key를 바꿔 아이콘이 바뀔 때마다 돌며 나타나게 한다 */}
      {theme === 'dark' ? (
        // 해 아이콘: 누르면 라이트 모드
        <svg key="sun" className="icon-enter" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // 달 아이콘: 누르면 다크 모드
        <svg key="moon" className="icon-enter" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
