// 화면 공통 UI 조각. 색은 index.css의 토큰만 쓴다.
import type { ButtonHTMLAttributes, ReactNode } from 'react'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-xl border border-line bg-surface p-4 sm:p-5', className)}>{children}</section>
}

/** 화면 맨 위 제목 */
export function PageHeader({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: ReactNode }) {
  return (
    <header>
      {eyebrow && <p className="text-xs font-semibold text-ink-3">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
      {desc && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-2">{desc}</p>}
    </header>
  )
}

/** 카드 안 제목 */
export function CardHeader({ title, desc, right }: { title: ReactNode; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {desc && <p className="mt-1 text-xs leading-relaxed text-ink-3">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        size === 'md' ? 'px-3.5 py-1.5' : 'px-2.5 py-1',
        variant === 'primary' && 'bg-accent font-medium text-accent-ink hover:bg-accent-hover',
        variant === 'secondary' && 'border border-line-strong bg-surface hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        className,
      )}
    />
  )
}

const fieldClass =
  'rounded-md border border-line-strong bg-surface px-2 py-1 text-sm text-ink focus-visible:outline-2 focus-visible:outline-focus'

export function Select<V extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: V
  onChange: (v: V) => void
  options: { value: V; label: string }[]
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      {label}
      <select
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          onChange((typeof value === 'number' ? Number(raw) : raw) as V)
        }}
        className={fieldClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/** 1 이상의 정수 입력 (시드 등). 빈칸이나 잘못된 값은 무시하고 이전 값을 유지한다. */
export function IntInput({
  label,
  value,
  onChange,
  min = 1,
  max = 999_999,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isInteger(v) && v >= min && v <= max) onChange(v)
        }}
        className={cx(fieldClass, 'w-24 font-mono')}
      />
    </label>
  )
}

/** 몇 개 중 하나를 고르는 버튼 묶음 */
export function Segmented<V extends string | number>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'md',
}: {
  value: V
  onChange: (v: V) => void
  options: { value: V; label: ReactNode }[]
  ariaLabel: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex rounded-lg bg-surface-3 p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'rounded-md text-sm transition-colors',
              size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5',
              on ? 'bg-surface font-semibold text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const calloutTone = {
  info: 'border-line-strong bg-surface-2 text-ink-2',
  warn: 'border-warn/50 bg-warn-soft text-ink',
  bad: 'border-bad/50 bg-bad-soft text-ink',
}

/** 안내·주의 상자 */
export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof calloutTone
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('rounded-lg border px-4 py-3 text-sm leading-relaxed', calloutTone[tone], className)}>
      {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
      {children}
    </div>
  )
}

/** 가로로 넘치면 스크롤되는 표 틀 */
export function Table({ children, minWidth, caption }: { children: ReactNode; minWidth?: number; caption?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={minWidth ? { minWidth } : undefined}>
          {children}
        </table>
      </div>
      {caption && <p className="border-t border-line px-4 py-2 text-xs text-ink-3">{caption}</p>}
    </div>
  )
}

export const th = 'px-4 py-2 text-left text-xs font-medium text-ink-3'
export const td = 'px-4 py-2'
export const thead = 'bg-surface-2'
export const tbody = 'divide-y divide-line'

/** 진행률 막대 */
export function Progress({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-1.5 w-28 overflow-hidden rounded bg-surface-3"
    >
      <div className="h-full bg-ink-2 transition-[width]" style={{ width: `${value * 100}%` }} />
    </div>
  )
}
