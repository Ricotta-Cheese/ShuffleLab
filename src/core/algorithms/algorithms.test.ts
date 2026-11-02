import { describe, expect, it } from 'vitest'
import { seededRng, type Rng } from '../rng'
import { exactDistribution } from '../stats/exact'
import { algorithms, getAlgorithm } from '.'
import { factorial } from './recorder'
import { traceRandomKey } from './randomKey'
import { RIFFLES, riffle, riffleProbability, risingSequences } from './riffle'

const identity = (n: number) => Array.from({ length: n }, (_, i) => i)
const sorted = (a: readonly number[]) => [...a].sort((x, y) => x - y)
const allPerms = (n: number): number[][] =>
  n === 0 ? [[]] : allPerms(n - 1).flatMap((p) => p.map((_, k) => [...p.slice(0, k), n - 1, ...p.slice(k)]).concat([[...p, n - 1]]))

describe.each(algorithms)('$name', (algo) => {
  it('결과는 항상 원본의 순열이다 (중복·손실 없음)', () => {
    for (let n = 0; n <= 12; n++) {
      for (let seed = 1; seed <= 30; seed++) {
        const input = identity(n).map((x) => x * 10)
        const out = algo.shuffle([...input], seededRng(seed))
        expect(out).toHaveLength(n)
        expect(sorted(out)).toEqual(input)
      }
    }
  })

  it('같은 시드에서 shuffle과 trace의 결과가 같다', () => {
    for (let n = 0; n <= 10; n++) {
      for (let seed = 1; seed <= 30; seed++) {
        const input = identity(n)
        const fast = algo.shuffle([...input], seededRng(seed))
        const traced = algo.trace(input, seededRng(seed))
        expect(traced.result).toEqual(fast)
      }
    }
  })

  it('trace는 입력을 바꾸지 않고, init으로 시작해 done으로 끝난다', () => {
    const input = [5, 3, 8, 1, 9, 2]
    const copy = [...input]
    const { steps, result, counters } = algo.trace(input, seededRng(3))
    expect(input).toEqual(copy)
    expect(steps[0].kind).toBe('init')
    expect(steps[0].array).toEqual(input)
    expect(steps.at(-1)!.kind).toBe('done')
    expect(steps.at(-1)!.counters).toEqual(counters)
    const last = steps.at(-1)!
    expect(algo.id === 'pick-remove' ? last.output : last.array).toEqual(result)
    for (const s of steps) {
      expect(s.what.length).toBeGreaterThan(0)
      expect(s.why.length).toBeGreaterThan(0)
    }
  })

  it('in-place 여부가 실제 동작과 맞다', () => {
    const arr = identity(8)
    const out = algo.shuffle(arr, seededRng(1))
    expect(out === arr).toBe(algo.inPlace)
  })
})

describe('Fisher–Yates', () => {
  const fy = getAlgorithm('fisher-yates')

  it('i번째 단계의 j는 항상 0 ≤ j ≤ i 범위다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const s of fy.trace(identity(10), seededRng(seed)).steps) {
        if (s.kind === 'select') {
          expect(s.j!).toBeGreaterThanOrEqual(0)
          expect(s.j!).toBeLessThanOrEqual(s.i!)
        }
      }
    }
  })

  it('난수 호출과 교환은 각각 n−1회다', () => {
    const { counters } = fy.trace(identity(10), seededRng(1))
    expect(counters.randomCalls).toBe(9)
    expect(counters.swaps).toBe(9)
  })

  it.each([1, 2, 3, 4, 5])('n=%i에서 모든 순열의 정확한 확률이 1/n!이다', (n) => {
    const dist = exactDistribution(n, (a, rng) => fy.shuffle(a, rng))
    expect(dist).toHaveLength(factorial(n))
    for (const o of dist) {
      expect(o.probability).toBeCloseTo(1 / factorial(n), 12)
      expect(o.paths).toBe(1)
    }
  })
})

describe('Random Pick & Remove', () => {
  const pr = getAlgorithm('pick-remove')

  it('당긴 원소 수는 각 단계의 (남은 길이 − 1 − 뽑은 위치)의 합이다', () => {
    const { steps, counters } = pr.trace(identity(10), seededRng(9))
    let expected = 0
    for (const s of steps) if (s.kind === 'pick') expected += s.array.length - 1 - s.j!
    expect(counters.shifts).toBe(expected)
    expect(counters.randomCalls).toBe(10)
  })

  it.each([1, 2, 3, 4, 5])('n=%i에서 모든 순열의 정확한 확률이 1/n!이다', (n) => {
    const dist = exactDistribution(n, (a, rng) => pr.shuffle(a, rng))
    expect(dist).toHaveLength(factorial(n))
    for (const o of dist) expect(o.probability).toBeCloseTo(1 / factorial(n), 12)
  })
})

