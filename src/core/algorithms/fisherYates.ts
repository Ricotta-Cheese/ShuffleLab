import type { Rng } from '../rng'
import { createRecorder, fmt, range } from './recorder'
import type { Algorithm, Trace } from './types'

/*
 * for i ← n−1 down to 1
 *     j ← random integer, 0 ≤ j ≤ i
 *     swap A[i], A[j]
 */
export function fisherYates<T>(arr: T[], rng: Rng): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
  return arr
}

export function traceFisherYates<T>(input: readonly T[], rng: Rng): Trace<T> {
  const a = [...input]
  const n = a.length
  const rec = createRecorder<T>()
  const c = rec.counters

  rec.push({
    kind: 'init',
    array: a,
    fixed: [],
    what: `초기 배열 (n=${n})`,
    why: '맨 뒤 칸부터 하나씩 자리를 확정한다. 처음에는 0~n−1 전체가 아직 확정되지 않은 범위다.',
  })

  for (let i = n - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    c.randomCalls++
    rec.push({
      kind: 'select',
      array: a,
      i,
      j,
      fixed: range(i + 1, n),
      what: `i=${i}: 0~${i} 범위에서 j=${j}를 뽑았다`,
      why: `아직 확정되지 않은 ${i + 1}칸 중 하나를 각각 1/${i + 1} 확률로 골라 ${i}번 칸에 올 원소를 정한다. 범위를 0~i로 제한하므로 이미 확정된 칸은 다시 바뀌지 않는다.`,
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
      fixed: range(i, n),
      what:
        i === j
          ? `j=i이므로 ${i}번 칸의 값 ${fmt(x)}이(가) 그대로 확정되었다`
          : `A[${j}]=${fmt(x)} ↔ A[${i}]=${fmt(y)} 교환, ${i}번 칸 확정`,
      why:
        i === j
          ? `자기 자신이 뽑히는 것도 1/${i + 1} 확률로 일어나는 정상적인 경우다. 그 원소가 이 칸에 남는다.`
          : `뽑힌 원소를 ${i}번 칸으로 보내 자리를 확정한다. 다음 단계부터 선택 범위는 0~${i - 1}로 줄어든다.`,
    })
  }

  rec.push({
    kind: 'done',
    array: a,
    fixed: range(0, n),
    what: '셔플 완료',
    why:
      n > 1
        ? `0번 칸은 남은 원소가 하나뿐이라 자동으로 확정된다. 무작위 선택과 교환을 각각 ${n - 1}번 했다.`
        : '원소가 1개 이하라 섞을 것이 없다.',
  })

  return rec.finish(a)
}

export const fisherYatesAlgorithm: Algorithm = {
  id: 'fisher-yates',
  name: 'Fisher–Yates',
  shuffle: fisherYates,
  trace: traceFisherYates,
  inPlace: true,
  time: 'O(n)',
  space: 'O(1)',
  uniform: 'yes',
}
