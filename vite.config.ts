/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * 화면 문구에서 한글과 괄호가 붙어 있으면(예: "불일치(D)로") 그 사이에 단어 결합자(U+2060)를 넣는다.
 * 브라우저는 word-break: keep-all이어도 한글과 괄호 사이를 줄바꿈 지점으로 봐서
 * "불일치(D)" / "로 세요."나 "불일치" / "(D)로"처럼 한 단어가 갈라지기 때문이다.
 * 단어 결합자는 보이지 않고 줄바꿈만 막는다. 복사해 쓰는 코드 예시(code.ts)와 테스트 파일은 건드리지 않는다.
 */
const WORD_JOINER = String.fromCharCode(0x2060)

function keepParticles(): Plugin {
  return {
    name: 'keep-korean-particles',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/src\/.*\.(ts|tsx)$/.test(id) || /\.test\.ts$|\/content\/code\.ts$/.test(id)) return
      const joint = /(?<=[가-힣])(?=\()|(?<=\))(?=[가-힣])/g
      if (!joint.test(code)) return
      return { code: code.replace(joint, WORD_JOINER), map: null }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [keepParticles(), react(), tailwindcss()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
