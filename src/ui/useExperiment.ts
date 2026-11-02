import { useEffect, useRef, useState } from 'react'
import type { AlgorithmId } from '../core/algorithms'
import type { RngKind } from '../core/rng'
import { uniformity } from '../core/stats/tvd'
import { theoreticalTvd } from '../core/theory'
import { recordUniformity } from './results'
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
 * 끝난 알고리즘의 결과는 G 전체 비교 화면에서 볼 수 있게 기록한다.
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

  /** onFinish: 모든 알고리즘이 끝나면(결과든 오류든) 한 번 부른다. 취소하면 부르지 않는다. */
  const start = (cfg: ExperimentConfig, onFinish?: () => void) => {
    stopAll()
    const id = ++jobId.current
    let remaining = cfg.algoIds.length
    const finishOne = () => {
      if (--remaining === 0) onFinish?.()
    }
    setConfig(cfg)
    setRuns(Object.fromEntries(cfg.algoIds.map((a) => [a, { done: 0 }])))

    for (const algoId of cfg.algoIds) {
      const w = new Worker(new URL('../workers/experiment.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent<ExperimentResponse>) => {
        const msg = e.data
        if (msg.jobId !== jobId.current) return
        if (msg.type === 'result') {
          const { tvd, u } = uniformity(msg.counts)
          recordUniformity(msg.algoId, {
            n: cfg.n,
            trials: cfg.trials,
            rngKind: cfg.rngKind,
            seed: cfg.seed,
            tvd,
            u,
            theoryTvd: theoreticalTvd(msg.algoId, cfg.n),
            elapsedMs: msg.elapsedMs,
          })
        }
        setRuns((prev) => ({
          ...prev,
          [msg.algoId]:
            msg.type === 'progress'
              ? { ...prev[msg.algoId], done: msg.done }
              : msg.type === 'result'
                ? { done: cfg.trials, counts: msg.counts, elapsedMs: msg.elapsedMs }
                : { done: 0, error: msg.message },
        }))
        if (msg.type !== 'progress') {
          w.terminate()
          finishOne()
        }
      }
      // Worker 파일을 불러오지 못하거나 메시지 밖에서 예외가 나면 진행 중 상태로 멈추지 않게 오류로 표시한다
      w.onerror = (e) => {
        if (id !== jobId.current) return
        e.preventDefault()
        setRuns((prev) => ({ ...prev, [algoId]: { done: 0, error: `Worker 오류: ${e.message || '불러오기 실패'}` } }))
        w.terminate()
        finishOne()
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
