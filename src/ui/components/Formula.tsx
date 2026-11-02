import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

/**
 * KaTeX로 수식을 그린다. tex는 이 코드 안에서 쓴 고정 문자열이나 숫자만 넣는다 (사용자 입력을 넣지 않음).
 * display면 가운데 정렬한 한 줄 수식, 아니면 문장 속 수식이다. 문단 안에서도 쓸 수 있게 span으로 감싼다.
 */
export default function Formula({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' }),
    [tex, display],
  )
  // KaTeX의 블록 수식 기본 여백(위아래 1em)은 상자 안에서 너무 커서 없앤다
  return (
    <span
      className={display ? 'block overflow-x-auto overflow-y-hidden [&_.katex-display]:m-0' : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
