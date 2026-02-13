import React from 'react';
import WaitingRoom from './WaitingRoom';

interface GameCanvasProps {
    // 👇 [수정] | null 을 추가하여 null 타입도 허용하도록 변경
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    isRouletteReady: boolean;
    status: 'idle' | 'waiting' | 'ready' | 'playing' | 'finished';
    countdown: number | null;
    participants: string[];
    hostName?: string;
    marbleCounts: { [userName: string]: number };
    isHost: boolean;
    onStart: () => void;
    onShuffle: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
                                                   canvasRef,
                                                   isRouletteReady,
                                                   status,
                                                   countdown,
                                                   participants,
                                                   hostName,
                                                   marbleCounts,
                                                   isHost,
                                                   onStart,
                                                   onShuffle,
                                               }) => {
    return (
        <div className="flex-1 relative">
            {/* Canvas (모든 참가자) */}
            <canvas
                ref={canvasRef}
                className={`w-full h-full rounded-xl bg-black ${!isRouletteReady ? 'hidden' : ''}`}
            ></canvas>

            {/* 로딩 화면 */}
            {!isRouletteReady && (
                <div className="absolute inset-0 bg-gray-800 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-lg">룰렛 로딩 중...</p>
                    </div>
                </div>
            )}

            {/* 대기실 오버레이 */}
            {status === 'waiting' && isRouletteReady && (
                <WaitingRoom
                    participants={participants}
                    hostName={hostName}
                    marbleCounts={marbleCounts}
                    isHost={isHost}
                    onStart={onStart}
                    onShuffle={onShuffle}
                />
            )}

            {/* 카운트다운 오버레이 (모든 참가자) */}
            {status === 'ready' && countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <span className="text-[120px] font-bold text-white countdown-pop drop-shadow-lg">
            {countdown}
          </span>
                </div>
            )}
        </div>
    );
};

export default GameCanvas;