// B 화면에서 쓰는 난수 설명 창. 실제 구현(core/rng.ts)과 같은 내용을 해요체로 옮긴다.
import type { AlgorithmContent } from '../../content/algorithms'
import Formula from './Formula'
import TermPopover from './TermPopover'

const formulaBox = 'block rounded-md bg-surface-2 px-3 py-2 text-ink'
const note = 'block text-xs text-ink-3'

/** 기본 난수 생성기: 시드 고정 SFC32 */
export function SfcTerm() {
  return (
    <TermPopover term="시드 고정 SFC32" title="SFC32 (Small Fast Counting)">
      <span className="block">
        32비트 수 네 개(a, b, c, d)를 상태로 들고, 부를 때마다 더하기·비트 이동·회전만으로 다음 32비트 정수를 만드는
        의사난수 생성기예요. d는 부를 때마다 1씩 늘어나는 카운터예요.
      </span>
      <span className={formulaBox}>
        <Formula display tex={String.raw`\begin{aligned} d &\leftarrow d + 1 \\ t &= a + b + d \\ a &\leftarrow b \oplus (b \gg 9) \\ b &\leftarrow c + (c \ll 3) \\ c &\leftarrow \mathrm{rotl}(c, 21) + t \end{aligned}`} />
      </span>
      <span className="block">
        출력은 t예요. 시드 하나를 SplitMix32로 넓혀 네 상태를 채우고, 처음 12개 출력은 버려요. 카운터 덕분에 주기는
        최소 2³²이고, 평균은 약 2¹²⁷이에요. 같은 시드는 항상 같은 수열을 만들어서 결과를 다시 볼 수 있어요.
      </span>
      <span className={note}>
        균등성(E)·효율성(F) 화면에서는 Math.random과 crypto.getRandomValues로 바꿔 비교할 수 있어요. 어느 쪽이든
        알고리즘은 아래 int(k)·float()로만 난수를 받아요.
      </span>
    </TermPopover>
  )
}

/** 선택한 알고리즘이 부르는 난수 함수 */
export function RngCallTerm({ call }: { call: AlgorithmContent['rngCall'] }) {
  const term = <span className="font-mono text-[0.95em]">{call.code}</span>
  if (call.method === 'int') {
    return (
      <TermPopover term={term} title="rng.int(k) (균등 정수)">
        <span className="block">
          0 이상 k 미만의 정수를 정확히 1/k 확률로 돌려줘요. 32비트 정수 u를 그냥 k로 나눈 나머지를 쓰면, 2³²이 k로
          나누어떨어지지 않을 때 작은 값이 조금 더 자주 나와요(모듈로 편향). 그래서 k의 배수 경계를 넘는 u는 버리고
          다시 뽑아요.
        </span>
        <span className={formulaBox}>
          <Formula display tex={String.raw`\begin{aligned} \mathrm{limit} &= 2^{32} - (2^{32} \bmod k) \\ r &= u \bmod k \quad (u < \mathrm{limit}) \end{aligned}`} />
        </span>
        <span className="block">
          다시 뽑을 확률은 k/2³²보다 작아서 평균 1번을 조금 넘게 뽑아요. k가 2의 거듭제곱(예: 동전 k = 2)이면 한 번도
          버리지 않아요.
        </span>
        <span className={note}>k는 1 이상 2³² 이하의 정수만 받아요. 그 밖의 값이면 바로 오류를 내요.</span>
      </TermPopover>
    )
  }
  return (
    <TermPopover term={term} title="rng.float() (53비트 실수)">
      <span className="block">
        [0, 1) 범위의 실수를 돌려줘요. 32비트 정수 두 개에서 위쪽 27비트(a)와 26비트(b)를 떼어 붙여, JavaScript 실수가
        정확히 담을 수 있는 53비트를 꽉 채워요.
      </span>
      <span className={formulaBox}>
        <Formula display tex={String.raw`\begin{gathered} x = \frac{a \cdot 2^{26} + b}{2^{53}} \\ 0 \le a < 2^{27},\quad 0 \le b < 2^{26} \end{gathered}`} />
      </span>
      <span className="block">
        x는 2⁵³개의 값 중 하나가 같은 확률로 나와요. 키 n개 중 둘이 겹칠 확률은 약 n²/2⁵⁴라서, n = 10⁶이어도 약 2만
        분의 1이에요.
      </span>
      <span className={note}>한 번 부를 때 32비트 정수를 두 개 써요. 그래서 int(k)보다 난수를 두 배 소비해요.</span>
    </TermPopover>
  )
}
