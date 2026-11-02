import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { algorithms, getAlgorithm } from '../../core/algorithms'
import { algorithmContent } from '../../content/algorithms'
import AlgorithmPicker from '../components/AlgorithmPicker'
import Pseudocode from '../components/Pseudocode'
import UniformBadge from '../components/UniformBadge'
import { useAlgorithmParam } from '../useAlgorithmParam'

function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">알고리즘</th>
            <th className="px-4 py-2 font-medium">시간</th>
            <th className="px-4 py-2 font-medium">추가 공간</th>
            <th className="px-4 py-2 font-medium">제자리</th>
            <th className="px-4 py-2 font-medium">균등성</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {algorithms.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-2 font-medium">{a.name}</td>
              <td className="px-4 py-2 font-mono">{a.time}</td>
              <td className="px-4 py-2 font-mono">{a.space}</td>
              <td className="px-4 py-2">{a.inPlace ? '예' : '아니요'}</td>
              <td className="px-4 py-2">
                <UniformBadge uniform={a.uniform} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-slate-500">{title}</h4>
      <div className="mt-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function AlgorithmsScreen() {
  const [id, setId] = useAlgorithmParam()
  const algo = getAlgorithm(id)
  const c = algorithmContent[id]

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold">알고리즘 비교</h2>
        <p className="mt-1 text-sm text-slate-600">
          네 알고리즘은 모두 "배열을 무작위 순서로 섞는다"는 같은 문제를 푼다. 복잡도와 균등성을 한눈에 비교한다.
        </p>
        <div className="mt-4">
          <ComparisonTable />
        </div>
      </section>

      <section className="space-y-4">
        <AlgorithmPicker value={id} onChange={setId} />

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold">{algo.name}</h3>
          <UniformBadge uniform={algo.uniform} />
          <Link to={`/visualize?algo=${id}`} className="ml-auto text-sm text-blue-600 hover:underline">
            동작 시각화로 보기 →
          </Link>
        </div>
        <p className="text-slate-700">{c.summary}</p>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="기본 원리">
            <ol className="list-decimal space-y-1 pl-5">
              {c.principle.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </Card>
          <Card title="핵심 의사코드">
            <Pseudocode lines={c.pseudocode} />
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card title={`시간 복잡도 ${algo.time}`}>{c.timeWhy}</Card>
          <Card title={`추가 공간 ${algo.space}`}>{c.spaceWhy}</Card>
          <Card title="균등성">{c.uniformWhy}</Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card title="장점">
            <ul className="list-disc space-y-1 pl-5">
              {c.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title="한계와 주의점">
            <ul className="list-disc space-y-1 pl-5">
              {c.limits.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  )
}
