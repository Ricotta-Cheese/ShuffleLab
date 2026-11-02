import { Suspense } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import { screens } from './ui/screens'

export default function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-lg font-bold">Shuffle Lab</h1>
          <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
            {screens.map((s) => (
              <NavLink
                key={s.path}
                to={s.path}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-1.5 text-sm ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {s.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Suspense fallback={<p className="text-sm text-slate-400">불러오는 중…</p>}>
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
