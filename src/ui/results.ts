import { useSyncExternalStore } from 'react'
import { algorithms, type AlgorithmId } from '../core/algorithms'
import type { RngKind } from '../core/rng'

// D·E·F 화면과 G 화면에서 측정한 결과를 알고리즘별로 마지막 것만 모아 둔다.
// G 전체 비교 화면이 이것을 읽는다. 이 브라우저에 기억하고, 저장이 막혀 있으면 이번 방문 동안만 유지한다.

export interface RelationshipEntry {
  /** 원소 수 */
  n: number
  seed: number
  runs: number
  meanTau: number
  meanR: number
  highR: number
  at: number
}

export interface UniformityEntry {
  n: number
  trials: number
  rngKind: RngKind
  seed: number
  tvd: number
  u: number
  theoryTvd: number
  elapsedMs: number
  at: number
}

export interface PerformanceEntry {
  samples: number
  rngKind: RngKind
  /** 크기 오름차순, 셔플 1회 실행 시간의 중앙값 */
  points: { n: number; medianMs: number }[]
  at: number
}

export interface Results {
  relationship: Partial<Record<AlgorithmId, RelationshipEntry>>
  uniformity: Partial<Record<AlgorithmId, UniformityEntry>>
  performance: Partial<Record<AlgorithmId, PerformanceEntry>>
}

const KEY = 'shuffle-lab-results-v1'
const empty: Results = { relationship: {}, uniformity: {}, performance: {} }
const listeners = new Set<() => void>()

/** 저장된 값에서 지금 있는 알고리즘의 결과만 남긴다 (예전에 있던 알고리즘의 결과는 버린다) */
function onlyKnown<E>(rec: unknown): Partial<Record<AlgorithmId, E>> {
  if (!rec || typeof rec !== 'object') return {}
  const out: Partial<Record<AlgorithmId, E>> = {}
  for (const a of algorithms) {
    const v = (rec as Record<string, unknown>)[a.id]
    if (v && typeof v === 'object') out[a.id] = v as E
  }
  return out
}

function load(): Results {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Results>
    return {
      relationship: onlyKnown(parsed.relationship),
      uniformity: onlyKnown(parsed.uniformity),
      performance: onlyKnown(parsed.performance),
    }
  } catch {
    return empty
  }
}

let results: Results = load()

function update(next: Results) {
  results = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 이번 방문 동안만 기억한다
  }
  listeners.forEach((l) => l())
}

export function recordRelationship(id: AlgorithmId, entry: Omit<RelationshipEntry, 'at'>) {
  update({ ...results, relationship: { ...results.relationship, [id]: { ...entry, at: Date.now() } } })
}

export function recordUniformity(id: AlgorithmId, entry: Omit<UniformityEntry, 'at'>) {
  update({ ...results, uniformity: { ...results.uniformity, [id]: { ...entry, at: Date.now() } } })
}

export function recordPerformance(entries: Partial<Record<AlgorithmId, Omit<PerformanceEntry, 'at'>>>) {
  const at = Date.now()
  const next = { ...results.performance }
  for (const [id, e] of Object.entries(entries)) if (e) next[id as AlgorithmId] = { ...e, at }
  update({ ...results, performance: next })
}

export function clearResults() {
  update(empty)
}

export function useResults(): Results {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => results,
  )
}
