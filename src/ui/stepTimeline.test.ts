import { describe, expect, it } from 'vitest'
import { getAlgorithm, type AlgorithmId } from '../core/algorithms'
import { seededRng } from '../core/rng'
import { buildTimeline, rowOfStep } from './stepTimeline'

const rowsOf = (id: AlgorithmId, n = 6, seed = 1) =>
  buildTimeline(getAlgorithm(id).trace(Array.from({ length: n }, (_, k) => k + 1), seededRng(seed)))
const values = (cells: { value: number }[]) => cells.map((c) => c.value)

// 보고서 그림 1·2(입력 [1..6], 시드 1)와 같은 행이 나오는지 확인한다
describe('buildTimeline', () => {
  it('Fisher–Yates: 선택과 교환을 한 행으로 합쳐 시작 + 5단계 + 완료', () => {
    const rows = rowsOf('fisher-yates')
    expect(rows.map((r) => r.label)).toEqual(['시작', '단계 1', '단계 2', '단계 3', '단계 4', '단계 5', '완료'])
    const [line] = rows[1].lines
    expect(values(line.cells)).toEqual([1, 2, 6, 4, 5, 3])
    expect(line.cells[2]).toMatchObject({ role: 'j', tag: 'j' })
    expect(line.cells[5]).toMatchObject({ role: 'i', tag: 'i' })
    expect(rows[1].what).toContain('→')
    expect(values(rows[6].lines[0].cells)).toEqual([5, 6, 1, 2, 4, 3])
  })

  it('Pick & Remove: 뽑기 전 배열과 이번에 붙인 결과를 한 행에, 당긴 횟수를 함께', () => {
    const rows = rowsOf('pick-remove')
    expect(rows).toHaveLength(8)
    expect(rows[0].lines[1].cells).toEqual([])
    const [before, out] = rows[1].lines
    expect(values(before.cells)).toEqual([1, 2, 3, 4, 5, 6])
    expect(before.cells[2]).toMatchObject({ role: 'j', tag: 'k' })
    expect(out.cells).toEqual([{ value: 3, role: 'new' }])
    expect(rows.slice(1, 7).map((r) => r.sub)).toEqual(['당김 3번', '당김 1번', '당김 2번', '당김 2번', '당김 1번', '당김 0번'])
    expect(rows[7].lines).toHaveLength(1)
    expect(values(rows[7].lines[0].cells)).toEqual([3, 5, 2, 1, 4, 6])
  })

  it('Riffle: 나누기와 합치기를 한 행으로 합쳐 리플 7번', () => {
    const rows = rowsOf('riffle')
    expect(rows).toHaveLength(9)
    expect(rows[1].lines.map((l) => l.label)).toEqual(['나눈 뒤', '합친 뒤'])
  })

  it('Random-Key Sort: 키 부여 n번 + 정렬', () => {
    const rows = rowsOf('random-key')
    expect(rows).toHaveLength(6 + 3)
    expect(rows[1].lines[0].cells[0]).toMatchObject({ role: 'i' })
    expect(rows[1].lines[0].cells[0].key).toBeTypeOf('number')
  })

  it('단계 번호로 그 단계가 들어 있는 행을 찾는다', () => {
    const rows = rowsOf('fisher-yates')
    // 단계 0 = 시작, 1(선택)·2(교환) = 단계 1, 마지막 = 완료
    expect([0, 1, 2, 3, 11].map((s) => rowOfStep(rows, s))).toEqual([0, 1, 1, 2, 6])
  })
})
