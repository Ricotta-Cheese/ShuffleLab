import type { ComponentType } from 'react'
import DescriptionScreen from './DescriptionScreen'

// 아직 구현하지 않은 화면 자리. 각 화면은 구현 단계에서 별도 파일로 분리한다.
function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </section>
  )
}

export const screens: { path: string; label: string; Component: ComponentType }[] = [
  {
    path: '/description',
    label: 'A. 설명',
    Component: DescriptionScreen,
  },
  {
    path: '/algorithms',
    label: 'B. 알고리즘',
    Component: () => <Placeholder title="알고리즘 소개 및 비교" desc="원리, 의사코드, 복잡도, 균등성" />,
  },
  {
    path: '/visualize',
    label: 'C. 동작 시각화',
    Component: () => <Placeholder title="단계별 동작 시각화" desc="최대 10개 원소, 단계별 설명" />,
  },
  {
    path: '/relationship',
    label: 'D. 관계성',
    Component: () => <Placeholder title="관계성 분석" desc="Kendall's τ, 관계성 지수 R" />,
  },
  {
    path: '/uniformity',
    label: 'E. 균등성',
    Component: () => <Placeholder title="반복 실험 및 균등성 분석" desc="순열 빈도, TVD, 균등성 지수 U" />,
  },
  {
    path: '/performance',
    label: 'F. 성능',
    Component: () => <Placeholder title="성능 비교" desc="입력 크기별 실행 시간" />,
  },
]
