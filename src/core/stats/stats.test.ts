import { describe, expect, it } from 'vitest'
import { factorial } from '../algorithms/recorder'
import { permutationRank, permutationUnrank } from './permutation'
import { toProbabilities, totalVariation, uniformity } from './tvd'

describe('permutationRank / permutationUnrank', () => {
  it('n=3 순열을 사전순으로 번호 매긴다', () => {
    const perms = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ]
    perms.forEach((p, r) => {
      expect(permutationRank(p)).toBe(r)
      expect(permutationUnrank(r, 3)).toEqual(p)
    })
  })

  it.each([1, 2, 4, 5, 6])('n=%i에서 n!개 번호가 순열과 일대일로 대응한다', (n) => {
    const seen = new Set<string>()
    for (let r = 0; r < factorial(n); r++) {
      const p = permutationUnrank(r, n)
      expect([...p].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i))
      expect(permutationRank(p)).toBe(r)
      seen.add(p.join(','))
    }
    expect(seen.size).toBe(factorial(n))
  })

  it('범위를 벗어난 번호는 거부한다', () => {
    expect(() => permutationUnrank(6, 3)).toThrow(RangeError)
    expect(() => permutationUnrank(-1, 3)).toThrow(RangeError)
  })
})

describe('TVD와 균등성 지수 U', () => {
  it('완전히 균등하면 TVD = 0, U = 1', () => {
    expect(uniformity([5, 5, 5, 5, 5, 5])).toEqual({ trials: 30, tvd: 0, u: 1 })
  })

  it('한 순열에만 몰리면 TVD = 1 − 1/n!', () => {
    const res = uniformity([12, 0, 0, 0, 0, 0])
    expect(res.tvd).toBeCloseTo(1 - 1 / 6, 12)
    expect(res.u).toBeCloseTo(1 / 6, 12)
  })

  it('손으로 계산한 예와 일치한다', () => {
    // p = (0.5, 0.25, 0.25), q = (1/3, 1/3, 1/3) → |1/6| + |1/12| + |1/12| = 1/3 → TVD = 1/6
    expect(totalVariation([0.5, 0.25, 0.25], [1 / 3, 1 / 3, 1 / 3])).toBeCloseTo(1 / 6, 12)
  })

  it('Naive Swap n=3의 정확한 분포(4,5,5,5,4,4 / 27)는 TVD = 1/18', () => {
    const p = [4, 5, 5, 5, 4, 4].map((c) => c / 27)
    expect(totalVariation(p, new Array(6).fill(1 / 6))).toBeCloseTo(1 / 18, 12)
  })

  it('관측 횟수를 확률로 바꾼다', () => {
    expect(toProbabilities([1, 3])).toEqual([0.25, 0.75])
    expect(() => toProbabilities([0, 0])).toThrow()
  })
})
