export default function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[11px] text-ink-3">{label}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-ink-3">{hint}</div>}
    </div>
  )
}
