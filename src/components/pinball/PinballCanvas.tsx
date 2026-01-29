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

      // 핀 그리기
      const pins = physics.getPins();
      for (const pin of pins) {
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pin.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
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

      // 결승선 라벨
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('FINISH', 10, finishLine - 8);

      // 공 그리기
      const balls = physics.getBalls();
      for (const ball of balls) {
        // 공 그림자
        ctx.beginPath();
        ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fill();

        // 공 본체
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();

        // 공 테두리
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 이름 첫 글자
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
