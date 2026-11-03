import { describe, expect, it } from 'vitest'
import { getAlgorithm } from '../core/algorithms'
import { countPermutations } from '../core/experiment'
import { DIST_RUNS, DIST_SEED_OFFSET, repeatKendall } from '../core/relationship'
import { seededRng } from '../core/rng'
import { kendall } from '../core/stats/kendall'
import { uniformity } from '../core/stats/tvd'
import { screenMeta } from './screens'
import { tutorialSteps } from './tutorial'

// 튜토리얼은 보고서 수치를 '기대값'으로 보여준다. 코드가 바뀌어 수치가 달라지면 여기서 먼저 알 수 있다.
const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1)

describe('튜토리얼 단계', () => {
  it('모든 단계가 있는 화면을 가리키고 id가 겹치지 않는다', () => {
    const paths = new Set(screenMeta.map((s) => s.path))
    for (const s of tutorialSteps) expect(paths.has(s.to.split('?')[0]), s.id).toBe(true)
    expect(new Set(tutorialSteps.map((s) => s.id)).size).toBe(tutorialSteps.length)
  })
})

describe('보고서 수치 재현', () => {
  it('5.1 Fisher–Yates, [1..6], 시드 1 → [5, 6, 1, 2, 4, 3], 교환 5번', () => {
    const t = getAlgorithm('fisher-yates').trace(range(6), seededRng(1))
    expect(t.result).toEqual([5, 6, 1, 2, 4, 3])
    expect(t.counters.swaps).toBe(5)
    expect(t.counters.randomCalls).toBe(5)
  })

  it('5.2 Pick & Remove, [1..6], 시드 1 → [3, 5, 2, 1, 4, 6], 난수 6번, 이동 9번', () => {
    const t = getAlgorithm('pick-remove').trace(range(6), seededRng(1))
    expect(t.result).toEqual([3, 5, 2, 1, 4, 6])
    expect(t.counters.randomCalls).toBe(6)
    expect(t.counters.shifts).toBe(9)
  })

  it('6.3 Fisher–Yates, 원소 8개, 시드 1 → C = 16, D = 12, τ ≈ 0.143', () => {
    const v = range(8)
    const r = kendall(v, getAlgorithm('fisher-yates').shuffle([...v], seededRng(1)))
    expect([r.concordant, r.discordant]).toEqual([16, 12])
    expect(r.tau).toBeCloseTo(0.143, 3)
  })

  it('6.3 같은 입력을 2,000번 섞으면 평균 τ ≈ −0.010, R ≥ 0.5 비율 ≈ 10.7%', () => {
    const s = repeatKendall(range(8), getAlgorithm('fisher-yates').shuffle, seededRng(1 + DIST_SEED_OFFSET), DIST_RUNS)
    expect(s.meanTau).toBeCloseTo(-0.01, 2)
    expect(s.highR).toBeCloseTo(0.107, 3)
  })

  it('6.2 n = 4, 100만 회, 시드 1 → 관측 TVD가 보고서 표와 같다', () => {
    const expected = { 'fisher-yates': 0.0013, 'pick-remove': 0.0016, riffle: 0.0082, 'random-key': 0.0022 } as const
    for (const [id, tvd] of Object.entries(expected)) {
      const u = uniformity(countPermutations(id as keyof typeof expected, 4, 1_000_000, seededRng(1)))
      expect(u.tvd, id).toBeCloseTo(tvd, 4)
    }
  }, 60_000)
})
