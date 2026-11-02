import { useEffect, useRef, useState } from 'react'
import type { AlgorithmId } from '../core/algorithms'
import type { RngKind } from '../core/rng'
import type { ExperimentRequest, ExperimentResponse } from '../workers/experiment.worker'

export interface ExperimentConfig {
  algoIds: AlgorithmId[]
  n: number
  trials: number
  rngKind: RngKind
  seed: number
}

export interface AlgoRun {
  done: number
  counts?: number[]
  elapsedMs?: number
  error?: string
}

/**
 * 알고리즘마다 Worker 하나씩 띄워 반복 실험을 병렬로 돌린다.
 * 새로 시작하거나 취소하면 이전 Worker를 모두 종료한다.
 */
export function useExperiment() {
  const workers = useRef<Worker[]>([])
  const jobId = useRef(0)
  const [config, setConfig] = useState<ExperimentConfig>()
  const [runs, setRuns] = useState<Partial<Record<AlgorithmId, AlgoRun>>>({})

  const stopAll = () => {
    workers.current.forEach((w) => w.terminate())
    workers.current = []
  }

  useEffect(() => stopAll, [])

  const start = (cfg: ExperimentConfig) => {
    stopAll()
    const id = ++jobId.current
    setConfig(cfg)
    setRuns(Object.fromEntries(cfg.algoIds.map((a) => [a, { done: 0 }])))

    for (const algoId of cfg.algoIds) {
      const w = new Worker(new URL('../workers/experiment.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent<ExperimentResponse>) => {
        const msg = e.data
        if (msg.jobId !== jobId.current) return
        setRuns((prev) => ({
          ...prev,
          [msg.algoId]:
            msg.type === 'progress'
              ? { ...prev[msg.algoId], done: msg.done }
              : msg.type === 'result'
                ? { done: cfg.trials, counts: msg.counts, elapsedMs: msg.elapsedMs }
                : { done: 0, error: msg.message },
        }))
        if (msg.type !== 'progress') w.terminate()
      }
      const req: ExperimentRequest = { jobId: id, algoId, n: cfg.n, trials: cfg.trials, rngKind: cfg.rngKind, seed: cfg.seed }
      w.postMessage(req)
      workers.current.push(w)
    }
  }

  const cancel = () => {
    stopAll()
    jobId.current++
    setRuns((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([k, r]) => [k, r?.counts ? r : { ...r, done: r?.done ?? 0, error: '취소됨' }]),
      ),
    )
  }

  const running = Object.values(runs).some((r) => r && !r.counts && !r.error)
  return { config, runs, running, start, cancel }
}
