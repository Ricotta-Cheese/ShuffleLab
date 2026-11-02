import { describe, expect, it } from 'vitest'
import { createRng, cryptoRng, fromUint32, mathRandomRng, seededRng } from './rng'

describe('fromUint32', () => {
  it('int(k)는 limit 이상의 값을 버리고 다시 뽑는다 (모듈로 편향 제거)', () => {
    // 2^32 = 3 × 1431655765 + 1 이므로 k=3의 limit은 2^32 − 1이고, 2^32 − 1은 버려야 한다
    const values = [0xffff_ffff, 7]
    const rng = fromUint32(() => values.shift()!)
    expect(rng.int(3)).toBe(7 % 3)
    expect(values).toHaveLength(0)
  })

  it('잘못된 k는 거부한다', () => {
    const rng = seededRng(1)
    expect(() => rng.int(0)).toThrow(RangeError)
    expect(() => rng.int(1.5)).toThrow(RangeError)
  })
})

describe.each([
  ['seeded', seededRng(42)],
  ['math', mathRandomRng()],
  ['crypto', cryptoRng()],
])('%s rng', (_, rng) => {
  it('int(k)는 0..k−1 범위의 값을 모두 만든다', () => {
    for (const k of [1, 2, 3, 7, 10]) {
      const seen = new Set<number>()
      for (let t = 0; t < 2000; t++) {
        const v = rng.int(k)
        expect(Number.isInteger(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(k)
        seen.add(v)
      }
      expect(seen.size).toBe(k)
    }
  })

  it('float()는 [0, 1) 범위다', () => {
    for (let t = 0; t < 2000; t++) {
      const v = rng.float()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seededRng', () => {
  it('같은 시드는 같은 수열, 다른 시드는 다른 수열을 만든다', () => {
    const seq = (seed: number) => {
      const r = seededRng(seed)
      return Array.from({ length: 20 }, () => r.int(1000))
    }
    expect(seq(7)).toEqual(seq(7))
    expect(seq(7)).not.toEqual(seq(8))
  })

  it('createRng("seeded")는 seededRng와 같다', () => {
    const a = createRng('seeded', 5)
    const b = seededRng(5)
    for (let t = 0; t < 10; t++) expect(a.int(100)).toBe(b.int(100))
  })
})
