// 화면 공통 UI 조각. 색은 index.css의 토큰만 쓴다.
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sliderClass, useSlider } from '../useSlider'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/** tour: 실험 가이드가 이 카드를 강조할 때 쓰는 이름 (data-tour) */
export function Card({ children, className, tour }: { children: ReactNode; className?: string; tour?: string }) {
  return (
    <section data-tour={tour} className={cx('min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5', className)}>
      {children}
    </section>
  )
}

/**
 * 마우스를 올리거나 키보드로 고르면 아래에 작게 뜨는 이름표 (헤더 아이콘 버튼용).
 * 오른쪽 끝 버튼도 화면 밖으로 나가지 않게 오른쪽에 맞춘다. 터치 화면에서는 hover가 없어 뜨지 않는다.
 */
export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 z-50 mt-2 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-bg opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-hover/tip:delay-200 group-has-[:focus-visible]/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  )
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
        'inline-flex items-center justify-center gap-1.5 rounded-md text-sm whitespace-nowrap transition duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        size === 'md' ? 'h-9 px-3.5' : 'px-2.5 py-1',
        variant === 'primary' && 'btn-shine bg-accent font-medium text-accent-ink hover:bg-accent-hover hover:shadow-md',
        variant === 'secondary' && 'border border-line-strong bg-surface hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        className,
      )}
    />
  )
}

// 선택 창·입력 칸 공통 모양: 높이를 맞추고, 선택 창 화살표는 직접 그린다
export const controlClass =
  'h-9 rounded-md border border-line-strong bg-surface text-sm text-ink transition-colors hover:border-ink-3 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:hover:border-line-strong'

/** 이름 + 칸. stacked면 이름을 위에 작게, 아니면 왼쪽에 둔다. */
function FieldLabel({ label, stacked, hideLabel, children }: { label: string; stacked?: boolean; hideLabel?: boolean; children: ReactNode }) {
  return (
    <label className={stacked ? 'flex min-w-0 flex-col gap-1.5' : 'flex items-center gap-2 text-sm text-ink-2'}>
      <span className={cx(hideLabel && 'sr-only', stacked && 'text-xs font-medium text-ink-3')}>{label}</span>
      {children}
    </label>
  )
}

export function Select<V extends string | number>({
  label,
  value,
  onChange,
  options,
  hideLabel,
  stacked,
}: {
  label: string
  value: V
  onChange: (v: V) => void
  options: { value: V; label: string }[]
  /** 이름을 화면에서 숨기고 스크린리더에만 알린다 */
  hideLabel?: boolean
  /** 이름을 칸 위에 둔다 (설정 패널용) */
  stacked?: boolean
}) {
  return (
    <FieldLabel label={label} stacked={stacked} hideLabel={hideLabel}>
      <span className={cx('relative', stacked && 'block')}>
        <select
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            onChange((typeof value === 'number' ? Number(raw) : raw) as V)
          }}
          className={cx(controlClass, 'cursor-pointer appearance-none pr-9 pl-3', stacked && 'w-full')}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-3"
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </FieldLabel>
  )
}

/** 1 이상의 정수 입력 (시드 등). 빈칸이나 잘못된 값은 무시하고 이전 값을 유지한다. */
export function IntInput({
  label,
  value,
  onChange,
  min = 1,
  max = 999_999,
  stacked,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  stacked?: boolean
}) {
  return (
    <FieldLabel label={label} stacked={stacked}>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (Number.isInteger(v) && v >= min && v <= max) onChange(v)
        }}
        className={cx(controlClass, 'px-3 font-mono', stacked ? 'w-full' : 'w-24')}
      />
    </FieldLabel>
  )
}

/**
 * 설정 카드의 한 줄: 왼쪽에 이름, 오른쪽에 컨트롤. 이름 열 너비를 맞춰 여러 줄이 가지런히 정렬된다.
 * 좁은 화면에서는 이름을 위에 둔다.
 */
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-2 md:grid-cols-[6rem_minmax(0,1fr)]">
      <span className="text-xs font-medium text-ink-3 md:pt-2.5 md:text-sm md:font-normal">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** 몇 개 중 하나를 고르는 버튼 묶음. 선택 상태는 aria-pressed로 알린다. */
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
  const [ref, slider] = useSlider<HTMLDivElement>(value)
  return (
    <div ref={ref} role="group" aria-label={ariaLabel} className="relative inline-flex rounded-lg bg-surface-3 p-0.5">
      <span aria-hidden className={cx(sliderClass, 'rounded-md bg-surface shadow-sm')} style={slider} />
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            aria-pressed={on}
            data-active={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative rounded-md text-sm transition active:scale-95',
              size === 'md' ? 'h-8 px-3' : 'px-2 py-0.5',
              on ? 'font-semibold text-ink' : 'text-ink-2 hover:text-ink',
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
      <div className="h-full bg-ink-2 transition-[width] duration-300 ease-out" style={{ width: `${value * 100}%` }} />
    </div>
  )
}
