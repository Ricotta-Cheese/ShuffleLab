import type { Rng } from './rng'
import { kendall } from './stats/kendall'

/** D 관계성 화면에서 τ 분포를 그릴 때 같은 입력을 섞는 횟수 */
export const DIST_RUNS = 2000
/** τ 분포용 난수는 '이번 결과'를 만든 시드와 겹치지 않게 이만큼 떨어진 시드를 쓴다 */
export const DIST_SEED_OFFSET = 1_000_003

export interface RepeatedKendall {
  runs: number
  /** τ의 평균 (원본과 같은 방향이면 +, 반대 방향이면 −) */
  meanTau: number
  /** R = |τ|의 평균 */
  meanR: number
  /** R ≥ 0.5인 실행의 비율 */
  highR: number
}

/**
 * 같은 입력을 runs번 섞어 매번 Kendall's τ를 잰다.
 * onTau로 실행마다의 τ를 받아 분포(히스토그램)를 따로 그릴 수 있다.
 */
export function repeatKendall<T>(
  values: readonly T[],
  shuffle: (arr: T[], rng: Rng) => T[],
  rng: Rng,
  runs: number,
  onTau?: (tau: number) => void,
): RepeatedKendall {
  let sumTau = 0
  let sumR = 0
  let high = 0
  for (let t = 0; t < runs; t++) {
    const { tau, r } = kendall(values, shuffle([...values], rng))
    sumTau += tau
    sumR += r
    if (r >= 0.5) high++
    onTau?.(tau)
  }
  return { runs, meanTau: sumTau / runs, meanR: sumR / runs, highR: high / runs }
}
