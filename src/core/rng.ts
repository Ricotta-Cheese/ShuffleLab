// 난수 생성기. 모든 알고리즘은 이 인터페이스로만 난수를 얻는다.
// 알고리즘이 난수를 어떻게 쓰는지와 난수가 어디서 오는지를 분리해 두면
// 같은 시드로 결과를 재현하거나, 모든 경로를 열거해 정확한 분포를 구할 수 있다.

export interface Rng {
  /** 0 이상 k 미만의 정수를 균등하게 반환한다. */
  int(k: number): number
  /** [0, 1) 범위의 실수를 반환한다 (53비트 정밀도). */
  float(): number
}

export type RngKind = 'seeded' | 'math' | 'crypto'

const TWO_32 = 0x1_0000_0000

/**
 * 32비트 부호 없는 정수 생성기로부터 Rng를 만든다.
 * int(k)는 거부 샘플링으로 모듈로 편향을 없앤다:
 * 2^32가 k로 나누어떨어지지 않으면 u % k에서 작은 값이 조금 더 자주 나오므로,
 * k의 배수 경계(limit) 이상인 u는 버리고 다시 뽑는다.
 */
export function fromUint32(next: () => number): Rng {
  return {
    int(k) {
      if (!Number.isInteger(k) || k < 1 || k > TWO_32) {
        throw new RangeError(`int(k): k는 1 이상 2^32 이하의 정수여야 한다 (k=${k})`)
      }
      const limit = TWO_32 - (TWO_32 % k)
      let u = next()
      while (u >= limit) u = next()
      return u % k
    },
    float() {
      // 상위 27비트 + 상위 26비트 = 53비트
      const a = next() >>> 5
      const b = next() >>> 6
      return (a * 67108864 + b) / 9007199254740992
    },
  }
}

function splitmix32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x9e3779b9) | 0
    let t = a ^ (a >>> 16)
    t = Math.imul(t, 0x21f0aaad)
    t = t ^ (t >>> 15)
    t = Math.imul(t, 0x735a2d97)
    return (t ^ (t >>> 15)) >>> 0
  }
}

function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    d = (d + 1) | 0
    const t = (((a + b) | 0) + d) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return t >>> 0
  }
}

/** 시드 고정 의사난수 (SFC32, 시드는 SplitMix32로 확장). 같은 시드는 항상 같은 수열을 만든다. */
export function seededRng(seed: number): Rng {
  const sm = splitmix32(seed)
  const next = sfc32(sm(), sm(), sm(), sm())
  for (let i = 0; i < 12; i++) next()
  return fromUint32(next)
}

/** 브라우저/런타임 기본 의사난수 Math.random. 시드를 지정할 수 없다. */
export function mathRandomRng(): Rng {
  return fromUint32(() => Math.floor(Math.random() * TWO_32))
}

/** 암호학적으로 안전한 난수 crypto.getRandomValues. 셔플 품질 비교용이며 속도는 더 느리다. */
export function cryptoRng(): Rng {
  const buf = new Uint32Array(256)
  let pos = buf.length
  return fromUint32(() => {
    if (pos === buf.length) {
      crypto.getRandomValues(buf)
      pos = 0
    }
    return buf[pos++]
  })
}

export function createRng(kind: RngKind, seed = 1): Rng {
  switch (kind) {
    case 'seeded':
      return seededRng(seed)
    case 'math':
      return mathRandomRng()
    case 'crypto':
      return cryptoRng()
  }
}
