import { useSyncExternalStore } from 'react'
import { tutorialSteps } from '../content/tutorial'

// 실험 가이드 진행 상태. 헤더 버튼을 눌러야만 시작하고, 언제든 끝낼 수 있다.
// 다시 열면 처음부터 시작한다 (방문할 때 저절로 이어서 뜨지 않도록 저장하지 않는다).

export interface TutorialState {
  active: boolean
  index: number
  /** 패널을 접어 화면을 가리지 않게 했는지 */
  collapsed: boolean
}

let state: TutorialState = { active: false, index: 0, collapsed: false }
const listeners = new Set<() => void>()

function set(next: Partial<TutorialState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export const startTutorial = () => set({ active: true, index: 0, collapsed: false })
export const endTutorial = () => set({ active: false })
export const goToStep = (index: number) =>
  set({ index: Math.max(0, Math.min(index, tutorialSteps.length - 1)), collapsed: false })
export const setTutorialCollapsed = (collapsed: boolean) => set({ collapsed })

export function useTutorial(): TutorialState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
