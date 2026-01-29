import React, { useEffect, useRef, useState } from 'react';
import { X, Play, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { getAvatarColor } from '../../utils';
import confetti from 'canvas-confetti';

interface MarbleRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
}

// 물리 엔진 설정값
const GRAVITY = 0.4;
const FRICTION = 0.99;
const BOUNCE = 0.7;
const OBSTACLE_RADIUS = 6;
const MARBLE_RADIUS = 12;

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  finished: boolean;
  rank: number;
}

interface Obstacle {
  x: number;
  y: number;
}

const MarbleRaceModal: React.FC<MarbleRaceModalProps> = ({ isOpen, onClose, participants }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'running' | 'finished'>('ready');
  const [ranks, setRanks] = useState<string[]>([]);
  
  // 수정된 부분: 초기값을 null로 설정하고 타입에 null 추가
  const requestRef = useRef<number | null>(null);
  
  // 게임 상태 Refs (렌더링 없이 실시간 업데이트용)
  const ballsRef = useRef<Ball[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const finishCountRef = useRef(0);

  // 초기화
  useEffect(() => {
    if (isOpen) {
      resetGame();
    }
    return () => cancelAnimation();
  }, [isOpen, participants]);

  const resetGame = () => {
    setGameState('ready');
    setRanks([]);
    finishCountRef.current = 0;
    cancelAnimation();

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    // 1. 공 초기화 (상단 중앙에 모아서 배치)
    ballsRef.current = participants.map((name, i) => ({
      id: name,
      x: width / 2 + (Math.random() - 0.5) * 40, // 약간의 랜덤 위치
      y: 50 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      color: getAvatarColor(name),
      finished: false,
      rank: 0
    }));

    // 2. 장애물 생성 (지그재그 패턴)
    const newObstacles: Obstacle[] = [];
    const rows = 12;
    for (let i = 0; i < rows; i++) {
      const y = 150 + i * 50;
      const isOdd = i % 2 === 0;
      const cols = isOdd ? 6 : 5;
      const spacing = width / (cols + 1);
      
      for (let j = 0; j < cols; j++) {
        newObstacles.push({
          x: spacing * (j + 1) + (Math.random() - 0.5) * 10, // 약간 비뚤어지게
          y: y + (Math.random() - 0.5) * 10
        });
      }
    }
    obstaclesRef.current = newObstacles;

    // 초기 화면 그리기
    draw();
  };

  const startGame = () => {
    setGameState('running');
    update();
  };

  const cancelAnimation = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const update = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    let activeBalls = 0;

    ballsRef.current.forEach(ball => {
      if (ball.finished) return;

      activeBalls++;

      // 물리 적용
      ball.vy += GRAVITY;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;
      ball.x += ball.vx;
      ball.y += ball.vy;

      // 벽 충돌
      if (ball.x < MARBLE_RADIUS) {
        ball.x = MARBLE_RADIUS;
        ball.vx *= -BOUNCE;
      } else if (ball.x > width - MARBLE_RADIUS) {
        ball.x = width - MARBLE_RADIUS;
        ball.vx *= -BOUNCE;
      }

      // 장애물 충돌
      obstaclesRef.current.forEach(obs => {
        const dx = ball.x - obs.x;
        const dy = ball.y - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = MARBLE_RADIUS + OBSTACLE_RADIUS;

        if (dist < minDist) {
          // 충돌 반응 (법선 벡터 계산)
          const angle = Math.atan2(dy, dx);
          const tx = obs.x + Math.cos(angle) * minDist;
          const ty = obs.y + Math.sin(angle) * minDist;
          
          const ax = (ball.x - tx) * 0.5; // 스프링 효과 감소
          const ay = (ball.y - ty) * 0.5;

          ball.vx -= ax;
          ball.vy -= ay;
          
          // 약간의 랜덤 튕김 추가 (도파민 요소)
          ball.vx += (Math.random() - 0.5) * 2;
        }
      });

      // 공끼리 충돌 (간단한 밀어내기)
      ballsRef.current.forEach(other => {
        if (ball === other || other.finished) return;
        const dx = ball.x - other.x;
        const dy = ball.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = MARBLE_RADIUS * 2;

        if (dist < minDist) {
          const angle = Math.atan2(dy, dx);
          const force = 0.5;
          ball.vx += Math.cos(angle) * force;
          ball.vy += Math.sin(angle) * force;
          other.vx -= Math.cos(angle) * force;
          other.vy -= Math.sin(angle) * force;
        }
      });

      // 결승선 통과
      if (ball.y > height - MARBLE_RADIUS) {
        ball.finished = true;
        ball.y = height - MARBLE_RADIUS;
        finishCountRef.current += 1;
        ball.rank = finishCountRef.current;
        
        // React 상태 업데이트 (랭킹 표시용)
        setRanks(prev => [...prev, ball.id]);
      }
    });

    draw();

    if (activeBalls > 0) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      setGameState('finished');
      // 꼴찌 축하(?) 효과
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#ef4444', '#000000'] // 검정/빨강 (지옥의 색)
      });
    }
  };

  const draw = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);

    // 배경 트랙 그리기
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // 결승선
    ctx.beginPath();
    ctx.moveTo(0, height - 50);
    ctx.lineTo(width, height - 50);
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 장애물 그리기
    ctx.fillStyle = '#94a3b8';
    obstaclesRef.current.forEach(obs => {
      ctx.beginPath();
      ctx.arc(obs.x, obs.y, OBSTACLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // 공 그리기
    ballsRef.current.forEach(ball => {
      // 그림자
      ctx.beginPath();
      ctx.arc(ball.x + 2, ball.y + 2, MARBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();

      // 본체
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, MARBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 이름 (공 위에 따라다니게)
      if (!ball.finished) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ball.id.slice(0, 2), ball.x, ball.y - 15);
      }
    });
  };

  if (!isOpen) return null;

  const loser = ranks.length > 0 ? ranks[ranks.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="p-4 bg-surface flex justify-between items-center border-b shrink-0">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    🏎️ 커피 마블 레이스
                </h2>
                <p className="text-xs text-gray-500">꼴찌가 커피 쏘기! ({participants.length}명)</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
            </button>
        </div>

        {/* 캔버스 영역 */}
        <div className="relative bg-slate-50 flex-1 flex justify-center overflow-hidden">
            <canvas 
                ref={canvasRef} 
                width={360} 
                height={600}
                className="w-full h-full object-contain"
            />
            
            {/* 게임 오버레이 (시작 전) */}
            {gameState === 'ready' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                    <button 
                        onClick={startGame}
                        className="bg-primary text-white px-8 py-3 rounded-full font-bold text-xl shadow-lg hover:scale-105 transition flex items-center gap-2 animate-bounce"
                    >
                        <Play fill="currentColor" /> RACE START
                    </button>
                </div>
            )}
        </div>

        {/* 하단 정보창 */}
        <div className="p-4 bg-white border-t shrink-0">
            {gameState === 'finished' ? (
                <div className="text-center animate-slide-up">
                    <div className="mb-2 text-danger font-bold text-lg flex items-center justify-center gap-2">
                        <AlertTriangle /> 당첨자(꼴찌) 확정! <AlertTriangle />
                    </div>
                    <div className="text-3xl font-black mb-4 text-gray-800 border-4 border-danger rounded-xl p-4 bg-red-50">
                        💀 {loser} 💀
                    </div>
                    <button 
                        onClick={resetGame}
                        className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition"
                    >
                        <RotateCcw size={18} /> 다시 하기
                    </button>
                </div>
            ) : (
                <div className="h-24 overflow-y-auto custom-scrollbar">
                    <h3 className="text-xs font-bold text-gray-400 mb-2 uppercase">Live Ranking (도착순)</h3>
                    {ranks.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">아직 도착한 사람이 없습니다...</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {ranks.map((name, idx) => (
                                <span key={name} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-bold flex items-center gap-1 border border-gray-200">
                                    <span className="text-gray-400">#{idx + 1}</span> 
                                    {name} 
                                    {idx === 0 && <Trophy size={12} className="text-yellow-500"/>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MarbleRaceModal;