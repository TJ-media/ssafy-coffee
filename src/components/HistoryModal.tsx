import { X, Calendar, Users, ShoppingBag, Coffee, CircleDollarSign, Check } from 'lucide-react';
import { OrderHistory, RouletteHistory } from '../types';
import { getAvatarColor, getTextContrastColor } from '../utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: OrderHistory[];
  rouletteHistory?: RouletteHistory[];
  groupId?: string;
}

type CombinedHistory =
  | (OrderHistory & { type: 'order' })
  | (RouletteHistory & { type: 'roulette' });

const HistoryModal = ({ isOpen, onClose, history, rouletteHistory = [], groupId }: HistoryModalProps) => {
  const userName = localStorage.getItem('ssafy_userName') || '';

  if (!isOpen) return null;

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 두 히스토리를 합쳐서 날짜순 정렬
  const combinedHistory: CombinedHistory[] = [
    ...history.map(h => ({ ...h, type: 'order' as const })),
    ...rouletteHistory.map(h => ({ ...h, type: 'roulette' as const })),
  ].sort((a, b) => {
    const dateA = a.type === 'order' ? a.orderedAt : a.playedAt;
    const dateB = b.type === 'order' ? b.orderedAt : b.playedAt;
    const timeA = dateA?.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
    const timeB = dateB?.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
    return timeB - timeA; // 최신순
  });

  // Firebase에서 결제 완료 상태 토글
  const togglePaid = async (itemId: string, currentPaid: boolean) => {
    if (!groupId) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      // rouletteHistory 배열에서 해당 아이템을 찾아서 paid 상태 업데이트
      const updatedRouletteHistory = rouletteHistory.map(item =>
        item.id === itemId ? { ...item, paid: !currentPaid } : item
      );
      await updateDoc(groupRef, {
        rouletteHistory: updatedRouletteHistory,
      });
    } catch (e) {
      console.error('Failed to update paid status:', e);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-surface rounded-2xl shadow-xl z-50 max-h-[80vh] flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            주문 히스토리
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {combinedHistory.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>아직 주문 내역이 없어요</p>
            </div>
          ) : (
            combinedHistory.map((item) => {
              if (item.type === 'order') {
                // 일반 주문 히스토리
                return (
                  <div key={item.id} className="bg-background rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full font-bold flex items-center gap-1">
                          <Check size={12} />
                          주문 완료
                        </span>
                        <span className="text-text-secondary text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(item.orderedAt)}
                        </span>
                      </div>
                      <span className="font-bold text-primary">
                        {item.totalPrice.toLocaleString()}원
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {item.items.map((orderItem, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary">{orderItem.menuName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                              orderItem.option === 'ICE' ? 'bg-blue-100 text-blue-600' :
                              orderItem.option === 'HOT' ? 'bg-red-100 text-red-600' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {orderItem.option === 'ONLY' ? '-' : orderItem.option}
                            </span>
                            <span className="text-text-secondary">x{orderItem.count}</span>
                          </div>
                          <span className="text-text-secondary">
                            {(orderItem.price * orderItem.count).toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <Users size={14} className="text-text-secondary" />
                      <div className="flex flex-wrap gap-1">
                        {item.participants.map((name, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // 룰렛 히스토리
                const paid = item.paid || false;
                const isWinner = item.winner === userName;

                return (
                  <div key={item.id} className={`bg-background rounded-xl p-4 ${paid ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {paid ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full font-bold flex items-center gap-1">
                            <Check size={12} />
                            결제 완료
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold flex items-center gap-1">
                            <CircleDollarSign size={12} />
                            결제 필요
                          </span>
                        )}
                        <span className="text-text-secondary text-sm flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(item.playedAt)}
                        </span>
                      </div>
                      <span className="font-bold text-primary">
                        {item.totalPrice.toLocaleString()}원
                      </span>
                    </div>

                    {/* 결제자 표시 */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg">
                      <Coffee size={16} className="text-amber-600" />
                      <span className="text-sm text-amber-700">결제자:</span>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                          style={{
                            backgroundColor: getAvatarColor(item.winner),
                            color: getTextContrastColor(),
                          }}
                        >
                          {item.winner.slice(0, 1)}
                        </div>
                        <span className="font-bold text-amber-800">{item.winner}</span>
                        {isWinner && <span className="text-xs text-amber-600">(나)</span>}
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {item.orderItems.map((orderItem, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-text-primary">{orderItem.menuName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                              orderItem.option === 'ICE' ? 'bg-blue-100 text-blue-600' :
                              orderItem.option === 'HOT' ? 'bg-red-100 text-red-600' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {orderItem.option === 'ONLY' ? '-' : orderItem.option}
                            </span>
                            <span className="text-text-secondary">x{orderItem.count}</span>
                          </div>
                          <span className="text-text-secondary">
                            {(orderItem.price * orderItem.count).toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-text-secondary" />
                        <div className="flex flex-wrap gap-1">
                          {item.participants.map((name, idx) => (
                            <span
                              key={idx}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                name === item.winner
                                  ? 'bg-amber-100 text-amber-700 font-bold'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* 결제자(winner)만 버튼 표시 */}
                      {isWinner && (
                        <button
                          onClick={() => togglePaid(item.id, paid)}
                          className={`text-xs px-3 py-1 rounded-lg font-bold transition ${
                            paid
                              ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          {paid ? '취소' : '결제 완료'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryModal;
