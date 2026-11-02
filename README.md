# Shuffle Lab

배열 셔플 알고리즘의 **효율성**, **관계성**, **균등성**을 비교하고 내부 동작을 시각화하는 교육용 웹앱입니다.
2026학년도 2학기 알고리즘 과제(주제 A: 알고리즘 동작 시각화)로 만들고 있습니다.

> 정렬 알고리즘은 다양하게 배우지만, 배열을 무작위로 섞는 알고리즘은 왜 잘 배우지 않을까?
> 섞는 알고리즘에도 종류가 있다면, 효율성과 무작위성에는 어떤 차이가 있을까?

- 저장소: https://github.com/Ricotta-Cheese/ShuffleLab
- 배포 주소: 준비 중 (Vercel)

## 비교하는 알고리즘

| 알고리즘 | 시간 | 추가 공간 | 균등한 셔플 | 비교 목적 |
|---|---|---|---|---|
| Fisher–Yates | O(n) | O(1) | 예 | 기준 알고리즘 |
| Random Pick & Remove | O(n²) | O(n) | 예 | 균등한 셔플끼리의 효율성 비교 |
| Naive Random Swap | O(n) | O(1) | 아니요 (n ≥ 3) | 같은 O(n)인데 균등성이 다른 반례 |
| Random-Key Sort | O(n log n) | O(n) | 키가 모두 다를 때만 | 정렬을 이용한 셔플 |

- **Fisher–Yates**: 맨 뒤 칸부터 `0..i` 범위에서 하나를 골라 i번 칸과 바꾸고, 그 칸을 확정합니다.
- **Random Pick & Remove**: 남은 원소 중 하나를 골라 결과 배열에 붙이고 원래 배열에서 지웁니다. 지울 때마다 뒤쪽 원소를 당겨야 해서 O(n²)입니다.
- **Naive Random Swap**: 모든 i에 대해 배열 **전체**에서 j를 골라 바꿉니다. 경로 수 nⁿ이 n!로 나누어떨어지지 않아(n ≥ 3) 일부 순열이 더 자주 나옵니다. **의도적으로 넣은 잘못된 구현입니다.**
- **Random-Key Sort**: 원소마다 [0, 1) 난수 키를 붙이고 키 순으로 정렬합니다. 실제 실수는 정밀도가 유한해서 키가 같을 수 있고, 이때 안정 정렬이 원래 순서를 유지하면 편향이 생깁니다.

## 분석 지표

| 관점 | 지표 | 설명 |
|---|---|---|
| 효율성 | 실행 시간, 연산 횟수 | 입력 크기별 실행 시간(반복 측정)과 교환·읽기·쓰기·이동 횟수 |
| 관계성 | Kendall's τ, R = \|τ\| | 원본과 결과 사이에서 원소 쌍의 앞뒤 순서가 얼마나 유지되는지 |
| 균등성 | TVD, U = 1 − TVD | 반복 실험으로 얻은 순열 분포가 균등분포(1/n!)와 얼마나 다른지 |

- R은 원본 순서와의 관계를 나타낼 뿐, **무작위성 점수가 아닙니다.** 올바른 셔플도 한 번 실행하면 R이 높게 나올 수 있습니다.
- U는 이 프로젝트에서 정의한 표시용 지수입니다. 실험 횟수가 유한하면 올바른 알고리즘도 정확히 1이 되지 않으므로, 배열 크기·반복 횟수와 함께 해석합니다.
- 균등성 실험은 통계적 균등성을 관찰하는 것이지, 난수 생성기의 암호학적 안전성을 검증하는 것이 아닙니다.

## 화면 구성

