import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const KEY = 'shuffle-lab-theme'
const listeners = new Set<() => void>()

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 기억하지 않는다
  }
  listeners.forEach((l) => l())
}

/**
 * 테마 상태. 기본값은 다크이고, 고른 테마는 이 브라우저에 기억한다 (저장이 막혀 있으면 이번 방문에만 적용).
 * 실제 값은 <html data-theme>에 두고 모든 전환 버튼이 같은 값을 구독한다.
 */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getTheme)
  return [theme, () => setTheme(theme === 'dark' ? 'light' : 'dark')]
}
