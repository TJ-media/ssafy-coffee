import { useState } from 'react';
import { X, Calendar, Users, ShoppingBag, Coffee, CircleDollarSign, Check, Pencil, Plus, Minus, Trash2, Save } from 'lucide-react';
import { OrderHistory, RouletteHistory, HistoryItem, OptionType } from '../types';
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

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<HistoryItem[]>([]);

  // 새 메뉴 추가 폼
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuPrice, setNewMenuPrice] = useState('');
  const [newMenuOption, setNewMenuOption] = useState<OptionType>('ICE');
  const [newMenuCount, setNewMenuCount] = useState(1);

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

  // 편집 시작
  const startEditing = (item: RouletteHistory) => {
    setEditingId(item.id);
    setEditingItems([...item.orderItems]);
    // 새 메뉴 폼 초기화
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuOption('ICE');
    setNewMenuCount(1);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditingItems([]);
  };

  // 수량 변경
  const updateItemCount = (index: number, delta: number) => {
    setEditingItems(prev => {
      const newItems = [...prev];
      const newCount = newItems[index].count + delta;
      if (newCount >= 1) {
        newItems[index] = { ...newItems[index], count: newCount };
      }
      return newItems;
    });
  };

  // 항목 삭제
  const removeItem = (index: number) => {
    setEditingItems(prev => prev.filter((_, i) => i !== index));
  };

  // 새 메뉴 추가
  const addNewItem = () => {
    if (!newMenuName.trim() || !newMenuPrice) return;

    const price = parseInt(newMenuPrice);
    if (isNaN(price) || price <= 0) return;

    const newItem: HistoryItem = {
      menuName: newMenuName.trim(),
      option: newMenuOption,
      price: price,
      count: newMenuCount,
      orderedBy: [userName],
    };

    setEditingItems(prev => [...prev, newItem]);

    // 폼 초기화
    setNewMenuName('');
    setNewMenuPrice('');
    setNewMenuOption('ICE');
    setNewMenuCount(1);
  };

  // 저장
  const saveEditing = async () => {
    if (!groupId || !editingId || editingItems.length === 0) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
      const totalPrice = editingItems.reduce((sum, item) => sum + item.price * item.count, 0);

      const updatedRouletteHistory = rouletteHistory.map(item =>
        item.id === editingId
          ? { ...item, orderItems: editingItems, totalPrice }
          : item
      );

      await updateDoc(groupRef, {
        rouletteHistory: updatedRouletteHistory,
      });

      setEditingId(null);
      setEditingItems([]);
    } catch (e) {
      console.error('Failed to save edited history:', e);
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
                        <div key={idx} className="bg-white/50 rounded-lg p-2">
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-text-primary font-medium">{orderItem.menuName}</span>
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
                          {/* 주문자 표시 */}
                          {orderItem.orderedBy && orderItem.orderedBy.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                              <span className="text-xs text-text-secondary">주문:</span>
                              <div className="flex flex-wrap gap-1">
                                {orderItem.orderedBy.map((name, nameIdx) => (
                                  <div
                                    key={nameIdx}
                                    className="flex items-center gap-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full"
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                                      style={{
                                        backgroundColor: getAvatarColor(name),
                                        color: getTextContrastColor(),
                                      }}
                                    >
                                      {name.slice(0, 1)}
                                    </div>
                                    <span className="text-text-secondary">{name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
                const isEditing = editingId === item.id;

                return (
                  <div key={item.id} className={`bg-background rounded-xl p-4 ${paid && !isEditing ? 'opacity-60' : ''} ${isEditing ? 'ring-2 ring-primary' : ''}`}>
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
                      <div className="flex items-center gap-2">
                        {isWinner && !isEditing && (
                          <button
                            onClick={() => startEditing(item)}
                            className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition"
                            title="메뉴 수정"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <span className="font-bold text-primary">
                          {isEditing
                            ? editingItems.reduce((sum, i) => sum + i.price * i.count, 0).toLocaleString()
                            : item.totalPrice.toLocaleString()
                          }원
                        </span>
                      </div>
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

                    {/* 메뉴 목록 - 편집 모드 */}
                    {isEditing ? (
                      <div className="space-y-2 mb-3">
                        {editingItems.map((orderItem, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-text-primary">{orderItem.menuName}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                                  orderItem.option === 'ICE' ? 'bg-blue-100 text-blue-600' :
                                  orderItem.option === 'HOT' ? 'bg-red-100 text-red-600' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {orderItem.option === 'ONLY' ? '-' : orderItem.option}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemCount(idx, -1)}
                                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center font-bold">{orderItem.count}</span>
                                <button
                                  onClick={() => updateItemCount(idx, 1)}
                                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                >
                                  <Plus size={14} />
                                </button>
                                <span className="text-text-secondary w-16 text-right">
                                  {(orderItem.price * orderItem.count).toLocaleString()}원
                                </span>
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {/* 주문자 표시 (편집 모드) */}
                            {orderItem.orderedBy && orderItem.orderedBy.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                                <span className="text-xs text-text-secondary">주문:</span>
                                <div className="flex flex-wrap gap-1">
                                  {orderItem.orderedBy.map((name, nameIdx) => (
                                    <div
                                      key={nameIdx}
                                      className="flex items-center gap-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full"
                                    >
                                      <div
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                                        style={{
                                          backgroundColor: getAvatarColor(name),
                                          color: getTextContrastColor(),
                                        }}
                                      >
                                        {name.slice(0, 1)}
                                      </div>
                                      <span className="text-text-secondary">{name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* 새 메뉴 추가 폼 */}
                        <div className="bg-white p-3 rounded-lg border-2 border-dashed border-gray-200 mt-3">
                          <p className="text-xs text-text-secondary mb-2 font-bold">새 메뉴 추가</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newMenuName}
                                onChange={(e) => setNewMenuName(e.target.value)}
                                placeholder="메뉴명"
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                              />
                              <input
                                type="number"
                                value={newMenuPrice}
                                onChange={(e) => setNewMenuPrice(e.target.value)}
                                placeholder="가격"
                                className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex gap-2 items-center">
                              <select
                                value={newMenuOption}
                                onChange={(e) => setNewMenuOption(e.target.value as OptionType)}
                                className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                              >
                                <option value="ICE">ICE</option>
                                <option value="HOT">HOT</option>
                                <option value="ONLY">없음</option>
                              </select>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setNewMenuCount(prev => Math.max(1, prev - 1))}
                                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{newMenuCount}</span>
                                <button
                                  onClick={() => setNewMenuCount(prev => prev + 1)}
                                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                onClick={addNewItem}
                                disabled={!newMenuName.trim() || !newMenuPrice}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg font-bold hover:bg-primary-dark transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                <Plus size={14} />
                                추가
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 저장/취소 버튼 */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={cancelEditing}
                            className="flex-1 px-3 py-2 bg-gray-100 text-text-secondary rounded-lg font-bold hover:bg-gray-200 transition text-sm"
                          >
                            취소
                          </button>
                          <button
                            onClick={saveEditing}
                            disabled={editingItems.length === 0}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            <Save size={14} />
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 일반 표시 모드 */
                      <div className="space-y-2 mb-3">
                        {item.orderItems.map((orderItem, idx) => (
                          <div key={idx} className="bg-white/50 rounded-lg p-2">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-text-primary font-medium">{orderItem.menuName}</span>
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
                            {/* 주문자 표시 */}
                            {orderItem.orderedBy && orderItem.orderedBy.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5 pl-1">
                                <span className="text-xs text-text-secondary">주문:</span>
                                <div className="flex flex-wrap gap-1">
                                  {orderItem.orderedBy.map((name, nameIdx) => (
                                    <div
                                      key={nameIdx}
                                      className="flex items-center gap-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full"
                                    >
                                      <div
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                                        style={{
                                          backgroundColor: getAvatarColor(name),
                                          color: getTextContrastColor(),
                                        }}
                                      >
                                        {name.slice(0, 1)}
                                      </div>
                                      <span className="text-text-secondary">{name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

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
                      {/* 결제자(winner)만 버튼 표시 - 편집 중 아닐 때만 */}
                      {isWinner && !isEditing && (
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
