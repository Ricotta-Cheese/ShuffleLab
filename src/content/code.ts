import type { AlgorithmId } from '../core/algorithms'

/**
 * 알고리즘별 구현 예시. src/core/algorithms의 shuffle 함수와 같은 순서로 같은 일을 한다.
 * 난수 생성기만 각 언어 표준 라이브러리 것을 쓰므로, 같은 시드라도 결과 순서는 이 사이트와 다를 수 있다.
 */
export type CodeLang = 'cpp' | 'python' | 'java'

export const codeLangs: { id: CodeLang; label: string }[] = [
  { id: 'cpp', label: 'C++' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
]

export const algorithmCode: Record<AlgorithmId, Record<CodeLang, string>> = {
  'fisher-yates': {
    cpp: `#include <random>
#include <utility>
#include <vector>

// 뒤에서부터 0~i 범위에서 하나를 골라 i번 칸에 확정한다
template <typename T>
void fisherYates(std::vector<T>& a, std::mt19937& rng) {
    for (int i = static_cast<int>(a.size()) - 1; i > 0; --i) {
        std::uniform_int_distribution<int> pick(0, i);  // 0 ≤ j ≤ i
        int j = pick(rng);
        std::swap(a[i], a[j]);
    }
}`,
    python: `import random


def fisher_yates(a: list, rng: random.Random) -> list:
    """뒤에서부터 0~i 범위에서 하나를 골라 i번 칸에 확정한다"""
    for i in range(len(a) - 1, 0, -1):
        j = rng.randint(0, i)  # 0 ≤ j ≤ i
        a[i], a[j] = a[j], a[i]
    return a`,
    java: `import java.util.Collections;
import java.util.List;
import java.util.Random;

public final class FisherYates {
    // 뒤에서부터 0~i 범위에서 하나를 골라 i번 칸에 확정한다
    public static <T> void shuffle(List<T> a, Random rng) {
        for (int i = a.size() - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1); // 0 ≤ j ≤ i
            Collections.swap(a, i, j);
        }
    }
}`,
  },

  'pick-remove': {
    cpp: `#include <random>
#include <vector>

// 남은 원소 중 하나를 뽑아 결과 끝에 붙이고, 남은 배열에서 지운다
template <typename T>
std::vector<T> pickRemove(const std::vector<T>& a, std::mt19937& rng) {
    std::vector<T> remaining = a;
    std::vector<T> result;
    result.reserve(a.size());
    while (!remaining.empty()) {
        std::uniform_int_distribution<std::size_t> pick(0, remaining.size() - 1);
        std::size_t k = pick(rng);
        result.push_back(remaining[k]);
        remaining.erase(remaining.begin() + k);  // 뒤쪽 원소를 한 칸씩 당겨서 O(n)
    }
    return result;
}`,
    python: `import random


def pick_remove(a: list, rng: random.Random) -> list:
    """남은 원소 중 하나를 뽑아 결과 끝에 붙이고, 남은 배열에서 지운다"""
    remaining = list(a)
    result = []
    while remaining:
        k = rng.randrange(len(remaining))  # 0 ≤ k < len(remaining)
        result.append(remaining.pop(k))  # pop(k)은 뒤쪽 원소를 당겨서 O(n)
    return result`,
    java: `import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public final class PickRemove {
    // 남은 원소 중 하나를 뽑아 결과 끝에 붙이고, 남은 배열에서 지운다
    public static <T> List<T> shuffle(List<T> a, Random rng) {
        List<T> remaining = new ArrayList<>(a);
        List<T> result = new ArrayList<>(a.size());
        while (!remaining.isEmpty()) {
            int k = rng.nextInt(remaining.size()); // 0 ≤ k < size
            result.add(remaining.remove(k)); // 뒤쪽 원소를 당겨서 O(n)
        }
        return result;
    }
}`,
  },

  riffle: {
    cpp: `#include <random>
#include <vector>

// Gilbert–Shannon–Reeds 리플 셔플을 7번 반복한다
template <typename T>
void riffle(std::vector<T>& a, std::mt19937& rng, int rounds = 7) {
    int n = static_cast<int>(a.size());
    std::uniform_int_distribution<int> coin(0, 1);
    std::vector<int> b(n);
    for (int k = 0; k < rounds; ++k) {
        int c = 0;  // 0의 개수 = 위 더미 장수
        for (int p = 0; p < n; ++p) {
            b[p] = coin(rng);
            if (b[p] == 0) ++c;
        }
        std::vector<T> tmp(a);  // 위 더미 tmp[0..c−1], 아래 더미 tmp[c..n−1]
        int l = 0, r = c;
        for (int p = 0; p < n; ++p) a[p] = (b[p] == 0) ? tmp[l++] : tmp[r++];
    }
}`,
    python: `import random


def riffle(a: list, rng: random.Random, rounds: int = 7) -> list:
    """Gilbert–Shannon–Reeds 리플 셔플을 7번 반복한다"""
    n = len(a)
    for _ in range(rounds):
        b = [rng.randrange(2) for _ in range(n)]
        c = b.count(0)  # 0의 개수 = 위 더미 장수
        top, bottom = iter(a[:c]), iter(a[c:])
        a[:] = [next(top) if bit == 0 else next(bottom) for bit in b]
    return a`,
    java: `import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public final class Riffle {
    // Gilbert–Shannon–Reeds 리플 셔플을 7번 반복한다
    public static <T> void shuffle(List<T> a, Random rng) {
        int n = a.size();
        int[] b = new int[n];
        for (int k = 0; k < 7; k++) {
            int c = 0; // 0의 개수 = 위 더미 장수
            for (int p = 0; p < n; p++) {
                b[p] = rng.nextInt(2);
                if (b[p] == 0) c++;
            }
            List<T> tmp = new ArrayList<>(a); // 위 더미 tmp[0..c−1], 아래 더미 tmp[c..n−1]
            int l = 0, r = c;
            for (int p = 0; p < n; p++) a.set(p, b[p] == 0 ? tmp.get(l++) : tmp.get(r++));
        }
    }
}`,
  },

  'random-key': {
    cpp: `#include <algorithm>
#include <random>
#include <utility>
#include <vector>

// 원소마다 [0, 1) 무작위 키를 붙이고 키 순서로 안정 정렬한다
template <typename T>
std::vector<T> randomKey(const std::vector<T>& a, std::mt19937& rng) {
    std::uniform_real_distribution<double> key(0.0, 1.0);
    std::vector<std::pair<double, T>> keyed;
    keyed.reserve(a.size());
    for (const T& x : a) keyed.emplace_back(key(rng), x);
    std::stable_sort(keyed.begin(), keyed.end(),
                     [](const auto& p, const auto& q) { return p.first < q.first; });
    std::vector<T> result;
    result.reserve(a.size());
    for (const auto& p : keyed) result.push_back(p.second);
    return result;
}`,
    python: `import random


def random_key(a: list, rng: random.Random) -> list:
    """원소마다 [0, 1) 무작위 키를 붙이고 키 순서로 안정 정렬한다"""
    keyed = [(rng.random(), x) for x in a]
    keyed.sort(key=lambda p: p[0])  # 키만 비교하는 안정 정렬, O(n log n)
    return [x for _, x in keyed]`,
    java: `import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

public final class RandomKey {
    // 원소마다 [0, 1) 무작위 키를 붙이고 키 순서로 안정 정렬한다
    public static <T> List<T> shuffle(List<T> a, Random rng) {
        List<Map.Entry<Double, T>> keyed = new ArrayList<>(a.size());
        for (T x : a) keyed.add(Map.entry(rng.nextDouble(), x));
        keyed.sort(Map.Entry.comparingByKey()); // List.sort는 안정 정렬, O(n log n)
        List<T> result = new ArrayList<>(a.size());
        for (Map.Entry<Double, T> e : keyed) result.add(e.getValue());
        return result;
    }
}`,
  },
}
