import type { Counters, Step, Trace } from './types'

export function emptyCounters(): Counters {
  return { randomCalls: 0, swaps: 0, comparisons: 0, reads: 0, writes: 0, shifts: 0 }
}

type StepInput<T> = Omit<Step<T>, 'counters' | 'array' | 'output' | 'keys'> & {
  array: readonly T[]
  output?: readonly T[]
  keys?: readonly (number | undefined)[]
}

/** 단계 기록 도구. push할 때마다 배열과 카운터를 복사해 스냅샷으로 남긴다. */
export function createRecorder<T>() {
  const steps: Step<T>[] = []
  const counters = emptyCounters()
  return {
    counters,
    push(s: StepInput<T>) {
      steps.push({
        ...s,
        array: [...s.array],
        output: s.output && [...s.output],
        keys: s.keys && [...s.keys],
        fixed: [...s.fixed],
        counters: { ...counters },
      })
    },
    finish(result: readonly T[]): Trace<T> {
      return { steps, result: [...result], counters: { ...counters } }
    },
  }
}

export function range(from: number, to: number): number[] {
  const r: number[] = []
  for (let k = from; k < to; k++) r.push(k)
  return r
}

export function factorial(n: number): number {
  let f = 1
  for (let k = 2; k <= n; k++) f *= k
  return f
}

export const fmt = (v: unknown) => String(v)
