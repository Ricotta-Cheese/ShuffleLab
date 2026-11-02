export const fmtNum = (v: number, digits = 3) => (Number.isNaN(v) ? '—' : v.toFixed(digits))
export const fmtInt = (v: number) => v.toLocaleString('ko-KR')
export const fmtPct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`

/** 실행 시간 (ms 단위 값을 ns·µs·ms 중 읽기 좋은 단위로) */
export function fmtTime(ms: number) {
  if (ms < 0.001) return `${(ms * 1e6).toFixed(0)} ns`
  if (ms < 1) return `${(ms * 1e3).toFixed(ms < 0.01 ? 2 : 1)} µs`
  return `${ms.toFixed(ms < 10 ? 2 : 1)} ms`
}
