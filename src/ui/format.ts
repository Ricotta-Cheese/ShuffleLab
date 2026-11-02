export const fmtNum = (v: number, digits = 3) => (Number.isNaN(v) ? '—' : v.toFixed(digits))
export const fmtInt = (v: number) => v.toLocaleString('ko-KR')
export const fmtPct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`
