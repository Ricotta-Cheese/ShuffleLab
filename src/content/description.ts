// A. 설명 화면에 표시할 내용. 문구와 링크는 이 파일만 고치면 된다.
// 링크가 빈 문자열이면 화면에 '준비 중'으로 표시된다.

export const description = {
  title: 'Shuffle Lab',
  subtitle: '배열 셔플 알고리즘의 효율성, 관계성 및 균등성 비교 분석',

  // 주제를 고른 이유. 문단 단위로 나눠 적는다.
  // 아래는 명세서의 '핵심 질문'을 옮긴 초안이므로 본인 문장으로 바꿔 쓴다.
  motivation: [
    '정렬 알고리즘은 다양하게 배우지만, 배열을 무작위로 섞는 알고리즘은 왜 잘 배우지 않을까?',
    '배열을 섞는 알고리즘에도 종류가 있으며, 알고리즘마다 효율성과 무작위성에 차이가 있을까?',
  ],

  // 분석 관점
  questions: [
    { name: '효율성', en: 'Efficiency', desc: '배열을 얼마나 빠르고 적은 메모리로 섞는가?' },
    { name: '관계성', en: 'Relationship', desc: '섞인 배열은 원본 배열의 순서와 얼마나 관계가 있는가?' },
    { name: '균등성', en: 'Uniformity', desc: '가능한 모든 순열이 공평한 확률로 생성되는가?' },
  ],

  links: {
    github: 'https://github.com/Ricotta-Cheese/ShuffleLab',
    report: '', // PDF 보고서 링크 (예: public/report.pdf에 넣으면 '/report.pdf')
  },
}
