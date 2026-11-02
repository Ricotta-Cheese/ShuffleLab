import { describe, expect, it } from 'vitest'
import { benchmarkAlgorithm, doublingRatios, median, powerOfTwoSizes, type BenchPoint } from './benchmark'
import { seededRng } from './rng'

describe('benchmarkAlgorithm', () => {
  it('가짜 시계로 재면 셔플 1회당 시간이 정확히 나온다', () => {
    // now()가 호출될 때마다 1ms씩 흐르는 시계 → 한 번 잴 때(t0, t1) batch와 무관하게 1ms가 걸린 것처럼 보인다.
    // 그러면 batch는 원소 상한(64 = 4 × 16)에서 멈추고, 1회당 시간은 1/4 ms가 된다.
    let t = 0
    const now = () => (t += 1)
    const res = benchmarkAlgorithm('fisher-yates', 16, {
      samples: 5,
      rng: seededRng(1),
      minBatchMs: 100,
      maxBatchElements: 64,
      now,
    })
    expect(res.batch).toBe(4)
    expect(res.medianMs).toBeCloseTo(1 / 4, 12)
    expect(res.samples).toBe(5)
  })

  it('batch × n이 상한을 넘지 않는다', () => {
    let t = 0
    const now = () => (t += 0.0001)
    const res = benchmarkAlgorithm('naive-swap', 1000, {
      samples: 3,
      rng: seededRng(1),
      minBatchMs: 1e9,
      maxBatchElements: 10_000,
      now,
    })
    expect(res.batch * 1000).toBeLessThanOrEqual(10_000)
  })

  it('실제 시계로 네 알고리즘을 잴 수 있다', () => {
    for (const id of ['fisher-yates', 'pick-remove', 'naive-swap', 'random-key'] as const) {
      const res = benchmarkAlgorithm(id, 256, { samples: 3, rng: seededRng(1), minBatchMs: 1 })
      expect(res.medianMs).toBeGreaterThanOrEqual(0)
      expect(res.minMs).toBeLessThanOrEqual(res.maxMs)
    }
  })
})

describe('보조 함수', () => {
  it('median', () => {
    expect(median([1, 2, 3])).toBe(2)
    expect(median([1, 2, 3, 10])).toBe(2.5)
  })

  it('doublingRatios는 크기가 정확히 두 배인 이웃끼리만 비율을 낸다', () => {
    const p = (n: number, medianMs: number) => ({ n, medianMs }) as BenchPoint
    expect(doublingRatios([p(4, 1), p(8, 2), p(16, 8), p(64, 1)])).toEqual([undefined, 2, 4, undefined])
  })

  it('powerOfTwoSizes', () => {
    expect(powerOfTwoSizes(3, 5)).toEqual([8, 16, 32])
  })
})
