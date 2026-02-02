import { useState, useEffect, useCallback, useRef } from 'react';
import { X, RotateCcw, Play, Users, Shuffle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { PinballGameState, PinballChatMessage } from '../../types';
import { Box2dPhysics } from '../../utils/pinball/Box2dPhysics';
import { createPinballStage } from '../../utils/pinball/maps';
import { StageDef } from '../../utils/pinball/types';
import { getAvatarColor, getTextContrastColor } from '../../utils';
import PinballCanvasBox2D from './PinballCanvasBox2D';
import PinballResult from './PinballResult';
import PinballChat from './PinballChat';

interface PinballModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  participants: string[];
  gameState: PinballGameState | undefined;
}

const PinballModal = ({
  isOpen,
  onClose,
  groupId,
  gameState,
}: PinballModalProps) => {
  const [physics, setPhysics] = useState<Box2dPhysics | null>(null);
  const [stage, setStage] = useState<StageDef | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localFinished, setLocalFinished] = useState(false);
  const [isPhysicsReady, setIsPhysicsReady] = useState(false);
  const physicsRef = useRef<Box2dPhysics | null>(null);

  const status = gameState?.status || 'idle';
  const chatMessages: PinballChatMessage[] = gameState?.chatMessages || [];
  const isChatActive = status === 'waiting' || status === 'ready' || status === 'playing';
  const userName = localStorage.getItem('ssafy_userName') || '익명';
  const isHost = gameState?.hostName === userName;

  // 참가자 순서를 문자열로 변환 (배열 변경 감지용)
  const participantsKey = gameState?.participants?.join(',') || '';

  // Box2D 물리 엔진 초기화
  useEffect(() => {
    if (!isOpen) return;

    const initPhysics = async () => {
      try {
        console.log('PinballModal: 물리 엔진 초기화 시작');
        const newPhysics = new Box2dPhysics();
        await newPhysics.init();
        physicsRef.current = newPhysics;
        setPhysics(newPhysics);
        setIsPhysicsReady(true);
        console.log('PinballModal: 물리 엔진 초기화 완료');
      } catch (error) {
        console.error('PinballModal: 물리 엔진 초기화 실패', error);
      }
    };

    initPhysics();

    return () => {
      if (physicsRef.current) {
        physicsRef.current.reset();
      }
      setIsPhysicsReady(false);
      setPhysics(null);
      setStage(null);
    };
  }, [isOpen]);

  // 게임 스테이지 및 공 설정
  useEffect(() => {
    if (!isPhysicsReady || !physics) return;
    if (!gameState?.participants || gameState.participants.length === 0) return;

    // 스테이지 생성
    const newStage = createPinballStage(gameState.participants.length);
    physics.reset();
    physics.createStage(newStage);

    // 공 생성
    const spacing = (newStage.width - 2) / (gameState.participants.length + 1);
    gameState.participants.forEach((name, index) => {
      const x = 1 + spacing * (index + 1);
      const y = newStage.startY;
      physics.createMarble(index, x, y, name, getAvatarColor(name));
    });

    setStage(newStage);
    setLocalFinished(false);
    setIsPlaying(false);
  }, [isPhysicsReady, physics, participantsKey, gameState?.seed]);

  // playing 상태가 되면 게임 시작
  useEffect(() => {
    if (status === 'playing' && physics && isPhysicsReady) {
      physics.start();
      setIsPlaying(true);
    }
  }, [status, physics, isPhysicsReady]);

  // 게임 시작 (호스트만 가능)
  const handleStartGame = async () => {
    if (!isHost) return;
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'pinballGame.status': 'ready',
    });
  };

  // 시작 위치 셔플 (호스트만 가능)
  const handleShuffle = async () => {
    if (!isHost || !gameState?.participants) return;

    const shuffled = [...gameState.participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      'pinballGame.participants': shuffled,
      'pinballGame.seed': Date.now(),
    });
  };

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
          'pinballGame.status': 'playing',
        });
      };
      startGame();
    }
  }, [status, countdown, groupId]);

  // 모든 공 도착 시
  const handleAllFinished = useCallback(async () => {
    if (!physics || localFinished) return;

    setIsPlaying(false);
    setLocalFinished(true);

    const winner = physics.getWinner();
    const finishOrder = physics.getFinishOrder();

    if (winner) {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        'pinballGame.status': 'finished',
        'pinballGame.winner': winner,
        'pinballGame.finishOrder': finishOrder,
      });
    }
  }, [physics, groupId, localFinished]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col pinball-modal-enter border border-gray-700">
          {/* 헤더 */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700 shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white">
              <span className="text-2xl">🎱</span>
              커피 내기 핀볼
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded-full transition text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="p-4 flex-1 flex gap-4 min-h-0">
            {/* 왼쪽: 게임 영역 */}
            <div className="overflow-y-auto custom-scrollbar shrink-0">
              <div className="flex flex-col items-center">
                <div className="relative">
                  {!isPhysicsReady ? (
                    <div className="w-[300px] h-[400px] bg-gray-800 rounded-xl flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                        <p className="text-sm">물리 엔진 로딩 중...</p>
                      </div>
                    </div>
                  ) : (
                    <PinballCanvasBox2D
                      physics={physics}
                      stage={stage}
                      isPlaying={isPlaying}
                      onAllFinished={handleAllFinished}
                    />
                  )}

                  {/* 대기실 오버레이 */}
                  {status === 'waiting' && isPhysicsReady && (
                    <div className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center p-4">
                      <div className="bg-gray-800/95 rounded-2xl p-6 shadow-xl max-w-[280px] w-full border border-gray-600">
                        <div className="text-center mb-4">
                          <Users size={32} className="text-primary mx-auto mb-2" />
                          <h3 className="text-lg font-bold text-white">대기실</h3>
                          <p className="text-xs text-gray-400">공 위치를 확인하세요!</p>
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
                {status === 'finished' && gameState?.winner && gameState?.finishOrder && (
                  <div className="mt-4 w-full">
                    <PinballResult
                      winner={gameState.winner}
                      finishOrder={gameState.finishOrder}
                      onReset={onClose}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 채팅 영역 */}
            <div className="flex-1 flex flex-col min-w-[200px] min-h-0">
              <PinballChat
                groupId={groupId}
                messages={chatMessages}
                isActive={isChatActive}
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-4 border-t border-gray-700 text-center">
            {status === 'waiting' && (
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition text-sm"
              >
                <X size={16} />
                대기실 나가기
              </button>
            )}
            {status === 'playing' && (
              <p className="text-gray-400 text-sm mb-4">
                🎱 공이 떨어지고 있어요... 마지막에 도착하면 커피 당첨!
              </p>
            )}
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

export default PinballModal;
