import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

type Box = { x: number; y: number; w: number; h: number }

const sameBox = (a: Box | null, b: Box | null) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h)

/**
 * 탭·버튼 묶음에서 선택 표시(배경 알약)가 선택한 칸으로 미끄러져 가게 한다.
 * 묶음 상자에 ref를 달고(position: relative), 선택한 칸에 data-active를 붙이면
 * 그 칸의 위치·크기를 재서 표시의 style을 돌려준다. 처음 놓일 때는 움직이지 않는다.
 */
export function useSlider<T extends HTMLElement>(activeKey: unknown) {
  const ref = useRef<T>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [ready, setReady] = useState(false)
  const measureRef = useRef<() => void>(() => {})
  const mounted = useRef(false)

  // 관찰자는 한 번만 만든다. 위치가 그대로면 상태를 바꾸지 않아 다시 그리지 않는다.
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const measure = () => {
      const el = root.querySelector<HTMLElement>('[data-active="true"]')
      const next = el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null
      setBox((prev) => (sameBox(prev, next) ? prev : next))
    }
    measureRef.current = measure
    measure()
    // 글꼴이 늦게 불러와지거나 창 폭이 바뀌면 칸 크기가 달라지므로 다시 잰다
    const ro = new ResizeObserver(measure)
    ro.observe(root)
    for (const child of root.children) ro.observe(child)
    return () => ro.disconnect()
  }, [])

  // 선택이 바뀌면 그리기 전에 다시 잰다. 처음 자리는 그냥 놓고, 첫 변경부터 움직임을 켠다.
  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setReady(true)
    measureRef.current()
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
