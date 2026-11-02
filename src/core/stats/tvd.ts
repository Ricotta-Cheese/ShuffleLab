/**
 * 두 확률분포 사이의 Total Variation Distance: (1/2) × Σ|p(x) − q(x)|.
 * 0이면 두 분포가 같고, 1이면 겹치는 부분이 전혀 없다.
 */
export function totalVariation(p: readonly number[], q: readonly number[]): number {
  if (p.length !== q.length) throw new Error('두 분포의 길이가 다르다')
  let s = 0
  for (let i = 0; i < p.length; i++) s += Math.abs(p[i] - q[i])
  return s / 2
}

/** 순열별 관측 횟수를 경험적 확률로 바꾼다 */
export function toProbabilities(counts: readonly number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) throw new Error('관측 횟수가 0이다')
  return counts.map((c) => c / total)
}

export interface UniformityResult {
  trials: number
  /** 관측 분포와 균등분포(모든 순열 1/n!)의 TVD */
  tvd: number
  /** 균등성 지수 U = 1 − TVD (이 프로젝트에서 정의한 표시용 지수) */
  u: number
}

/** counts[r] = 사전순 r번째 순열이 나온 횟수 (길이 n!) */
export function uniformity(counts: readonly number[]): UniformityResult {
  const p = toProbabilities(counts)
  const uniform = new Array(counts.length).fill(1 / counts.length)
  const tvd = totalVariation(p, uniform)
  return { trials: counts.reduce((a, b) => a + b, 0), tvd, u: 1 - tvd }
}
