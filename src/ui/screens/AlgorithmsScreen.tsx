import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { algorithms, getAlgorithm, type Algorithm } from '../../core/algorithms'
import type { AlgorithmContent } from '../../content/algorithms'
import { algorithmContent } from '../../content/algorithms'
import AlgorithmPicker from '../components/AlgorithmPicker'
import CodeViewer from '../components/CodeViewer'
import ScreenHeader from '../components/ScreenHeader'
import UniformBadge from '../components/UniformBadge'
import { Card, CardHeader, Table, tbody, td, th, thead } from '../components/ui'
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

/** 복잡도·균등성의 값과 이유 한 칸 */
function Trait({ label, value, children }: { label: string; value: ReactNode; children: ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
      <p className="text-xs font-semibold text-ink-3">{label}</p>
      <div className="mt-1 text-lg font-semibold">{value}</div>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">{children}</p>
    </div>
  )
}

function Points({ title, icon, iconClass, items }: { title: string; icon: string; iconClass: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-ink-3">{title}</h4>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-2">
        {items.map((s) => (
          <li key={s} className="flex gap-2">
            <span aria-hidden className={`shrink-0 font-semibold ${iconClass}`}>
              {icon}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** 시간·공간·균등성과 장점·한계를 한 카드에 모은다 */
function TraitsCard({ algo, c }: { algo: Algorithm; c: AlgorithmContent }) {
  return (
    <Card>
      <CardHeader title="특징 한눈에 보기" />
      <div className="divide-y divide-line md:grid md:grid-cols-3 md:divide-x md:divide-y-0">
        <Trait label="시간 복잡도" value={<span className="font-mono">{algo.time}</span>}>
          {c.timeWhy}
        </Trait>
        <Trait label="추가 공간" value={<span className="font-mono">{algo.space}</span>}>
          {c.spaceWhy}
        </Trait>
        <Trait label="균등성" value={<UniformBadge uniform={algo.uniform} />}>
          {c.uniformWhy}
        </Trait>
      </div>
      <div className="mt-5 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
        <Points title="장점" icon="✓" iconClass="text-good" items={c.strengths} />
        <Points title="한계와 주의점" icon="!" iconClass="text-warn" items={c.limits} />
      </div>
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
        <ScreenHeader id="algorithms"
          title="알고리즘 비교"
          desc='네 알고리즘은 모두 "배열을 무작위 순서로 섞는다"는 같은 문제를 풀어요. 복잡도와 균등성을 한눈에 비교해요.'
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

        <InfoCard title="기본 원리">
          <ol className="list-decimal space-y-1 pl-5">
            {c.principle.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </InfoCard>

        <CodeViewer id={id} />

        <TraitsCard algo={algo} c={c} />
      </section>
    </div>
  )
}
