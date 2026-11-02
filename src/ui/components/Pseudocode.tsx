export default function Pseudocode({ lines, active = [] }: { lines: string[]; active?: number[] }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-line bg-code-bg py-3 font-mono text-[13px] leading-6 text-code-ink">
      {lines.map((line, k) => {
        const on = active.includes(k)
        return (
          <div key={k} className={`flex px-3 ${on ? 'bg-code-active text-code-active-ink' : ''}`}>
            <span className="mr-4 w-4 shrink-0 text-right text-code-muted select-none">{k + 1}</span>
            <span className="whitespace-pre">{line}</span>
          </div>
        )
      })}
    </pre>
  )
}
