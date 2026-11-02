import type { Rng } from '../rng'
import { createRecorder, fmt } from './recorder'
import type { Algorithm, Trace } from './types'

/*
 * for i ← 0 to n−1
 *     key[i] ← random real number in [0, 1)
 * sort A by key (ascending)       ← 비교 정렬이므로 O(n log n)
 *
 * 키가 모두 다르면 모든 순열이 같은 확률이다.
 * 실제로는 53비트 유한 정밀도라 키가 같을 수 있고, 이때 안정 정렬은 원래 순서를 유지한다.
 */
export function randomKey<T>(arr: T[], rng: Rng): T[] {
  const keyed = arr.map((value) => ({ value, key: rng.float() }))
  keyed.sort((p, q) => p.key - q.key)
  return keyed.map((p) => p.value)
}

const fmtKey = (k: number) => k.toFixed(4)

export function traceRandomKey<T>(input: readonly T[], rng: Rng): Trace<T> {
  const n = input.length
  const keys: (number | undefined)[] = new Array(n).fill(undefined)
  const rec = createRecorder<T>()
  const c = rec.counters

  rec.push({
    kind: 'init',
    array: input,
    keys,
    fixed: [],
    what: `초기 배열 (n=${n})`,
    why: '원소마다 [0, 1) 범위의 무작위 키를 붙인 뒤, 키 순서대로 정렬하면 섞인 배열이 된다.',
  })

  for (let i = 0; i < n; i++) {
    keys[i] = rng.float()
    c.randomCalls++
    c.reads++
    c.writes++
    rec.push({
      kind: 'assignKey',
      array: input,
      keys,
      i,
      fixed: [],
      what: `값 ${fmt(input[i])}에 키 ${fmtKey(keys[i]!)} 부여`,
      why: '각 키는 다른 키와 독립적으로 뽑는다. 원래 위치와 무관한 키를 쓰므로 정렬 후 순서는 원래 순서와 관계가 없다.',
    })
  }

  const keyed = input.map((value, i) => ({ value, key: keys[i]! }))
  keyed.sort((p, q) => {
    c.comparisons++
    return p.key - q.key
  })
  const result = keyed.map((p) => p.value)
  const sortedKeys = keyed.map((p) => p.key)
  c.writes += n

  let ties = 0
  for (let i = 1; i < n; i++) if (sortedKeys[i] === sortedKeys[i - 1]) ties++

  rec.push({
    kind: 'sort',
    array: result,
    keys: sortedKeys,
    fixed: [],
    what: `키 오름차순으로 정렬 (비교 ${c.comparisons}회)`,
    why:
      ties === 0
        ? '키가 모두 다르므로 키의 크기 순위가 곧 새 순서가 된다. 독립적인 키의 순위는 모든 순열이 같은 확률로 나온다.'
        : `같은 키가 ${ties}쌍 있다. 안정 정렬은 같은 키끼리 원래 순서를 유지하므로 이 부분에서 균등성이 깨진다.`,
  })

  rec.push({
    kind: 'done',
    array: result,
    keys: sortedKeys,
    fixed: [],
    what: '셔플 완료',
    why: `비교 정렬을 쓰므로 시간은 O(n log n)이고, 키와 정렬용 배열에 O(n) 추가 공간이 든다.`,
  })

  return rec.finish(result)
}

export const randomKeyAlgorithm: Algorithm = {
  id: 'random-key',
  name: 'Random-Key Sort',
  shuffle: randomKey,
  trace: traceRandomKey,
  inPlace: false,
  time: 'O(n log n)',
  space: 'O(n)',
  uniform: 'conditional',
}
