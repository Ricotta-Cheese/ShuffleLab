import type { Algorithm } from '../../core/algorithms'
import { uniformLabel } from '../../content/algorithms'

const styles: Record<Algorithm['uniform'], string> = {
  yes: 'bg-green-100 text-green-800',
  no: 'bg-red-100 text-red-800',
  conditional: 'bg-amber-100 text-amber-800',
}

export default function UniformBadge({ uniform }: { uniform: Algorithm['uniform'] }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${styles[uniform]}`}>
      {uniformLabel[uniform]}
    </span>
  )
}
