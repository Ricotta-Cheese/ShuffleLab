import { describe, expect, it } from 'vitest'
import { repeatKendall } from './relationship'
import { seededRng } from './rng'
import { theoreticalProbabilities, theoreticalTvd } from './theory'

describe('theoreticalTvd', () => {
  it('균등한 알고리즘은 0, Riffle은 0보다 크다', () => {
    expect(theoreticalTvd('fisher-yates', 4)).toBeCloseTo(0, 12)
    expect(theoreticalTvd('pick-remove', 4)).toBeCloseTo(0, 12)
    expect(theoreticalTvd('random-key', 4)).toBe(0)
    expect(theoreticalTvd('riffle', 3)).toBeCloseTo(0.0039, 4)
  })

  it('순열별 이론 확률의 합은 1이다', () => {
    for (const id of ['fisher-yates', 'pick-remove', 'riffle', 'random-key'] as const) {
      expect(theoreticalProbabilities(id, 4).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12)
    }
  })
})

describe('repeatKendall', () => {
  const values = ['a', 'b', 'c', 'd', 'e']

  it('섞지 않으면 τ = R = 1, 뒤집으면 τ = −1, R = 1', () => {
    const same = repeatKendall(values, (a) => a, seededRng(1), 10)
    expect(same).toEqual({ runs: 10, meanTau: 1, meanR: 1, highR: 1 })
    const reversed = repeatKendall(values, (a) => a.reverse(), seededRng(1), 10)
    expect(reversed).toEqual({ runs: 10, meanTau: -1, meanR: 1, highR: 1 })
  })

  it('실행마다 τ를 onTau로 알린다', () => {
    const taus: number[] = []
    repeatKendall(values, (a) => a, seededRng(1), 3, (t) => taus.push(t))
    expect(taus).toEqual([1, 1, 1])
  })
})
