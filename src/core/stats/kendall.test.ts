import { describe, expect, it } from 'vitest'
import { kendall } from './kendall'

describe('kendall', () => {
  it('같은 순서면 τ = 1, 뒤집힌 순서면 τ = −1', () => {
    const a = [1, 2, 3, 4, 5]
    expect(kendall(a, a)).toEqual({ concordant: 10, discordant: 0, tau: 1, r: 1 })
    expect(kendall(a, [...a].reverse())).toEqual({ concordant: 0, discordant: 10, tau: -1, r: 1 })
  })

  it('손으로 센 예시와 일치한다', () => {
    // 원본 A B C D, 결과 B A D C → 위치열 1 0 3 2
    // 불일치 쌍: (B,A), (D,C) → D = 2, C = 6 − 2 = 4, τ = 2/6
    const res = kendall(['A', 'B', 'C', 'D'], ['B', 'A', 'D', 'C'])
    expect(res.concordant).toBe(4)
    expect(res.discordant).toBe(2)
    expect(res.tau).toBeCloseTo(1 / 3, 12)
  })

  it('C + D = n(n−1)/2 이고, τ = 0이어도 계산된다', () => {
    // 원본 1 2 3 4, 결과 2 4 1 3 → 위치열 1 3 0 2
    // 쌍: (1,3)C (1,0)D (1,2)C (3,0)D (3,2)D (0,2)C → C = 3, D = 3
    const res = kendall([1, 2, 3, 4], [2, 4, 1, 3])
    expect(res.concordant + res.discordant).toBe(6)
    expect(res.tau).toBe(0)
    expect(res.r).toBe(0)
  })

  it('원소가 2개 미만이면 τ는 NaN이다', () => {
    expect(kendall([7], [7]).tau).toBeNaN()
    expect(kendall([], []).tau).toBeNaN()
  })

  it('중복 원소나 순열이 아닌 입력은 거부한다', () => {
    expect(() => kendall([1, 1, 2], [1, 2, 1])).toThrow('중복')
    expect(() => kendall([1, 2, 3], [1, 2, 4])).toThrow('순열이 아니다')
    expect(() => kendall([1, 2], [1, 2, 3])).toThrow('길이')
  })
})
