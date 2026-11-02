import type { Rng } from '../rng'

export interface ExactOutcome {
  /** 결과 순열 (입력이 [0, 1, ..., n−1]일 때의 결과) */
  perm: number[]
  /** 이 순열이 나올 정확한 확률 */
  probability: number
  /** 이 순열로 이어지는 난수 선택 경로 수 */
  paths: number
}

/**
 * 알고리즘이 가질 수 있는 모든 난수 선택 경로를 하나씩 따라가며
 * 순열별 정확한 확률을 구한다 (실험이 아닌 이론값).
 *
 * rng.int(k)가 호출될 때마다 0..k−1 중 어느 값을 줄지를 자리마다 정해 두고,
 * 오도미터처럼 마지막 자리부터 하나씩 올려 가며 모든 경우를 실행한다.
 * 한 경로의 확률은 그 경로에서 나온 1/k를 모두 곱한 값이다.
 *
 * int()만 쓰는 알고리즘에만 쓸 수 있다 (float()는 경우가 무한하다).
 * 경로 수가 빠르게 늘어나므로 작은 n에서만 사용한다.
 */
export function exactDistribution(
  n: number,
  run: (arr: number[], rng: Rng) => number[],
  maxPaths = 1_000_000,
): ExactOutcome[] {
  const choices: number[] = []
  const ranges: number[] = []
  const byPerm = new Map<string, ExactOutcome>()
  let total = 0

  for (;;) {
    let call = 0
    let probability = 1
    const rng: Rng = {
      int(k) {
        if (call < choices.length) {
          if (ranges[call] !== k) throw new Error('같은 선택 접두사에서 난수 범위가 달라졌다')
        } else {
          choices.push(0)
          ranges.push(k)
        }
        probability /= k
        return choices[call++]
      },
      float() {
        throw new Error('exactDistribution은 int()만 쓰는 알고리즘에만 사용할 수 있다')
      },
    }

    const perm = run(
      Array.from({ length: n }, (_, i) => i),
      rng,
    )
    if (call !== choices.length) throw new Error('같은 선택 접두사에서 난수 호출 횟수가 달라졌다')

    const key = perm.join(',')
    const prev = byPerm.get(key)
    if (prev) {
      prev.probability += probability
      prev.paths++
    } else {
      byPerm.set(key, { perm, probability, paths: 1 })
    }

    if (++total > maxPaths) throw new Error(`경로가 ${maxPaths}개를 넘는다. n을 줄일 것`)

    // 다음 경로: 끝자리부터 올릴 수 있는 자리를 찾는다
    let d = choices.length - 1
    while (d >= 0 && choices[d] + 1 >= ranges[d]) d--
    if (d < 0) break
    choices[d]++
    choices.length = d + 1
    ranges.length = d + 1
  }

  return [...byPerm.values()].sort((p, q) => (p.perm.join(',') < q.perm.join(',') ? -1 : 1))
}
