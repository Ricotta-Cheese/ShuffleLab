// 반복 실험을 화면과 다른 스레드에서 돌려 UI가 멈추지 않게 한다.

import type { AlgorithmId } from '../core/algorithms'
import { countPermutations } from '../core/experiment'
import { createRng, type RngKind } from '../core/rng'

export interface ExperimentRequest {
  jobId: number
  algoId: AlgorithmId
  n: number
  trials: number
  rngKind: RngKind
  seed: number
}

export type ExperimentResponse =
  | { type: 'progress'; jobId: number; algoId: AlgorithmId; done: number }
  | { type: 'result'; jobId: number; algoId: AlgorithmId; counts: number[]; elapsedMs: number }
  | { type: 'error'; jobId: number; algoId: AlgorithmId; message: string }

// 앱 tsconfig는 DOM 타입을 쓰므로 Worker 전역 객체에 필요한 부분만 타입을 붙인다
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<ExperimentRequest>) => void) | null
  postMessage(msg: ExperimentResponse): void
}

ctx.onmessage = (e) => {
  const { jobId, algoId, n, trials, rngKind, seed } = e.data
  const post = (msg: ExperimentResponse) => ctx.postMessage(msg)
  try {
    const start = performance.now()
    const counts = countPermutations(algoId, n, trials, createRng(rngKind, seed), (done) =>
      post({ type: 'progress', jobId, algoId, done }),
    )
    post({ type: 'result', jobId, algoId, counts, elapsedMs: performance.now() - start })
  } catch (err) {
    post({ type: 'error', jobId, algoId, message: err instanceof Error ? err.message : String(err) })
  }
}
