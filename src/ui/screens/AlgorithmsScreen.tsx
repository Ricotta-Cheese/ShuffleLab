import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { algorithms, getAlgorithm } from '../../core/algorithms'
import { algorithmContent } from '../../content/algorithms'
import AlgorithmPicker from '../components/AlgorithmPicker'
import Pseudocode from '../components/Pseudocode'
import UniformBadge from '../components/UniformBadge'
import { Card, PageHeader, Table, tbody, td, th, thead } from '../components/ui'
import { algoColor } from '../chartTheme'
import { useAlgorithmParam } from '../useAlgorithmParam'

function ComparisonTable() {
  return (
    <Table minWidth={560}>
      <thead className={thead}>
        <tr>
          <th className={th}>알고리즘</th>
          <th className={th}>시간</th>
          <th className={th}>추가 공간</th>
          <th className={th}>제자리</th>
          <th className={th}>균등성</th>
        </tr>
      </thead>
      <tbody className={tbody}>
        {algorithms.map((a) => (
          <tr key={a.id}>
            <td className={`${td} font-medium`}>
              <span className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ background: algoColor[a.id] }} />
                {a.name}
              </span>
            </td>
            <td className={`${td} font-mono`}>{a.time}</td>
            <td className={`${td} font-mono`}>{a.space}</td>
            <td className={td}>{a.inPlace ? '예' : '아니요'}</td>
            <td className={td}>
              <UniformBadge uniform={a.uniform} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h4 className="text-xs font-semibold tracking-wide text-ink-3">{title}</h4>
      <div className="mt-2 text-sm leading-relaxed text-ink-2">{children}</div>
    </Card>
  )
}

export default function AlgorithmsScreen() {
  const [id, setId] = useAlgorithmParam()
  const algo = getAlgorithm(id)
  const c = algorithmContent[id]

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <PageHeader
          eyebrow="B · 알고리즘"
          title="알고리즘 비교"
          desc='네 알고리즘은 모두 "배열을 무작위 순서로 섞는다"는 같은 문제를 푼다. 복잡도와 균등성을 한눈에 비교한다.'
        />
        <ComparisonTable />
      </div>

      <section className="space-y-4">
        <AlgorithmPicker value={id} onChange={setId} />

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold">{algo.name}</h3>
          <UniformBadge uniform={algo.uniform} />
          <Link to={`/visualize?algo=${id}`} className="ml-auto text-sm text-link hover:underline">
            동작 시각화로 보기 →
          </Link>
        </div>
        <p className="text-ink-2">{c.summary}</p>

        <div className="grid gap-4 lg:grid-cols-2">
          <InfoCard title="기본 원리">
            <ol className="list-decimal space-y-1 pl-5">
              {c.principle.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </InfoCard>
          <InfoCard title="핵심 의사코드">
            <Pseudocode lines={c.pseudocode} />
          </InfoCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title={`시간 복잡도 ${algo.time}`}>{c.timeWhy}</InfoCard>
          <InfoCard title={`추가 공간 ${algo.space}`}>{c.spaceWhy}</InfoCard>
          <InfoCard title="균등성">{c.uniformWhy}</InfoCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard title="장점">
            <ul className="list-disc space-y-1 pl-5">
              {c.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </InfoCard>
          <InfoCard title="한계와 주의점">
            <ul className="list-disc space-y-1 pl-5">
              {c.limits.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </InfoCard>
        </div>
      </section>
    </div>
  )
}
