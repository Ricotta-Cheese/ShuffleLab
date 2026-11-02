import type { Rng } from '../rng'
import { createRecorder, range } from './recorder'
import type { Algorithm, Trace } from './types'

/** 한 번 셔플할 때 튕겨 섞는 횟수 (Bayer–Diaconis: 52장이면 7번이 충분하다) */
export const RIFFLES = 7

/*
 * Gilbert–Shannon–Reeds 모델의 리플 셔플을 k번 반복한다.
 * repeat k times
 *     b[0..n−1] ← 동전 n번 (0 또는 1)
 *     c ← b에서 0의 개수
 *     위 더미 L ← A[0..c−1],  아래 더미 R ← A[c..n−1]
 *     for p ← 0 to n−1
 *         A[p] ← (b[p] = 0) ? L의 다음 카드 : R의 다음 카드
 *
 * 0의 개수 c는 이항분포 B(n, 1/2)를 따르고(GSR의 자르는 위치),
 * c가 정해지면 0이 놓일 자리는 C(n, c)가지가 모두 같은 확률이라 두 더미를 끼워 넣는 방법이 균등하다.
 */
export function riffle<T>(arr: T[], rng: Rng, k = RIFFLES): T[] {
  const n = arr.length
  const tmp = new Array<T>(n)
  const bits = new Uint8Array(n)
  for (let round = 0; round < k; round++) {
    let c = 0
    for (let p = 0; p < n; p++) {
      bits[p] = rng.int(2)
      if (bits[p] === 0) c++
    }
    for (let p = 0; p < n; p++) tmp[p] = arr[p]
    let l = 0
    let r = c
    for (let p = 0; p < n; p++) arr[p] = bits[p] === 0 ? tmp[l++] : tmp[r++]
  }
  return arr
}

export function traceRiffle<T>(input: readonly T[], rng: Rng): Trace<T> {
  const a = [...input]
  const n = a.length
  const rec = createRecorder<T>()
  const c = rec.counters

  rec.push({
    kind: 'init',
    array: a,
    fixed: [],
    what: `초기 배열 (n=${n})`,
    why: `카드 더미를 둘로 나눠 번갈아 떨어뜨리는 리플 셔플을 ${RIFFLES}번 반복해요. 어떤 칸도 중간에 확정되지 않아요.`,
  })

  for (let round = 1; round <= RIFFLES; round++) {
    const bits: (0 | 1)[] = []
    for (let p = 0; p < n; p++) bits.push(rng.int(2) as 0 | 1)
    c.randomCalls += n
    const cut = bits.filter((b) => b === 0).length
    rec.push({
      kind: 'cut',
      array: a,
      cut,
      fixed: [],
      what: `${round}/${RIFFLES}번째: 동전 ${n}번 → 0이 ${cut}개, 위 ${cut}장 / 아래 ${n - cut}장으로 나눔`,
      why: `동전 하나가 카드 한 장 몫이라 0의 개수, 곧 위 더미 크기는 이항분포 B(${n}, 1/2)를 따라요. 실제로 사람이 더미를 대략 반으로 자르는 모습을 흉내 낸 거예요.`,
    })

    const tmp = [...a]
    c.reads += n
    c.writes += n
    let l = 0
    let r = cut
    for (let p = 0; p < n; p++) a[p] = bits[p] === 0 ? tmp[l++] : tmp[r++]
    c.reads += n
    c.writes += n
    rec.push({
      kind: 'riffle',
      array: a,
      source: bits,
      fixed: [],
      what: `동전 결과 [${bits.join('')}] 순서대로 0이면 위 더미, 1이면 아래 더미에서 한 장씩 내려놓음`,
      why: `각 더미 안의 순서는 그대로 유지돼요. 위 더미가 0이 나온 자리 ${cut}곳을 차지하는데, 그 자리 조합 C(${n}, ${cut})가지가 모두 같은 확률이라 두 더미를 끼워 넣는 방법이 고르게 나와요.`,
    })
  }

  rec.push({
    kind: 'done',
    array: a,
    fixed: range(0, n),
    what: '셔플 완료',
    why:
      n > 1
        ? `리플 ${RIFFLES}번, 동전 ${RIFFLES * n}번을 썼어요. 경로 2^${RIFFLES * n}가지를 순열 ${n}!가지에 똑같이 나눌 수는 없어서 완전히 균등하지는 않지만, 편향은 작아요.`
        : '원소가 1개 이하라 섞을 것이 없어요.',
  })

  return rec.finish(a)
}

/** 순열의 상승 수열 개수: 값 v+1이 v보다 앞에 놓일 때마다 새 수열이 시작된다 */
export function risingSequences(perm: readonly number[]): number {
  const pos: number[] = []
  perm.forEach((v, idx) => (pos[v] = idx))
  let r = perm.length > 0 ? 1 : 0
  for (let v = 1; v < perm.length; v++) if (pos[v] < pos[v - 1]) r++
  return r
}

/**
 * 입력 [0..n−1]을 리플 k번 했을 때 결과가 perm일 정확한 확률 (Bayer–Diaconis 1992).
 * 상승 수열이 r개인 순열의 확률은 C(2^k + n − r, n) / 2^(kn).
 * 경로 수 2^(kn)이 너무 많아 모두 열거할 수 없을 때 이론값으로 쓴다.
 */
export function riffleProbability(perm: readonly number[], k = RIFFLES): number {
  const n = perm.length
  const a = 2 ** k
  const top = a + n - risingSequences(perm)
  // C(top, n) / a^n 을 넘치지 않게 곱해 나간다
  let p = 1
  for (let t = 0; t < n; t++) p *= (top - t) / (t + 1) / a
  return Math.max(p, 0)
}

export const riffleAlgorithm: Algorithm = {
  id: 'riffle',
  name: 'Riffle Shuffle',
  shuffle: (arr, rng) => riffle(arr, rng),
  trace: traceRiffle,
  inPlace: true,
  time: 'O(n)',
  space: 'O(n)',
  uniform: 'approximate',
}
