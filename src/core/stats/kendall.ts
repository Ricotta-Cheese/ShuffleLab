export interface KendallResult {
  /** 원본과 앞뒤 순서가 같은 원소 쌍 수 */
  concordant: number
  /** 원본과 앞뒤 순서가 뒤집힌 원소 쌍 수 */
  discordant: number
  /** τ = (C − D) / (C + D), 원소가 2개 미만이면 NaN */
  tau: number
  /** 순서 관계성 지수 R = |τ| (무작위성 점수가 아님) */
  r: number
}

/**
 * 원본 배열과 결과 배열 사이의 Kendall's τ.
 * 원소는 모두 서로 달라야 한다 (중복이 있으면 순위가 정의되지 않으므로 거부한다).
 *
 * 결과 배열의 각 원소를 원본에서의 위치로 바꾼 뒤,
 * 모든 쌍 (a, b), a < b에 대해 원래 위치도 a쪽이 앞이면 일치(C), 뒤면 불일치(D)로 센다.
 */
export function kendall<T>(original: readonly T[], shuffled: readonly T[]): KendallResult {
  const pos = originalPositions(original, shuffled)
  const n = pos.length
  let concordant = 0
  let discordant = 0
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      if (pos[a] < pos[b]) concordant++
      else discordant++
    }
  }
  const total = concordant + discordant
  const tau = total === 0 ? NaN : (concordant - discordant) / total
  return { concordant, discordant, tau, r: Math.abs(tau) }
}

/** 결과 배열의 각 원소가 원본에서 몇 번째였는지. 같은 원소 집합의 순열이 아니면 예외. */
export function originalPositions<T>(original: readonly T[], shuffled: readonly T[]): number[] {
  if (original.length !== shuffled.length) {
    throw new Error('원본과 결과 배열의 길이가 다르다')
  }
  const index = new Map<T, number>()
  original.forEach((v, i) => {
    if (index.has(v)) throw new Error(`중복 원소 ${String(v)}: 관계성 지표는 서로 다른 원소에서만 계산한다`)
    index.set(v, i)
  })
  const seen = new Set<T>()
  return shuffled.map((v) => {
    const p = index.get(v)
    if (p === undefined || seen.has(v)) throw new Error('결과 배열이 원본의 순열이 아니다')
    seen.add(v)
    return p
  })
}
