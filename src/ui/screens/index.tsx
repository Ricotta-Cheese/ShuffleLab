import type { ComponentType } from 'react'
import Placeholder from '../components/Placeholder'
import AlgorithmsScreen from './AlgorithmsScreen'
import DescriptionScreen from './DescriptionScreen'
import VisualizeScreen from './VisualizeScreen'

export const screens: { path: string; label: string; Component: ComponentType }[] = [
  { path: '/description', label: 'A. 설명', Component: DescriptionScreen },
  { path: '/algorithms', label: 'B. 알고리즘', Component: AlgorithmsScreen },
  { path: '/visualize', label: 'C. 동작 시각화', Component: VisualizeScreen },
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
