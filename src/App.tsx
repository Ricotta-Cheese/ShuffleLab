import { Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import ThemeToggle from './ui/components/ThemeToggle'
import { screens } from './ui/screens'

export default function App() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md bg-accent font-mono text-xs text-accent-ink">
                SL
              </span>
              Shuffle Lab
            </h1>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
          <nav aria-label="화면" className="-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
            {screens.map((s) => (
              <NavLink
                key={s.path}
                to={s.path}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive ? 'bg-accent font-medium text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Suspense fallback={<p className="text-sm text-ink-3">불러오는 중…</p>}>
          <Routes>
            <Route path="/" element={<Navigate to={screens[0].path} replace />} />
            {screens.map((s) => (
              <Route key={s.path} path={s.path} element={<s.Component />} />
            ))}
            <Route path="*" element={<Navigate to={screens[0].path} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
