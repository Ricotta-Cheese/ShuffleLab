import type { AlgorithmId } from '../core/algorithms'

// 차트 공통 색상 (dataviz 기준 팔레트의 라이트 모드 값)
export const chart = {
  series1: '#2a78d6', // 관측값, 순서 유지 쌍
  series2: '#eb6834', // 이론값·현재 실행, 순서 뒤집힌 쌍
  reference: '#52514e', // 기준선 (균등 확률 등)
  grid: '#e5e7eb',
  axis: '#6b7280',
  text: '#0b0b0b',
}

// 여러 알고리즘을 한 차트에 그릴 때의 색. 순위가 아니라 알고리즘에 고정한다 (기준 팔레트 1~4번 순서).
export const algoColor: Record<AlgorithmId, string> = {
  'fisher-yates': '#2a78d6',
  'pick-remove': '#eb6834',
  'naive-swap': '#1baf7a',
  'random-key': '#eda100',
}
