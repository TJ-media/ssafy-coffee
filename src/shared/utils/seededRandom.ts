// 시드 기반 결정론적 난수 생성기
// 같은 시드를 사용하면 항상 같은 결과를 반환
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // 0~1 사이의 난수 반환
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // 범위 내 정수 반환
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // 범위 내 실수 반환
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}
