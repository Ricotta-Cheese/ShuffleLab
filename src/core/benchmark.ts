import { getAlgorithm, type AlgorithmId } from './algorithms'
import type { Rng } from './rng'

export interface BenchPoint {
  algoId: AlgorithmId
  n: number
  /** 셔플 1회당 실행 시간의 중앙값 (ms) */
  medianMs: number
  minMs: number
  maxMs: number
  /** 측정 반복 수 */
  samples: number
  /** 한 번 잴 때 연속으로 섞은 배열 수 */
  batch: number
}

export interface BenchOptions {
  samples: number
  rng: Rng
  /** 한 번 잴 때 최소한 이만큼은 걸리도록 batch를 늘린다 (타이머 해상도 대응) */
  minBatchMs?: number
  /** batch × n 상한 (메모리 보호) */
  maxBatchElements?: number
  now?: () => number
}

/**
 * 알고리즘 실행 시간만 잰다.
 * - 배열 생성과 복사는 시간을 재기 전에 끝낸다.
 * - 난수 생성은 셔플의 일부이므로 측정에 포함된다.
 * - 짧은 실행은 타이머 해상도(브라우저에서 보통 0.1ms 안팎)보다 작을 수 있어서,
 *   batch개의 배열을 연속으로 섞은 시간을 batch로 나눈다.
 * - 처음 몇 번은 JIT 최적화 전이라 느리므로 워밍업 후 잰다.
 */
export function benchmarkAlgorithm(algoId: AlgorithmId, n: number, opts: BenchOptions): BenchPoint {
  const { samples, rng, minBatchMs = 5, maxBatchElements = 4_000_000, now = () => performance.now() } = opts
  const algo = getAlgorithm(algoId)
  const base = Array.from({ length: n }, (_, i) => i)
  let sink = 0

  const timeBatch = (batch: number) => {
    const copies = Array.from({ length: batch }, () => base.slice())
    const t0 = now()
    for (const c of copies) sink += algo.shuffle(c, rng)[0] ?? 0
    return (now() - t0) / batch
  }

  // 워밍업
  for (let k = 0; k < 3; k++) timeBatch(1)

  // batch 크기 정하기: 한 번 재는 데 minBatchMs 이상 걸릴 때까지 두 배씩
  let batch = 1
  while (timeBatch(batch) * batch < minBatchMs && batch * 2 * n <= maxBatchElements) batch *= 2

  const times: number[] = []
  for (let s = 0; s < samples; s++) times.push(timeBatch(batch))
  times.sort((a, b) => a - b)

  // sink를 결과에 섞어 엔진이 셔플을 쓸모없는 코드로 보고 지우지 못하게 한다
  if (sink === -1) times.push(0)

  return {
    algoId,
    n,
    medianMs: median(times),
    minMs: times[0],
    maxMs: times[times.length - 1],
    samples,
    batch,
  }
}

export function median(sorted: readonly number[]): number {
  const m = sorted.length >> 1
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2
}

/** 크기를 두 배로 늘렸을 때의 시간 비율. O(n)이면 약 2, O(n log n)이면 2보다 조금 크고, O(n²)이면 약 4. */
export function doublingRatios(points: readonly BenchPoint[]): (number | undefined)[] {
  return points.map((p, k) => {
    const prev = points[k - 1]
    return prev && p.n === prev.n * 2 ? p.medianMs / prev.medianMs : undefined
  })
}

/** 2^from ~ 2^to */
export function powerOfTwoSizes(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, k) => 2 ** (from + k))
}
