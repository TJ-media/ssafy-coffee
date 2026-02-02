// 간단한 핀볼 물리 엔진
export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  name: string;
  color: string;
  finished: boolean;
}

export interface Pin {
  x: number;
  y: number;
  radius: number;
}

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface RotatingBar {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  angularVelocity: number;
}

export interface Stage {
  width: number;
  height: number;
  goalY: number;
  startY: number;
  pins: Pin[];
  walls: Wall[];
  bars: RotatingBar[];
}

export class SimplePhysics {
  private balls: Ball[] = [];
  private stage: Stage | null = null;
  private finishOrder: string[] = [];
  private gravity = 0.15;
  private friction = 0.995;
  private isRunning = false;

  createStage(participantCount: number): Stage {
    const width = Math.max(300, participantCount * 40);
    const height = 600;
    const goalY = height - 50;
    const startY = 30;

    const pins: Pin[] = [];
    const walls: Wall[] = [];
    const bars: RotatingBar[] = [];

    // 좌우 벽
    walls.push({ x1: 10, y1: 0, x2: 10, y2: goalY + 50 });
    walls.push({ x1: width - 10, y1: 0, x2: width - 10, y2: goalY + 50 });

    // 핀 생성 (패칭코 스타일)
    const pinStartY = 80;
    const pinEndY = height - 150;
    const rows = 14;
    const rowHeight = (pinEndY - pinStartY) / rows;

    for (let row = 0; row < rows; row++) {
      const y = pinStartY + row * rowHeight;
      const isEvenRow = row % 2 === 0;
      const pinsInRow = Math.floor((width - 40) / 35);
      const offsetX = isEvenRow ? 0 : 17.5;

      for (let i = 0; i < pinsInRow; i++) {
        const x = 30 + i * 35 + offsetX;
        if (x > 20 && x < width - 20) {
          pins.push({ x, y, radius: 5 });
        }
      }
    }

    // 회전 막대
    bars.push({
      x: width / 2,
      y: 120,
      width: width * 0.15,
      height: 4,
      angle: 0,
      angularVelocity: 0.03,
    });

    bars.push({
      x: width / 3,
      y: 250,
      width: width * 0.12,
      height: 4,
      angle: Math.PI / 4,
      angularVelocity: -0.04,
    });

    bars.push({
      x: (width / 3) * 2,
      y: 250,
      width: width * 0.12,
      height: 4,
      angle: -Math.PI / 4,
      angularVelocity: 0.04,
    });

    bars.push({
      x: width / 2,
      y: 380,
      width: width * 0.18,
      height: 4,
      angle: Math.PI / 2,
      angularVelocity: -0.025,
    });

    // 깔때기 벽
    const funnelStartY = height - 120;
    const funnelEndY = goalY - 10;
    walls.push({ x1: 10, y1: funnelStartY, x2: width / 2 - 30, y2: funnelEndY });
    walls.push({ x1: width - 10, y1: funnelStartY, x2: width / 2 + 30, y2: funnelEndY });

    this.stage = { width, height, goalY, startY, pins, walls, bars };
    return this.stage;
  }

  createBalls(participants: { name: string; color: string }[]): void {
    if (!this.stage) return;

    this.balls = [];
    this.finishOrder = [];

    const spacing = (this.stage.width - 40) / (participants.length + 1);

    participants.forEach((p, index) => {
      this.balls.push({
        id: index,
        x: 20 + spacing * (index + 1),
        y: this.stage!.startY,
        vx: 0,
        vy: 0,
        radius: 8,
        name: p.name,
        color: p.color,
        finished: false,
      });
    });
  }

  start(): void {
    this.isRunning = true;
  }

