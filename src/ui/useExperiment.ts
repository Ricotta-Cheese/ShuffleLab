import { useEffect, useRef, useState } from 'react'
import { getAlgorithm, type AlgorithmId } from '../core/algorithms'
import { factorial } from '../core/algorithms/recorder'
import type { RngKind } from '../core/rng'
import { uniformity } from '../core/stats/tvd'
import { theoreticalTvd } from '../core/theory'
import { log, rngName } from './console'
import { fmtInt, fmtNum, fmtTime } from './format'
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
      if (--remaining === 0) {
        log('균등성', '모든 알고리즘의 반복 실험이 끝났어요.', 'result')
        onFinish?.()
      }
    }
    // 진행 상황은 25%마다 한 번만 남긴다 (매 알림마다 남기면 줄이 너무 많아진다)
    const quarter: Partial<Record<AlgorithmId, number>> = {}
    log(
      '균등성',
      `반복 실험 시작: ${cfg.algoIds.map((a) => getAlgorithm(a).name).join(', ')}\n` +
        `원소 ${cfg.n}개(순열 ${factorial(cfg.n)}가지) · ${fmtInt(cfg.trials)}회 · 난수 ${rngName[cfg.rngKind]} · 시드 ${cfg.seed} · Worker ${cfg.algoIds.length}개`,
    )
    setConfig(cfg)
    setRuns(Object.fromEntries(cfg.algoIds.map((a) => [a, { done: 0 }])))

    for (const algoId of cfg.algoIds) {
      const w = new Worker(new URL('../workers/experiment.worker.ts', import.meta.url), { type: 'module' })
      w.onmessage = (e: MessageEvent<ExperimentResponse>) => {
        const msg = e.data
        if (msg.jobId !== jobId.current) return
        const name = getAlgorithm(msg.algoId).name
        if (msg.type === 'progress') {
          const q = Math.floor((msg.done / cfg.trials) * 4)
          if (q > (quarter[msg.algoId] ?? 0) && q < 4) {
            quarter[msg.algoId] = q
            log('균등성', `${name}: ${fmtInt(msg.done)} / ${fmtInt(cfg.trials)}회 (${q * 25}%)`, 'step')
          }
        }
        if (msg.type === 'error') log('균등성', `${name}: 오류 — ${msg.message}`, 'warn')
        if (msg.type === 'result') {
          const { tvd, u } = uniformity(msg.counts)
          const theory = theoreticalTvd(msg.algoId, cfg.n)
          const min = Math.min(...msg.counts)
          const max = Math.max(...msg.counts)
          log(
            '균등성',
            `${name} 완료 (${fmtTime(msg.elapsedMs)})\n` +
              `  순열별 횟수 ${fmtInt(min)}~${fmtInt(max)} (기대값 ${fmtInt(Math.round(cfg.trials / msg.counts.length))})\n` +
              `  TVD = ½Σ|P−1/n!| = ${fmtNum(tvd, 4)} · U = ${fmtNum(u, 4)} · 이론 TVD ${fmtNum(theory, 4)}`,
            'result',
          )
          recordUniformity(msg.algoId, {
            n: cfg.n,
            trials: cfg.trials,
            rngKind: cfg.rngKind,
            seed: cfg.seed,
            tvd,
            u,
            theoryTvd: theory,
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
    log('균등성', '반복 실험을 취소했어요.', 'warn')
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