describe('Riffle Shuffle', () => {
  const rf = getAlgorithm('riffle')

  it('상승 수열 개수를 센다', () => {
    expect(risingSequences([])).toBe(0)
    expect(risingSequences([0, 1, 2, 3])).toBe(1)
    expect(risingSequences([3, 2, 1, 0])).toBe(4)
    // 0, 1, 2와 3, 4가 각각 앞에서 뒤로 이어진다
    expect(risingSequences([3, 0, 1, 4, 2])).toBe(2)
  })

  it('난수 호출은 리플마다 n회, 단계는 리플마다 cut과 riffle 하나씩이다', () => {
    const { steps, counters } = rf.trace(identity(10), seededRng(1))
    expect(counters.randomCalls).toBe(RIFFLES * 10)
    expect(steps.filter((s) => s.kind === 'cut')).toHaveLength(RIFFLES)
    expect(steps.filter((s) => s.kind === 'riffle')).toHaveLength(RIFFLES)
  })

  it('리플 한 번은 두 더미의 순서를 유지한다 (상승 수열이 2개 이하)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      expect(risingSequences(riffle(identity(10), seededRng(seed), 1))).toBeLessThanOrEqual(2)
    }
  })

  it.each([
    [3, 1],
    [3, 2],
    [4, 1],
    [4, 2],
    [4, 3],
    [5, 2],
  ])('n=%i, 리플 %i번: 경로를 모두 열거한 분포가 상승 수열 공식과 같다', (n, k) => {
    const dist = exactDistribution(n, (a, rng) => riffle(a, rng, k))
    const total = dist.reduce((s, o) => s + o.probability, 0)
    expect(total).toBeCloseTo(1, 12)
    for (const o of dist) expect(o.probability).toBeCloseTo(riffleProbability(o.perm, k), 12)
  })

  it.each([2, 3, 4, 5, 6])('n=%i, 리플 7번: 확률의 합은 1이고, 정확히 균등하지는 않다', (n) => {
    const probs = allPerms(n).map((p) => riffleProbability(p))
    expect(probs.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 12)
    expect(Math.max(...probs) - Math.min(...probs)).toBeGreaterThan(1e-6)
    // 원래 순서(상승 수열 1개)가 가장 자주 나온다
    expect(riffleProbability(identity(n))).toBe(Math.max(...probs))
  })

  it('n=3, 리플 7번의 이론 TVD는 약 0.0039다', () => {
    const tvd = allPerms(3).reduce((s, p) => s + Math.abs(riffleProbability(p) - 1 / 6), 0) / 2
    expect(tvd).toBeCloseTo(0.0039, 4)
  })
})

describe('Random-Key Sort', () => {
  // float()가 정해진 키를 순서대로 돌려주는 가짜 rng
  const fixedKeys = (keys: number[]): Rng => ({
    int: () => {
      throw new Error('사용하지 않음')
    },
    float: () => keys.shift()!,
  })

  it('키 오름차순으로 정렬한다', () => {
    const { result } = traceRandomKey(['a', 'b', 'c', 'd'], fixedKeys([0.7, 0.1, 0.9, 0.4]))
    expect(result).toEqual(['b', 'd', 'a', 'c'])
  })

  it('같은 키는 원래 순서를 유지하고, sort 단계에서 동률로 알린다', () => {
    const { result, steps } = traceRandomKey(['a', 'b', 'c'], fixedKeys([0.5, 0.5, 0.1]))
    expect(result).toEqual(['c', 'a', 'b'])
    const sortStep = steps.find((s) => s.kind === 'sort')!
    expect(sortStep.why).toContain('같은 키가 1쌍')
  })

  it('난수는 원소당 1회 쓰고, 비교 횟수를 센다', () => {
    const { counters } = traceRandomKey(identity(10), seededRng(2))
    expect(counters.randomCalls).toBe(10)
    expect(counters.comparisons).toBeGreaterThan(0)
  })
})