  step(): void {
    if (!this.isRunning || !this.stage) return;

    // 막대 회전
    this.stage.bars.forEach((bar) => {
      bar.angle += bar.angularVelocity;
    });

    // 각 공 업데이트
    this.balls.forEach((ball) => {
      if (ball.finished) return;

      // 중력
      ball.vy += this.gravity;

      // 마찰
      ball.vx *= this.friction;
      ball.vy *= this.friction;

      // 위치 업데이트
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 벽 충돌
      this.stage!.walls.forEach((wall) => {
        this.collideWithWall(ball, wall);
      });

      // 핀 충돌
      this.stage!.pins.forEach((pin) => {
        this.collideWithCircle(ball, pin.x, pin.y, pin.radius);
      });

      // 회전 막대 충돌
      this.stage!.bars.forEach((bar) => {
        this.collideWithBar(ball, bar);
      });

      // 좌우 경계
      if (ball.x - ball.radius < 10) {
        ball.x = 10 + ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.6;
      }
      if (ball.x + ball.radius > this.stage!.width - 10) {
        ball.x = this.stage!.width - 10 - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.6;
      }

      // 골인 체크
      if (ball.y >= this.stage!.goalY && !ball.finished) {
        ball.finished = true;
        this.finishOrder.push(ball.name);
      }
    });
  }

  private collideWithCircle(ball: Ball, cx: number, cy: number, cr: number): void {
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + cr;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      // 분리
      const overlap = minDist - dist;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      // 반사
      const dot = ball.vx * nx + ball.vy * ny;
      const restitution = 0.7;
      ball.vx -= (1 + restitution) * dot * nx;
      ball.vy -= (1 + restitution) * dot * ny;

      // 약간의 랜덤성
      ball.vx += (Math.random() - 0.5) * 0.5;
    }
  }

  private collideWithWall(ball: Ball, wall: Wall): void {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = -dy / len;
    const ny = dx / len;

    const t = ((ball.x - wall.x1) * dx + (ball.y - wall.y1) * dy) / (len * len);
    if (t < 0 || t > 1) return;

    const closestX = wall.x1 + t * dx;
    const closestY = wall.y1 + t * dy;

    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);

    if (dist < ball.radius) {
      const overlap = ball.radius - dist;
      if (dist > 0) {
        ball.x += (distX / dist) * overlap;
        ball.y += (distY / dist) * overlap;
      }

      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        ball.vx -= 1.5 * dot * nx;
        ball.vy -= 1.5 * dot * ny;
      }
    }
  }

  private collideWithBar(ball: Ball, bar: RotatingBar): void {
    // 막대의 두 끝점 계산
    const cos = Math.cos(bar.angle);
    const sin = Math.sin(bar.angle);
    const hw = bar.width;

    const x1 = bar.x - cos * hw;
    const y1 = bar.y - sin * hw;
    const x2 = bar.x + cos * hw;
    const y2 = bar.y + sin * hw;

    // 선분과 충돌 검사
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const t = Math.max(0, Math.min(1, ((ball.x - x1) * dx + (ball.y - y1) * dy) / (len * len)));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distX = ball.x - closestX;
    const distY = ball.y - closestY;
    const dist = Math.sqrt(distX * distX + distY * distY);

    const collisionDist = ball.radius + bar.height;

    if (dist < collisionDist && dist > 0) {
      // 분리
      const overlap = collisionDist - dist;
      ball.x += (distX / dist) * overlap;
      ball.y += (distY / dist) * overlap;

      // 막대의 회전에 의한 충격 추가
      const hitPointX = closestX - bar.x;
      const hitPointY = closestY - bar.y;
      const tangentVx = -bar.angularVelocity * hitPointY * 15;
      const tangentVy = bar.angularVelocity * hitPointX * 15;

      // 반사 + 회전 속도
      const nx = distX / dist;
      const ny = distY / dist;
      const dot = ball.vx * nx + ball.vy * ny;

      ball.vx = ball.vx - 1.8 * dot * nx + tangentVx;
      ball.vy = ball.vy - 1.8 * dot * ny + tangentVy;
    }
  }

  getBalls(): Ball[] {
    return this.balls;
  }

  getStage(): Stage | null {
    return this.stage;
  }

  getFinishOrder(): string[] {
    return [...this.finishOrder];
  }

  getWinner(): string | null {
    return this.finishOrder.length > 0 ? this.finishOrder[this.finishOrder.length - 1] : null;
  }

  isAllFinished(): boolean {
    return this.finishOrder.length === this.balls.length && this.balls.length > 0;
  }

  reset(): void {
    this.balls = [];
    this.stage = null;
    this.finishOrder = [];
    this.isRunning = false;
  }
}
