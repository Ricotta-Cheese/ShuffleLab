import { useEffect, useMemo, useState } from 'react'

type Render = (tex: string, display: boolean) => string

// KaTeX(스크립트와 글꼴 CSS)는 크기가 커서 수식을 처음 그릴 때 한 번만 따로 내려받는다.
let render: Render | null = null
let loading: Promise<Render> | null = null

/** KaTeX를 미리 불러온다. 설명 창 용어에 마우스를 올리는 순간 불러 두면 창을 열 때 바로 그려진다. */
export function preloadFormula(): Promise<Render> {
  loading ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([{ default: katex }]) => {
    render = (tex, display) => katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' })
    return render
  })
  return loading
}

/**
 * KaTeX로 수식을 그린다. tex는 이 코드 안에서 쓴 고정 문자열이나 숫자만 넣는다 (사용자 입력을 넣지 않음).
 * display면 가운데 정렬한 한 줄 수식, 아니면 문장 속 수식이다. 문단 안에서도 쓸 수 있게 span으로 감싼다.
 * KaTeX를 불러오는 동안에는 자리만 잡아 둔다.
 */
export default function Formula({ tex, display = false }: { tex: string; display?: boolean }) {
  const [ready, setReady] = useState<Render | null>(() => render)

  useEffect(() => {
    if (ready) return
    let alive = true
    preloadFormula().then((r) => alive && setReady(() => r))
    return () => {
      alive = false
    }
  }, [ready])

  const html = useMemo(() => ready?.(tex, display), [ready, tex, display])

  if (!html) return <span aria-busy className={display ? 'block h-10' : 'inline-block h-[1em] w-12 align-middle'} />
  // KaTeX의 블록 수식 기본 여백(위아래 1em)은 상자 안에서 너무 커서 없앤다
  return (
    <span
      className={display ? 'block overflow-x-auto overflow-y-hidden [&_.katex-display]:m-0' : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
