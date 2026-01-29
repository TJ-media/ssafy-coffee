import { useState, useEffect, useCallback } from 'react';
import { X, Play, Users } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { PinballGameState } from '../../types';
import { PinballPhysics } from '../../utils/pinballPhysics';
import { getAvatarColor } from '../../utils';
import PinballCanvas from './PinballCanvas';
import PinballResult from './PinballResult';

interface PinballModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  participants: string[];
  gameState: PinballGameState | undefined;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 450;

const PinballModal = ({
  isOpen,
  onClose,
  groupId,
  participants,
  gameState,
}: PinballModalProps) => {
  const [physics, setPhysics] = useState<PinballPhysics | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localFinished, setLocalFinished] = useState(false);

  const status = gameState?.status || 'idle';

  // 게임 상태에 따라 물리 엔진 초기화
  useEffect(() => {
    if (!isOpen) return;

    if (status === 'playing' || status === 'finished') {
      if (gameState?.seed && gameState?.participants) {
        const newPhysics = new PinballPhysics(
          CANVAS_WIDTH,
          CANVAS_HEIGHT,
          gameState.seed
        );
        newPhysics.addParticipants(gameState.participants, getAvatarColor);

        // 이미 끝난 게임이면 빠르게 진행
        if (status === 'finished') {
          newPhysics.fastForward();
          setLocalFinished(true);
        }

        setPhysics(newPhysics);
        setIsPlaying(status === 'playing');
      }
    } else {
      setPhysics(null);
      setIsPlaying(false);
      setLocalFinished(false);
    }
  }, [isOpen, status, gameState?.seed, gameState?.participants]);

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
      // 첫 번째 클라이언트만 상태 업데이트
      const startGame = async () => {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
          'pinballGame.status': 'playing',
        });
      };
      startGame();
    }
  }, [status, countdown, groupId]);

  // 게임 시작 버튼
  const handleStartGame = async () => {
    if (participants.length < 2) {
      alert('2명 이상의 참여자가 필요합니다.');
      return;
    }

    const seed = Date.now();
    const groupRef = doc(db, 'groups', groupId);

    const newGameState: PinballGameState = {
      status: 'ready',
      participants: participants,
      seed: seed,
      startedAt: new Date(),
    };

    await updateDoc(groupRef, {
      pinballGame: newGameState,
    });
  };

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

  // 리셋
  const handleReset = async () => {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      pinballGame: {
        status: 'idle',
        participants: [],
        seed: 0,
      },
    });
    setPhysics(null);
    setLocalFinished(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-hidden pinball-modal-enter">
          {/* 헤더 */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">🎱</span>
              커피 내기 핀볼
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* 참여자 표시 */}
            {status === 'idle' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Users size={16} />
                  <span>참여자 ({participants.length}명)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participants.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: getAvatarColor(name) }}
                      >
                        {name.slice(0, 1)}
                      </div>
                      <span className="text-sm">{name}</span>
                    </div>
                  ))}
                </div>
                {participants.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    장바구니에 메뉴를 담은 사람이 없어요
                  </p>
                )}
                {participants.length === 1 && (
                  <p className="text-amber-500 text-sm py-2 text-center">
                    2명 이상 필요합니다
                  </p>
                )}
              </div>
            )}

            {/* 캔버스 영역 */}
            {(status === 'playing' || status === 'finished' || status === 'ready') && (
              <div className="flex justify-center mb-4 relative">
                <PinballCanvas
                  physics={physics}
                  isPlaying={isPlaying}
                  onAllFinished={handleAllFinished}
                />

                {/* 카운트다운 오버레이 */}
                {status === 'ready' && countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <span className="text-7xl font-bold text-white countdown-pop">
                      {countdown}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 결과 화면 */}
            {status === 'finished' && gameState?.winner && gameState?.finishOrder && (
              <PinballResult
                winner={gameState.winner}
                finishOrder={gameState.finishOrder}
                onReset={handleReset}
              />
            )}
          </div>

          {/* 푸터 - 시작 버튼 */}
          {status === 'idle' && (
            <div className="p-4 border-t">
              <button
                onClick={handleStartGame}
                disabled={participants.length < 2}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition ${
                  participants.length >= 2
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play size={20} />
                마감하고 게임 시작
              </button>
            </div>
          )}

          {/* 게임 중 안내 */}
          {status === 'playing' && (
            <div className="p-4 border-t text-center">
              <p className="text-gray-500 text-sm">
                🎱 공이 떨어지고 있어요... 마지막에 도착하면 커피 당첨!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PinballModal;
