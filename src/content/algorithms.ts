// B. 알고리즘 화면과 C. 동작 시각화 화면에 쓰는 알고리즘 설명 (화면 문구라 해요체).
// 보고서에 옮길 때는 본인이 검증한 뒤 자기 문장으로 다시 쓴다.

import type { AlgorithmId, StepKind } from '../core/algorithms'

export interface AlgorithmContent {
  summary: string
  principle: string[]
  pseudocode: string[]
  /** 단계 종류 → 강조할 의사코드 줄 번호 (0부터) */
  stepLines: Partial<Record<StepKind, number[]>>
  timeWhy: string
  spaceWhy: string
  uniformWhy: string
  strengths: string[]
  limits: string[]
}

export const algorithmContent: Record<AlgorithmId, AlgorithmContent> = {
  'fisher-yates': {
    summary: '뒤에서부터 한 칸씩, 아직 확정되지 않은 범위에서 원소를 골라 자리를 확정해요.',
    principle: [
      '배열을 "확정되지 않은 앞부분"과 "확정된 뒷부분"으로 나눠요.',
      'i번 칸을 확정할 때, 0~i 범위에서 j를 무작위로 골라 A[i]와 A[j]를 바꿔요.',
      '확정된 칸은 다시 선택 범위에 들어가지 않으므로, 각 원소는 정확히 한 번 자리가 정해져요.',
    ],
    pseudocode: ['for i ← n−1 down to 1', '    j ← random integer, 0 ≤ j ≤ i', '    swap A[i], A[j]'],
    stepLines: { select: [0, 1], swap: [2] },
    timeWhy: '반복은 n−1번이고, 한 번 반복할 때 난수 1회와 교환 1회(상수 시간)만 하므로 O(n)이에요.',
    spaceWhy: '입력 배열 안에서 교환만 하고 임시 변수 하나만 쓰므로 추가 공간은 O(1)이에요.',
    uniformWhy:
      'i번째 단계의 선택지는 i+1개이므로 전체 선택 경로는 n × (n−1) × … × 2 = n!개예요. 서로 다른 경로는 서로 다른 순열을 만들므로 경로와 순열이 일대일로 대응하고, 각 순열의 확률은 정확히 1/n!이에요.',
    strengths: ['시간 O(n), 추가 공간 O(1)로 가장 효율적이에요.', '난수만 균등하면 모든 순열이 같은 확률로 나와요.'],
    limits: [
      '선택 범위를 0~i가 아니라 0~n−1로 잘못 쓰면 Naive Random Swap이 되어 균등성이 깨져요.',
      '0~i−1로 쓰면(자기 자신 제외) Sattolo 알고리즘이 되어 원형 순열만 만들어요.',
    ],
  },

  'pick-remove': {
    summary: '남은 원소 중 하나를 골라 결과 배열에 붙이고, 원래 배열에서 지워요.',
    principle: [
      '사람이 카드를 한 장씩 무작위로 뽑아 새 줄에 놓는 방식과 같아요.',
      '남은 원소가 len개일 때 각각을 1/len 확률로 골라요.',
      '고른 원소를 배열 중간에서 지우려면 그 뒤의 원소를 한 칸씩 당겨야 해요.',
    ],
    pseudocode: [
      'remaining ← copy of A,  result ← empty',
      'while remaining is not empty',
      '    k ← random integer, 0 ≤ k < length(remaining)',
      '    append remaining[k] to result',
      '    remove remaining[k]    // 뒤쪽 원소를 한 칸씩 당김',
    ],
    stepLines: { init: [0], pick: [1, 2], move: [3, 4] },
    timeWhy:
      'n번 반복하고, 남은 길이가 len일 때 제거에 최대 len−1번 이동이 필요해요. 뽑는 위치가 균등하면 평균 (len−1)/2번이므로 전체 평균 이동 횟수는 n(n−1)/4, 즉 O(n²)이에요.',
    spaceWhy: '원본을 보존하기 위한 remaining 복사본과 결과 배열이 각각 n칸 필요하므로 추가 공간은 O(n)이에요.',
    uniformWhy:
      '선택지가 n, n−1, …, 1개로 줄어들므로 전체 경로는 n!개이고, 각 경로가 서로 다른 순열을 만들어요. 따라서 Fisher–Yates와 같은 이유로 모든 순열의 확률이 1/n!이에요.',
    strengths: ['원리가 직관적이고 구현이 쉬워요.', '올바르게 구현하면 균등한 셔플이에요.'],
    limits: [
      '중간 원소 삭제 때문에 O(n²)이라 큰 배열에서 느려요.',
      '결과 배열이 따로 필요해 O(n) 추가 공간을 써요.',
      '삭제 대신 마지막 원소를 그 자리로 옮기면 사실상 Fisher–Yates가 돼요.',
    ],
  },

  'naive-swap': {
    summary: '모든 칸을 차례로, 배열 전체에서 고른 칸과 바꿔요. (의도적으로 넣은 잘못된 구현)',
    principle: [
      '언뜻 보면 "모든 칸을 무작위 칸과 한 번씩 바꾸니 잘 섞인다"고 생각하기 쉬워요.',
      'Fisher–Yates와 코드가 거의 같지만, j의 범위가 줄어들지 않고 항상 0~n−1이에요.',
      '그래서 이미 교환을 마친 칸도 뒤의 단계에서 다시 바뀔 수 있어요.',
    ],
    pseudocode: ['for i ← 0 to n−1', '    j ← random integer, 0 ≤ j ≤ n−1', '    swap A[i], A[j]'],
    stepLines: { select: [0, 1], swap: [2] },
    timeWhy: '반복은 n번이고, 한 번 반복할 때 난수 1회와 교환 1회만 하므로 O(n)이에요.',
    spaceWhy: '입력 배열 안에서 교환만 하므로 추가 공간은 O(1)이에요.',
    uniformWhy:
      '매 단계 선택지가 n개이므로 경로는 nⁿ개이고, 각 경로의 확률은 1/nⁿ이에요. 순열의 확률은 (그 순열로 가는 경로 수)/nⁿ인데, 모든 순열이 같으려면 nⁿ이 n!로 나누어떨어져야 해요. n ≥ 3이면 n−1은 n!을 나누지만, n과 서로소라 nⁿ은 나누지 못해요. 따라서 균등할 수 없어요.',
    strengths: ['Fisher–Yates와 시간·공간 복잡도가 같아요.'],
    limits: [
      'n ≥ 3에서 모든 순열이 같은 확률로 나오지 않아요. 예: n=3이면 27개 경로가 순열마다 4개 또는 5개씩 나뉘어요.',
      '복잡도만으로는 이 차이를 알 수 없어요. 균등성은 따로 검증해야 해요.',
    ],
  },

  'random-key': {
    summary: '원소마다 무작위 키를 붙이고, 키 순서대로 정렬해요.',
    principle: [
      '각 원소에 [0, 1) 범위의 독립적인 무작위 실수 키를 하나씩 붙여요.',
      '키를 기준으로 오름차순 정렬하면, 키의 순위가 새 순서가 돼요.',
      '이미 있는 정렬 함수를 그대로 쓸 수 있어 구현이 간단해요.',
    ],
    pseudocode: ['for i ← 0 to n−1', '    key[i] ← random real number in [0, 1)', 'sort A by key (ascending)'],
    stepLines: { assignKey: [0, 1], sort: [2] },
    timeWhy:
      '키를 붙이는 데 O(n), 비교 정렬에 O(n log n)이 걸려요. 큰 쪽이 전체를 결정하므로 O(n log n)이에요.',
    spaceWhy: '원소와 키를 묶은 n칸 배열이 필요해요. 정렬 자체가 쓰는 공간도 구현에 따라 O(n)까지 들어요.',
    uniformWhy:
      '키가 연속분포에서 독립적으로 뽑혀 모두 다르다면, 키들의 크기 순서는 대칭성에 의해 n!가지가 모두 같은 확률이에요. 하지만 실제 키는 53비트 실수라 같은 키가 나올 수 있고, 이때 안정 정렬은 원래 순서를 유지해 아주 작은 편향이 생겨요.',
    strengths: ['정렬 함수만 있으면 쉽게 구현할 수 있어요.', '키가 모두 다르면 균등한 셔플이에요.'],
    limits: [
      '정렬 때문에 O(n log n)으로 Fisher–Yates보다 느려요.',
      '키 배열에 O(n) 추가 공간이 들어요.',
      '비교 함수가 무작위 값을 돌려주는 방식(예: sort(() => Math.random() − 0.5))은 이 알고리즘과 다르며 균등하지 않아요.',
    ],
  },
}

export const uniformLabel = {
  yes: '균등',
  no: '비균등',
  conditional: '조건부 균등',
} as const
