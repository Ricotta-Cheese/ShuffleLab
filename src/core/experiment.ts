import { getAlgorithm, type AlgorithmId } from './algorithms'
import { factorial } from './algorithms/recorder'
import type { Rng } from './rng'
import { permutationRank } from './stats/permutation'

/**
 * 같은 알고리즘을 trials번 실행해 순열별 발생 횟수를 센다.
 * 입력은 위치 0..n−1로 두므로, 실제 원소 값과 무관하게 "어느 위치의 원소가 어디로 갔는가"를 센다.
 * counts[r] = 사전순 r번째 순열이 나온 횟수.
 *
 * 매 실행 결과가 0..n−1의 순열인지도 검사한다 (중복·손실이 있으면 예외).
 */
export function countPermutations(
  algoId: AlgorithmId,
  n: number,
  trials: number,
  rng: Rng,
  onProgress?: (done: number) => void,
  progressEvery = 20_000,
): number[] {
  const algo = getAlgorithm(algoId)
  const counts = new Array<number>(factorial(n)).fill(0)
  const base = Array.from({ length: n }, (_, i) => i)
  const seen = new Uint8Array(n)

  for (let t = 1; t <= trials; t++) {
    const out = algo.shuffle(base.slice(), rng)
    seen.fill(0)
    for (const v of out) {
      if (seen[v]) throw new Error(`${algo.name}: 결과에 중복 원소가 있다`)
      seen[v] = 1
    }
    if (out.length !== n) throw new Error(`${algo.name}: 결과 길이가 다르다`)
    counts[permutationRank(out)]++
    if (onProgress && t % progressEvery === 0) onProgress(t)
  }
  return counts
}
