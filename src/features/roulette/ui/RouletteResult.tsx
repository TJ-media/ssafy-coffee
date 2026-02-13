import { Trophy, Coffee } from 'lucide-react';
import { getAvatarColor } from '../../../shared/utils';
import { GroupedCartItem } from '../../../shared/types';

interface RouletteResultProps {
    winner: string;
    finishOrder?: string[];
    onReset: () => void;
    isWinner?: boolean;
    orderItems?: GroupedCartItem[];
    totalPrice?: number;
}

const RouletteResult = ({
                            winner,
                            finishOrder,
                            onReset,
                            isWinner = false,
                            orderItems = [],
                            totalPrice = 0,
                        }: RouletteResultProps) => {
    return (
        <div className="text-center py-6 pinball-result-enter max-w-lg mx-auto">
            {/* 당첨자 발표 */}
            <div className="mb-6">
                <div className="text-6xl mb-4 animate-bounce">
                    {isWinner ? (
                        <Coffee className="inline-block text-amber-600" size={64} />
                    ) : (
                        <Trophy className="inline-block text-yellow-500" size={64} />
                    )}
                </div>
                <p className="text-gray-400 text-sm mb-2">
                    {isWinner ? '축하합니다! 오늘의 커피 당첨자' : '오늘의 커피 당첨자'}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                        style={{ backgroundColor: getAvatarColor(winner) }}
                    >
                        {winner.slice(0, 2)}
                    </div>
                    <span className="text-2xl font-bold text-white">{winner}</span>
                </div>
                {isWinner && <p className="text-primary font-bold mt-2 text-lg">🎉 커피 쏘세요! 🎉</p>}
            </div>

            {/* 당첨자에게만 주문 목록 표시 */}
            {isWinner && orderItems.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-gray-400 mb-3 font-bold flex items-center gap-2">
                        <Coffee size={16} />
                        주문해야 할 목록
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {orderItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center bg-gray-700/50 rounded-lg px-3 py-2"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{item.menuName}</span>
                                        {item.option !== 'ONLY' && (
                                            <span
                                                className={`text-xs px-1.5 py-0.5 rounded ${
                                                    item.option === 'ICE'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}
                                            >
                        {item.option}
                      </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{item.names.join(', ')}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-400 text-sm">x{item.count}</span>
                                    <div className="text-primary font-bold">
                                        {(item.price * item.count).toLocaleString()}원
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-600 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-gray-400 font-bold">총 금액</span>
                        <span className="text-xl font-bold text-primary">
              {totalPrice.toLocaleString()}원
            </span>
                    </div>
                </div>
            )}

            {/* 비당첨자용 주문 목록 */}
            {!isWinner && orderItems.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-gray-400 mb-3 font-bold flex items-center gap-2">
                        <Coffee size={16} />
                        <span className="text-primary font-bold">{winner}</span>님이 주문할 목록
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {orderItems.map((item, index) => (
                            <div
                                key={index}
                                className="flex justify-between items-center bg-gray-700/50 rounded-lg px-3 py-2"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{item.menuName}</span>
                                        {item.option !== 'ONLY' && (
                                            <span
                                                className={`text-xs px-1.5 py-0.5 rounded ${
                                                    item.option === 'ICE'
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                }`}
                                            >
                        {item.option}
                      </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{item.names.join(', ')}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-400 text-sm">x{item.count}</span>
                                    <div className="text-primary font-bold">
                                        {(item.price * item.count).toLocaleString()}원
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-600 mt-3 pt-3 flex justify-between items-center">
                        <span className="text-gray-400 font-bold">총 금액</span>
                        <span className="text-xl font-bold text-primary">
              {totalPrice.toLocaleString()}원
            </span>
                    </div>
                </div>
            )}

            {/* 도착 순서 */}
            {finishOrder && finishOrder.length > 0 && (
                <div className="bg-gray-800/50 rounded-xl p-3 mb-6">
                    <p className="text-xs text-gray-500 mb-2">도착 순서</p>
                    <div className="flex justify-center gap-1 flex-wrap">
                        {finishOrder.map((name, index) => (
                            <div
                                key={name}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                    index === finishOrder.length - 1
                                        ? 'bg-red-500/20 text-red-400 font-bold'
                                        : 'bg-gray-700 text-gray-400'
                                }`}
                            >
                                <span className="font-mono text-[10px]">{index + 1}.</span>
                                <span>{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 버튼 영역 */}
            <div className="flex flex-col gap-2 items-center">
                <button
                    onClick={onReset}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl font-bold transition"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default RouletteResult;