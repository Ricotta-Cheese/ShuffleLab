import type { Algorithm } from '../../core/algorithms'
import { uniformLabel } from '../../content/algorithms'

// 상태 색은 아이콘과 글자와 함께 쓴다 (색만으로 구분하지 않음)
const styles: Record<Algorithm['uniform'], { cls: string; icon: string }> = {
  yes: { cls: 'bg-good-soft text-good', icon: '✓' },
  no: { cls: 'bg-bad-soft text-bad', icon: '✗' },
  conditional: { cls: 'bg-warn-soft text-warn', icon: '△' },
  approximate: { cls: 'bg-warn-soft text-warn', icon: '≈' },
}

export default function UniformBadge({ uniform }: { uniform: Algorithm['uniform'] }) {
  const s = styles[uniform]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.cls}`}
    >
      <span aria-hidden>{s.icon}</span>
      {uniformLabel[uniform]}
    </span>
  )
}
