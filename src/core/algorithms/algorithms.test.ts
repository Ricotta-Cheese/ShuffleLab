import { describe, expect, it } from 'vitest'
import { seededRng, type Rng } from '../rng'
import { exactDistribution } from '../stats/exact'
import { algorithms, getAlgorithm } from '.'
import { factorial } from './recorder'
import { traceRandomKey } from './randomKey'

const identity = (n: number) => Array.from({ length: n }, (_, i) => i)
const sorted = (a: readonly number[]) => [...a].sort((x, y) => x - y)

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

describe('Naive Random Swap', () => {
  const naive = getAlgorithm('naive-swap')

  it('n=3에서 경로 27개가 순열 6개에 4개 또는 5개씩 나뉜다', () => {
    const dist = exactDistribution(3, (a, rng) => naive.shuffle(a, rng))
    const paths = Object.fromEntries(dist.map((o) => [o.perm.join(''), o.paths]))
    expect(paths).toEqual({ '012': 4, '021': 5, '102': 5, '120': 5, '201': 4, '210': 4 })
    for (const o of dist) expect(o.probability).toBeCloseTo(o.paths / 27, 12)
  })

  it('n=2에서는 경로 4개가 순열 2개에 2개씩 나뉘어 균등하다', () => {
    const dist = exactDistribution(2, (a, rng) => naive.shuffle(a, rng))
    expect(dist.map((o) => o.paths)).toEqual([2, 2])
  })

  it.each([3, 4, 5])('n=%i에서 균등하지 않다 (모든 순열은 나오지만 확률이 다르다)', (n) => {
    const dist = exactDistribution(n, (a, rng) => naive.shuffle(a, rng))
    expect(dist).toHaveLength(factorial(n))
    const total = dist.reduce((s, o) => s + o.paths, 0)
    expect(total).toBe(n ** n)
    const probs = dist.map((o) => o.probability)
    expect(Math.max(...probs) - Math.min(...probs)).toBeGreaterThan(1e-6)
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
