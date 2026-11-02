import { useSearchParams } from 'react-router'
import { algorithms, type AlgorithmId } from '../core/algorithms'

/** 선택한 알고리즘을 주소의 ?algo=로 유지한다 (보고서에 화면별 링크를 넣을 수 있도록). */
export function useAlgorithmParam(): [AlgorithmId, (id: AlgorithmId) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('algo')
  const id = algorithms.some((a) => a.id === raw) ? (raw as AlgorithmId) : algorithms[0].id
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
