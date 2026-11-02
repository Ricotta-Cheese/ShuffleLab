import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * 탭·버튼 묶음에서 선택 표시(배경 알약)가 선택한 칸으로 미끄러져 가게 한다.
 * 묶음 상자에 ref를 달고(position: relative), 선택한 칸에 data-active를 붙이면
 * 그 칸의 위치·크기를 재서 표시의 style을 돌려준다. 처음 놓일 때는 움직이지 않는다.
 */
export function useSlider<T extends HTMLElement>(activeKey: unknown) {
  const ref = useRef<T>(null)
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[data-active="true"]')
      setBox(el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null)
    }
    measure()
    // 글꼴이 늦게 불러와지거나 창 폭이 바뀌면 칸 크기가 달라지므로 다시 잰다
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    for (const child of root.children) ro.observe(child)
    const id = requestAnimationFrame(() => setReady(true))
    return () => {
      ro.disconnect()
      cancelAnimationFrame(id)
    }
  }, [activeKey])

  const style: CSSProperties = box
    ? {
        transform: `translate(${box.x}px, ${box.y}px)`,
        width: box.w,
        height: box.h,
        transitionProperty: ready ? 'transform, width, height' : 'none',
      }
    : { opacity: 0 }
  return [ref, style] as const
}

/** useSlider가 움직이는 표시. 칸들보다 뒤에 깔린다. */
export const sliderClass =
  'pointer-events-none absolute top-0 left-0 duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none'
