// 화면 목록과 각 화면의 안내 문구. 상단 메뉴, 화면 머리말, 이전/다음 이동이 모두 이 순서를 따른다.
import type { HypothesisId } from './hypotheses'

export type ScreenId =
  | 'description'
  | 'algorithms'
  | 'visualize'
  | 'relationship'
  | 'uniformity'
  | 'performance'
  | 'compare'

export interface ScreenMeta {
  id: ScreenId
  path: string
  letter: string
  name: string
  /** 메뉴와 머리말에 붙는 짧은 부제 */
  subtitle: string
  /** 이 화면에서 확인할 것 */
  goals: string[]
  hypotheses: HypothesisId[]
  /** 고른 알고리즘을 주소(?algo=)로 이어받는 화면인지 */
  usesAlgorithm: boolean
}

export const screenMeta: ScreenMeta[] = [
  {
    id: 'description',
    path: '/description',
    letter: 'A',
    name: '설명',
    subtitle: '프로젝트 소개',
    goals: [],
    hypotheses: [],
    usesAlgorithm: false,
  },
  {
    id: 'algorithms',
    path: '/algorithms',
    letter: 'B',
    name: '알고리즘',
    subtitle: '원리와 복잡도',
    goals: [
      '네 알고리즘의 원리와 핵심 의사코드를 비교해요.',
      '시간·공간 복잡도가 왜 그렇게 나오는지 확인해요.',
      '어떤 알고리즘이 이론적으로 균등한 셔플인지 확인해요.',
    ],
    hypotheses: [1, 2],
    usesAlgorithm: true,
  },
  {
    id: 'visualize',
    path: '/visualize',
    letter: 'C',
    name: '동작 시각화',
    subtitle: '한 단계씩 따라가기',
    goals: [
      '원소 10개 이하로 셔플 과정을 한 단계씩 따라가요.',
      '각 단계에서 무엇을, 왜 했는지 읽어요.',
      '교환으로 자리를 하나씩 확정하는 Fisher–Yates와 더미를 나눠 끼워 넣는 Riffle Shuffle이 어떻게 다른지 눈으로 비교해요.',
    ],
    hypotheses: [1],
    usesAlgorithm: true,
  },
  {
    id: 'relationship',
    path: '/relationship',
    letter: 'D',
    name: '관계성',
    subtitle: '원본과 얼마나 닮았나',
    goals: [
      '한 번 섞은 결과가 원본 순서와 얼마나 관계있는지 Kendall의 τ로 재요.',
      '같은 입력을 여러 번 섞었을 때 τ가 어떻게 퍼지는지 봐요.',
    ],
    hypotheses: [3, 4],
    usesAlgorithm: true,
  },
  {
    id: 'uniformity',
    path: '/uniformity',
    letter: 'E',
    name: '균등성',
    subtitle: '모든 순열이 공평한가',
    goals: [
      '같은 알고리즘을 여러 번 실행해 순열별 발생 확률을 재요.',
      '균등분포와의 차이(TVD)를 알고리즘끼리, 그리고 이론값과 비교해요.',
    ],
    hypotheses: [1, 3],
    usesAlgorithm: false,
  },
  {
    id: 'performance',
    path: '/performance',
    letter: 'F',
    name: '효율성',
    subtitle: '얼마나 빠른가',
    goals: [
      '배열 크기를 두 배씩 늘리며 셔플 1회의 실행 시간을 재요.',
      '크기가 두 배일 때 시간이 몇 배가 되는지로 복잡도 차이를 확인해요.',
    ],
    hypotheses: [2],
    usesAlgorithm: false,
  },
  {
    id: 'compare',
    path: '/compare',
    letter: 'G',
    name: '전체 비교',
    subtitle: '측정 결과 한눈에',
    goals: [
      'D·E·F 화면에서 잰 관계성·균등성·효율성 결과를 알고리즘별로 나란히 비교해요.',
      '알고리즘마다 측정 조건이 같은지 확인하고, 다르면 표준 조건으로 한 번에 다시 재요.',
    ],
    hypotheses: [1, 2, 3],
    usesAlgorithm: false,
  },
]

export const getScreen = (id: ScreenId) => screenMeta.find((s) => s.id === id)!
