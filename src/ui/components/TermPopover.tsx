import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * 문장 속 용어를 누르면 바로 아래에 짧은 설명 창을 띄운다.
 * 문단(<p>) 안에서도 쓸 수 있게 span으로만 그린다. 바깥을 누르거나 Esc를 누르면 닫힌다.
 * 용어가 줄 오른쪽에 있으면 창이 화면 밖으로 나가지 않게 왼쪽으로 당긴다.
 */
const GUTTER = 16

export default function TermPopover({ term, title, children }: { term: ReactNode; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLSpanElement>(null)
  const id = useId()

  // 화면에 그리기 전에 창 위치를 정해 깜빡이지 않게 한다
  useLayoutEffect(() => {
    if (!open || !root.current || !panel.current) return
    const place = () => {
      const anchor = root.current!.getBoundingClientRect().left
      const width = panel.current!.offsetWidth
      const maxLeft = window.innerWidth - GUTTER - width
      panel.current!.style.left = `${Math.max(GUTTER, Math.min(anchor, maxLeft)) - anchor}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={root} className="relative inline-block">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help rounded-sm font-medium text-ink underline decoration-ink-3 decoration-dotted underline-offset-4 hover:decoration-ink"
      >
        {term}
      </button>
      {open && (
        <span
          ref={panel}
          id={id}
          role="dialog"
          aria-label={title}
          className="absolute top-full z-30 mt-2 block w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line-strong bg-surface p-4 text-left text-sm leading-relaxed font-normal text-ink-2 shadow-lg shadow-black/30"
        >
          <span className="flex items-start justify-between gap-3">
            <span className="font-semibold text-ink">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="설명 닫기"
              className="-mt-1 -mr-1 rounded px-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              ✕
            </button>
          </span>
          <span className="mt-2 block space-y-2">{children}</span>
        </span>
      )}
    </span>
  )
}
