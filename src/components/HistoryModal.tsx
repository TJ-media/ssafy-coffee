import { X, Calendar, Users, ShoppingBag } from 'lucide-react';
import { OrderHistory } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: OrderHistory[];
}

const HistoryModal = ({ isOpen, onClose, history }: HistoryModalProps) => {
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
          {history.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <ShoppingBag size={48} className="mx-auto mb-3 opacity-30" />
              <p>아직 주문 내역이 없어요</p>
            </div>
          ) : (
            [...history].reverse().map((order) => (
              <div key={order.id} className="bg-background rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-text-secondary text-sm">
                    <Calendar size={14} />
                    <span>{formatDate(order.orderedAt)}</span>
                  </div>
                  <span className="font-bold text-primary">
                    {order.totalPrice.toLocaleString()}원
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary">{item.menuName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                          item.option === 'ICE' ? 'bg-blue-100 text-blue-600' :
                          item.option === 'HOT' ? 'bg-red-100 text-red-600' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {item.option === 'ONLY' ? '-' : item.option}
                        </span>
                        <span className="text-text-secondary">x{item.count}</span>
                      </div>
                      <span className="text-text-secondary">
                        {(item.price * item.count).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Users size={14} className="text-text-secondary" />
                  <div className="flex flex-wrap gap-1">
                    {order.participants.map((name, idx) => (
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
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryModal;
