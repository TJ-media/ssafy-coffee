import { useRef, useEffect, useCallback } from 'react';
import { Box2dPhysics } from '../../utils/pinball/Box2dPhysics';
import { StageDef, BallState, MapEntityState } from '../../utils/pinball/types';

interface PinballCanvasBox2DProps {
  physics: Box2dPhysics | null;
  stage: StageDef | null;
  isPlaying: boolean;
  onAllFinished: () => void;
}

const SCALE = 12; // Box2D 단위를 픽셀로 변환

const PinballCanvasBox2D = ({ physics, stage, isPlaying, onAllFinished }: PinballCanvasBox2DProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const render = useCallback((
    ctx: CanvasRenderingContext2D,
    balls: BallState[],
    entities: MapEntityState[],
    stageData: StageDef
  ) => {
    const canvasWidth = stageData.width * SCALE;
    const canvasHeight = stageData.height * SCALE;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 그리드 패턴 (장식)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < canvasHeight; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // 엔티티 그리기
    entities.forEach((entity) => {
      ctx.save();
      ctx.translate(entity.x * SCALE, entity.y * SCALE);
      ctx.rotate(entity.angle);

      switch (entity.shape.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, entity.shape.radius * SCALE, 0, Math.PI * 2);
          // 범퍼는 밝은 색, 핀은 어두운 색
          if (entity.shape.radius > 0.5) {
            ctx.fillStyle = '#ff6b6b';
            ctx.shadowColor = '#ff6b6b';
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = '#4a5568';
          }
          ctx.fill();
          ctx.shadowBlur = 0;
          break;

        case 'box':
          const hw = entity.shape.width * SCALE;
          const hh = entity.shape.height * SCALE;
          ctx.fillStyle = '#6366f1';
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 8;
          ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
          ctx.shadowBlur = 0;
          break;

        case 'polyline':
          ctx.beginPath();
          const points = entity.shape.points;
          if (points.length > 0) {
            ctx.moveTo(points[0][0] * SCALE - entity.x * SCALE, points[0][1] * SCALE - entity.y * SCALE);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i][0] * SCALE - entity.x * SCALE, points[i][1] * SCALE - entity.y * SCALE);
            }
          }
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
          break;
      }

      ctx.restore();
    });

    // 결승선
    const finishY = stageData.goalY * SCALE;
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(0, finishY);
    ctx.lineTo(canvasWidth, finishY);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);

    // FINISH 텍스트
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('FINISH', 10, finishY - 8);

    // 공 그리기
    balls.forEach((ball) => {
      const x = ball.x * SCALE;
      const y = ball.y * SCALE;
      const radius = 0.3 * SCALE;

      // 그림자
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fill();

      // 공 본체
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 테두리
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 이름 첫 글자
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ball.name.slice(0, 1), x, y);
    });
  }, []);

  useEffect(() => {
    if (!physics || !stage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = stage.width * SCALE;
    canvas.height = stage.height * SCALE;

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (isPlaying) {
        // 물리 시뮬레이션 (60fps 기준)
        physics.step(1 / 60);

        if (physics.isAllFinished()) {
          onAllFinished();
        }
      }

      const balls = physics.getBalls();
      const entities = physics.getEntities();
      render(ctx, balls, entities, stage);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = 0;
    };
  }, [physics, stage, isPlaying, onAllFinished, render]);

  if (!stage) return null;

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border-2 border-gray-700 shadow-lg"
      style={{
        maxWidth: '100%',
        height: 'auto',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
      }}
    />
  );
};

export default PinballCanvasBox2D;