| 화면 | 내용 | 상태 |
|---|---|---|
| A. 설명 | 주제 선정 이유, 분석 관점, 링크 | 틀 완성 |
| B. 알고리즘 | 원리, 의사코드, 복잡도, 균등성 | 예정 |
| C. 동작 시각화 | 최대 10개 원소의 단계별 동작과 설명 | 예정 |
| D. 관계성 | Kendall's τ, R, 원소 위치 이동 | 예정 |
| E. 균등성 | 반복 실험, 순열 빈도, TVD, U | 예정 |
| F. 성능 | 입력 크기별 실행 시간 | 예정 |

D·E 화면에서는 **랜덤 배열**과 **직접 입력한 배열** 중에서 고를 수 있게 할 예정입니다.

## 구현 원칙

- **난수 분리**: 알고리즘은 `Rng` 인터페이스로만 난수를 얻습니다. 시드 고정 의사난수(SFC32), `Math.random`, `crypto.getRandomValues` 중에서 고를 수 있습니다. 정수 난수는 거부 샘플링으로 모듈로 편향을 없앴습니다.
- **두 가지 버전**: 알고리즘마다 빠른 버전 `shuffle`과 기록 버전 `trace`를 따로 둡니다.
  - `shuffle`은 성능 측정과 반복 실험에 씁니다.
  - `trace`는 단계별 배열 상태, 선택 위치, 누적 연산 횟수, "무엇을 / 왜" 설명을 남깁니다.
  - 같은 시드에서 두 결과가 같은지 테스트로 확인합니다.
- **정확한 이론 분포**: `exactDistribution`은 작은 n에서 난수 선택 경로를 모두 따라가 순열별 정확한 확률을 구합니다. 실험 결과와 비교할 이론값으로 씁니다.

## 시작하기

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm test           # 단위 테스트
npm run build      # 타입 검사 + 프로덕션 빌드
npm run lint       # oxlint
```

## 폴더 구조

```
src/
  core/                    UI와 무관한 순수 TypeScript (테스트 대상)
    rng.ts                 난수 생성기
    algorithms/            알고리즘 4종 (shuffle + trace), 단계 기록 타입
    stats/                 통계 지표, 정확 분포 열거
  workers/                 반복 실험·벤치마크용 Web Worker (예정)
  content/                 설명 화면 문구와 링크
  ui/
    screens/               화면 A~F
    components/            공통 UI 컴포넌트
```

## 검증

`npm test`로 다음을 확인합니다.

- 모든 알고리즘의 결과가 원본의 순열인지 확인합니다(중복·손실 없음, n = 0~12).
- 같은 시드에서 `shuffle`과 `trace`의 결과가 같은지 확인합니다.
- Fisher–Yates의 j가 항상 `0 ≤ j ≤ i` 범위인지 확인합니다.
- Fisher–Yates와 Pick & Remove는 n = 1~5에서 모든 순열의 정확한 확률이 1/n!인지 확인합니다.
- Naive Swap
  - n = 3에서 27개 경로가 순열마다 4개 또는 5개로 나뉘는지 확인합니다.
  - n = 2에서는 균등한지 확인합니다.
  - n = 3~5에서는 균등하지 않은지 확인합니다.
- Random-Key Sort
  - 키 순서대로 정렬되는지 확인합니다.
  - 같은 키가 있으면 원래 순서를 유지하고, 그 사실을 단계 설명에 표시하는지 확인합니다.
- 정수 난수의 거부 샘플링, 시드 재현성, 난수 범위를 확인합니다.

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · React Router · Vitest · Vercel

## 참고문헌

- Knuth, D. E. *The Art of Computer Programming, Vol. 2: Seminumerical Algorithms* (3rd ed.), §3.4.2. Addison-Wesley, 1997.
- Fisher, R. A., & Yates, F. *Statistical Tables for Biological, Agricultural and Medical Research*. Oliver & Boyd, 1938.
- Durstenfeld, R. Algorithm 235: Random permutation. *Communications of the ACM*, 7(7), 420, 1964.
- Kendall, M. G. A new measure of rank correlation. *Biometrika*, 30(1/2), 81–93, 1938.
