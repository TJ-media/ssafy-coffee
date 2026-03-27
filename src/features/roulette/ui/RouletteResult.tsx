import { useState } from 'react';
import { Trophy, Coffee } from 'lucide-react';
import { getAvatarColor } from '../../../shared/utils';
import { GroupedCartItem } from '../../../shared/types';
import OrderRedirectModal from '../../../shared/ui/OrderRedirectModal';

interface RouletteResultProps {
    winner: string;
    finishOrder?: string[];
    onReset: () => void;
    isWinner?: boolean;
    orderItems?: GroupedCartItem[];
    totalPrice?: number;
    cafeId?: string;
    cafeName?: string;
}

const RouletteResult = ({
    winner,
    finishOrder,
    onReset,
    isWinner = false,
    orderItems = [],
    totalPrice = 0,
    cafeId = '',
    cafeName = '',
}: RouletteResultProps) => {
    const [isRedirectOpen, setIsRedirectOpen] = useState(false);

    const orderItemCard = (item: GroupedCartItem, index: number) => (
        <div
            key={index}
            className="flex justify-between items-center bg-white rounded-xl px-3 py-2.5 border border-gray-100"
        >
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-text-primary font-medium text-sm">{item.menuName}</span>
                    {item.option !== 'ONLY' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                            item.option === 'ICE'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-red-50 text-red-600'
                        }`}>
                            {item.option}
                        </span>
                    )}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">{item.names.join(', ')}</div>
            </div>
            <div className="text-right">
                <span className="text-text-secondary text-sm">x{item.count}</span>
                <div className="text-primary font-bold text-sm">
                    {(item.price * item.count).toLocaleString()}원
                </div>
            </div>
        </div>
    );

    return (
        <div className="text-center py-4 pinball-result-enter max-w-lg mx-auto">
            {/* 당첨자 발표 */}
            <div className="mb-5">
                <div className="text-6xl mb-3 animate-bounce">
                    {isWinner ? (
                        <Coffee className="inline-block text-amber-500" size={60} />
                    ) : (
                        <Trophy className="inline-block text-yellow-500" size={60} />
                    )}
                </div>
                <p className="text-text-secondary text-sm mb-2">
                    {isWinner ? '축하합니다! 오늘의 커피 당첨자' : '오늘의 커피 당첨자'}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                        style={{ backgroundColor: getAvatarColor(winner) }}
                    >
                        {winner.slice(0, 2)}
                    </div>
                    <span className="text-2xl font-bold text-text-primary">{winner}</span>
                </div>
                {isWinner && <p className="text-primary font-bold mt-2 text-lg">🎉 커피 쏘세요! 🎉</p>}
            </div>

            {/* 당첨자 주문 목록 */}
            {isWinner && orderItems.length > 0 && (
                <div className="bg-background rounded-2xl p-4 mb-5 text-left border border-gray-200">
                    <p className="text-sm text-text-secondary mb-3 font-bold flex items-center gap-2">
                        <Coffee size={15} className="text-primary" />
                        주문해야 할 목록
                    </p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                        {orderItems.map(orderItemCard)}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-text-secondary font-bold text-sm">총 금액</span>
                        <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>
            )}

            {/* 비당첨자 주문 목록 */}
            {!isWinner && orderItems.length > 0 && (
                <div className="bg-background rounded-2xl p-4 mb-5 text-left border border-gray-200">
                    <p className="text-sm text-text-secondary mb-3 font-bold flex items-center gap-2">
                        <Coffee size={15} className="text-primary" />
                        <span className="text-primary">{winner}</span>님이 주문할 목록
                    </p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                        {orderItems.map(orderItemCard)}
                    </div>
                    <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-text-secondary font-bold text-sm">총 금액</span>
                        <span className="text-lg font-bold text-primary">{totalPrice.toLocaleString()}원</span>
                    </div>
                </div>
            )}

            {/* 도착 순서 */}
            {finishOrder && finishOrder.length > 0 && (
                <div className="bg-background rounded-2xl p-3 mb-5 border border-gray-200">
                    <p className="text-xs text-text-secondary mb-2 font-bold">도착 순서</p>
                    <div className="flex justify-center gap-1 flex-wrap">
                        {finishOrder.map((name, index) => (
                            <div
                                key={name}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    index === finishOrder.length - 1
                                        ? 'bg-red-50 text-red-500 font-bold'
                                        : 'bg-gray-100 text-text-secondary'
                                }`}
                            >
                                <span className="font-mono text-[10px] opacity-60">{index + 1}.</span>
                                <span>{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex gap-2 justify-center">
                <button
                    onClick={onReset}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-2xl font-bold transition active:scale-[0.98]"
                >
                    닫기
                </button>
                {isWinner && orderItems.length > 0 && (
                    <button
                        onClick={() => setIsRedirectOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-white rounded-2xl font-bold transition active:scale-[0.98] shadow-sm"
                    >
                        <Coffee size={16} />
                        주문하러 가기
                    </button>
                )}
            </div>

            <OrderRedirectModal
                isOpen={isRedirectOpen}
                onClose={() => setIsRedirectOpen(false)}
                cafeName={cafeName}
                cafeId={cafeId}
                orderItems={orderItems}
                totalPrice={totalPrice}
                winner={winner}
            />
        </div>
    );
};

export default RouletteResult;
