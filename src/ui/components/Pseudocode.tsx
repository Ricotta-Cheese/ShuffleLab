export default function Pseudocode({ lines, active = [] }: { lines: string[]; active?: number[] }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-900 py-3 font-mono text-[13px] leading-6 text-slate-300">
      {lines.map((line, k) => (
        <div
          key={k}
          className={`flex px-3 ${active.includes(k) ? 'bg-amber-300/20 text-amber-100' : ''}`}
        >
          <span className="mr-4 w-4 shrink-0 text-right text-slate-500 select-none">{k + 1}</span>
          <span className="whitespace-pre">{line}</span>
        </div>
      ))}
    </pre>
  )
}
