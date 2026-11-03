import { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { description } from './content/description'
import ConsolePanel, { ConsoleToggle } from './ui/components/ConsolePanel'
import { ScreenPager, TopNav } from './ui/components/ScreenNav'
import ThemeToggle from './ui/components/ThemeToggle'
import TutorialPanel, { TutorialToggle } from './ui/components/TutorialPanel'
import { useConsoleOpen } from './ui/console'
import { screens } from './ui/screens'
import { useTutorial } from './ui/tutorial'

export default function App() {
  const [consoleOpen] = useConsoleOpen()
  const tutorial = useTutorial()
  const { pathname } = useLocation()
  return (
    // 콘솔을 열면 넓은 화면(xl 이상)에서는 화면 전체를 왼쪽으로 밀어 콘솔과 나란히 둔다.
    // 화면 레이아웃은 창 폭 기준이라, 그보다 좁은 데스크톱에서 밀면 배치가 깨지므로 콘솔을 위에 겹쳐 띄운다.
    // 휴대폰에서는 아래쪽 절반에 띄우고 내용을 그만큼 위로 올린다.
    <div className={`flex min-h-dvh flex-col ${consoleOpen ? 'pb-[45dvh] md:pb-0 xl:mr-[400px]' : ''}`}>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-base font-bold tracking-tight">
              <span aria-hidden className="grid h-6 w-6 place-items-center rounded-md bg-accent font-mono text-xs text-accent-ink">
                SL
              </span>
              Shuffle Lab
            </h1>
            <div className="flex gap-2 md:hidden">
              <TutorialToggle />
              <ConsoleToggle />
              <ThemeToggle />
            </div>
          </div>
          <TopNav />
          <div className="hidden gap-2 md:flex">
            <TutorialToggle />
            <ConsoleToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<p className="text-sm text-ink-3">불러오는 중…</p>}>
          {/* 화면을 바꿀 때마다 새로 그려 등장 애니메이션을 다시 튼다 */}
          <div key={pathname} className="page-enter">
            <Routes>
              <Route path="/" element={<Navigate to={screens[0].path} replace />} />
              {screens.map((s) => (
                <Route key={s.path} path={s.path} element={<s.Component />} />
              ))}
              <Route path="*" element={<Navigate to={screens[0].path} replace />} />
            </Routes>
          </div>
          <ScreenPager />
          {/* 펼친 가이드 창이 화면 맨 아래(이전/다음 이동)를 가리지 않도록 그만큼 비워 둔다 */}
          {tutorial.active && !tutorial.collapsed && <div aria-hidden className="h-[60dvh] md:h-72" />}
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
      <TutorialPanel />
      <ConsolePanel />
    </div>
  )
}
