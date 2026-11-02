import { describe, expect, it } from 'vitest'
import { countPermutations } from './experiment'
import { seededRng } from './rng'
import { uniformity } from './stats/tvd'

describe('countPermutations', () => {
  it('횟수의 합은 실행 횟수와 같고, 길이는 n!이다', () => {
    const counts = countPermutations('fisher-yates', 4, 5000, seededRng(1))
    expect(counts).toHaveLength(24)
    expect(counts.reduce((a, b) => a + b, 0)).toBe(5000)
  })

  it('진행 상황을 정해진 간격으로 알린다', () => {
    const seen: number[] = []
    countPermutations('naive-swap', 3, 100, seededRng(1), (d) => seen.push(d), 25)
    expect(seen).toEqual([25, 50, 75, 100])
  })

  // 시드가 고정이라 결과는 항상 같다. 경계값은 표본 잡음보다 넉넉하게 잡았다.
  it('n=3, 200,000회: Fisher–Yates의 TVD는 작고, Naive는 이론값 1/18 근처다', () => {
    const fy = uniformity(countPermutations('fisher-yates', 3, 200_000, seededRng(11)))
    const naive = uniformity(countPermutations('naive-swap', 3, 200_000, seededRng(11)))
    expect(fy.tvd).toBeLessThan(0.01)
    expect(Math.abs(naive.tvd - 1 / 18)).toBeLessThan(0.01)
  })
})
