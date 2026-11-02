import type { CSSProperties } from 'react'
import type { AlgorithmId } from '../core/algorithms'

// 차트 색은 CSS 변수로 넘겨서 테마를 바꾸면 다시 그리지 않아도 색이 따라 바뀐다 (값은 index.css).
export const chart = {
  ink: 'var(--ink)', // 이론값·기준 표시처럼 알고리즘이 아닌 표식
  reference: 'var(--ink-3)', // 기준선 (균등 확률 등)
  surface: 'var(--surface)', // 점 테두리 등 바탕색 간격
  grid: 'var(--line)',
  axis: 'var(--ink-3)',
  text: 'var(--ink)',
  lineMuted: 'var(--line-strong)',
}

// 알고리즘 색. 순위가 아니라 알고리즘에 고정한다 (기준 팔레트 1~4번 순서).
export const algoColor: Record<AlgorithmId, string> = {
  'fisher-yates': 'var(--algo-fy)',
  'pick-remove': 'var(--algo-pr)',
  'naive-swap': 'var(--algo-naive)',
  'random-key': 'var(--algo-rk)',
}

/** Recharts 툴팁을 테마에 맞춘다 */
export const tooltipStyle: { contentStyle: CSSProperties; labelStyle: CSSProperties; itemStyle: CSSProperties } = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line-strong)',
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: 'var(--ink)', fontWeight: 600 },
  itemStyle: { color: 'var(--ink-2)' },
}
