// 실험 가이드(튜토리얼) 단계. 보고서의 장 순서를 그대로 따라간다 (화면 순서 A→G와는 다르다).
// 기대값은 모두 보고서에 적은 수치이고, 시드가 고정된 값은 tutorial.test.ts가 지금 코드로 재현되는지 확인한다.

/** 단계 패널이 측정 결과(ui/results.ts)를 읽어 보고서 값과 나란히 보여줄 실험 */
export type TutorialLive = 'performance' | 'uniformity' | 'relationship' | 'compare'

export interface TutorialStep {
  id: string
  /** 보고서의 절 번호 */
  section: string
  title: string
  /** 이 단계에서 열 화면 (보고서와 같은 조건을 주소로 채운다) */
  to: string
  /** 강조할 요소의 data-tour 값 */
  target?: string
  body: string[]
  /** 사용자가 직접 할 일 */
  todo?: string
  /** 보고서에 적은 값 */
  expect?: { label: string; value: string }[]
  live?: TutorialLive
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'intro',
    section: '1장',
    title: '무엇을 확인하나요?',
    to: '/description',
    target: 'hypotheses',
    body: [
      '이 가이드는 보고서의 흐름대로 실험을 따라가요. 단계마다 필요한 화면과 조건을 대신 열어 주고, 보고서에 적은 값과 지금 나온 값을 나란히 보여줘요.',
      '셔플은 동작 과정, 균등성, 효율성을 따로 봐야 해요. 원본과 많이 달라 보인다고 균등한 셔플인 것도 아니고, 균등한 셔플도 원본과 닮은 결과를 낼 수 있기 때문이에요. 아래 강조된 네 가설(H1~H4)을 차례로 확인해요.',
    ],
  },
  {
    id: 'algorithms',
    section: '2–4장',
    title: '네 알고리즘과 복잡도',
    to: '/algorithms?algo=fisher-yates',
    target: 'complexity-table',
    body: [
      '핵심 비교 대상은 Fisher–Yates와 Random Pick & Remove예요. 둘 다 이론적으로 균등하지만, 고른 원소를 처리하는 방식이 달라요.',
      'Fisher–Yates는 고른 칸과 현재 칸을 교환해 O(n)·추가 공간 O(1)이고, Pick & Remove는 뽑은 자리를 메우려고 뒤쪽 원소를 당겨 평균 n(n−1)/4번 옮기므로 O(n²)·O(n)이에요.',
      'Riffle Shuffle(7회)과 Random-Key Sort는 결과 분포를 더 넓게 비교하려고 넣었어요.',
    ],
    todo: '복잡도 표에서 시간·추가 공간·균등성 열을 비교해 보세요.',
  },
  {
    id: 'visualize-fy',
    section: '5.1',
    title: 'Fisher–Yates 단계별 동작',
    to: '/visualize?algo=fisher-yates&n=6&seed=1',
    target: 'viz-player',
    body: [
      '입력 [1, 2, 3, 4, 5, 6], 시드 1로 맞춰 두었어요. 맨 뒤 칸부터 0~i 범위에서 j를 골라 A[i]와 교환하고, 교환이 끝난 칸은 확정돼요.',
    ],
    todo: '"다음 단계"(또는 → 키)로 끝까지 넘기며 단계마다 "왜?" 설명을 읽어 보세요.',
    expect: [
      { label: '최종 결과', value: '[5, 6, 1, 2, 4, 3]' },
      { label: '난수 호출 · 교환', value: '5번 · 5번' },
    ],
  },
  {
    id: 'visualize-pr',
    section: '5.2–5.3',
    title: 'Random Pick & Remove 단계별 동작',
    to: '/visualize?algo=pick-remove&n=6&seed=1',
    target: 'viz-player',
    body: [
      '같은 입력과 시드예요. 처음 다섯 번의 선택값(2, 3, 1, 0, 0)은 Fisher–Yates와 같지만, 뽑은 원소를 결과 배열로 옮기고 빈자리를 메우려고 뒤쪽 원소를 당기기 때문에 결과가 달라져요.',
      '앞쪽 원소를 뽑을수록 당겨야 할 원소가 많아져요. 이 이동 비용이 6.1절 효율성 차이의 원인이에요.',
    ],
    todo: '끝까지 넘기며 "당긴 원소" 횟수가 어떻게 늘어나는지 보세요.',
    expect: [
      { label: '최종 결과', value: '[3, 5, 2, 1, 4, 6]' },
      { label: '난수 호출 · 원소 이동', value: '6번 · 9번' },
    ],
  },
  {
    id: 'performance',
    section: '6.1 · H2',
    title: '효율성: 둘 다 균등해도 속도는 다를까?',
    to: '/performance',
    target: 'perf-presets',
    body: [
      '배열 크기를 256부터 두 배씩 늘리며 셔플 1회 시간을 재요. 크기가 두 배일 때 O(n)은 약 2배, O(n²)은 약 4배 느려져야 해요.',
      '실행 시간은 컴퓨터마다 달라서 절대값보다 "두 배 늘렸을 때 몇 배가 되는지"를 비교해요. 측정하는 동안 이 탭을 화면에 띄워 두세요.',
    ],
    todo: '"H2 확인 · FY vs Pick & Remove"를 눌러 측정을 시작하세요.',
    expect: [
      { label: '16,384 → 32,768일 때 증가', value: 'FY ≈ 1.89배 · P&R ≈ 4.05배' },
      { label: 'P&R ÷ FY', value: '1,024에서 9.9배 → 32,768에서 287배' },
    ],
    live: 'performance',
  },
  {
    id: 'uniformity',
    section: '6.2 · H1',
    title: '균등성: 시간 복잡도가 같아도 균등성은 다를까?',
    to: '/uniformity',
    target: 'uni-presets',
    body: [
      '원소 4개를 100만 번씩 섞어 24가지 순열이 각각 1/24 확률로 나오는지 TVD로 재요. 시드가 1로 고정이라 보고서와 같은 값이 나와야 해요.',
      'Fisher–Yates와 Riffle Shuffle은 둘 다 O(n)이지만 Riffle의 이론 TVD는 약 0.0091이에요. 균등한 알고리즘도 표본 오차 때문에 관측 TVD가 0이 아니라는 점(약 0.0019 수준)도 함께 보세요.',
    ],
    todo: '"전체 비교 (n = 4, 100만 회)"를 눌러 네 알고리즘을 한 번에 실험하세요.',
    expect: [
      { label: 'Fisher–Yates', value: 'TVD 0.0013 (이론 0)' },
      { label: 'Pick & Remove', value: 'TVD 0.0016 (이론 0)' },
      { label: 'Riffle Shuffle', value: 'TVD 0.0082 (이론 0.0091)' },
      { label: 'Random-Key Sort', value: 'TVD 0.0022 (이론 0)' },
    ],
    live: 'uniformity',
  },
  {
    id: 'relationship-single',
    section: '6.3 · H3',
    title: '관계성: 한 번 섞은 결과의 τ',
    to: '/relationship?algo=fisher-yates&n=8&seed=1',
    target: 'rel-result',
    body: [
      '원소 8개를 Fisher–Yates, 시드 1로 한 번 섞었어요. 원소 쌍마다 원본과 앞뒤 순서가 같으면 일치(C), 반대면 불일치(D)로 세서 τ = (C − D) / (C + D)를 구해요.',
    ],
    todo: '"이번 결과의 관계성"에서 C, D, τ를 확인하고 옆의 위치 이동 그림을 보세요.',
    expect: [
      { label: 'C · D', value: '16 · 12' },
      { label: "Kendall's τ", value: '(16 − 12) / 28 = 0.143' },
    ],
  },
  {
    id: 'relationship-dist',
    section: '6.3 · H4',
    title: '균등한 셔플도 원본과 닮은 결과를 낼까?',
    to: '/relationship?algo=fisher-yates&n=8&seed=1',
    target: 'rel-dist',
    body: [
      '같은 입력을 2,000번 섞어 τ의 분포를 그려요. 한 번의 결과와 겹치지 않게 시드 1 + 1,000,003을 써요.',
      '평균 τ는 0에 가깝지만, 원본과 꽤 닮은 결과(|τ| ≥ 0.5)도 일정 비율로 나와요. 한 번의 결과만으로 셔플의 품질을 판단할 수 없는 이유예요.',
    ],
    todo: '분포 그래프에서 양 끝(τ가 ±1에 가까운 쪽)에 막대가 있는지 보세요.',
    expect: [
      { label: '평균 τ', value: '≈ −0.010' },
      { label: '|τ| ≥ 0.5인 비율', value: '10.7%' },
    ],
    live: 'relationship',
  },
  {
    id: 'relationship-rotation',
    section: '6.3 · H3',
    title: '원본과 관계가 적으면 좋은 셔플일까?',
    to: '/relationship?algo=fisher-yates&n=8&seed=1',
    target: 'rel-rotation',
    body: [
      '"항상 3칸 회전"은 무작위성이 전혀 없는 규칙이지만 τ가 0에 가까워 원본과 관계가 낮아 보여요.',
      '하지만 40,320가지 순열 중 한 가지만 만들기 때문에 균등성 지수 U는 거의 0이에요. 관계성(R)과 균등성(U)은 따로 봐야 해요.',
    ],
    expect: [
      { label: "Kendall's τ", value: '−0.071' },
      { label: '균등성 지수 U', value: '2.48 × 10⁻⁵' },
    ],
  },
  {
    id: 'compare',
    section: '6.4',
    title: '전체 비교',
    to: '/compare',
    target: 'compare-run',
    body: [
      '관계성(n = 8, 2,000회), 균등성(n = 4, 100만 회), 효율성(최대 16,384, 5회 측정)을 표준 조건으로 한 번에 재서 나란히 놓아요.',
      '네 알고리즘의 평균 R은 모두 비슷하지만, 속도와 균등성은 달라요. 같은 R 값대에서도 셔플의 성질이 다를 수 있어요.',
    ],
    todo: '"표준 조건"인지 확인하고 "측정 시작"을 누르세요. 균등성 실험 때문에 시간이 조금 걸려요.',
    expect: [
      { label: '평균 R (4종)', value: '0.231 ~ 0.234 (이론 ≈ 0.230)' },
      { label: 'n = 16,384에서 P&R ÷ FY', value: '142.9배 (컴퓨터마다 다름)' },
    ],
    live: 'compare',
  },
  {
    id: 'conclusion',
    section: '7장',
    title: '결론',
    to: '/description',
    target: 'hypotheses',
    body: [
      '균등성과 성능을 모두 만족한 것은 Fisher–Yates였어요. Pick & Remove도 균등하지만 고른 원소를 꺼낸 뒤 나머지를 당기느라 O(n²)이었어요 (H2).',
      '같은 O(n)인 Riffle Shuffle은 순열이 나오는 확률이 달랐고 (H1), "원본과 얼마나 달라졌는가"는 "모든 순열이 얼마나 고르게 나오는가"와 따로 봐야 했어요 (H3, H4).',
      '이제 조건을 바꿔 가며 직접 실험해 보세요. 가이드는 오른쪽 위 버튼으로 언제든 다시 시작할 수 있어요.',
    ],
  },
]
