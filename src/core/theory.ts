import { getAlgorithm, type AlgorithmId } from './algorithms'
import { factorial } from './algorithms/recorder'
import { riffleProbability } from './algorithms/riffle'
import { exactDistribution } from './stats/exact'
import { permutationRank, permutationUnrank } from './stats/permutation'
import { totalVariation } from './stats/tvd'

/**
 * 순열별 이론 확률 (사전순 r번째 순열의 확률). int()만 쓰는 알고리즘은 모든 난수 경로를 열거해 정확히 구하고,
 * Random-Key Sort는 키가 모두 다르다는 가정(연속분포)에서의 이론값 1/n!을 쓴다.
 * Riffle은 경로가 2^(7n)개라 열거 대신 상승 수열 공식(Bayer–Diaconis)으로 구한다.
 */
export function theoreticalProbabilities(id: AlgorithmId, n: number): number[] {
  const size = factorial(n)
  if (id === 'random-key') return new Array(size).fill(1 / size)
  if (id === 'riffle') return Array.from({ length: size }, (_, r) => riffleProbability(permutationUnrank(r, n)))
  const algo = getAlgorithm(id)
  const probs = new Array(size).fill(0)
  for (const o of exactDistribution(n, (a, rng) => algo.shuffle(a, rng))) {
    probs[permutationRank(o.perm)] = o.probability
  }
  return probs
}

/** 이론 분포와 균등분포(1/n!)의 TVD */
export function theoreticalTvd(id: AlgorithmId, n: number): number {
  const size = factorial(n)
  return totalVariation(theoreticalProbabilities(id, n), new Array(size).fill(1 / size))
}
