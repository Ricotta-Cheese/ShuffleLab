import { useEffect, useMemo, useState } from 'react'
import type { AlgorithmId } from '../../core/algorithms'
import { algorithmContent } from '../../content/algorithms'
import { algorithmCode, codeLangs, type CodeLang } from '../../content/code'
import { highlight } from '../highlight'
import { Button, Card, CardHeader, Segmented } from './ui'

type Lang = 'pseudo' | CodeLang

const langOptions: { value: Lang; label: string }[] = [
  { value: 'pseudo', label: 'Pseudo' },
  ...codeLangs.map((l) => ({ value: l.id, label: l.label })),
]

// 마지막으로 고른 언어. 알고리즘을 바꿔도 같은 언어로 이어서 본다 (이번 방문 동안만).
let lastLang: Lang = 'pseudo'

/** 알고리즘 하나의 의사코드와 C++/Python/Java 구현을 탭으로 보여 준다 */
export default function CodeViewer({ id }: { id: AlgorithmId }) {
  const [lang, setLangState] = useState<Lang>(lastLang)
  const [copied, setCopied] = useState(false)
  const setLang = (l: Lang) => {
    lastLang = l
    setLangState(l)
  }

  const code = lang === 'pseudo' ? algorithmContent[id].pseudocode.join('\n') : algorithmCode[id][lang]
  const html = useMemo(() => highlight(code, lang), [code, lang])
  const lineCount = code.split('\n').length

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // 클립보드 권한이 없으면 아무것도 하지 않는다
    }
  }

  return (
    <Card>
      <CardHeader
        title="코드로 보기"
        desc="C++·Python·Java 코드는 이 사이트의 구현과 같은 순서로 같은 일을 해요. 난수 생성기는 언어마다 달라서 같은 시드라도 섞인 결과는 다를 수 있어요."
      />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Segmented ariaLabel="코드 언어" size="sm" value={lang} onChange={setLang} options={langOptions} />
        <Button size="sm" variant="ghost" onClick={copy} aria-live="polite">
          {copied ? '복사했어요' : '코드 복사'}
        </Button>
      </div>
      <div className="flex overflow-x-auto rounded-lg border border-line bg-code-bg py-3 font-mono text-[13px] leading-6 text-code-ink">
        <div aria-hidden className="sticky left-0 shrink-0 bg-code-bg pr-4 pl-3 text-right text-code-muted select-none">
          {Array.from({ length: lineCount }, (_, k) => (
            <div key={k}>{k + 1}</div>
          ))}
        </div>
        <pre className="hljs pr-4">
          <code dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    </Card>
  )
}
