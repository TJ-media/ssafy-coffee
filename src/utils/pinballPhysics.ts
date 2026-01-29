import { SeededRandom } from './seededRandom';

// 공 클래스
export class Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  name: string;
  color: string;
  finished: boolean;
  finishTime: number;

  constructor(x: number, y: number, name: string, color: string) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.name = name;
    this.color = color;
    this.finished = false;
    this.finishTime = 0;
  }
}

// 핀 위치
export interface Pin {
  x: number;
  y: number;
  radius: number;
}

// 물리 엔진 설정
const GRAVITY = 0.15;
const FRICTION = 0.99;
const BOUNCE = 0.7;
const PIN_BOUNCE = 0.8;

export class PinballPhysics {
  private width: number;
  private height: number;
  private balls: Ball[];
  private pins: Pin[];
  private finishLine: number;
  private random: SeededRandom;
  private finishOrder: string[];
  private time: number;

  constructor(width: number, height: number, seed: number) {
    this.width = width;
    this.height = height;
    this.balls = [];
    this.pins = [];
    this.finishLine = height - 50;
    this.random = new SeededRandom(seed);
    this.finishOrder = [];
    this.time = 0;

    this.generatePins();
  }

  // 핀 배열 생성
  private generatePins() {
    const pinRadius = 8;
    const startY = 100;
    const endY = this.finishLine - 60;
    const rows = 7;
    const rowHeight = (endY - startY) / rows;

    for (let row = 0; row < rows; row++) {
      const y = startY + row * rowHeight;
      const isEvenRow = row % 2 === 0;
      const pinsInRow = isEvenRow ? 5 : 4;
      const spacing = this.width / (pinsInRow + 1);

      for (let i = 0; i < pinsInRow; i++) {
        const x = isEvenRow
          ? spacing * (i + 1)
          : spacing * (i + 1) + spacing / 2;

        this.pins.push({ x, y, radius: pinRadius });
      }
    }
  }

  // 참여자 추가
  addParticipants(participants: string[], getColor: (name: string) => string) {
    const spacing = this.width / (participants.length + 1);

    participants.forEach((name, index) => {
      const x = spacing * (index + 1);
      // 시드 기반 랜덤으로 시작 위치에 약간의 변화
      const offsetX = this.random.nextFloat(-10, 10);
      const ball = new Ball(x + offsetX, 30, name, getColor(name));
      // 초기 속도에도 약간의 랜덤
      ball.vx = this.random.nextFloat(-1, 1);
      ball.vy = this.random.nextFloat(0.5, 1.5);
      this.balls.push(ball);
    });
  }

  // 물리 업데이트
  update(): boolean {
    this.time++;
    let allFinished = true;

    for (const ball of this.balls) {
      if (ball.finished) continue;
      allFinished = false;

      // 중력 적용
      ball.vy += GRAVITY;

      // 속도 제한
      const maxSpeed = 8;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
      }

      // 위치 업데이트
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 마찰 적용
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      // 벽 충돌
      if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * BOUNCE;
      }
      if (ball.x + ball.radius > this.width) {
        ball.x = this.width - ball.radius;
        ball.vx = -ball.vx * BOUNCE;
      }

      // 핀 충돌
      for (const pin of this.pins) {
        const dx = ball.x - pin.x;
        const dy = ball.y - pin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + pin.radius;

        if (dist < minDist) {
          // 충돌 방향 정규화
          const nx = dx / dist;
          const ny = dy / dist;

          // 위치 보정
          ball.x = pin.x + nx * minDist;
          ball.y = pin.y + ny * minDist;

          // 반사
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * PIN_BOUNCE;
          ball.vy = (ball.vy - 2 * dot * ny) * PIN_BOUNCE;

          // 시드 기반 랜덤 튕김 추가
          ball.vx += this.random.nextFloat(-0.5, 0.5);
        }
      }

      // 결승선 도달
      if (ball.y + ball.radius >= this.finishLine) {
        ball.y = this.finishLine - ball.radius;
        ball.finished = true;
        ball.finishTime = this.time;
        this.finishOrder.push(ball.name);
      }
    }

    return allFinished;
  }

  // 빠른 시뮬레이션 (새로고침 시 결과까지 빠르게 진행)
  fastForward(): void {
    let maxIterations = 10000;
    while (!this.isAllFinished() && maxIterations > 0) {
      this.update();
      maxIterations--;
    }
  }

  // 모든 공이 도착했는지 확인
  isAllFinished(): boolean {
    return this.balls.every((ball) => ball.finished);
  }

  // 당첨자 (마지막 도착자) 반환
  getWinner(): string | null {
    if (this.finishOrder.length === 0) return null;
    return this.finishOrder[this.finishOrder.length - 1];
  }

  // 도착 순서 반환
  getFinishOrder(): string[] {
    return [...this.finishOrder];
  }

  // 렌더링용 데이터 반환
  getBalls(): Ball[] {
    return this.balls;
  }

  getPins(): Pin[] {
    return this.pins;
  }

  getFinishLine(): number {
    return this.finishLine;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
