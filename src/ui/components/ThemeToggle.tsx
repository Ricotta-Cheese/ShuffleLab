import { useTheme } from '../theme'

export default function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const next = theme === 'dark' ? '라이트' : '다크'
  return (
    <button
      onClick={toggle}
      aria-label={`${next} 모드로 바꾸기`}
      title={`${next} 모드로 바꾸기`}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-strong text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      {theme === 'dark' ? (
        // 해 아이콘: 누르면 라이트 모드
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // 달 아이콘: 누르면 다크 모드
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
