import type { Rng } from '../rng'
import { createRecorder, fmt } from './recorder'
import type { Algorithm, Trace } from './types'

/*
 * remaining ← copy of A,  result ← empty
 * while remaining is not empty
 *     k ← random integer, 0 ≤ k < length(remaining)
 *     append remaining[k] to result
 *     remove remaining[k]          ← 뒤쪽 원소를 한 칸씩 당겨야 하므로 O(n)
 */
export function pickRemove<T>(arr: T[], rng: Rng): T[] {
  const remaining = arr.slice()
  const result: T[] = []
  while (remaining.length > 0) {
    const len = remaining.length
    const k = rng.int(len)
    result.push(remaining[k])
    for (let t = k; t < len - 1; t++) remaining[t] = remaining[t + 1]
    remaining.length = len - 1
  }
  return result
}

export function tracePickRemove<T>(input: readonly T[], rng: Rng): Trace<T> {
  const remaining = [...input]
  const result: T[] = []
  const rec = createRecorder<T>()
  const c = rec.counters

  rec.push({
    kind: 'init',
    array: remaining,
    output: result,
    fixed: [],
    what: `초기 배열 (n=${remaining.length}), 결과 배열은 비어 있음`,
    why: '남은 원소 중 하나를 무작위로 골라 결과 배열 끝에 붙이는 일을 원소가 없어질 때까지 반복해요.',
  })

  while (remaining.length > 0) {
    const len = remaining.length
    const k = rng.int(len)
    c.randomCalls++
    const x = remaining[k]
    c.reads++
    rec.push({
      kind: 'pick',
      array: remaining,
      output: result,
      j: k,
      fixed: [],
      what: `남은 ${len}개 중 ${k}번 칸(값 ${fmt(x)})을 뽑았어요`,
      why: `남은 원소 각각을 같은 확률 1/${len}로 골라요. 결과 배열의 ${result.length}번 칸에 올 원소를 정하는 거예요.`,
    })

    result.push(x)
    c.writes++
    const shift = len - 1 - k
    for (let t = k; t < len - 1; t++) remaining[t] = remaining[t + 1]
    remaining.length = len - 1
    c.shifts += shift
    rec.push({
      kind: 'move',
      array: remaining,
      output: result,
      fixed: [],
      what:
        shift > 0
          ? `값 ${fmt(x)}: 결과 끝에 붙이고 원래 배열에서 제거, 뒤쪽 원소 ${shift}개를 한 칸씩 당김`
          : `값 ${fmt(x)}: 결과 끝에 붙이고 원래 배열에서 제거 (맨 끝이라 당길 원소 없음)`,
      why: '배열 중간을 지우면 빈칸이 생기므로 뒤쪽 원소를 앞으로 옮겨야 해요. 한 번에 최대 n−1번 옮기므로 전체는 O(n²)이 돼요.',
    })
  }

  rec.push({
    kind: 'done',
    array: remaining,
    output: result,
    fixed: [],
    what: '셔플 완료',
    why: `모든 원소가 결과 배열로 옮겨졌어요. 당긴 원소는 모두 ${c.shifts}개예요. 결과 배열이 원래 배열과 따로 필요하므로 추가 공간은 O(n)이에요.`,
  })

  return rec.finish(result)
}

export const pickRemoveAlgorithm: Algorithm = {
  id: 'pick-remove',
  name: 'Random Pick & Remove',
  shuffle: pickRemove,
  trace: tracePickRemove,
  inPlace: false,
  time: 'O(n²)',
  space: 'O(n)',
  uniform: 'yes',
}
