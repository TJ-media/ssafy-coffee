import { useState } from 'react';
import { OrderHistory, RouletteHistory, HistoryItem } from '../types';
import { X, Calendar, Coffee, Plus, Trash2, Pencil, Check } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../utils';
import dayjs from 'dayjs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: OrderHistory[];
  rouletteHistory: RouletteHistory[];
  groupId: string;
  userName: string;
  onAddMode: (historyId: string, type: 'normal' | 'roulette') => void;
  onDeleteItem: (
      historyId: string,
      type: 'normal' | 'roulette',
      itemIndex: number,
      targetUser?: string
  ) => void;
}

const HistoryModal = ({
                        isOpen, onClose, history, rouletteHistory, userName, onAddMode, onDeleteItem
                      }: Props) => {
  const [deleteTarget, setDeleteTarget] = useState<{
    historyId: string;
    type: 'normal' | 'roulette';
    itemIndex: number;
    participants: string[];
    menuName: string;
  } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const allHistory = [
    ...history.map(h => ({ ...h, type: 'normal' as const })),
    ...rouletteHistory.map(h => ({ ...h, type: 'roulette' as const }))
  ].sort((a, b) => {
    const dateA = a.type === 'normal' ? (a as OrderHistory).orderedAt : (a as RouletteHistory).playedAt;
    const dateB = b.type === 'normal' ? (b as OrderHistory).orderedAt : (b as RouletteHistory).playedAt;
    const timeA = dateA?.toDate ? dateA.toDate().getTime() : new Date(dateA).getTime();
    const timeB = dateB?.toDate ? dateB.toDate().getTime() : new Date(dateB).getTime();
    return timeB - timeA;
  });

  const handleDeleteClick = (
      hItem: OrderHistory | RouletteHistory,
      type: 'normal' | 'roulette',
      item: HistoryItem,
      idx: number
  ) => {
    const isRoulette = type === 'roulette';
    const winner = isRoulette ? (hItem as RouletteHistory).winner : '';
    const isPayer = isRoulette && winner === userName;

    if (isPayer && item.orderedBy.length > 1) {
      setDeleteTarget({
        historyId: hItem.id, type, itemIndex: idx, participants: item.orderedBy, menuName: item.menuName
      });
      return;
    }
    const targetUser = isPayer ? undefined : userName;
    onDeleteItem(hItem.id, type, idx, targetUser);
  };

  const handleClose = () => {
    setEditingId(null);
    onClose();
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        {/* 👇 [수정] animate-slide-up 클래스 적용 (장바구니와 동일한 애니메이션) */}
        <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl max-h-[85vh] flex flex-col relative z-10 animate-slide-up">
          <div className="p-5 border-b flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="text-primary" size={24} />
                주문 히스토리
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                연필 버튼을 눌러 내역을 수정하세요
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          <div className="overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {allHistory.length === 0 ? (
                <div className="text-center py-10 text-text-secondary">
                  <Coffee size={48} className="mx-auto mb-3 opacity-20" />
                  <p>아직 주문 내역이 없어요</p>
                </div>
            ) : (
                allHistory.map((h) => {
                  const date = h.type === 'normal' ? (h as OrderHistory).orderedAt : (h as RouletteHistory).playedAt;
                  const dateObj = date?.toDate ? date.toDate() : new Date(date);
                  const isRoulette = h.type === 'roulette';
                  const winner = isRoulette ? (h as RouletteHistory).winner : null;

                  const isPayer = isRoulette && winner === userName;
                  const items = isRoulette ? (h as RouletteHistory).orderItems : (h as OrderHistory).items;

                  const isEditing = editingId === h.id;

                  return (
                      <div key={h.id} className={`border rounded-2xl p-4 bg-white shadow-sm transition-all duration-300 ${isEditing ? 'border-primary ring-1 ring-primary/20 shadow-lg scale-[1.02]' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-4 pb-3 border-b border-dashed">
                          <div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full mb-2 inline-block ${isRoulette ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                        {isRoulette ? '🎲 룰렛 게임' : '☕ 일반 주문'}
                      </span>
                            <div className="text-xs text-text-secondary">
                              {dayjs(dateObj).format('YYYY.MM.DD HH:mm')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isRoulette && (
                                <div className="text-right mr-1">
                                  <div className="text-[10px] text-text-secondary">당첨자</div>
                                  <div className="font-bold text-primary text-sm">{winner}</div>
                                </div>
                            )}

                            <button
                                onClick={() => setEditingId(isEditing ? null : h.id)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isEditing ? 'bg-primary text-white shadow-md rotate-0' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                title={isEditing ? "수정 완료" : "수정하기"}
                            >
                              {isEditing ? <Check size={16} /> : <Pencil size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {items.map((item, idx) => {
                            const isMyItem = item.orderedBy.includes(userName);
                            const canEdit = isPayer || isMyItem;

                            return (
                                <div key={idx} className="flex justify-between items-center group">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-text-primary">
                                {item.menuName}
                                <span className="text-xs font-normal text-text-secondary ml-1">x {item.count}</span>
                              </span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.option === 'ICE' ? 'bg-blue-50 text-blue-500' : item.option === 'HOT' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                {item.option === 'ONLY' ? '-' : item.option}
                              </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.orderedBy.map((p, i) => (
                                          <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  {p}
                                </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-text-primary">{(item.price * item.count).toLocaleString()}원</span>
                                    {isEditing && canEdit && (
                                        <button
                                            onClick={() => handleDeleteClick(h, h.type, item, idx)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors animate-fade-in"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                    )}
                                  </div>
                                </div>
                            );
                          })}
                        </div>

                        <div className="mt-4 pt-3 border-t flex justify-between items-center">
                          <span className="font-bold text-sm text-text-primary">총 합계</span>
                          <span className="font-bold text-lg text-primary">{h.totalPrice.toLocaleString()}원</span>
                        </div>

                        {isEditing && (
                            <button
                                onClick={() => onAddMode(h.id, h.type)}
                                className="w-full mt-4 py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary/20 transition flex items-center justify-center gap-2 active:scale-95 animate-fade-in"
                            >
                              <Plus size={16} /> 메뉴 추가하기
                            </button>
                        )}
                      </div>
                  );
                })
            )}
          </div>
        </div>

        {deleteTarget && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <div className="bg-white p-6 rounded-2xl shadow-xl w-64 animate-bounce-in">
                <h3 className="text-center font-bold text-lg mb-2">누구 메뉴를 뺄까요?</h3>
                <p className="text-center text-xs text-text-secondary mb-4">{deleteTarget.menuName}</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {deleteTarget.participants.map((p, idx) => (
                      <button
                          key={idx}
                          onClick={() => {
                            onDeleteItem(deleteTarget.historyId, deleteTarget.type, deleteTarget.itemIndex, p);
                            setDeleteTarget(null);
                          }}
                          className="flex flex-col items-center gap-1 group transition-transform hover:scale-110"
                      >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white text-sm font-bold group-hover:ring-2 group-hover:ring-danger transition-all"
                            style={{ backgroundColor: getAvatarColor(p), color: getTextContrastColor() }}
                        >
                          {p.slice(0, 1)}
                        </div>
                        <span className="text-xs font-medium text-text-primary group-hover:text-danger group-hover:font-bold">
                    {p}
                  </span>
                      </button>
                  ))}
                </div>
                <button
                    onClick={() => setDeleteTarget(null)}
                    className="w-full mt-6 py-2 text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  취소
                </button>
              </div>
            </div>
        )}
      </div>
  );
};

export default HistoryModal;