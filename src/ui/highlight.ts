// 코드 강조. 필요한 언어만 등록해 번들을 작게 유지한다. 색은 index.css의 .hljs-* 규칙이 정한다.
import hljs from 'highlight.js/lib/core'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import type { HLJSApi, Language } from 'highlight.js'

/** 이 사이트 의사코드용 간단한 문법 (for … down to, while, swap, ← 등) */
function pseudo(api: HLJSApi): Language {
  return {
    name: 'Pseudo',
    keywords: {
      keyword: 'for to down while if then else return is not and or of by in',
      built_in: 'swap append remove sort copy length random',
      literal: 'empty',
      type: 'integer real number',
    },
    contains: [
      api.C_LINE_COMMENT_MODE,
      { scope: 'number', match: /\b\d+\b/ },
      { scope: 'operator', match: /[←≤<≥>−×]/ },
      { scope: 'variable', match: /\b[A-Z]\b/ },
    ],
  }
}

hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('python', python)
hljs.registerLanguage('pseudo', pseudo)

export type HighlightLang = 'cpp' | 'java' | 'python' | 'pseudo'

/** 이스케이프된 HTML을 돌려준다 (hljs가 원문의 <, & 등을 이스케이프한다) */
export function highlight(code: string, lang: HighlightLang): string {
  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
}
