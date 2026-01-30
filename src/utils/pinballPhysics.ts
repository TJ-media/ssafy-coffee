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

// 회전 막대
export interface RotatingBar {
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
}

// 범퍼 (삼각형)
export interface Bumper {
  points: { x: number; y: number }[];
  bounce: number;
}

// 바람 영역
export interface WindArea {
  rect: { x: number; y: number; width: number; height: number };
  force: { x: number; y: number };
}

// 벽 (선분)
export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
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
  private rotatingBars: RotatingBar[];
  private bumpers: Bumper[];
  private windAreas: WindArea[];
  private walls: Wall[];
  private finishLine: number;
  private random: SeededRandom;
  private finishOrder: string[];
  private time: number;

  constructor(width: number, height: number, seed: number) {
    this.width = width;
    this.height = height;
    this.balls = [];
    this.pins = [];
    this.rotatingBars = [];
    this.bumpers = [];
    this.windAreas = [];
    this.walls = [];
    this.finishLine = height - 50;
    this.random = new SeededRandom(seed);
    this.finishOrder = [];
    this.time = 0;

    this.generateObstacles();
  }

  // 모든 장애물 생성
  private generateObstacles() {
    this.generatePins();
    this.generateRotatingBars();
    this.generateBumpers();
    this.generateWindAreas();
    this.generateWalls();
  }
  
  // 핀 배열 생성 (맵 확장 대응)
  private generatePins() {
    const pinRadius = 7;
    const startY = 100;
    const endY = this.finishLine - 150;
    const rows = 16;
    const rowHeight = (endY - startY) / rows;

    // 너비에 따라 핀 개수 동적 조정 (약 60px 간격)
    const basePins = Math.floor(this.width / 60);

    for (let row = 0; row < rows; row++) {
      const y = startY + row * rowHeight;
      const isEvenRow = row % 2 === 0;
      const pinsInRow = isEvenRow ? basePins : basePins - 1;
      const spacing = this.width / (pinsInRow + 1);

      for (let i = 0; i < pinsInRow; i++) {
        const x = isEvenRow
          ? spacing * (i + 1)
          : spacing * (i + 1) + spacing / 2;

        this.pins.push({ x, y, radius: pinRadius });
      }
    }
  }

  // 회전 막대 생성 (너비에 비례)
  private generateRotatingBars() {
    const barLength = this.width * 0.3; // 너비의 30%
    const smallBarLength = this.width * 0.2; // 너비의 20%

    this.rotatingBars.push({ x: this.width / 2, y: 300, length: barLength, angle: 0, speed: 0.02 });
    this.rotatingBars.push({ x: this.width / 4, y: 500, length: smallBarLength, angle: 0, speed: -0.03 });
    this.rotatingBars.push({ x: (this.width / 4) * 3, y: 500, length: smallBarLength, angle: 0, speed: 0.03 });
    this.rotatingBars.push({ x: this.width / 2, y: 700, length: barLength, angle: 0, speed: -0.025 });
  }
  
  // 범퍼 생성 (비활성화)
  private generateBumpers() {
    // 삼각형 범퍼 제거됨
  }
  
  // 바람 영역 생성
  private generateWindAreas() {
    // 왼쪽에서 오른쪽으로 부는 바람 (중간)
    this.windAreas.push({
        rect: { x: 0, y: this.height * 0.4, width: this.width, height: 50 },
        force: { x: 0.1, y: 0 }
    });
    // 오른쪽에서 왼쪽으로 부는 바람 (아래)
    this.windAreas.push({
        rect: { x: 0, y: this.height * 0.7, width: this.width, height: 50 },
        force: { x: -0.1, y: 0 }
    });
    // 위에서 아래로 부는 바람 (좁은 영역, 속도 증가)
    this.windAreas.push({
      rect: { x: this.width / 2 - 20, y: 150, width: 40, height: 100 },
      force: { x: 0, y: 0.2 }
    });
  }

  // 깔때기 벽 생성
  private generateWalls() {
    const funnelStartY = this.height * 0.75; // 깔때기 시작점
    const funnelEndY = this.finishLine - 20; // 깔때기 끝점
    const funnelTopWidth = this.width * 0.45; // 상단 열린 너비 (양쪽)
    const funnelBottomWidth = this.width * 0.15; // 하단 좁은 너비 (양쪽)

    // 왼쪽 깔때기 벽
    this.walls.push({
      x1: 0,
      y1: funnelStartY,
      x2: this.width / 2 - funnelBottomWidth,
      y2: funnelEndY
    });

    // 오른쪽 깔때기 벽
    this.walls.push({
      x1: this.width,
      y1: funnelStartY,
      x2: this.width / 2 + funnelBottomWidth,
      y2: funnelEndY
    });
  }


  // 참여자 추가
  addParticipants(participants: string[], getColor: (name: string) => string) {
    const spacing = this.width / (participants.length + 1);

    participants.forEach((name, index) => {
      const x = spacing * (index + 1);
      // 오프셋 없이 정확한 위치에 배치 (셔플 시 위치 변경이 명확하게 보임)
      const ball = new Ball(x, 30, name, getColor(name));
      ball.vx = 0;
      ball.vy = 0.5;
      this.balls.push(ball);
    });
  }

  // 물리 업데이트
  update(): boolean {
    this.time++;
    let allFinished = true;

    // 회전 막대 각도 업데이트
    for (const bar of this.rotatingBars) {
      bar.angle += bar.speed;
    }

    for (const ball of this.balls) {
      if (ball.finished) continue;
      allFinished = false;

      // 바람 영역 확인
      for (const area of this.windAreas) {
        if (ball.x > area.rect.x && ball.x < area.rect.x + area.rect.width &&
            ball.y > area.rect.y && ball.y < area.rect.y + area.rect.height) {
          ball.vx += area.force.x;
          ball.vy += area.force.y;
        }
      }
      
      ball.vy += GRAVITY;

      const maxSpeed = 8;
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed > maxSpeed) {
        ball.vx = (ball.vx / speed) * maxSpeed;
        ball.vy = (ball.vy / speed) * maxSpeed;
      }

      ball.x += ball.vx;
      ball.y += ball.vy;

      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

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
          const nx = dx / dist;
          const ny = dy / dist;
          ball.x = pin.x + nx * minDist;
          ball.y = pin.y + ny * minDist;
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * PIN_BOUNCE;
          ball.vy = (ball.vy - 2 * dot * ny) * PIN_BOUNCE;
          ball.vx += this.random.nextFloat(-0.5, 0.5);
        }
      }

      // 회전 막대 충돌
      for (const bar of this.rotatingBars) {
        const halfLength = bar.length / 2;
        const startX = bar.x - halfLength * Math.cos(bar.angle);
        const startY = bar.y - halfLength * Math.sin(bar.angle);
        const endX = bar.x + halfLength * Math.cos(bar.angle);
        const endY = bar.y + halfLength * Math.sin(bar.angle);
        
        // 선분-점 거리 계산
        const dx = endX - startX;
        const dy = endY - startY;
        const l2 = dx * dx + dy * dy;
        
        let t = ((ball.x - startX) * dx + (ball.y - startY) * dy) / l2;
        t = Math.max(0, Math.min(1, t));

        const closestX = startX + t * dx;
        const closestY = startY + t * dy;

        const dist_from_line = Math.sqrt(Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2));

        if (dist_from_line < ball.radius) {
          // 충돌 처리
          const nx = ball.x - closestX;
          const ny = ball.y - closestY;
          const norm = Math.sqrt(nx*nx + ny*ny);
          const ux = nx/norm;
          const uy = ny/norm;

          ball.x = closestX + ux * ball.radius;
          ball.y = closestY + uy * ball.radius;

          const dot = ball.vx * ux + ball.vy * uy;
          ball.vx -= 2 * dot * ux;
          ball.vy -= 2 * dot * uy;
          
          // 막대의 움직임에 의한 속도 전달 (단순화)
          ball.vx += bar.speed * (ball.y - bar.y) * 0.1;
          ball.vy -= bar.speed * (ball.x - bar.x) * 0.1;
        }
      }

      // 범퍼 충돌
      for (const bumper of this.bumpers) {
        for (let i = 0; i < bumper.points.length; i++) {
            const p1 = bumper.points[i];
            const p2 = bumper.points[(i + 1) % bumper.points.length];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const l2 = dx * dx + dy * dy;

            let t = ((ball.x - p1.x) * dx + (ball.y - p1.y) * dy) / l2;
            t = Math.max(0, Math.min(1, t));

            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;

            const dist_from_line = Math.sqrt(Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2));

            if (dist_from_line < ball.radius) {
                const nx = p2.y - p1.y;
                const ny = p1.x - p2.x;
                const norm = Math.sqrt(nx*nx + ny*ny);
                const ux = nx/norm;
                const uy = ny/norm;

                const dot = ball.vx * ux + ball.vy * uy;
                ball.vx = (ball.vx - 2 * dot * ux) * bumper.bounce;
                ball.vy = (ball.vy - 2 * dot * uy) * bumper.bounce;
            }
        }
      }

      // 벽 충돌 (깔때기)
      for (const wall of this.walls) {
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const l2 = dx * dx + dy * dy;

        let t = ((ball.x - wall.x1) * dx + (ball.y - wall.y1) * dy) / l2;
        t = Math.max(0, Math.min(1, t));

        const closestX = wall.x1 + t * dx;
        const closestY = wall.y1 + t * dy;

        const distFromWall = Math.sqrt(Math.pow(ball.x - closestX, 2) + Math.pow(ball.y - closestY, 2));

        if (distFromWall < ball.radius) {
          const nx = ball.x - closestX;
          const ny = ball.y - closestY;
          const norm = Math.sqrt(nx * nx + ny * ny);
          if (norm > 0) {
            const ux = nx / norm;
            const uy = ny / norm;

            ball.x = closestX + ux * ball.radius;
            ball.y = closestY + uy * ball.radius;

            const dot = ball.vx * ux + ball.vy * uy;
            ball.vx = (ball.vx - 2 * dot * ux) * BOUNCE;
            ball.vy = (ball.vy - 2 * dot * uy) * BOUNCE;
          }
        }
      }


      if (ball.y + ball.radius >= this.finishLine) {
        ball.y = this.finishLine - ball.radius;
        ball.finished = true;
        ball.finishTime = this.time;
        this.finishOrder.push(ball.name);
      }
    }

    return allFinished;
  }

  fastForward(): void {
    let maxIterations = 20000; // 반복 횟수 증가
    while (!this.isAllFinished() && maxIterations > 0) {
      this.update();
      maxIterations--;
    }
  }

  isAllFinished(): boolean {
    return this.balls.every((ball) => ball.finished);
  }

  getWinner(): string | null {
    if (this.finishOrder.length === 0) return null;
    return this.finishOrder[this.finishOrder.length - 1];
  }

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
  
  getRotatingBars(): RotatingBar[] {
    return this.rotatingBars;
  }

  getBumpers(): Bumper[] {
    return this.bumpers;
  }

  getWindAreas(): WindArea[] {
    return this.windAreas;
  }

  getWalls(): Wall[] {
    return this.walls;
  }

  getFinishLine(): number {
    return this.finishLine;
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}
