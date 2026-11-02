import { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { description } from './content/description'
import { ScreenPager, TopNav } from './ui/components/ScreenNav'
import ThemeToggle from './ui/components/ThemeToggle'
import { screens } from './ui/screens'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-6">
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
          <TopNav />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-sm text-ink-3">불러오는 중…</p>}>
          <Routes>
            <Route path="/" element={<Navigate to={screens[0].path} replace />} />
            {screens.map((s) => (
              <Route key={s.path} path={s.path} element={<s.Component />} />
            ))}
            <Route path="*" element={<Navigate to={screens[0].path} replace />} />
          </Routes>
          <ScreenPager />
        </Suspense>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>
            <span className="font-semibold text-ink-2">Shuffle Lab</span> · {description.course}
          </p>
          <p className="flex flex-wrap gap-x-3">
            <span>{description.aiNote}</span>
            {description.links.github && (
              <a href={description.links.github} target="_blank" rel="noreferrer" className="text-link hover:underline">
                GitHub
              </a>
            )}
          </p>
        </div>
      </footer>
    </div>
  )
}
