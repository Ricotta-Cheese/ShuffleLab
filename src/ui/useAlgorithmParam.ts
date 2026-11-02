import { useEffect, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { algorithms, type AlgorithmId } from '../core/algorithms'

// 마지막으로 고른 알고리즘. 상단 메뉴로 B·C·D 화면을 오갈 때 이어받는다 (이번 방문 동안만).
let lastAlgo: AlgorithmId = algorithms[0].id
const listeners = new Set<() => void>()

function remember(id: AlgorithmId) {
  if (id === lastAlgo) return
  lastAlgo = id
  listeners.forEach((l) => l())
}

export function useLastAlgorithm(): AlgorithmId {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => lastAlgo,
  )
}

/**
 * 선택한 알고리즘을 주소의 ?algo=로 유지한다 (보고서에 화면별 링크를 넣을 수 있도록).
 * 주소에 없으면 마지막으로 고른 알고리즘을 쓴다.
 */
export function useAlgorithmParam(): [AlgorithmId, (id: AlgorithmId) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('algo')
  const fallback = useLastAlgorithm()
  const id = algorithms.some((a) => a.id === raw) ? (raw as AlgorithmId) : fallback

  useEffect(() => remember(id), [id])

  const set = (next: AlgorithmId) =>
    setParams(
      (p) => {
        p.set('algo', next)
        return p
      },
      { replace: true },
    )
  return [id, set]
}
