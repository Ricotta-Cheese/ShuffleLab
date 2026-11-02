import type { ComponentType } from 'react'
import Placeholder from '../components/Placeholder'
import AlgorithmsScreen from './AlgorithmsScreen'
import DescriptionScreen from './DescriptionScreen'
import RelationshipScreen from './RelationshipScreen'
import UniformityScreen from './UniformityScreen'
import VisualizeScreen from './VisualizeScreen'

export const screens: { path: string; label: string; Component: ComponentType }[] = [
  { path: '/description', label: 'A. 설명', Component: DescriptionScreen },
  { path: '/algorithms', label: 'B. 알고리즘', Component: AlgorithmsScreen },
  { path: '/visualize', label: 'C. 동작 시각화', Component: VisualizeScreen },
  { path: '/relationship', label: 'D. 관계성', Component: RelationshipScreen },
  { path: '/uniformity', label: 'E. 균등성', Component: UniformityScreen },
  {
    path: '/performance',
    label: 'F. 성능',
    Component: () => <Placeholder title="성능 비교" desc="입력 크기별 실행 시간" />,
  },
]
