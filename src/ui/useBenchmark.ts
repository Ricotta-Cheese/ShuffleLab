import { useEffect, useRef, useState } from 'react'
import type { AlgorithmId } from '../core/algorithms'
import type { BenchPoint } from '../core/benchmark'
import type { BenchRequest, BenchResponse } from '../workers/bench.worker'

export type BenchConfig = Omit<BenchRequest, 'jobId'>

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
    const w = new Worker(new URL('../workers/bench.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<BenchResponse>) => {
      const msg = e.data
      if (msg.jobId !== jobId.current) return
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
    const req: BenchRequest = { ...config, jobId: id }
    w.postMessage(req)
    worker.current = w
  }

  const cancel = () => {
    stop()
    jobId.current++
    setState((s) => ({ ...s, measuring: undefined, status: 'cancelled' }))
  }

  return { ...state, start, cancel }
}
