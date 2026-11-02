import { useEffect, useRef } from 'react'
import { clearLog, useConsoleOpen, useLog, type LogLevel } from '../console'

const levelClass: Record<LogLevel, string> = {
  info: 'text-console-ink-2',
  step: 'text-console-ink',
  result: 'text-console-accent',
  warn: 'text-console-warn',
}

const two = (v: number) => String(v).padStart(2, '0')
const clock = (t: number) => {
  const d = new Date(t)
  return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}

/** 헤더의 콘솔 열기/닫기 버튼 */
export function ConsoleToggle() {
  const [open, setOpen] = useConsoleOpen()
  return (
    <button
      onClick={() => setOpen(!open)}
      aria-pressed={open}
      aria-label={open ? '콘솔 닫기' : '콘솔 열기'}
      title={open ? '콘솔 닫기' : '콘솔 열기 (연산 과정 보기)'}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors ${
        open ? 'border-ink-2 bg-surface-3 text-ink' : 'border-line-strong text-ink-2 hover:bg-surface-2 hover:text-ink'
      }`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9l3 3-3 3M13 15h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/**
 * 화면 오른쪽(휴대폰에서는 아래쪽)에 붙는 콘솔. 화면들이 남긴 연산 기록을 시간순으로 보여준다.
 * 맨 아래를 보고 있을 때만 새 줄을 따라 내려가고, 위로 올려 읽는 중에는 그대로 둔다.
 */
export default function ConsolePanel() {
  const [open, setOpen] = useConsoleOpen()
  const lines = useLog()
  const box = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  useEffect(() => {
    if (open && stick.current && box.current) box.current.scrollTop = box.current.scrollHeight
  }, [lines, open])

  if (!open) return null
  return (
    <aside
      aria-label="콘솔"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[45dvh] flex-col border-t border-console-line bg-console-bg text-console-ink md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[min(420px,50vw)] md:border-t-0 md:border-l md:shadow-2xl md:shadow-black/50 xl:w-[400px] xl:shadow-none"
    >
      <div className="flex items-center gap-3 border-b border-console-line px-4 py-2.5">
        <span className="font-mono text-sm font-semibold">
          <span className="text-console-accent">$</span> console
        </span>
        <span className="font-mono text-xs text-console-ink-3">{lines.length}줄</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={clearLog}
            className="rounded px-2 py-1 font-mono text-xs text-console-ink-2 hover:bg-console-line hover:text-console-ink"
          >
            clear
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="콘솔 닫기"
            className="rounded px-2 py-1 font-mono text-xs text-console-ink-2 hover:bg-console-line hover:text-console-ink"
          >
            ✕
          </button>
        </div>
      </div>
      <div
        ref={box}
        role="log"
        aria-live="off"
        onScroll={(e) => {
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24
        }}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-5"
      >
        {lines.length === 0 ? (
          <p className="text-console-ink-3">
            아직 기록이 없어요. 동작 시각화에서 단계를 넘기거나 관계성·균등성·효율성 화면에서 실험을 돌리면 연산 과정이 여기에
            쌓여요.
          </p>
        ) : (
          lines.map((l) => (
            <div key={l.id} className="flex gap-2 [word-break:break-word]">
              <span className="shrink-0 text-console-ink-3">{clock(l.time)}</span>
              <span className="shrink-0 text-console-ink-3">[{l.source}]</span>
              <span className={`min-w-0 whitespace-pre-wrap ${levelClass[l.level]}`}>{l.text}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
