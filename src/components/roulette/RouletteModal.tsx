import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Play, Users, Shuffle } from 'lucide-react';
import { RouletteGameState, PinballChatMessage } from '../../types';
import { Roulette } from './roulette';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAvatarColor, getTextContrastColor } from '../../utils';
import RouletteChat from './RouletteChat';
import RouletteResult from './RouletteResult';

interface RouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  participants: string[];
  gameState: RouletteGameState | undefined;
}

const RouletteModal: React.FC<RouletteModalProps> = ({ isOpen, onClose, groupId, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rouletteInstance = useRef<Roulette | null>(null);

  const [isRouletteReady, setIsRouletteReady] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localFinished, setLocalFinished] = useState(false);

  const status = gameState?.status || 'idle';
  const chatMessages: PinballChatMessage[] = gameState?.chatMessages || [];
  const isChatActive = status === 'waiting' || status === 'ready' || status === 'playing';
  const userName = localStorage.getItem('ssafy_userName') || '익명';
  const isHost = gameState?.hostName === userName;

  // 참가자 순서를 문자열로 변환 (배열 변경 감지용)
  const participantsKey = gameState?.participants?.join(',') || '';

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

  // 룰렛 초기화
  useEffect(() => {
    if (!isOpen) return;

    const initRoulette = async () => {
      if (canvasRef.current) {
        if (rouletteInstance.current) {
          rouletteInstance.current.reset();
        } else {
          rouletteInstance.current = new Roulette(canvasRef.current);
        }

        // 잠시 대기 후 ready 상태 확인
        const checkReady = () => {
          if (rouletteInstance.current?.isReady) {
            setIsRouletteReady(true);
            if (gameState?.participants) {
              rouletteInstance.current.setMarbles(gameState.participants);
            }
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      }
    };

    initRoulette();
    setLocalFinished(false);
    setIsPlaying(false);

    return () => {
      if (rouletteInstance.current) {
        rouletteInstance.current.reset();
        rouletteInstance.current = null;
      }
      setIsRouletteReady(false);
    };
  }, [isOpen]);

  // 참가자 변경시 마블 재설정
  useEffect(() => {
    if (!isRouletteReady || !rouletteInstance.current) return;
    if (!gameState?.participants || gameState.participants.length === 0) return;

    rouletteInstance.current.reset();
    rouletteInstance.current.setMarbles(gameState.participants);
    setLocalFinished(false);
    setIsPlaying(false);
  }, [isRouletteReady, participantsKey, gameState?.seed]);

  // 카운트다운 처리
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

  // 카운트다운 완료 시 게임 시작
  useEffect(() => {
    if (status === 'ready' && countdown === 0) {
      const startGame = async () => {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          'rouletteGame.status': 'playing',
        });
      };
      startGame();
    }
  }, [status, countdown, groupId]);

  // playing 상태가 되면 게임 시작
  useEffect(() => {
    if (status === 'playing' && rouletteInstance.current && isRouletteReady) {
      rouletteInstance.current.start();
      setIsPlaying(true);
    }
  }, [status, isRouletteReady]);

  // Event listener for roulette 'goal' event
  useEffect(() => {
    const handleGoal = (event: Event) => {
      if (localFinished) return;

      const customEvent = event as CustomEvent;
      const winnerName = customEvent.detail.winner;

      setIsPlaying(false);
      setLocalFinished(true);

      const updateRouletteState = async () => {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          'rouletteGame.status': 'finished',
          'rouletteGame.winner': winnerName,
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
  }, [groupId, localFinished]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-2">
        <div className="bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col pinball-modal-enter border border-gray-700">
          {/* 헤더 */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 shrink-0">
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

          {/* 메인 컨텐츠 */}
          <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden">
            {/* 왼쪽: 게임 영역 (전체 채움) */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 relative">
                {/* Canvas는 항상 렌더링 */}
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
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-800/95 rounded-2xl p-6 shadow-xl max-w-[320px] w-full border border-gray-600">
                      <div className="text-center mb-4">
                        <Users size={40} className="text-primary mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-white">대기실</h3>
                        <p className="text-sm text-gray-400">참가자들을 확인하세요!</p>
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
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition shadow-md text-lg"
                          >
                            <Play size={20} />
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
                          <p className="text-sm text-gray-400">
                            <span className="font-bold text-primary">{gameState?.hostName}</span>님이
                            시작하면 게임이 시작돼요
                          </p>
                          <div className="mt-2 flex items-center justify-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 카운트다운 오버레이 */}
                {status === 'ready' && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <span className="text-[120px] font-bold text-white countdown-pop drop-shadow-lg">
                      {countdown}
                    </span>
                  </div>
                )}

                {/* 결과 표시 */}
                {status === 'finished' && gameState?.winner && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl">
                    <RouletteResult
                      winner={gameState.winner}
                      finishOrder={gameState.finishOrder}
                      onReset={onClose}
                    />
                  </div>
                )}
              </div>

              {/* 하단 상태 */}
              <div className="py-2 text-center shrink-0">
                {status === 'waiting' && (
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm"
                  >
                    <X size={16} />
                    대기실 나가기
                  </button>
                )}
                {status === 'playing' && (
                  <p className="text-gray-400 text-sm">
                    🎡 룰렛이 돌아가고 있어요... 마지막에 도착하면 커피 당첨!
                  </p>
                )}
                {(status === 'playing' || status === 'finished') && (
                  <button
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm mt-2"
                  >
                    <RotateCcw size={16} />
                    처음부터 다시하기
                  </button>
                )}
              </div>
            </div>

            {/* 오른쪽: 채팅 영역 */}
            <div className="w-[280px] shrink-0 flex flex-col min-h-0">
              <RouletteChat
                groupId={groupId}
                messages={chatMessages}
                isActive={isChatActive}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RouletteModal;
