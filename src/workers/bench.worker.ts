// 성능 측정을 화면과 다른 스레드에서 돌린다.
// 알고리즘끼리 CPU를 나눠 쓰면 측정값이 흔들리므로, Worker 하나에서 순서대로 잰다.

import type { AlgorithmId } from '../core/algorithms'
import { benchmarkAlgorithm, type BenchPoint } from '../core/benchmark'
import { createRng, type RngKind } from '../core/rng'

export interface BenchRequest {
  jobId: number
  algoIds: AlgorithmId[]
  sizes: number[]
  samples: number
  rngKind: RngKind
  seed: number
  /** 한 크기의 중앙값이 이 시간을 넘으면 그 알고리즘의 더 큰 크기는 건너뛴다 */
  budgetMs: number
}

export type BenchResponse =
  | { type: 'measuring'; jobId: number; algoId: AlgorithmId; n: number }
  | { type: 'point'; jobId: number; point: BenchPoint }
  | { type: 'skipped'; jobId: number; algoId: AlgorithmId; fromN: number }
  | { type: 'done'; jobId: number }
  | { type: 'error'; jobId: number; message: string }

const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<BenchRequest>) => void) | null
  postMessage(msg: BenchResponse): void
}

ctx.onmessage = (e) => {
  const { jobId, algoIds, sizes, samples, rngKind, seed, budgetMs } = e.data
  try {
    for (const algoId of algoIds) {
      const rng = createRng(rngKind, seed)
      for (const n of sizes) {
        ctx.postMessage({ type: 'measuring', jobId, algoId, n })
        const point = benchmarkAlgorithm(algoId, n, { samples, rng })
        ctx.postMessage({ type: 'point', jobId, point })
        if (point.medianMs > budgetMs && n !== sizes[sizes.length - 1]) {
          ctx.postMessage({ type: 'skipped', jobId, algoId, fromN: n * 2 })
          break
        }
      }
    }
    ctx.postMessage({ type: 'done', jobId })
  } catch (err) {
    ctx.postMessage({ type: 'error', jobId, message: err instanceof Error ? err.message : String(err) })
  }
}
