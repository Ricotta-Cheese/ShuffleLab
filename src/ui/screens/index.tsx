import { lazy, type ComponentType } from 'react'

// 화면별로 나눠 불러온다. 차트 라이브러리는 D·E·F 화면을 열 때만 내려받는다.
export const screens: { path: string; label: string; Component: ComponentType }[] = [
  { path: '/description', label: 'A. 설명', Component: lazy(() => import('./DescriptionScreen')) },
  { path: '/algorithms', label: 'B. 알고리즘', Component: lazy(() => import('./AlgorithmsScreen')) },
  { path: '/visualize', label: 'C. 동작 시각화', Component: lazy(() => import('./VisualizeScreen')) },
  { path: '/relationship', label: 'D. 관계성', Component: lazy(() => import('./RelationshipScreen')) },
  { path: '/uniformity', label: 'E. 균등성', Component: lazy(() => import('./UniformityScreen')) },
  { path: '/performance', label: 'F. 성능', Component: lazy(() => import('./PerformanceScreen')) },
]
