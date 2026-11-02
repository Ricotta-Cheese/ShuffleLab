// A. 설명 화면의 참고 문헌. 보고서(PDF)의 참고 문헌과 같은 목록을 쓴다.
// 서지 정보는 APA 형식에 맞춰 적고, used에는 이 사이트의 어느 부분에 쓰였는지 적는다.
// 보고서에 옮기기 전에 원문(DOI·링크)을 직접 열어 확인한다.

export interface Reference {
  /** 화면에 보이는 짧은 이름 (본문에서 부를 때 쓰는 이름) */
  key: string
  citation: string
  url?: string
  used: string
}

export interface ReferenceGroup {
  title: string
  items: Reference[]
}

export const references: ReferenceGroup[] = [
  {
    title: '셔플 알고리즘',
    items: [
      {
        key: 'Fisher & Yates (1938)',
        citation:
          'Fisher, R. A., & Yates, F. (1938). Statistical tables for biological, agricultural and medical research. Oliver & Boyd.',
        used: 'Fisher–Yates의 원형. 남은 수 중 하나를 골라 지우는 손 계산 방식으로, Random Pick & Remove와 같은 아이디어.',
      },
      {
        key: 'Durstenfeld (1964)',
        citation: 'Durstenfeld, R. (1964). Algorithm 235: Random permutation. Communications of the ACM, 7(7), 420.',
        url: 'https://doi.org/10.1145/364520.364540',
        used: '지우는 대신 교환해서 O(n)으로 만든 현대식 Fisher–Yates (B·C 화면의 구현).',
      },
      {
        key: 'Knuth (1997)',
        citation:
          'Knuth, D. E. (1997). The art of computer programming: Vol. 2. Seminumerical algorithms (3rd ed.). Addison-Wesley.',
        used: '3.4.2절 Algorithm P(셔플)와 무작위 키 정렬. 복잡도와 균등성 설명의 기준.',
      },
      {
        key: 'Bayer & Diaconis (1992)',
        citation:
          'Bayer, D., & Diaconis, P. (1992). Trailing the dovetail shuffle to its lair. The Annals of Applied Probability, 2(2), 294–313.',
        url: 'https://doi.org/10.1214/aoap/1177005705',
        used: 'Riffle Shuffle의 GSR 모델, 7번이면 충분하다는 결과, 상승 수열로 구한 정확한 확률 (B·E 화면).',
      },
    ],
  },
  {
    title: '난수 생성',
    items: [
      {
        key: 'PractRand (SFC32)',
        citation: 'Doty-Humphrey, C. (n.d.). PractRand: Practically random [Computer software].',
        url: 'https://pracrand.sourceforge.net/',
        used: '기본 난수 생성기 SFC32(Small Fast Counting)의 출처 (B 화면 난수 설명).',
      },
      {
        key: 'Steele et al. (2014)',
        citation:
          'Steele, G. L., Jr., Lea, D., & Flood, C. H. (2014). Fast splittable pseudorandom number generators. Proceedings of the 2014 ACM International Conference on Object Oriented Programming Systems Languages & Applications (OOPSLA ’14), 453–472.',
        url: 'https://doi.org/10.1145/2660193.2660195',
        used: '시드 하나를 넓혀 SFC32의 상태를 채우는 SplitMix 방식.',
      },
      {
        key: 'Lemire (2019)',
        citation:
          'Lemire, D. (2019). Fast random integer generation in an interval. ACM Transactions on Modeling and Computer Simulation, 29(1), Article 3.',
        url: 'https://doi.org/10.1145/3230636',
        used: 'rng.int(k)의 모듈로 편향과 거부 샘플링.',
      },
      {
        key: 'MDN: Math.random()',
        citation: 'MDN Web Docs. (n.d.). Math.random().',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random',
        used: 'E·F 화면에서 비교하는 브라우저 기본 난수.',
      },
      {
        key: 'MDN: getRandomValues()',
        citation: 'MDN Web Docs. (n.d.). Crypto: getRandomValues() method.',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues',
        used: 'E·F 화면에서 비교하는 암호학적 난수.',
      },
    ],
  },
  {
    title: '측정 지표',
    items: [
      {
        key: 'Kendall (1938)',
        citation: 'Kendall, M. G. (1938). A new measure of rank correlation. Biometrika, 30(1–2), 81–93.',
        url: 'https://doi.org/10.1093/biomet/30.1-2.81',
        used: '관계성 지표 Kendall’s τ (D·G 화면).',
      },
      {
        key: 'Levin & Peres (2017)',
        citation:
          'Levin, D. A., & Peres, Y. (2017). Markov chains and mixing times (2nd ed.). American Mathematical Society.',
        used: '균등성 지표로 쓴 총변동거리(TVD)의 정의, 셔플이 균등분포에 가까워지는 정도를 재는 방법 (E·G 화면).',
      },
    ],
  },
]
