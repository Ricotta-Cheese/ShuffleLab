// 연구 가설 (프로젝트 명세서 5장). 문장은 명세서를 그대로 옮겼다.
// 사이트는 가설마다 근거를 확인할 화면으로 안내하고, 결론은 실제로 돌린 수치로만 보여준다.

export type HypothesisId = 1 | 2 | 3 | 4

export interface Hypothesis {
  id: HypothesisId
  /** 짧은 질문형 제목 */
  question: string
  statement: string
  compare: string
  /** 근거를 확인할 화면 경로 */
  path: string
  screenName: string
}

export const hypotheses: Hypothesis[] = [
  {
    id: 1,
    question: '시간 복잡도가 같아도 균등성은 다를까?',
    statement: '시간 복잡도가 같은 셔플 알고리즘이라도 균등성에는 차이가 있을 수 있다.',
    compare: 'Fisher–Yates vs Riffle Shuffle',
    path: '/uniformity',
    screenName: 'E 균등성',
  },
  {
    id: 2,
    question: '둘 다 균등해도 효율은 다를까?',
    statement: '균등한 셔플을 구현하는 알고리즘끼리도 시간 및 공간 효율성에 차이가 있을 수 있다.',
    compare: 'Fisher–Yates vs Random Pick & Remove',
    path: '/performance',
    screenName: 'F 성능',
  },
  {
    id: 3,
    question: '원본과 관계가 적으면 좋은 셔플일까?',
    statement: '원본 배열과의 관계성이 낮은 결과가 반드시 더 좋은 셔플을 의미하지 않는다.',
    compare: '관계성 지수 R vs 균등성 지수 U',
    path: '/relationship',
    screenName: 'D 관계성',
  },
  {
    id: 4,
    question: '올바른 셔플도 원본과 닮은 결과를 낼까?',
    statement:
      '올바른 셔플 알고리즘의 단일 실행에서는 원본 배열과 높은 관계성을 갖는 결과도 자연스럽게 발생할 수 있다. 따라서 관계성 평가와 균등성 평가는 분리해야 한다.',
    compare: '한 번의 실행 vs 반복 실행의 τ 분포',
    path: '/relationship',
    screenName: 'D 관계성',
  },
]

export const getHypothesis = (id: HypothesisId) => hypotheses.find((h) => h.id === id)!
