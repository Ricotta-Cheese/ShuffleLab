# Shuffle Lab 구현 계획

2026-2학기 알고리즘 과제 주제 A(알고리즘 동작 시각화). 제출: 2026-11-14(토) 23:59:59, LMS에 PDF 1개.

## 범위

알고리즘 4종을 모두 구현한다.

| 알고리즘 | 시간 | 추가 공간 | 균등성 | 역할 |
|---|---|---|---|---|
| Fisher–Yates | O(n) | O(1) | 균등 | 기준 |
| Random Pick & Remove | O(n²) | O(n) | 균등 | 효율성 비교 |
| Riffle Shuffle (7회) | O(n) | O(n) | 근사 균등 | 같은 O(n)에서 균등성 비교 |
| Random-Key Sort | O(n log n) | O(n) | 키 중복이 없으면 균등 | 확장 비교 |

## 입력 방식

관계성(D)과 균등성(E) 화면은 입력 배열을 두 가지 방식으로 고를 수 있다.

- **랜덤 배열**: 크기를 지정하면 서로 다른 원소로 된 배열을 만든다.
- **사용자 지정 배열**: 직접 입력한다. 원소가 중복되면 지표 계산을 막고 이유를 알린다.

균등성 실험의 순열 집계는 원소 값이 아니라 위치 기준(0..n-1의 순열)으로 하므로, 어떤 입력이든 결과 분포는 같다.

## 구조

```
src/
  core/          UI와 무관한 순수 TS (테스트 대상)
    rng.ts       시드 고정 PRNG / Math.random / crypto, 편향 없는 randomInt
    algorithms/  알고리즘별 shuffle(빠른 버전) + trace(단계 기록 버전)
    stats/       Kendall τ·R, Spearman ρ, 순열 인덱싱, TVD·U, 정확 분포 열거
  workers/       반복 실험, 벤치마크 (UI 멈춤 방지)
  ui/
    screens/     A 설명 / B 알고리즘 / C 동작 시각화 / D 관계성 / E 균등성 / F 성능 / G 전체 비교
  content/       A 설명 화면 문구와 링크 (description.ts)
    components/  배열 뷰, 단계 컨트롤, 다이어그램 내보내기, 차트
```

## 설계 원칙

1. `shuffle`과 `trace`를 분리해 벤치마크에 기록 비용이 섞이지 않게 한다. 같은 시드에서 두 결과가 같은지 테스트로 확인한다.
2. 기본 난수는 시드 고정 PRNG(재현 가능). 비교용으로 `Math.random`, `crypto.getRandomValues`를 선택할 수 있다.
3. 모든 결과가 원본의 순열인지(중복·손실 없음) 검사한다.
4. 작은 n에서는 난수 경로를 전부 열거해 정확한 이론 분포를 구하고, 실험 분포와 겹쳐 보여준다.
5. 관계성 지수 R을 '무작위성 점수'로 표현하지 않는다. U는 반복 횟수, 배열 크기와 함께 표시한다.
6. PDF용 정적 단계 다이어그램(단계를 세로로 이어 붙인 한 장)을 PNG로 내보낸다.

## 진행 순서

1. 난수 모듈, 알고리즘 4종 + 단계 기록, 단위 테스트
2. 화면 B, C (A 설명 화면은 틀만 있고, 문구와 링크는 본인이 채움)
3. 통계 모듈 + 테스트, 화면 D
4. 화면 E (Worker)
5. 화면 F (Worker 벤치마크)
6. 반응형 점검, 다이어그램 내보내기, Vercel 배포
7. 캡처, 보고서 작성(본인), 수치 재검증

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · React Router · html-to-image · Vitest · Vercel

## 명령어

```
npm run dev        개발 서버
npm test           단위 테스트
npm run build      타입 검사 + 프로덕션 빌드
npm run lint       oxlint
```
