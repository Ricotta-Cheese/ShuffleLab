import { factorial } from '../algorithms/recorder'

/**
 * 0..n−1의 순열을 사전순 번호(0..n!−1)로 바꾼다 (Lehmer code).
 * 반복 실험에서 순열별 빈도를 배열 하나로 셀 수 있게 해 준다.
 * 각 자리에서 "뒤쪽에 나보다 작은 원소가 몇 개인가"를 자리값 (n−1−i)!로 곱해 더한다.
 */
export function permutationRank(perm: readonly number[]): number {
  const n = perm.length
  let rank = 0
  for (let i = 0; i < n; i++) {
    let smaller = 0
    for (let j = i + 1; j < n; j++) if (perm[j] < perm[i]) smaller++
    rank = rank * (n - i) + smaller
  }
  return rank
}

/** permutationRank의 역함수 */
export function permutationUnrank(rank: number, n: number): number[] {
  if (!Number.isInteger(rank) || rank < 0 || rank >= factorial(n)) {
    throw new RangeError(`rank는 0 이상 ${n}! 미만이어야 한다 (rank=${rank})`)
  }
  const pool = Array.from({ length: n }, (_, i) => i)
  const perm: number[] = []
  for (let i = n - 1; i >= 0; i--) {
    const f = factorial(i)
    const k = Math.floor(rank / f)
    rank %= f
    perm.push(pool.splice(k, 1)[0])
  }
  return perm
}
