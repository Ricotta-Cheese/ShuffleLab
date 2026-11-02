import { lazy, type ComponentType } from 'react'
import { screenMeta, type ScreenId, type ScreenMeta } from '../../content/screens'

// 화면별로 나눠 불러온다. 차트 라이브러리는 D·E·F 화면을 열 때만 내려받는다.
const components: Record<ScreenId, ComponentType> = {
  description: lazy(() => import('./DescriptionScreen')),
  algorithms: lazy(() => import('./AlgorithmsScreen')),
  visualize: lazy(() => import('./VisualizeScreen')),
  relationship: lazy(() => import('./RelationshipScreen')),
  uniformity: lazy(() => import('./UniformityScreen')),
  performance: lazy(() => import('./PerformanceScreen')),
}

export const screens: (ScreenMeta & { Component: ComponentType })[] = screenMeta.map((m) => ({
  ...m,
  Component: components[m.id],
}))
