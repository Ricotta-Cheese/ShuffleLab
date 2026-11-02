import { useEffect, useRef, useState } from 'react'
import type { AlgorithmId } from '../core/algorithms'
import type { BenchPoint } from '../core/benchmark'
import { getAlgorithm } from '../core/algorithms'
import { log, rngName } from './console'
import { fmtInt, fmtNum, fmtTime } from './format'
import { recordPerformance, type PerformanceEntry } from './results'
import type { BenchRequest, BenchResponse } from '../workers/bench.worker'

export type BenchConfig = Omit<BenchRequest, 'jobId'>

/** 측정을 시작하는 크기 2^BENCH_MIN_EXP */
export const BENCH_MIN_EXP = 8
/** 한 크기의 중앙값이 이 시간(ms)을 넘으면 그 알고리즘의 더 큰 크기는 건너뛴다 */
export const BENCH_BUDGET_MS = 200

export interface BenchState {
  config?: BenchConfig
  points: BenchPoint[]
  /** 시간 예산을 넘어 건너뛴 알고리즘과 시작 크기 */
  skipped: Partial<Record<AlgorithmId, number>>
  measuring?: { algoId: AlgorithmId; n: number }
  status: 'idle' | 'running' | 'done' | 'cancelled' | 'error'
  error?: string
  /** 측정 중 탭이 숨겨진 적이 있는지. 브라우저는 숨겨진 탭을 느리게 돌리므로 결과가 부풀 수 있다. */
  hiddenDuringRun: boolean
}

const initial: BenchState = { points: [], skipped: {}, status: 'idle', hiddenDuringRun: false }

export function useBenchmark() {
  const worker = useRef<Worker>(undefined)
  const jobId = useRef(0)
  const [state, setState] = useState<BenchState>(initial)

  const stop = () => {
    worker.current?.terminate()
    worker.current = undefined
  }

  useEffect(() => stop, [])

  const running = state.status === 'running'
  useEffect(() => {
    if (!running) return
    const onVisibility = () => {
      if (document.hidden) setState((s) => ({ ...s, hiddenDuringRun: true }))
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [running])

  const start = (config: BenchConfig) => {
    stop()
    const id = ++jobId.current
    setState({ ...initial, config, status: 'running', hiddenDuringRun: document.hidden })
    const points: BenchPoint[] = []
    log(
      '효율성',
      `실행 시간 측정 시작: ${config.algoIds.map((a) => getAlgorithm(a).name).join(', ')}\n` +
        `크기 ${fmtInt(config.sizes[0])}~${fmtInt(config.sizes.at(-1)!)} (2배씩) · 크기마다 ${config.samples}회 측정 중앙값 · 난수 ${rngName[config.rngKind]}`,
    )
    const w = new Worker(new URL('../workers/bench.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<BenchResponse>) => {
      const msg = e.data
      if (msg.jobId !== jobId.current) return
      if (msg.type === 'point') {
        const p = msg.point
        const prev = points.findLast((q) => q.algoId === p.algoId)
        const ratio = prev && p.n === prev.n * 2 ? ` · 이전 크기의 ${fmtNum(p.medianMs / prev.medianMs, 2)}배` : ''
        log(
          '효율성',
          `${getAlgorithm(p.algoId).name} n = ${fmtInt(p.n)}: 1회 ${fmtTime(p.medianMs)} (원소당 ${fmtTime(p.medianMs / p.n)}, 배치 ${fmtInt(p.batch)}개)${ratio}`,
          'step',
        )
        points.push(p)
      }
      if (msg.type === 'skipped')
        log('효율성', `${getAlgorithm(msg.algoId).name}: 중앙값이 ${config.budgetMs}ms를 넘어 n = ${fmtInt(msg.fromN)}부터는 건너뛰어요.`, 'warn')
      if (msg.type === 'error') log('효율성', `오류 — ${msg.message}`, 'warn')
      // 끝까지 측정한 결과만 G 전체 비교 화면에 기록한다 (취소·오류는 남기지 않음)
      if (msg.type === 'done') {
        const entries: Partial<Record<AlgorithmId, Omit<PerformanceEntry, 'at'>>> = {}
        for (const id of config.algoIds) {
          const own = points.filter((p) => p.algoId === id).map((p) => ({ n: p.n, medianMs: p.medianMs }))
          if (own.length) entries[id] = { samples: config.samples, rngKind: config.rngKind, points: own }
        }
        recordPerformance(entries)
        log('효율성', '실행 시간 측정이 끝났어요.', 'result')
      }
      setState((s) => {
        switch (msg.type) {
          case 'measuring':
            return { ...s, measuring: { algoId: msg.algoId, n: msg.n } }
          case 'point':
            return { ...s, points: [...s.points, msg.point] }
          case 'skipped':
            return { ...s, skipped: { ...s.skipped, [msg.algoId]: msg.fromN } }
          case 'done':
            return { ...s, measuring: undefined, status: 'done' }
          case 'error':
            return { ...s, measuring: undefined, status: 'error', error: msg.message }
        }
      })
      if (msg.type === 'done' || msg.type === 'error') stop()
    }
    // Worker 파일을 불러오지 못하거나 메시지 밖에서 예외가 나면 측정 중 상태로 멈추지 않게 오류로 표시한다
    w.onerror = (e) => {
      if (id !== jobId.current) return
      e.preventDefault()
      setState((s) => ({ ...s, measuring: undefined, status: 'error', error: `Worker 오류: ${e.message || '불러오기 실패'}` }))
      stop()
    }
    const req: BenchRequest = { ...config, jobId: id }
    w.postMessage(req)
    worker.current = w
  }

  const cancel = () => {
    if (worker.current) log('효율성', '실행 시간 측정을 취소했어요.', 'warn')
    stop()
    jobId.current++
    setState((s) => ({ ...s, measuring: undefined, status: 'cancelled' }))
  }

  return { ...state, start, cancel }
}
