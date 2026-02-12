import { X, Settings, Minus, Plus, RotateCcw } from 'lucide-react';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

interface MarbleAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  marbleCounts: { [userName: string]: number };
  groupId: string;
}

const MarbleAdminModal = ({ isOpen, onClose, marbleCounts, groupId }: MarbleAdminModalProps) => {
  if (!isOpen) return null;

  const users = Object.keys(marbleCounts);

  const updateMarbleCount = async (userName: string, newCount: number) => {
    if (newCount < 1) newCount = 1; // 최소 1개
    if (newCount > 50) newCount = 50; // 최대 50개로 수정 (REQ-02 반영)

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        [`marbleCounts.${userName}`]: newCount,
      });
    } catch (e) {
      console.error('Failed to update marble count:', e);
    }
  };

  const resetAllCounts = async () => {
    if (!confirm('모든 사용자의 공 개수를 1개로 초기화할까요?')) return;

    try {
      const resetCounts: { [key: string]: number } = {};
      users.forEach(user => {
        resetCounts[user] = 1;
      });

      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        marbleCounts: resetCounts,
      });
    } catch (e) {
      console.error('Failed to reset marble counts:', e);
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
              <Settings size={20} className="text-primary" />
              공 개수 관리
            </h2>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {users.length === 0 ? (
                <div className="text-center py-12 text-text-secondary">
                  <Settings size={48} className="mx-auto mb-3 opacity-30" />
                  <p>아직 기록된 사용자가 없어요</p>
                  <p className="text-sm mt-1">룰렛 게임을 한 번 진행하면 기록됩니다</p>
                </div>
            ) : (
                <>
                  <p className="text-sm text-text-secondary mb-4">
                    공 개수가 많을수록 당첨(커피 사기) 확률이 높아져요 (최대 50개)
                  </p>
                  <div className="space-y-3">
                    {users.map((userName) => {
                      const count = marbleCounts[userName] || 1;
                      return (
                          <div
                              key={userName}
                              className="flex items-center justify-between bg-background rounded-xl p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                  style={{
                                    backgroundColor: getAvatarColor(userName),
                                    color: getTextContrastColor(),
                                  }}
                              >
                                {userName.slice(0, 2)}
                              </div>
                              <span className="font-bold text-text-primary">{userName}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                  onClick={() => updateMarbleCount(userName, count - 1)}
                                  disabled={count <= 1}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:hover:bg-gray-200 rounded-lg transition"
                              >
                                <Minus size={16} />
                              </button>
                              <div className="w-12 text-center">
                                {/* 숫자가 커져도 레이아웃 유지되도록 텍스트 크기 조절 */}
                                <span className={`font-bold text-primary ${count >= 10 ? 'text-lg' : 'text-xl'}`}>
                                  {count}
                                </span>
                              </div>
                              <button
                                  onClick={() => updateMarbleCount(userName, count + 1)}
                                  disabled={count >= 50}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:hover:bg-gray-200 rounded-lg transition"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>
                      );
                    })}
                  </div>

                  <button
                      onClick={resetAllCounts}
                      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-text-secondary rounded-xl font-bold transition"
                  >
                    <RotateCcw size={18} />
                    전체 초기화 (모두 1개로)
                  </button>
                </>
            )}
          </div>
        </div>
      </>
  );
};

export default MarbleAdminModal;