import { useSyncExternalStore } from 'react'

// 화면 오른쪽 콘솔에 보여줄 연산 기록. 화면들이 log()로 남기고 ConsolePanel이 구독한다.
// 콘솔을 닫아 두어도 기록은 쌓인다 (최근 MAX_LINES줄만 유지).

export type LogLevel = 'info' | 'step' | 'result' | 'warn'

/** 기록에 쓰는 난수 종류 이름 */
export const rngName = { seeded: '시드 고정', math: 'Math.random', crypto: 'crypto' } as const

export interface LogLine {
  id: number
  time: number
  /** 어느 화면·작업에서 나온 기록인지 (예: 'C', 'E 균등성') */
  source: string
  text: string
  level: LogLevel
}

const MAX_LINES = 600
let lines: LogLine[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function log(source: string, text: string, level: LogLevel = 'info') {
  lines = [...lines.slice(-(MAX_LINES - 1)), { id: nextId++, time: Date.now(), source, text, level }]
  emit()
}

export function clearLog() {
  lines = []
  emit()
}

export function useLog(): LogLine[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => lines,
  )
}

// 콘솔 열림 상태. 이 브라우저에 기억한다 (저장이 막혀 있으면 이번 방문 동안만).
const OPEN_KEY = 'shuffle-lab-console'
let open = (() => {
  try {
    return localStorage.getItem(OPEN_KEY) === '1'
  } catch {
    return false
  }
})()
const openListeners = new Set<() => void>()

export function setConsoleOpen(next: boolean) {
  open = next
  try {
    localStorage.setItem(OPEN_KEY, next ? '1' : '0')
  } catch {
    // 저장소를 쓸 수 없으면 기억하지 않는다
  }
  openListeners.forEach((l) => l())
}

export function useConsoleOpen(): [boolean, (v: boolean) => void] {
  const value = useSyncExternalStore(
    (l) => {
      openListeners.add(l)
      return () => openListeners.delete(l)
    },
    () => open,
  )
  return [value, setConsoleOpen]
}
