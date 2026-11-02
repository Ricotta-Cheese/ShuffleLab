import type { Rng } from '../rng'
import { createRecorder, factorial, fmt, range } from './recorder'
import type { Algorithm, Trace } from './types'

/*
 * 의도적으로 균등하지 않은 반례 구현.
 * for i ← 0 to n−1
 *     j ← random integer, 0 ≤ j ≤ n−1     ← Fisher–Yates와 달리 범위가 줄지 않는다
 *     swap A[i], A[j]
 */
export function naiveSwap<T>(arr: T[], rng: Rng): T[] {
  const n = arr.length
  for (let i = 0; i < n; i++) {
    const j = rng.int(n)
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

export function traceNaiveSwap<T>(input: readonly T[], rng: Rng): Trace<T> {
  const a = [...input]
  const n = a.length
  const rec = createRecorder<T>()
  const c = rec.counters

  rec.push({
    kind: 'init',
    array: a,
    fixed: [],
    what: `초기 배열 (n=${n})`,
    why: '앞 칸부터 차례로, 각 칸을 배열 전체에서 고른 칸과 교환해요. 어떤 칸도 확정되지 않아요.',
  })

  for (let i = 0; i < n; i++) {
    const j = rng.int(n)
    c.randomCalls++
    rec.push({
      kind: 'select',
      array: a,
      i,
      j,
      fixed: [],
      what: `i = ${i}: 0~${n - 1} 전체에서 무작위로 고른 위치 j = ${j}`,
      why: `Fisher–Yates와 달리 범위를 줄이지 않고 항상 배열 전체에서 골라요. 그래서 이미 교환을 마친 앞쪽 칸도 다시 바뀔 수 있어요.`,
    })

    const x = a[j]
    const y = a[i]
    a[i] = x
    a[j] = y
    c.reads += 2
    c.writes += 2
    c.swaps++
    rec.push({
      kind: 'swap',
      array: a,
      i,
      j,
      fixed: [],
      what: i === j ? `j=i이므로 ${i}번 칸의 값 ${fmt(x)}이(가) 그대로 남아요` : `A[${j}]=${fmt(x)} ↔ A[${i}]=${fmt(y)} 교환`,
      why: '교환 후에도 이 칸은 확정되지 않아요. 뒤의 단계에서 j로 다시 뽑히면 또 바뀌어요.',
    })
  }

  const paths = n ** n
  const perms = factorial(n)
  rec.push({
    kind: 'done',
    array: a,
    fixed: range(0, n),
    what: '셔플 완료',
    why:
      n >= 3
        ? `무작위 선택 경로는 ${n}^${n}=${paths}가지인데 순열은 ${n}!=${perms}가지예요. 경로 수가 순열 수의 배수가 아니므로 모든 순열이 같은 수의 경로를 가질 수 없고, 일부 순열이 더 자주 나와요.`
        : `n=${n}에서는 경로 ${paths}가지가 순열 ${perms}가지로 나누어떨어져 우연히 균등해요. n≥3부터 편향이 생겨요.`,
  })

  return rec.finish(a)
}

export const naiveSwapAlgorithm: Algorithm = {
  id: 'naive-swap',
  name: 'Naive Random Swap',
  shuffle: naiveSwap,
  trace: traceNaiveSwap,
  inPlace: true,
  time: 'O(n)',
  space: 'O(1)',
  uniform: 'no',
}
