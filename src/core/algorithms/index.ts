import { fisherYatesAlgorithm } from './fisherYates'
import { pickRemoveAlgorithm } from './pickRemove'
import { randomKeyAlgorithm } from './randomKey'
import { riffleAlgorithm } from './riffle'
import type { Algorithm, AlgorithmId } from './types'

export const algorithms: Algorithm[] = [
  fisherYatesAlgorithm,
  pickRemoveAlgorithm,
  riffleAlgorithm,
  randomKeyAlgorithm,
]

export function getAlgorithm(id: AlgorithmId): Algorithm {
  const a = algorithms.find((x) => x.id === id)
  if (!a) throw new Error(`알 수 없는 알고리즘: ${id}`)
  return a
}

export type { Algorithm, AlgorithmId, Counters, Step, StepKind, Trace } from './types'
