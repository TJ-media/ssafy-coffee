import { useRef, useEffect } from 'react';
import { PinballPhysics } from '../../utils/pinballPhysics';

interface PinballCanvasProps {
  physics: PinballPhysics | null;
  isPlaying: boolean;
  onAllFinished: () => void;
}

const PinballCanvas = ({ physics, isPlaying, onAllFinished }: PinballCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!physics || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = physics.getDimensions();
    canvas.width = width;
    canvas.height = height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 배경
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // 바람 영역 그리기
      const windAreas = physics.getWindAreas();
      for (const area of windAreas) {
        ctx.fillStyle = area.force.x > 0 ? 'rgba(135, 206, 250, 0.2)' : 'rgba(255, 165, 0, 0.2)';
        ctx.fillRect(area.rect.x, area.rect.y, area.rect.width, area.rect.height);
        
        // 바람 방향 화살표
        ctx.fillStyle = area.force.x > 0 ? 'rgba(135, 206, 250, 0.5)' : 'rgba(255, 165, 0, 0.5)';
        const arrowY = area.rect.y + area.rect.height / 2;
        for (let x = area.rect.x + 10; x < area.rect.x + area.rect.width; x += 25) {
            ctx.beginPath();
            if (area.force.x > 0) {
                ctx.moveTo(x, arrowY - 5);
                ctx.lineTo(x + 5, arrowY);
                ctx.lineTo(x, arrowY + 5);
            } else {
                ctx.moveTo(x + 5, arrowY - 5);
                ctx.lineTo(x, arrowY);
                ctx.lineTo(x + 5, arrowY + 5);
            }
            ctx.fill();
        }
      }
      
      // 핀 그리기
      const pins = physics.getPins();
      for (const pin of pins) {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#94a3b8'; // 핀 색상 변경
        ctx.fill();
      }

      // 회전 막대 그리기
      const bars = physics.getRotatingBars();
      for (const bar of bars) {
        const halfLength = bar.length / 2;
        const startX = bar.x - halfLength * Math.cos(bar.angle);
        const startY = bar.y - halfLength * Math.sin(bar.angle);
        const endX = bar.x + halfLength * Math.cos(bar.angle);
        const endY = bar.y + halfLength * Math.sin(bar.angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 범퍼 그리기
      const bumpers = physics.getBumpers();
      for (const bumper of bumpers) {
          ctx.beginPath();
          ctx.moveTo(bumper.points[0].x, bumper.points[0].y);
          for(let i = 1; i < bumper.points.length; i++) {
              ctx.lineTo(bumper.points[i].x, bumper.points[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = '#64748b';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 4;
          ctx.stroke();
      }

      // 깔때기 벽 그리기
      const walls = physics.getWalls();
      for (const wall of walls) {
        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 결승선 그리기
      const finishLine = physics.getFinishLine();
      ctx.beginPath();
      ctx.setLineDash([10, 10]);
      ctx.moveTo(0, finishLine);
      ctx.lineTo(width, finishLine);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FINISH', 10, finishLine - 8);

      // 공 그리기
      const balls = physics.getBalls();
      for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.name.slice(0, 1), ball.x, ball.y);
      }
    };

    const animate = () => {
      if (isPlaying) {
        const allFinished = physics.update();
        if (allFinished) {
          onAllFinished();
        }
      }
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [physics, isPlaying, onAllFinished]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border-2 border-gray-200 shadow-inner"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default PinballCanvas;
