/** 1~99에서 서로 다른 정수 n개를 무작위로 고른다 (입력 배열 생성용, 실험 난수와는 별개) */
export function randomDistinctValues(n: number): string[] {
  const pool = Array.from({ length: 99 }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n).map(String)
}

export function parseCustom(text: string, minN: number, maxN: number): { values?: string[]; error?: string } {
  const values = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (values.length < minN || values.length > maxN) {
    return { error: `원소는 ${minN}~${maxN}개여야 한다 (현재 ${values.length}개)` }
  }
  const dup = values.find((v, i) => values.indexOf(v) !== i)
  if (dup !== undefined) {
    return { error: `중복 원소 "${dup}"가 있다. 관계성·균등성 지표는 서로 다른 원소로만 계산한다.` }
  }
  return { values }
}
