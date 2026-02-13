import React from 'react';
import { X } from 'lucide-react';
import { RouletteGameState, CartItem } from '../../../shared/types';
import RouletteResult from '../components/RouletteResult';
import { useRouletteGame } from '../hooks/useRouletteGame';
import { groupCartItems } from '../utils/cartUtils';
import GameCanvas from './GameCanvas';

interface RouletteModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    gameState: RouletteGameState | undefined;
    cart?: CartItem[];
    marbleCounts?: { [userName: string]: number };
}

const RouletteModal: React.FC<RouletteModalProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         groupId,
                                                         gameState,
                                                         cart = [],
                                                         marbleCounts = {},
                                                     }) => {
    const userName = localStorage.getItem('ssafy_userName') || '익명';

    const {
        canvasRef,
        isRouletteReady,
        status,
        countdown,
        cachedCart,
        isHost,
        handleStartGame,
        handleShuffle,
    } = useRouletteGame({
        groupId,
        gameState,
        cart,
        marbleCounts,
        isOpen,
        userName,
    });

    if (!isOpen) return null;

    const isWinner = gameState?.winner === userName;

    // 게임 종료 - 결과 화면
    if (status === 'finished' && gameState?.winner) {
        const displayCart = cachedCart.length > 0 ? cachedCart : cart;
        const groupedCart = groupCartItems(displayCart);
        const totalPrice = displayCart.reduce((sum, item) => sum + item.price, 0);

        return (
            <>
                <div className="fixed inset-0 bg-black/80 z-40" onClick={onClose} />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-700 pinball-modal-enter max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <RouletteResult
                            winner={gameState.winner}
                            finishOrder={gameState.finishOrder}
                            onReset={onClose}
                            isWinner={isWinner}
                            orderItems={groupedCart}
                            totalPrice={totalPrice}
                        />
                    </div>
                </div>
            </>
        );
    }

    const canClose = status === 'waiting';

    return (
        <>
            {/* 대기 중일 때만 배경 클릭으로 닫기 가능 */}
            <div
                className="fixed inset-0 bg-black/80 z-40"
                onClick={canClose ? onClose : undefined}
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-2">
                <div className="bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col pinball-modal-enter border border-gray-700">
                    {/* 헤더 */}
                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700 shrink-0">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                            <span className="text-2xl">🎡</span>
                            커피 내기 룰렛
                        </h2>
                        {canClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition p-1"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1 flex flex-col p-2 min-h-0 overflow-hidden">
                        <GameCanvas
                            canvasRef={canvasRef}
                            isRouletteReady={isRouletteReady}
                            status={status}
                            countdown={countdown}
                            participants={gameState?.participants || []}
                            hostName={gameState?.hostName}
                            marbleCounts={marbleCounts}
                            isHost={isHost}
                            onStart={handleStartGame}
                            onShuffle={handleShuffle}
                        />

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
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RouletteModal;