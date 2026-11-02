import type { Rng } from '../rng'

/**
 * 단계 기록용 연산 카운터. trace 버전에서만 센다 (shuffle 버전은 속도 측정용이라 세지 않는다).
 * - randomCalls: 난수 호출 횟수
 * - swaps: 실행한 교환 연산 횟수 (i와 j가 같아도 교환을 실행했으면 1회)
 * - comparisons: 키 비교 횟수 (Random-Key Sort)
 * - reads / writes: 배열 원소 읽기 / 쓰기 횟수 (아래 shifts는 포함하지 않음)
 * - shifts: 중간 원소를 제거한 뒤 빈칸을 메우려고 한 칸씩 당긴 원소 수 (Pick & Remove)
 */
export interface Counters {
  randomCalls: number
  swaps: number
  comparisons: number
  reads: number
  writes: number
  shifts: number
}

export type StepKind =
  | 'init' // 초기 상태
  | 'select' // 무작위 인덱스 선택
  | 'swap' // 두 원소 교환
  | 'pick' // 남은 원소 중 하나 선택 (Pick & Remove)
  | 'move' // 결과 배열로 옮기고 원래 배열에서 제거 (Pick & Remove)
  | 'assignKey' // 무작위 키 부여 (Random-Key Sort)
  | 'sort' // 키 기준 정렬 (Random-Key Sort)
  | 'cut' // 더미를 위아래 둘로 나눔 (Riffle)
  | 'riffle' // 두 더미를 번갈아 내려놓음 (Riffle)
  | 'done' // 완료

export interface Step<T> {
  kind: StepKind
  /** 이 단계 직후의 작업 배열 스냅샷 */
  array: T[]
  /** Pick & Remove의 결과 배열 스냅샷 */
  output?: T[]
  /** Random-Key Sort에서 array와 같은 순서로 정렬된 키 (아직 부여 전이면 undefined) */
  keys?: (number | undefined)[]
  /** Riffle에서 위 더미의 장수. array[0..cut−1]이 위 더미, 나머지가 아래 더미 */
  cut?: number
  /** Riffle에서 각 위치의 카드가 온 더미 (0 = 위, 1 = 아래) */
  source?: (0 | 1)[]
  /** 현재 기준 위치 */
  i?: number
  /** 무작위로 선택된 위치 */
  j?: number
  /** 위치가 확정된 인덱스 */
  fixed: number[]
  /** 이 단계 직후까지의 누적 카운터 */
  counters: Counters
  /** 무엇을 했는가 */
  what: string
  /** 왜 그렇게 했는가 */
  why: string
}

export interface Trace<T> {
  steps: Step<T>[]
  result: T[]
  counters: Counters
}

export type AlgorithmId = 'fisher-yates' | 'pick-remove' | 'riffle' | 'random-key'

export interface Algorithm {
  id: AlgorithmId
  name: string
  /**
   * 빠른 버전. 기록 없이 셔플만 한다 (성능·반복 실험용).
   * inPlace가 true면 입력 배열을 직접 바꾸고 그 배열을 반환한다.
   */
  shuffle: <T>(arr: T[], rng: Rng) => T[]
  /** 기록 버전. 입력은 바꾸지 않고 단계별 스냅샷을 만든다 (시각화용). */
  trace: <T>(arr: readonly T[], rng: Rng) => Trace<T>
  inPlace: boolean
  time: string
  space: string
  /** 균등한 순열 생성 여부 (이론). approximate: 정확히 균등하지는 않지만 편향이 매우 작음 */
  uniform: 'yes' | 'no' | 'conditional' | 'approximate'
}
