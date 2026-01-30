import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Play, Users, Shuffle } from 'lucide-react';
import { RouletteGameState, PinballChatMessage } from '../../types';
import { Roulette } from './roulette';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAvatarColor, getTextContrastColor } from '../../utils';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  participants: string[];
  gameState: RouletteGameState | undefined;
}

const RouletteModal: React.FC<RouletteModalProps> = ({ isOpen, onClose, groupId, participants, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rouletteInstance = useRef<Roulette | null>(null);

  const [isRouletteReady, setIsRouletteReady] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const status = gameState?.status || 'idle';
  const chatMessages: PinballChatMessage[] = gameState?.chatMessages || []; // Using PinballChatMessage for now
  const userName = localStorage.getItem('ssafy_userName') || '익명';
  const isHost = gameState?.hostName === userName;

  const handleStartGame = async () => {
    if (!isHost) return;
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'rouletteGame.status': 'ready',
    });
  };

  const handleShuffle = async () => {
    if (!isHost || !gameState?.participants) return;

    const shuffled = [...gameState.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'rouletteGame.participants': shuffled,
      'rouletteGame.seed': Date.now(),
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const initRoulette = async () => {
      if (canvasRef.current) {
        if (rouletteInstance.current) {
          rouletteInstance.current.reset();
        } else {
          rouletteInstance.current = new Roulette(canvasRef.current);
        }
        
        setIsRouletteReady(rouletteInstance.current.isReady);

        if (rouletteInstance.current.isReady && gameState?.participants) {
            rouletteInstance.current.setMarbles(gameState.participants);
        }
      }
    };

    initRoulette();

    return () => {
      if (rouletteInstance.current) {
        rouletteInstance.current.reset();
        rouletteInstance.current = null;
      }
    };
  }, [isOpen, gameState?.participants, gameState?.seed]);


  useEffect(() => {
    if (status === 'ready') {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'ready' && countdown === 0) {
      const startGame = async () => {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          'rouletteGame.status': 'playing',
        });
        rouletteInstance.current?.start(); // Start the actual roulette game
      };
      startGame();
    }
  }, [status, countdown, groupId]);


  // Event listener for roulette 'goal' event
  useEffect(() => {
    const handleGoal = (event: Event) => {
      const customEvent = event as CustomEvent;
      const winnerName = customEvent.detail.winner;
      
      const updateRouletteState = async () => {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          'rouletteGame.status': 'finished',
          'rouletteGame.winner': winnerName,
          // finishOrder is not directly available from the current roulette.ts example
          // 'rouletteGame.finishOrder': finishOrder, 
        });
      };
      updateRouletteState();
    };

    if (rouletteInstance.current) {
      rouletteInstance.current.addEventListener('goal', handleGoal);
    }

    return () => {
      if (rouletteInstance.current) {
        rouletteInstance.current.removeEventListener('goal', handleGoal);
      }
    };
  }, [groupId]);


  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pinball-modal-enter border border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="text-2xl">🎡</span>
              커피 내기 룰렛
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 flex-1 flex gap-4 min-h-0">
            {/* 왼쪽: 게임 영역 */}
            <div className="overflow-y-auto custom-scrollbar shrink-0">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {!isRouletteReady ? (
                    <div className="w-[800px] h-[600px] bg-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm">룰렛 로딩 중...</p>
                      </div>
                    </div>
                  ) : (
                    <canvas ref={canvasRef} width="800" height="600"></canvas>
                  )}
                  
                  {status === 'waiting' && isRouletteReady && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center p-4">
                      <div className="bg-gray-800/95 rounded-2xl p-6 shadow-xl max-w-[280px] w-full border border-gray-600">
                        <div className="text-center mb-4">
                          <Users size={32} className="text-primary mx-auto mb-2" />
                          <h3 className="text-lg font-bold text-white">대기실</h3>
                          <p className="text-xs text-gray-400">참가자들을 확인하세요!</p>
                        </div>

                        {/* 참가자 목록 */}
                        <div className="bg-gray-700/50 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-400 mb-2 font-bold">
                            참가자 ({gameState?.participants?.length || 0}명)
                          </p>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {gameState?.participants?.map((name) => (
                              <div
                                key={name}
                                className="flex items-center gap-1.5 px-2 py-1 bg-gray-600 rounded-full"
                              >
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                                  style={{
                                    backgroundColor: getAvatarColor(name),
                                    color: getTextContrastColor(),
                                  }}
                                >
                                  {name.slice(0, 1)}
                                </div>
                                <span className="text-xs font-medium text-gray-200">
                                  {name}
                                  {name === gameState?.hostName && (
                                    <span className="ml-0.5 text-[10px] text-primary">(방장)</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 시작/셔플 버튼 */}
                        {isHost ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={handleStartGame}
                              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-md"
                            >
                              <Play size={18} />
                              게임 시작!
                            </button>
                            <button
                              onClick={handleShuffle}
                              className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-600 text-gray-200 rounded-xl font-medium hover:bg-gray-500 transition text-sm"
                            >
                              <Shuffle size={14} />
                              위치 셔플
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-xs text-gray-400">
                              <span className="font-bold text-primary">{gameState?.hostName}</span>님이
                              시작하면 게임이 시작돼요
                            </p>
                            <div className="mt-2 flex items-center justify-center gap-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 카운트다운 오버레이 */}
                  {status === 'ready' && countdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                      <span className="text-8xl font-bold text-white countdown-pop drop-shadow-lg">
                        {countdown}
                      </span>
                    </div>
                  )}
                </div>

                {/* 결과 표시 */}
                {status === 'finished' && gameState?.winner && (
                  <div className="mt-4 w-full text-center text-white">
                    <h3 className="text-xl font-bold">🎉 승자: {gameState.winner} 🎉</h3>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 mx-auto px-4 py-2 mt-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm"
                    >
                      <RotateCcw size={16} />
                      다시하기
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 채팅 영역 (임시) */}
            <div className="flex-1 flex flex-col min-w-[200px] min-h-0">
              <div className="flex-1 bg-gray-800 rounded-xl p-4 text-white">
                <h3 className="font-bold mb-2">룰렛 채팅</h3>
                {chatMessages.length === 0 ? (
                  <p className="text-gray-400 text-sm">아직 메시지가 없어요.</p>
                ) : (
                  <div className="space-y-2">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-bold" style={{ color: getAvatarColor(msg.userName) }}>{msg.userName}:</span> {msg.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-4 border-t border-gray-700 text-center">
            {(status === 'playing' || status === 'finished') && (
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm"
              >
                <RotateCcw size={16} />
                처음부터 다시하기
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RouletteModal;
